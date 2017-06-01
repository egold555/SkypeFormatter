// ==UserScript==
// @name         Skype font size
// @namespace    http://eric.golde.org
// @version      1.0
// @description  Skype Script
// @author       Eric Golde
// @include      https://web.skype.com/en/
// @grant        none
// ==/UserScript==

//Example Size: #!100!Test
//Example Color: #|ff0000|Test
//Example blink: #%%Blinking Text
(function(XHR) {
    "use strict";

    var stats = [];
    var timeoutId = null;

    var open = XHR.prototype.open;
    var send = XHR.prototype.send;

    XHR.prototype.open = function(method, url, async, user, pass) {
        this._url = url;
        open.call(this, method, url, async, user, pass);
    };

    XHR.prototype.send = function(data) {
        var k;
        if(isMsg(data) && data != null) {       
            k = JSON.parse(data);
            var size = null;
            var color = null;
            var blink = null;
            if(k.content.indexOf("##") > -1) {
                k.content = k.content.replace('##','');
                k.content = unescapeHTML(k.content);
                k = JSON.stringify(k);
                data = k;
            } else {
                if(k.content.indexOf("!") > -1) {
                    size = k.content.match(/\!(.*?)\!/)[1];
                }
                if(k.content.indexOf("|") > -1) {
                    color = k.content.match(/\|(.*?)\|/)[1];
                }
                if(k.content.indexOf("%") > -1) {
                    blink = "S";
                }
                if(k.content.substring(0, 1) === "#") {    
                    k = replaceURL(k);
                    if(k !== null) {
                        k = JSON.stringify(k);
                        data = k;
                    }
                    if(size !== null) {
                        k = changeFontSize(JSON.parse(data), size);
                        if(k !== null) {
                            k = JSON.stringify(k);
                            data = k;
                        }
                    }
                    if(color !== null) {
                        k = changeFontColor(JSON.parse(data), color);
                        if(k !== null) {
                            k = JSON.stringify(k);
                            data = k;
                        }
                    }
                    if(blink != null) {
                        k = blinkText(JSON.parse(data));
                        if(k !== null) {
                            k = JSON.stringify(k);
                            data = k;
                        }
                    }
                    /*if(true) {
                        k = test(JSON.parse(data));
                        if(k !== null) {
                            k = JSON.stringify(k);
                            data = k;
                        }
                    }*/
                } 
            }

            console.log(data);
        }

        var self = this;
        var start;
        var oldOnReadyStateChange;
        var url = this._url;

        function onReadyStateChange() {
            if(self.readyState == 4 /* complete */) {
                var time = new Date() - start;                
                stats.push({
                    url: url,
                    duration: time                    
                });

                if(!timeoutId) {
                    timeoutId = window.setTimeout(function() {
                        var xhr = new XHR();
                        xhr.noIntercept = true;
                        xhr.open("POST", "/clientAjaxStats", true);
                        xhr.setRequestHeader("Content-type","application/json");
                        xhr.send(JSON.stringify({ stats: stats } ));                        

                        timeoutId = null;
                        stats = []; 
                    }, 2000);
                }                
            }

            if(oldOnReadyStateChange) {
                oldOnReadyStateChange();
            }
        }

        if(!this.noIntercept) {
            start = new Date();

            if(this.addEventListener) {
                this.addEventListener("readystatechange", onReadyStateChange, false);
            } else {
                oldOnReadyStateChange = this.onreadystatechange; 
                this.onreadystatechange = onReadyStateChange;
            }
        }

        send.call(this, data);
    }
})(XMLHttpRequest);

function isMsg(value) {
    try {
        JSON.stringify(value);
        if(JSON.stringify(value).indexOf("content") > -1) {
            return true;
        } else {
            return false;
        }
    } catch (ex) {
        return false;
    }
}

function replaceURL(data) {
    try {
        if(data.content.indexOf('<a href="') > -1) {
            var remove = data.content.match(/\<(.*?)\>/)[1];
            data.content = data.content.replace(remove, '');
            data.content = data.content.replace('<', '');
            data.content = data.content.replace('>', '');
            data.content = data.content.replace('</a>', '');
            console.log(data.content);
        }
        if(data.content.match(/\[(.*?)\]/)[1].indexOf("http://") == -1 && data.content.match(/\[(.*?)\]/)[1].indexOf("https://") == -1) {   
            data.content = "<a href='http://" +  data.content.match(/\[(.*?)\]/)[1] + "'>" + data.content.match(/\(([^)]+)\)/)[1] + "</a>";
        } else {
            data.content = "<a href='" +  data.content.match(/\[(.*?)\]/)[1] + "'>" + data.content.match(/\(([^)]+)\)/)[1] + "</a>";
        }
        return data;
    } catch(ex) {
        return null;
    }
}

function unescapeHTML(escapedHTML) {
  return escapedHTML.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function changeFontSize(data, size) {
    try {
        if(data.content.indexOf("#") > -1) {
            data.content = data.content.replace('#','');
            data.content = data.content.replace(data.content.match(/\!(.*?)\!/)[1], '');
            data.content = data.content.replace(/!/g, '');
        }

        data.content = "<font size='" +  size + "'>" + data.content + "</font>";
        return data;
    } catch(ex) {
        return null;
    }
}

function changeFontColor(data, color) {
    try {
        if(data.content.indexOf("#") > -1) {
            data.content = data.content.replace('#','');
            data.content = data.content.replace(data.content.match(/\|(.*?)\|/)[1], '');
            data.content = data.content.replace(/[|]/g, '');
        }

        data.content = "<font color='#" +  color + "'>" + data.content + "</font>";
        return data;
    } catch(ex) {
        return null;
    }
}

function blinkText(data) {
    try {
        if(data.content.indexOf("#") > -1) {
            data.content = data.content.replace('#','');
            data.content = data.content.replace(data.content.match(/\%(.*?)\%/)[1], '');
            data.content = data.content.replace(/[%]/g, '');
        }

        data.content = "<blink>" + data.content + "</blink>";
        return data;
    } catch(ex) {
        return null;
    }
}

/*function test(data) {
    try {
        if(data.content.indexOf("#") > -1) {
            data.content = data.content.replace('#','');
            data.content = data.content.replace(data.content.match(/\%(.*?)\%/)[1], '');
            data.content = data.content.replace(/[%]/g, '');
        }

        data.content = '' + data.content + "";
        return data;
    } catch(ex) {
        return null;
    }
}*/
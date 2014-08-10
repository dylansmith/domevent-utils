(function(global) {
    // ie8 EventListener polyfill (https://gist.github.com/jonathantneal/3748027)
    /*jshint quotmark: false, ignore:start */
    !window.addEventListener&&function(e,t,n,r,i,s,o){e[r]=t[r]=n[r]=function(e,t){var n=this;o.unshift([n,e,t,function(e){e.currentTarget=n,e.preventDefault=function(){e.returnValue=!1},e.stopPropagation=function(){e.cancelBubble=!0},e.target=e.srcElement||n,t.call(n,e)}]),this.attachEvent("on"+e,o[0][3])},e[i]=t[i]=n[i]=function(e,t){for(var n=0,r;r=o[n];++n)if(r[0]==this&&r[1]==e&&r[2]==t)return this.detachEvent("on"+e,o.splice(n,1)[0][3])},e[s]=t[s]=n[s]=function(e){return this.fireEvent("on"+e.type,e)}}(Window.prototype,HTMLDocument.prototype,Element.prototype,"addEventListener","removeEventListener","dispatchEvent",[]); //jshint ignore:line
    /*jshint quotmark: true, ignore:end */

    /**
     * @class DomEventUtils
     */
    global.DomEventUtils = {

        bind: function(el, evtOrType, callback, useCapture, delay, runOnce, filter) {
            if (typeof callback !== 'function') return evtOrType;
            delay = (delay === true) ? 0 : parseInt(delay, 10);
            filter = (typeof filter === 'function') ? filter : function() { return true; };

            var handler, unbind,
                isEvt = (typeof evtOrType !== 'string'),
                type = (isEvt) ? evtOrType.type : evtOrType;

            handler = function() {
                return function(evt) {
                    var t = evt.srcElement || evt.target,
                        fire = function() {
                            callback(evt);
                            if (runOnce === true) {
                                unbind();
                            }
                        };

                    if (filter(evt, t) && (isEvt ? evt === evtOrType : type === evt.type)) {
                        if (delay >= 0) {
                            setTimeout(fire, delay);
                        }
                        else {
                            fire();
                        }
                    }
                };
            }.call(el); // gives IE<9 access to evt.currentTarget via this

            unbind = function() {
                el.removeEventListener(type, handler, useCapture);
            };

            el.addEventListener(type, handler, useCapture);

            return {
                'element': el,
                'type': type,
                'event': isEvt ? evtOrType : null,
                'callback': callback,
                'useCapture': useCapture,
                'delay': delay,
                'runOnce': runOnce,
                'filter': filter,
                'handler': handler,
                'unbind': unbind
            };
        },

        bindOnce: function(el, evtOrType, callback, useCapture, delay, filter) {
            return this.bind(el, evtOrType, callback, useCapture, delay, true, filter);
        },

        after: function(target, type, callback, delayed/*=true*/) {
            target = (typeof target === 'string' && document.querySelector) ?
                document.querySelector(target) : target;
            return this.bind(document, type, callback, false, (delayed !== false), false,
                function(evt, t) {
                    return (t === target);
                });
        },

        afterAll: function(evtOrType, callback, delayed/*=true*/) {
            return this.bind(document, evtOrType, callback, false, (delayed !== false));
        },

        afterAllOnce: function(evtOrType, callback, delayed/*=true*/) {
            return this.bindOnce(document, evtOrType, callback, false, (delayed !== false));
        },

        before: function(target, type, callback) {
            target = (typeof target === 'string' && document.querySelector) ?
                document.querySelector(target) : target;
            return this.bind(document, type, callback, true, false, false, function(evt, t) {
                return t === target;
            });
        },

        beforeAll: function(evtOrType, callback) {
            return this.bind(document, evtOrType, callback, true, false);
        },

        beforeAllOnce: function(evtOrType, callback) {
            return this.bind(document, evtOrType, callback, true, false, true);
        }
    };

})(window);

(function(global) {

    /**
     * @class DomEventUtils
     */
    global.DomEventUtils = {

        /**
         * Accepts a selector string, single DOM node or NodeList and returns an
         * array or NodeList.
         * @param  {String|Node|NodeList} selectorOrNodes
         * @return {NodeList|Array}
         */
        _resolveNodeList: function(selectorOrNodes) {
            var nodelist;
            if (selectorOrNodes instanceof NodeList) {
                nodelist = selectorOrNodes;
            }
            else if (selectorOrNodes instanceof Node) {
                nodelist = (document.createDocumentFragment) ?
                    // attempt to return as a NodeList
                    document.createDocumentFragment().appendChild(selectorOrNodes).childNodes :
                    // fallback to array
                    [selectorOrNodes];
            }
            else if (typeof selectorOrNodes === 'string' && (window.$ || document.querySelectorAll)) {
                nodelist = (window.$ || document.querySelectorAll)(selectorOrNodes);
            }
            return nodelist;
        },

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
            }.call(el); // run the handler with "this" being the currentTarget

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

        after: function(scope, type, callback, delayed/*=true*/) {
            scope = this._resolveNodeList(scope);
            return this.bind(document, type, callback, false, (delayed !== false), false,
                function(evt, t) {
                    return (t === scope || scope.indexOf(t) !== -1);
                });
        },

        afterAll: function(evtOrType, callback, delayed/*=true*/) {
            return this.bind(document, evtOrType, callback, false, (delayed !== false));
        },

        afterAllOnce: function(evtOrType, callback, delayed/*=true*/) {
            return this.bindOnce(document, evtOrType, callback, false, (delayed !== false));
        },

        before: function(scope, type, callback) {
            scope = this._resolveNodeList(scope);
            return this.bind(document, type, callback, true, false, false,
                function(evt, t) {
                    return (t === scope || scope.indexOf(t) !== -1);
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

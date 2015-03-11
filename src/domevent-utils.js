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

            handler = function(evt) {
                var t = evt.srcElement || evt.target,
                    fire = function() {
                        callback.call(t, evt);
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
            }.bind(el); // run the handler with "this" being the currentTarget

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
        },

        prevent: function(el, type, stop/*=false*/, stopImmediate/*=false*/, runOnce/*=false*/) {
            this.bind(el, type, function(evt) {
                evt.preventDefault();
                if (stop === true) {
                    evt.stopPropagation();
                    if (stopImmediate === true) {
                       evt.stopImmediatePropagation();
                    }
                }
            }, false, false, runOnce !== false)
        },

        preventOnce: function(el, type, stop/*=false*/, stopImmediate/*=false*/) {
            this.prevent(el, type, stop, stopImmediate, true);
        },

        navigateAfter: function(evtOrType, location) {
            this.afterAllOnce(evtOrType, function(evt) {
                if (evt.defaultPrevented === false || evt.returnValue !== false) {
                    window.location = location;
                }
            }, false);
        },

        makeResumable: function(e) {
            return new ResumableEvent(e);
        }
    };

    function ResumableEvent(e) {
        if (e) {
            // if this event is already managed by ResumableEvent, return that instance
            if (e._ResumableEvent instanceof ResumableEvent) {
                return e._ResumableEvent;
            }

            this.origEvent = e;
            this.origTarget = e.srcElement || e.target;
        }
    }
    ResumableEvent.prototype = {
        clonedEvent: null,
        origEvent: null,
        origTarget: null,
        isPaused: false,
        isResumed: false,

        clone: function(evt) {
            var c, o = evt;

            if (document.createEvent) {
                c = document.createEvent('MouseEvents');
            }
            else if (window.MouseEvent) {
                c = new MouseEvent();
            }

            if (c) {
                // defaults are for props that IE9 does not support
                c.initMouseEvent(
                    o.type,
                    o.bubbles || true,
                    o.cancelable || true,
                    o.view || window,
                    o.detail || 1,
                    o.screenX,
                    o.screenY,
                    o.clientX,
                    o.clientY,
                    o.ctrlKey,
                    o.altKey,
                    o.shiftKey,
                    o.metaKey || false,
                    o.button,
                    o.relatedTarget || null
                );
            }
            // IE<9
            else if (document.createEventObject) {
                c = document.createEventObject(o);
            }

            // obey the defaultPrevented status which may have been set by other handlers
            if (o.defaultPrevented === true) {
                c.preventDefault();
            }

            return c;
        },

        pause: function(whilePaused) {
            var o = this.origEvent;
            if (o && this.isPaused === false && this.isResumed === false) {
                // clone before cancelling otherwise IE cries
                this.clonedEvent = this.clone(o);
                try {
                    o.stopPropagation();
                    o.stopImmediatePropagation();
                    o.preventDefault();
                } catch (err) {}
                try {
                    o.returnValue = false;
                    o.cancelBubble = true;
                } catch (err) {}

                this.isPaused = true;
                if (typeof whilePaused === 'function') {
                    whilePaused();
                }
            }
            return this;
        },

        resume: function(whenResumed) {
            if (this.isPaused === true &&
                this.isResumed === false &&
                this.origTarget &&
                this.clonedEvent
            ) {
                var t = this.origTarget;

                // mark the clone as a managed ResumableEvent so we can ignore it
                this.clonedEvent._ResumableEvent = this;

                // IE
                if (window.MSEventObj && this.clonedEvent instanceof window.MSEventObj && t.fireEvent) {
                    t.fireEvent('on' + this.clonedEvent.type, this.clonedEvent);
                }
                else if (t.dispatchEvent) {
                    t.dispatchEvent(this.clonedEvent);
                }

                this.isResumed = true;
                this.isPaused = false;
                if (typeof whenResumed === 'function') {
                    whenResumed();
                }
            }
        }
    }

})(window);

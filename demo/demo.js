/* global $, DomEventUtils */
(function(global, $, DomEventUtils) {

    var Demo = {

        dom: {},
        profileHandlers: [],
        profiles: null,

        init: function(profiles) {
            var self = this;
            this.dom.body = $('body');
            this.dom.profileSelect = $('#profiles select');
            this.dom.log = $('#log ol');
            this.dom.clearLog = $('#clear-log');

            // bind UI handlers:
            // trap events from UI containers
            var sp = function(evt) {
                evt.stopPropagation();
            };
            $('#profiles, #log').click(sp).change(sp);
            // profile switching
            this.dom.profileSelect.change(function(evt) {
                evt.stopPropagation();
                self.setProfile($(this).val());
                self.clearLog();
            });
            // reporters
            this.bindReporters();
            // clear log
            this.dom.clearLog.click(function() {
                self.clearLog();
            });

            // start 'er up
            this.renderProfiles(profiles);
            this.setProfile('default');
        },

        bindReporters: function() {
            var self = this;

            // utility method to return a configured handler
            function createHandler(el, useCapture) {
                el = el[0] || el;
                var handler, opts, unbind, type = 'click';

                handler = function() {
                    return function(evt) {
                        var t = evt.srcElement || evt.target,
                            ct = evt.currentTarget || this,
                            icon = useCapture ? '[&#8595;]' : '[&#8593;]',
                            label;

                        if (t.hasAttribute('data-reporter') === false) return;
                        label = (ct === document.body) ? 'body' :
                                (ct.getAttribute('data-reporter') || ct.nodeName);
                        self.log([icon, label].join(' '), evt);
                    };
                }.call(el); // run in context of element for IE without currentTarget

                unbind = function() {
                    el.removeEventListener(type, handler, useCapture);
                };

                opts = {
                    'element': el,
                    'type': type,
                    'useCapture': useCapture || false,
                    'handler': handler,
                    'unbind': unbind
                };

                el.addEventListener(opts.type, opts.handler, opts.useCapture);
            }

            // add click handlers to doc, body & reporters
            $('body, *[data-reporter]').forEach(function(item) {
                createHandler(item, false);
                createHandler(item, true);
            });
        },

        log: function(msg, data) {
            $('<li>').html(msg).appendTo(this.dom.log);
            console.log(msg, data);
        },

        clearLog: function() {
           this.dom.log.empty();
        },

        renderProfiles: function(profiles) {
            var select = this.dom.profileSelect,
                pid;

            // empty
            select.empty();

            // add default
            $('<option>').attr({
                value: 'default',
                selected: true
            })
            .html('default')
            .appendTo(select);

            // add profiles
            for (pid in profiles) { //jshint forin:false
                $('<option>').attr('value', pid).html(pid).appendTo(select);
            }

            this.profiles = profiles;
        },

        setProfile: function(profileId) {
            var profile = this.profiles[profileId] || null;
            if (profile) {
                // reset hash
                window.location.hash = '';
                // clear log
                this.clearLog();
                // clear highlights
                $('body, *[data-reporter]').removeClass('highlight');
                // remove listeners
                for (var i=0; i < this.profileHandlers.length; i++) {
                    var h = this.profileHandlers[i];
                    h.unbind();
                }
                // profile-specific setup
                var binding = profile.action(profileId, profile.scope);
                if (binding.handler) {
                    this.profileHandlers.push(binding);
                }
                if (profile.scope) {
                    $(profile.scope).addClass('highlight');
                }
            }
        }
    };

    var profiles = {
        'after': {
            desc: 'do something after all other event handlers for a click event on a single node',
            scope: '#trigger',
            action: function(pid, scope) {
                return DomEventUtils.after(scope, 'click', function(evt) {
                    Demo.log(pid, evt);
                });
            }
        },
        'after.multi': {
            desc: 'do something after all other event handlers for a click event on a set of nodes',
            scope: '#trigger, #ancestor-sibling',
            action: function(pid, scope) {
                return DomEventUtils.after(scope, 'click', function(evt) {
                    Demo.log(pid, evt);
                });
            }
        },
        'after.trigger.defaultPrevented': {
            desc: 'preventDefault() after all other event handlers for a click event on a single node',
            scope: '#trigger',
            action: function(pid, scope) {
                return DomEventUtils.after(scope, 'click', function(evt) {
                    evt.preventDefault();
                    Demo.log(pid, evt);
                });
            }
        },
        'afterAll': {
            desc: 'do something after all other event handlers for a click event on any node',
            scope: '*[data-reporter]',
            action: function(pid) {
                return DomEventUtils.afterAll('click', function(evt) {
                    Demo.log(pid, evt);
                });
            }
        },
        'afterAll.defaultPrevented': {
            desc: 'preventDefault() after all other event handlers for a click event on any node',
            scope: '*[data-reporter]',
            action: function(pid) {
                return DomEventUtils.afterAll('click', function(evt) {
                    evt.preventDefault();
                    Demo.log(pid, evt);
                }, false);
            }
        },
        'afterAllOnce': {
            desc: 'do something only once after all other event handlers for a click event on any node',
            scope: '*[data-reporter]',
            action: function(pid) {
                return DomEventUtils.afterAllOnce('click', function(evt) {
                    Demo.log(pid, evt);
                });
            }
        },
        'before': {
            desc: 'do something before all other event handlers for a click event on a single node',
            scope: '#trigger',
            action: function(pid, scope) {
                return DomEventUtils.before(scope, 'click', function(evt) {
                    Demo.log(pid, evt);
                });
            }
        },
        'beforeAll': {
            desc: 'do something before all other event handlers for a click event on any node',
            scope: '*[data-reporter]',
            action: function(pid) {
                return DomEventUtils.beforeAll('click', function(evt) {
                    Demo.log(pid, evt);
                });
            }
        },
        'beforeAllOnce': {
            desc: 'do something only once before all other event handlers for a click event on any node',
            scope: '*[data-reporter]',
            action: function(pid) {
                return DomEventUtils.beforeAllOnce('click', function(evt) {
                    Demo.log(pid, evt);
                });
            }
        }
    };

    $(function() {
        Demo.init(profiles);
    });

    // export as a global module
    global.Demo = Demo;

})(window, $, DomEventUtils);

(function(global, $) {

    var Demo = {

        dom: {},
        handlers: [],
        profiles: null,

        init: function(profiles) {
            var self = this;
            this.dom.body = $('body');
            this.dom.profiles = $('#profiles');
            this.dom.profileSelect = $('#profiles select');
            this.dom.log = $('#log ol');
            this.dom.ancestor = $('#ancestor');
            this.dom.trigger = $('#trigger');
            this.dom.clearLog = $('#clear-log');

            // bind UI handlers:
            // trap clicks within the profiles element
            this.dom.profiles.click(function(evt) {
                evt.stopPropagation();
            });
            // profile switching
            this.dom.profileSelect.change(function() {
                self.setProfile($(this).val());
                self.clearLog();
            });
            // clear log
            this.dom.clearLog.click(function() {
                self.clearLog();
            });

            // start 'er up
            this.renderProfiles(profiles, this.dom.profiles);
            this.reset();
            this.setProfile('default');
        },

        log: function(msg, data) {
            $('<li>').html(msg).appendTo(this.dom.log);
            console.log(msg, data);
        },

        clearLog: function() {
           this.dom.log.empty();
        },

        reset: function() {
            // reset hash
            window.location.hash = '';
            // remove listeners
            for (var i=0; i < this.handlers.length; i++) {
                var h = this.handlers[i];
                h.unbind();
            }
            this.dom.trigger.off();
            this.clearLog();
        },

        renderProfiles: function(profiles) {
            var self = this,
                select = this.dom.profileSelect,
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
            for (pid in profiles) {
                $('<option>').attr('value', pid).html(pid).appendTo(select);
            }

            this.profiles = profiles;
        },

        setProfile: function(profileId) {
            var self = this;

            // clear state
            this.reset();
            this.dom.profiles.find('button').removeClass('selected');
            this.dom.profiles.find('button[data-profile='+profileId+']').addClass('selected');

            // utility method to return a configured handler
            function createClickHandler(el, msg, useCapture, preventDefaultFor) {
                el = el[0] || el;
                var handler, opts, unbind, type = 'click';

                handler = function(evt) {
                    var t = evt.srcElement || evt.target;
                    if (t.hasAttribute('data-inscope') === false) return;
                    if (preventDefaultFor && t === preventDefaultFor) {
                        evt.preventDefault();
                    }
                    self.log(msg, evt);
                };

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
                self.handlers.push(opts);
            }

            // body handlers
            createClickHandler(this.dom.body, '[&#8593;] body', false);
            createClickHandler(this.dom.body, '[&#8595;] body', true);

            // test node handlers
            $('*[data-inscope]').forEach(function(item) {
                var t = item.getAttribute('data-type');
                createClickHandler(item, '[&#8593;] ' + t , false);
                createClickHandler(item, '[&#8595;] ' + t, true);
            });

            // profile-specific setup
            if (this.profiles[profileId]) {
                var binding = this.profiles[profileId](profileId);
                if (binding.handler) {
                    this.handlers.push(binding);
                }
            }
        }
    };

    var profiles = {
        'after':
            function(pid) {
                return DomEventUtils.after('#trigger', 'click', function(evt) {
                    Demo.log(pid, evt);
                });
            },

        'after-defaultPrevented':
            function(pid) {
                return DomEventUtils.after('#trigger', 'click', function(evt) {
                    evt.preventDefault();
                    Demo.log(pid, evt);
                }, false);
            },

        'afterAll':
            function(pid) {
                return DomEventUtils.afterAll('click', function(evt) {
                    Demo.log(pid, evt);
                });
            },

        'afterAll-defaultPrevented':
            function(pid) {
                return DomEventUtils.afterAll('click', function(evt) {
                    evt.preventDefault();
                    Demo.log(pid, evt);
                }, false);
            },

        'afterAllOnce':
            function(pid) {
                return DomEventUtils.afterAllOnce('click', function(evt) {
                    Demo.log(pid, evt);
                });
            },

        'before':
            function(pid) {
                return DomEventUtils.before('#trigger', 'click', function(evt) {
                    Demo.log(pid, evt);
                });
            },

        'beforeAll':
            function(pid) {
                return DomEventUtils.beforeAll('click', function(evt) {
                    Demo.log(pid, evt);
                });
            },

        'beforeAllOnce':
            function(pid) {
                return DomEventUtils.beforeAllOnce('click', function(evt) {
                    Demo.log(pid, evt);
                });
            }
    };

    $(function() {
        Demo.init(profiles);
    });

    // export as a global module
    global.Demo = Demo;

})(window, $);

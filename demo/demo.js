(function(global, $) {

    global.Demo = {

        dom: {},
        handlers: [],
        profiles: null,

        init: function(profiles) {
            var self = this;
            this.dom.body = $('body');
            this.dom.profiles = $('#profiles');
            this.dom.log = $('#log');
            this.dom.ancestor = $('#ancestor');
            this.dom.trigger = $('#trigger');
            this.dom.clearLog = $('#clear-log');

            // bind clear log button
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

        renderProfiles: function(profiles, container) {
            var self = this, pid;
            // render profiles
            for (pid in profiles) {
                $('<button>').attr('data-profile', pid).html(pid).appendTo(container);
            }
            // trap clicks within the profiles element
            container.click(function(evt) {
                evt.stopPropagation();
            });

            container.find('button').click(function() {
                // setup the triggers
                self.setProfile(this.getAttribute('data-profile'));
                self.clearLog();
            });

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

            // ancestor handlers
            $('*[data-type^="ancestor"]').forEach(function(item) {
                var t = item.getAttribute('data-type');
                createClickHandler(item, '[&#8593;] ' + t , false);
                createClickHandler(item, '[&#8595;] ' + t, true);
            });

            // local handlers
            $('*[data-type^="ancestor"] > a').forEach(function(item) {
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

})(window, $);

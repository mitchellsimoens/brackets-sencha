/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, $, brackets, window */

var NodeDomain         = brackets.getModule('utils/NodeDomain'),
    PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
    ProjectManager     = brackets.getModule('project/ProjectManager'),
    prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
    isWin              = brackets.platform === 'win',
    shell              = isWin ? 'cmd.exe' : '/bin/bash';

//TODO use App.panel.Preferences

/**
 * Class to execute commands on the node process
 *
 * @class App.node.Command
 */
Sencha.define('App.node.Command', {
    singleton : true,

    config : {
        autolinker : null
    },

    stopped : false,

    construct : function(config) {
        this.initConfig(config);

        this.callParent([config]);

        ProjectManager.on('beforeAppClose', this.stop.bind(this));
    },

    execute : function(cmd, cwd, displayCmd) {
        var output = App.panel.Output,
            stopEl = output.stopEl;

        output.show();

        output.clear();

        output.append(displayCmd || cmd, {
            tag       : 'div',
            className : 'brackets-sencha-command'
        });

        stopEl.removeClass('disabled');

        this.domain.exec(
            'execute',
            cmd,
            cwd,
            isWin,
            shell
        );
    },

    stop : function() {
        this.domain.exec('kill');
    },

    initDomain : function(path) {
        var me           = this,
            _domain      = me.domain = new NodeDomain(
                'senchaShellDomain',
                path
            ),
            _outputPanel = App.panel.Output,
            _stopEl      = _outputPanel.stopEl;

        _domain.on('stdout', function(evt, data) {
            data = me.linkify(data);

            _outputPanel.append(data, {
                tag : 'div'
            });
        });

        _domain.on('stderr', function(evt, data) {
            _outputPanel.append(data);
        });

        _domain.on('close', function(evt, dir) {
            if (!me.stopped) {
                var doClose = prefs.get('close_on_success');

                _outputPanel.append('Command Complete!', {
                    tag       : 'div',
                    className : 'brackets-sencha-complete'
                });

                if (doClose) {
                    var el = _outputPanel.append('Closing in 2 seconds. <span class="cancel_close_on_success">Click Here</span> to cancel.', {
                            tag       : 'div',
                            className : 'close_on_success_msg'
                        }),
                        timeout;

                    el.one('click', function() {
                        el.remove();

                        _outputPanel.append('Close canceled.', {
                            tag       : 'div',
                            className : 'close_on_success_msg'
                        });

                        clearTimeout(timeout);
                    });

                    timeout = setTimeout(function() {
                        el.empty();

                        _outputPanel.hide();
                    }, 2000);
                }
            }

            me.stopped = false;

            _stopEl.addClass('disabled');
        });

        _domain.on('kill', function(evt) {
            me.stopped = true;

            _outputPanel.append('Command Stopped!', {
                tag       : 'div',
                className : 'brackets-sencha-stopped'
            });
        });
    },

    linkify : function(text) {
        var autolinker = this.getAutolinker();

        if (autolinker) {
            text = autolinker.link(text, {
                stripPrefix : false
            });
        }

        return text;
    }
});

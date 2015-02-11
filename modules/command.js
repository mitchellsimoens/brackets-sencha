/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports, module) {
    'use strict';

    var NodeDomain     = brackets.getModule('utils/NodeDomain'),
        ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        isWin          = brackets.platform === 'win',
        shell          = isWin ? 'cmd.exe' : '/bin/bash',
        stopped,
        _outputPanel, _stopEl, _domain;

    function _execute(cmd, cwd, displayCmd) {
        _outputPanel.show();

        _outputPanel.clear();

        _outputPanel.append(displayCmd || cmd, {
            tag       : 'div',
            className : 'brackets-sencha-command'
        });

        _stopEl.removeClass('disabled');

        _domain.exec(
            'execute',
            cmd,
            cwd,
            isWin,
            shell
        );
    }

    function _stop() {
        var el = $('.stop', _outputPanel.$panel);

        if (!el.hasClass('disabled')) {
            _domain.exec('kill');
        }
    }

    function initDomain() {
        _domain = new NodeDomain(
            'senchaShellDomain',
            ExtensionUtils.getModulePath(module, '../node/SenchaDomain')
        );

        $(_domain).on('stdout', function(evt, data) {
            _outputPanel.append(data);
        });

        $(_domain).on('stderr', function(evt, data) {
            _outputPanel.append(data);
        });

        $(_domain).on('close', function(evt, dir) {
            if (!stopped) {
                _outputPanel.append('Command Complete!', {
                    tag       : 'div',
                    className : 'brackets-sencha-complete'
                });
            }

            stopped = false;

            _stopEl.addClass('disabled');
        });

        $(_domain).on('kill', function(evt) {
            stopped = true;

            _outputPanel.append('Command Stopped!', {
                tag       : 'div',
                className : 'brackets-sencha-stopped'
            });
        });
    }

    function init(config) {
        _outputPanel = config.OutputPanel;
        _stopEl      = _outputPanel.stopEl;

        initDomain();

        _stopEl.click(_stop);

        return {
            exec : _execute
        };
    }

    exports.init = init;
});

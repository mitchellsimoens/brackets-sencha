/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports) {
    'use strict';

    var WorkspaceManager   = brackets.getModule('view/WorkspaceManager'),
        AppInit            = brackets.getModule('utils/AppInit'),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        OutputPanel;

    var clearEl, closeEl, stopEl, closeOnSuccessEl;

    function _toggle() {
        if (OutputPanel.isVisible()) {
            _hide();
        } else {
            _show();
        }
    }

    function _hide() {
        OutputPanel.hide();
    }

    function _show() {
        OutputPanel.show();

        _scrollToBottom();
    }

    function _clear() {
        var el = $('.brackets-sencha-content', OutputPanel.$panel);

        el.empty();
    }

    function _closeOnSuccessClick() {
        prefs.set('close_on_success', this.checked);
    }

    function _scrollToBottom() {
        var el = $('.brackets-sencha-content', OutputPanel.$panel);

        el.scrollTop(el[0].scrollHeight);
    }

    function _append(data, config) {
        var el  = $('.brackets-sencha-content', OutputPanel.$panel),
            div = document.createElement('div'),
            row;

        div.className = 'sencha-output';

        if (config) {
            if (config.tag) {
                row = document.createElement(config.tag)

                row.innerHTML = data;
            } else {
                row = document.createTextNode(data);
            }

            if (config.className) {
                row.className = config.className;
            }
        } else {
            row = document.createTextNode(data);
        }

        div.appendChild(row);

        el.append(div);

        _scrollToBottom();

        return $(div);
    }

    function init(config) {
        var _outputPanelHtml = require('text!../templates/output/outputPanel.html');

        OutputPanel = WorkspaceManager.createBottomPanel('sencha.cmd.output.panel', $(_outputPanelHtml), 250);

        AppInit.appReady(function () {
            closeOnSuccessEl.prop('checked', prefs.get('close_on_success'));

            closeEl.click(_toggle);

            closeOnSuccessEl.click(_closeOnSuccessClick);
        });

        clearEl          = $('.clear',            OutputPanel.$panel);
        closeEl          = $('.close',            OutputPanel.$panel);
        closeOnSuccessEl = $('#close_on_success', OutputPanel.$panel);
        stopEl           = $('.stop',             OutputPanel.$panel);

        config.MenuManager.addMenus([
            {
                name       : 'sencha.console.show',
                label      : 'Show Sencha Console',
                keyBinding : 'Ctrl-Alt-C',
                fn         : _show,
                menu       : [
                    'view-menu'
                ]
            },
            {
                divider : 'sencha.console.show',
                name    : 'sencha.console.divider',
                menu    : [
                    'view-menu'
                ]
            }
        ]);

        return {
            append       : _append,
            clear        : _clear,
            hide         : _hide,
            panel        : OutputPanel,
            scrollBottom : _scrollToBottom,
            show         : _show,
            toggle       : _toggle,

            clearEl          : clearEl,
            closeEl          : closeEl,
            closeOnSuccessEl : closeOnSuccessEl,
            stopEl           : stopEl
        };
    }

    exports.init = init;
});

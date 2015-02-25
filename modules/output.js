/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports) {
    'use strict';

    var WorkspaceManager = brackets.getModule('view/WorkspaceManager'),
        AppInit          = brackets.getModule('utils/AppInit'),
        OutputPanel;

    var clearEl, closeEl, stopEl;

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
    }

    function _clear() {
        var el = $('.brackets-sencha-content', OutputPanel.$panel);

        el.empty();
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
    }

    function init() {
        var _outputPanelHtml = require('text!../templates/outputPanel.html');

        OutputPanel = WorkspaceManager.createBottomPanel('sencha.cmd.output.panel', $(_outputPanelHtml), 250);

        AppInit.appReady(function () {
            clearEl.click(_clear);
            closeEl.click(_toggle);
        });

        clearEl = $('.clear', OutputPanel.$panel);
        closeEl = $('.close', OutputPanel.$panel);
        stopEl  = $('.stop', OutputPanel.$panel);

        return {
            append       : _append,
            clear        : _clear,
            hide         : _hide,
            panel        : OutputPanel,
            scrollBottom : _scrollToBottom,
            show         : _show,
            toggle       : _toggle,

            clearEl : clearEl,
            closeEl : closeEl,
            stopEl  : stopEl
        };
    }

    exports.init = init;
});

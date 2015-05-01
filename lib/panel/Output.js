/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, $, brackets, window */

var WorkspaceManager   = brackets.getModule('view/WorkspaceManager'),
    PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
    prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha');

//TODO use Sencha.panel.Preferences

/**
 * Class to manage the output panel.
 *
 * @class Sencha.panel.Output
 */
Sencha.define('Sencha.panel.Output', {
    singleton : true,

    requires : [
        'Sencha.Template'
    ],

    mixins : [
        'Sencha.menu.Mixin'
    ],

    _panel    : null,
    _template : null,

    menus : [
        {
            name       : 'sencha.console.show',
            label      : 'Show Sencha Console',
            keyBinding : 'Ctrl-Alt-C',
            scope      : 'this',
            fn         : 'show',
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
    ],

    construct : function(config) {
        this.callParent([config]);

        this.initMenu();
    },

    getPanel : function() {
        var panel = this._panel;

        if (!panel) {
            panel = this._panel = WorkspaceManager.createBottomPanel(
                'sencha.cmd.output.panel',
                $(Sencha.Template.get('output/outputPanel')),
                250
            );
        }

        return panel;
    },

    render : function() {
        var panel            = this.getPanel(),
            clearEl          = this.clearEl = $('.clear',            panel.$panel),
            closeEl          = this.closeEl = $('.close',            panel.$panel),
            closeOnSuccessEl = this.closeOnSuccessEl = $('#close_on_success', panel.$panel),
            stopEl           = this.stopEl = $('.stop',             panel.$panel);

        closeOnSuccessEl.prop('checked', prefs.get('close_on_success'));

        closeEl.click(this.toggle.bind(this));
        clearEl.click(this.clear.bind(this));
        stopEl.click(this.stop.bind(this));

        closeOnSuccessEl.click(this.closeOnSuccessClick.bind(this));
    },

    toggle : function() {
        if (this.getPanel().isVisible()) {
            this.hide();
        } else {
            this.show();
        }
    },

    hide : function() {
        this.getPanel().hide();
    },

    show : function() {
        this.getPanel().show();

        this.scrollToBottom();
    },

    clear : function() {
        var el = $('.brackets-sencha-content', this.getPanel().$panel);

        el.empty();
    },

    stop : function() {
        var el = this.stopEl;

        if (!el.hasClass('disabled')) {
            Sencha.node.Command.stop();
        }
    },

    closeOnSuccessClick : function() {
        prefs.set('close_on_success', this.checked);
    },

    scrollToBottom : function() {
        var el = $('.brackets-sencha-content', this.getPanel().$panel);

        el.scrollTop(el[0].scrollHeight);
    },

    append : function(data, config) {
        var el  = $('.brackets-sencha-content', this.getPanel().$panel),
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

        this.scrollToBottom();

        return $(div);
    }
});

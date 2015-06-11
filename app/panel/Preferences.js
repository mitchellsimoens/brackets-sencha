/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, $, brackets, window */

var PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
    FileSystem         = brackets.getModule('filesystem/FileSystem'),
    Dialogs            = brackets.getModule('widgets/Dialogs'),
    user               = brackets.app.getUserDocumentsDirectory(),
    prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha');

/**
 * Class to manage preferences.
 *
 * @class App.panel.Preferences
 */
Sencha.define('App.panel.Preferences', {
    singleton : true,

    requires : [
        'App.Template'
    ],

    mixins : [
        'App.menu.Mixin'
    ],

    // groups we want to track for preferences
    prefsGroups : [
        { name : 'cmd',      label : 'Sencha Cmd' },
        { name : 'fiddle',   label : 'Fiddle'     }
    ],

    /**
     * Main repository of preferences for the application
     * When this module initializes, it will loop over this list and call the necessary "definePreference" for each
     *
     * Each preference config should include:
     * - key (the key within this object)
     * - type (type used in definePreference)
     * - default (default value used in definePreference)
     * - inputType (type of input to create on the manager form; if not present, will take on the type value; valid values are "path", "boolean", "string")
     * - group (key of the group to which this preference should be belong; see "prefGroups" for valid group keys)
     * - label (label to be used when rendering the form field/label on the manager form)
     */
    prefsConfig : {
        'cmd_root'              : {
            type      : 'string',
            default   : user.replace('/Documents', ''),
            group     : 'cmd',
            label     : 'Sencha Cmd Root',
            inputType : 'path',
            editable  : true
        },
        'close_on_success'      : {
            type    : 'boolean',
            default : true,
            group   : 'cmd',
            label   : 'Close Output Panel on Success',
            editable: true
        },
        'user_cmds'             : {
            type    : 'object',
            default : {},
            group   : 'cmd',
            label   : 'User-defined Cmd Recipes',
            editable: false
        },
        'fiddle_replace_remote' : {
            type    : 'boolean',
            default : true,
            group   : 'fiddle',
            label   : 'Replace Remote URIs With Local',
            editable: true
        },
        'fiddle_onready_wrap'   : {
            type    : 'boolean',
            default : true,
            group   : 'fiddle',
            label   : 'Wrap File Source in Ext.onReady',
            editable: true
        },
        'sdk_tpl'               : {
            type    : 'string',
            default : 'http://localhost/sdk/{framework}/{full_version}',
            group   : 'fiddle',
            label   : 'SDK Url Template',
            under   : 'Options:<ul><li>{framework}</li><li>{version}</li><li>{short_version}</li><li>{label}</li></ul>',
            editable: true
        }
    },

    menus : [
        {
            name  : 'sencha.preferences.edit',
            label : 'Sencha Preferences...',
            scope : 'this',
            fn    : 'showPreferencesDialog',
            menu  : [
                'edit-menu'
            ]
        },
        {
            divider : 'sencha.preferences.edit',
            name    : 'sencha.preferences.divider',
            menu    : [
                'edit-menu'
            ]
        }
    ],

    construct : function(config) {
        this.callParent([config]);

        var prefsConfig = this.prefsConfig,
            key, item;

        // loop over defs and define them
        for (key in prefsConfig) {
            item = prefsConfig[key];

            prefs.definePreference(key, item.type, item.default);
        }

        this.initMenu();
    },

    /**
     * @private
     * Saves preferences defined in form
     * @param {Event} e The click event from the save button
     */
    savePreferences : function(e) {
        var prefsConfig = this.prefsConfig,
            $form       = $('#preferences_form'),
            values      = $form.serializeArray(),
            i           = 0,
            length      = values.length,
            prefConfig,pref,value;

        for (; i < length; i++) {
            pref       = values[i];
            prefConfig = prefsConfig[pref.name];
            value      = pref.value;

            if (prefConfig.type && prefConfig.type==='boolean') {
                value = (value === 'true');
            }

            prefs.set(pref.name, value);
        }
    },

    /**
     * @private
     * Creates a modal with promise for path selection
     * @param {Event} e The click event from the save button
     */
    showPathSelector : function(e) {
        var me       = this,
            $button  = $(e.target),
            $field   = $button.prevAll('input'),
            deferred = $.Deferred();

        e.preventDefault();

        deferred
            .then(function() {
                return me.choosePath($field.val());
            })
            .done(function(dir) {
                $field.val(dir);
            });

        deferred.resolve();

        return false;
    },

    /**
     * @private
     * Displays path selector modal
     * @param {String} initialPath Initial path to use for modal selector
     */
    choosePath : function(initialPath) {
        var deferred = new $.Deferred();

        FileSystem.showOpenDialog(
            false,
            true,
            'Select a new path',
            initialPath,
            null,
            function(error, dir) {
                if (!error && dir.length > 0) {
                    dir = dir.pop();

                    deferred.resolve(dir);
                }
            }
        );

        return deferred.promise();
    },

    /**
     * @private
     * Clears read-only field
     * @param {Event} e The button click event
     */
    clearFieldValue : function(e) {
        var $button = $(this);

        $button.prev('input').val('');

        e.preventDefault();

        return false;
    },

    /**
     * @private
     * Display user preferences for brackets-sencha
     */
    showPreferencesDialog : function() {
        var modalTemplate = App.Template.get('preferences/formModal'),
            senchaPrefs   = [],
            groups        = {},
            prefsGroups   = this.prefsGroups,
            prefsConfig   = this.prefsConfig,
            renderedTemplate,
            dialog,
            $element,
            $saveButton,
            $pathButtons,
            $clearButtons,
            key, pref, group, value, type;

        // define groups
        for (key in prefsGroups) {
            group = prefsGroups[key];

            group = groups[group.name] = {
                label       : group.label,
                preferences : []
            };

            //push to the array so Mustache can deal with it
            senchaPrefs.push(group);
        }

        // create render definitions for each pref and put in correct group
        for (key in prefsConfig) {
            pref  = prefsConfig[key];
            value = prefs.get(key);
            type  = pref.inputType || pref.type;

            if(pref.editable) {
                groups[pref.group].preferences.push({
                    key            : key,
                    value          : value,
                    label          : pref.label,
                    isPath         : type === 'path',
                    isBoolean      : type === 'boolean',
                    isString       : type === 'string',
                    isEditable     : pref.editable,
                    under          : pref.under,
                    booleanOptions : [
                        {
                            value    : true,
                            text     : 'Yes',
                            selected : value
                        },
                        {
                            value    : false,
                            text     : 'No',
                            selected : !value
                        }
                    ]
                });
            }
        }

        // render with Mustache so we can handle *some* logic in the template
        renderedTemplate = Mustache.render(modalTemplate, { prefCollection : senchaPrefs });
        dialog           = Dialogs.showModalDialogUsingTemplate(renderedTemplate);
        $element         = dialog.getElement();
        $saveButton      = $element.find('.save-button');
        $pathButtons     = $element.find('.path-button');
        $clearButtons    = $element.find('.clear-button');

        // add event listeners to elements
        $saveButton  .on('click', this.savePreferences.bind(this));
        $pathButtons .on('click', this.showPathSelector.bind(this));
        $clearButtons.on('click', this.clearFieldValue.bind(this));
    }
});

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, Mustache */

define(function(require, exports) {
    'use strict';
    var PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        FileSystem         = brackets.getModule('filesystem/FileSystem'),
        Menus              = brackets.getModule('command/Menus'),
        Dialogs            = brackets.getModule('widgets/Dialogs'),
        user               = brackets.app.getUserDocumentsDirectory(),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        prefsConfig,
        prefsGroups;

    function init(config) {
        var key, item;

        // groups we want to track for preferences
        prefsGroups = [
            { name : 'cmd',      label : 'Sencha Cmd' },
            { name : 'fiddle',   label : 'Fiddle'     }
        ];

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
        prefsConfig = {
            'cmd_root'              : {
                type      : 'string',
                default   : user.replace('/Documents', ''),
                group     : 'cmd',
                label     : 'Sencha Cmd Root',
                inputType : 'path'
            },
            'close_on_success'      : {
                type    : 'boolean',
                default : true,
                group   : 'cmd',
                label   : 'Close Output Panel on Success'
            },
            'sdk_tpl'               : {
                type    : 'string',
                default : 'http://localhost/sdk/{framework}/{full_version}',
                group   : 'fiddle',
                label   : 'SDK Url Template'
            },
            'fiddle_replace_remote' : {
                type    : 'boolean',
                default : true,
                group   : 'fiddle',
                label   : 'Replace Remote URIs With Local'
            },
            'fiddle_onready_wrap'   : {
                type    : 'boolean',
                default : true,
                group   : 'fiddle',
                label   : 'Wrap File Source in Ext.onReady'
            }
        };

        // loop over defs and define them
        for (key in prefsConfig) {
            item = prefsConfig[key];

            prefs.definePreference(key, item.type, item.default);
        }

        config.MenuManager.addMenus([
            {
                name     : 'sencha.preferences.edit',
                label    : 'Sencha Preferences...',
                menu     : [
                    'edit-menu'
                ],
                fn       : _showPreferencesDialog
            },
            {
                divider : 'sencha.preferences.edit',
                name    : 'sencha.preferences.divider',
                menu    : [
                    'edit-menu'
                ]
            }
        ]);
    }

    /**
     * @private
     * Saves preferences defined in form
     * @param {Event} e The click event from the save button
     */
    function _savePreferences(e) {
        var $form  = $('#preferences_form'),
            values = $form.serializeArray(),
            i      = 0,
            length = values.length,
            prefConfig,pref,value;

        for(; i < length; i++) {
            pref       = values[i];
            prefConfig = prefsConfig[pref.name];
            value      = pref.value;

            if (prefConfig.type && prefConfig.type==='boolean') {
                value = (value === 'true');
            }

            prefs.set(pref.name, value);
        }
    }

    /**
     * @private
     * Creates a modal with promise for path selection
     * @param {Event} e The click event from the save button
     */
    function _showPathSelector(e) {
        var $button = $(this),
            $fld    = $button.prev(),
            deferred;

        e.preventDefault();

        deferred = $.Deferred();

        deferred
            .then(function() {
                return _choosePath($fld.val());
            })
            .done(function(dir) {
                $fld.val(dir);
            });

        deferred.resolve();

        return false;
    }

    /**
     * @private
     * Displays path selector modal
     * @param {String} initialPath Initial path to use for modal selector
     */
    function _choosePath(initialPath) {
        var deferred = new $.Deferred();

        FileSystem.showOpenDialog(
            false,
            true,
            'Select a new path',
            initialPath,
            null,
            function(error, dirs) {
                if (!error && dirs.length > 0) {
                    var dir = dirs.pop();
                    deferred.resolve(dir);
                }
            }
        );

        return deferred.promise();
    }

    /**
     * @private
     * Clears read-only field
     * @param {Event} e The button click event
     */
    function _clearFieldValue(e) {
        var $button = $(this);

        $button.prev().val('');

        e.preventDefault();

        return false;
    }

    /**
     * @private
     * Display user preferences for brackets-sencha
     */
    function _showPreferencesDialog() {
        var modalTemplate = require('text!templates/preferences/formModal.html'),
            senchaPrefs   = [],
            groups        = {},
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

            groups[pref.group].preferences.push({
                key            : key,
                value          : value,
                label          : pref.label,
                isPath         : type === 'path',
                isBoolean      : type === 'boolean',
                isString       : type === 'string',
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

        // render with Mustache so we can handle *some* logic in the template
        renderedTemplate = Mustache.render(modalTemplate, {prefCollection: senchaPrefs});
        dialog           = Dialogs.showModalDialogUsingTemplate(renderedTemplate);
        $element         = dialog.getElement();
        $saveButton      = $element.find('.save-button');
        $pathButtons     = $element.find('.path-button');
        $clearButtons    = $element.find('.clear-button');

        // add event listeners to elements
        $saveButton  .on('click', _savePreferences);
        $pathButtons .on('click', _showPathSelector);
        $clearButtons.on('click', _clearFieldValue);
    }

    exports.init = init;
});

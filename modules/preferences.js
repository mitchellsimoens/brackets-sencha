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
        var key,
            item;
        // groups we want to track for preferences
        prefsGroups = [
            {name: 'cmd',      label: 'Sencha Cmd'},
            {name: 'fiddle',   label: 'Fiddle'}
        ];
        /**
         * Main repository of preferences for the application
         * When this module initializes, it will loop over this list and call the necessary "definePreference" for each
         * 
         * Each preference config should include:
         * - key (the key within this object)
         * - type (type used in definePreference)
         * - default (default value used in definePreference)
         * - inputType (type of input to create on the manager form; valid values are "path", "boolean")
         * - group (key of the group to which this preference should be belong; see "prefGroups" for valid group keys)
         * - label (label to be used when rendering the form field/label on the manager form)
         */
        prefsConfig = {
            'cmd_root': {
                type: 'string', default: user.replace('/Documents', ''), inputType: 'path', group: 'cmd', label: 'Sencha Cmd Root'
            },
            'close_on_success': {
                type: 'boolean',default: '', inputType: 'boolean',  group: 'cmd',    label: 'Close on Success'
            },
            'webserver_path': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'Webserver Path'
            },
            'sdk_path_5.1.0': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 5.1.0)'
            },
            'sdk_path_5.0.1': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 5.0.1)'
            },
            'sdk_path_5.0.0': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 5.0.0)'
            },
            'sdk_path_ext-5.0.0.736': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 5.0.0.736)'
            },
            'sdk_path_4.2.1': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 4.2.1)'
            },
            'sdk_path_4.2.0': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 4.2.0)'
            },
            'sdk_path_ext-4.1.1-gpl': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 4.1.1)'
            },
            'sdk_path_ext-4.1.0-gpl': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 4.1.0)'
            },
            'sdk_path_ext-4.0.7-gpl': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 4.0.7)'
            },
            'sdk_path_3.4.1.1': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 3.4.1.1)'
            },
            'sdk_path_ext-3.4.0': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 3.4.0)'
            },
            'sdk_path_ext-3.3.0': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 3.3.0)'
            },
            'sdk_path_ext-3.0.0': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 3.0.0)'
            },
            'sdk_path_ext-2.3.0': {
                 type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Ext JS 2.3.0)'
            },
            'sdk_path_touch-2.4.1': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Sencha Touch 2.4.1)'
            },
            'sdk_path_touch-2.4.0': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Sencha Touch 2.4.0)'
            },
            'sdk_path_touch-2.3.0': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Sencha Touch 2.3.0)'
            },
            'sdk_path_touch-2.2.1': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Sencha Touch 2.2.1)'
            },
            'sdk_path_touch-2.2.0': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Sencha Touch 2.2.0)'
            },
            'sdk_path_touch-2.1.1': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Sencha Touch 2.1.1)'
            },
            'sdk_path_touch-2.0.1.1': {
                type: 'string', default: '', inputType: 'path',     group: 'fiddle', label: 'SDK Path (Sencha Touch 2.0.1.1)'
            }
        };
        // loop over defs and define them
        for(key in prefsConfig) {
            item = prefsConfig[key];
            prefs.definePreference(key, item.type, item.default);
        } 
        config.MenuManager.addMenus([
            {
                name     : 'sencha.preferences.edit',
                label    : 'Sencha Preferences...',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ],
                fn       : function() {
                    _showPreferencesDialog();
                }
            }
        ]);
    }
    
    /**
     * @private
     * Saves preferences defined in form
     * @param {Event} e The click event from the save button
     */
    function _savePreferences(e) {
        var $form = $('#preferences_form'),
            values = $form.serializeArray(),
            i=0,
            prefConfig,pref,value
        for(; i<values.length; i++) {
            pref = values[i];
            prefConfig = prefsConfig[pref.name];
            value = pref.value;
            if(prefConfig.type && prefConfig.type==='boolean') {
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
            $fld = $button.prev(),
            deferred;
        e.preventDefault();
        deferred = $.Deferred()
        deferred.then(function() {
            return _choosePath($fld.val());
        }).done(function(dir) {
            $fld.val(dir);              
        })
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
            renderedTemplate,
            dialog,
            $element,
            $saveButton,
            $pathButtons,
            $clearButtons,
            senchaPrefs = [],
            groups={},
            key,pref,group,i,value;
        // define groups
        for(i in prefsGroups){
            group = prefsGroups[i];
            groups[group.name] = {
                label: group.label,
                preferences: []
            };
        }
        // create render definitions for each pref and put in correct group
        for(key in prefsConfig) {
            pref = prefsConfig[key];
            value = prefs.get(key);
            groups[pref.group].preferences.push({
                key: key,
                value: value,
                label: pref.label,
                isPath: pref.inputType=='path',
                isBoolean: pref.inputType=='boolean',
                isText: pref.inputType=='text',
                booleanOptions: [{
                    value: true,
                    text: 'Yes',
                    selected: value
                },{
                    value: false,
                    text: 'No',
                    selected: !value
                }]
            });
        }
        // flatten to an array so Mustache can handle them
        for(key in groups){
            senchaPrefs.push(groups[key]);
        }
        renderedTemplate = Mustache.render(modalTemplate, {prefCollection: senchaPrefs});
        dialog = Dialogs.showModalDialogUsingTemplate(renderedTemplate);
        $element = dialog.getElement();
        $saveButton = $element.find('.save-button');
        $pathButtons = $element.find('.path-button');
        $clearButtons = $element.find('.clear-button');
        // add event listeners to elements
        $saveButton.on('click', _savePreferences);
        $pathButtons.on('click', _showPathSelector);
        $clearButtons.on('click', _clearFieldValue);
    }
    
    exports.init = init;
});
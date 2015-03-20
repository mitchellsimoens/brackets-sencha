/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require) {
    'use strict';

    var PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        user               = brackets.app.getUserDocumentsDirectory();

    prefs.definePreference('cmd_root',         'string',   user.replace('/Documents', ''));
    prefs.definePreference('close_on_success', 'boolean ', true                          );

    var MenuManager = require('./modules/menumanager'),
        OutputPanel = require('./modules/output').init(),
        Command     = require('./modules/command').init({
            OutputPanel : OutputPanel
        }),
        Cmd         = require('./modules/cmd').init({
            OutputPanel : OutputPanel,
            Command     : Command,
            MenuManager : MenuManager
        });
});

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require) {
    'use strict';

    var PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        user               = brackets.app.getUserDocumentsDirectory();
        
    var MenuManager = require('./modules/menumanager'),
        OutputPanel = require('./modules/output').init(),
        Command     = require('./modules/command').init({
            OutputPanel : OutputPanel
        }),
        Cmd         = require('./modules/cmd').init({
            OutputPanel : OutputPanel,
            Command     : Command,
            MenuManager : MenuManager
        }),
        Fiddle      = require('./modules/fiddle').init({
            MenuManager : MenuManager
        }),
        Preferences      = require('./modules/preferences').init({
            MenuManager : MenuManager
        });
});

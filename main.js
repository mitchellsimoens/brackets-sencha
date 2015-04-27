/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require) {
    'use strict';

    var PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        user               = brackets.app.getUserDocumentsDirectory();

    var MenuManager = require('./modules/menumanager'),
        OutputPanel = require('./modules/output').init({
            MenuManager : MenuManager
        }),
        Command     = require('./modules/command').init({
            MenuManager : MenuManager,
            OutputPanel : OutputPanel
        }),
        Cmd         = require('./modules/cmd').init({
            Command     : Command,
            MenuManager : MenuManager,
            OutputPanel : OutputPanel
        }),
        Fiddle      = require('./modules/fiddle').init({
            Cmd         : Cmd,
            Command     : Command,
            MenuManager : MenuManager,
            OutputPanel : OutputPanel
        }),
        Preferences      = require('./modules/preferences').init({
            Cmd         : Cmd,
            Command     : Command,
            Fiddle      : Fiddle,
            MenuManager : MenuManager,
            OutputPanel : OutputPanel
        });
});

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require) {
    require('./lib/Sencha');

    var AppInit        = brackets.getModule('utils/AppInit'),
        ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        appPath        = Sencha.modulePath + '../app/',
        SenchaDomain   = appPath + 'node/SenchaDomain'

    Sencha.Loader.setPath('App', appPath);

    Sencha.require([
        'App.menu.Manager',
        'App.panel.Preferences',
        'App.panel.Output',
        'App.node.Command',
        'App.cmd.Cmd',
        'App.fiddle.Fiddle'
    ]);

    AppInit.appReady(function () {
        App.panel.Output.render();

        App.node.Command.initDomain(SenchaDomain);
    });
});

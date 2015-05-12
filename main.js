/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports, module) {
    require('./lib/Sencha');

    var AppInit        = brackets.getModule('utils/AppInit'),
        ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        appPath        = ExtensionUtils.getModulePath(module, 'app/'),
        tplPath        = ExtensionUtils.getModulePath(module, 'templates/'),
        SenchaDomain   = appPath + 'node/SenchaDomain';

    Sencha.Loader.setPath('App', appPath);

    Sencha.require([
        'Sencha.Format',
        'App.menu.Manager',
        'App.panel.Preferences',
        'App.panel.Output',
        'App.node.Command',
        'App.cmd.Cmd',
        'App.fiddle.Fiddle',
        'App.Template'
    ]);

    AppInit.appReady(function () {
        App.Template.setTplPath(tplPath);

        App.node.Command.setAutolinker(
            require('./Autolinker')
        );

        App.panel.Output.render();

        App.node.Command.initDomain(SenchaDomain);
    });
});

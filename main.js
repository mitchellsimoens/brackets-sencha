/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports, module) {
    var AppInit        = brackets.getModule('utils/AppInit'),
        ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        SenchaDomain   = ExtensionUtils.getModulePath(module, 'lib/node/SenchaDomain');

    require('./lib/Sencha');

    Sencha.require([
        'Sencha.menu.Manager',
        'Sencha.panel.Preferences',
        'Sencha.panel.Output',
        'Sencha.node.Command',
        'Sencha.cmd.Cmd',
        'Sencha.fiddle.Fiddle'
    ]);

    AppInit.appReady(function () {
        Sencha.panel.Output.render();

        Sencha.node.Command.initDomain(SenchaDomain);
    });
});

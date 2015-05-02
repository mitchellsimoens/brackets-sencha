/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, define, $, brackets, window */

define(function(require, exports, module) {
    var ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        modulePath     = ExtensionUtils.getModulePath(module),
        Loader         = require('./Loader'),
        ClassManager   = require('./ClassManager'),
        Util           = require('./Util');

    Loader.setPath('Sencha', modulePath);

    window.Sencha = {
        ClassManager : ClassManager,
        Loader       : Loader,
        Util         : Util,

        modulePath : modulePath,

        apply   : Util.apply.bind(Util),
        define  : ClassManager.apply.bind(ClassManager),
        require : Loader.require.bind(Loader)
    };
});

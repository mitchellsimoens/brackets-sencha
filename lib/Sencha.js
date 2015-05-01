/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, define, $, brackets, window */

define(function(require, exports, module) {
    var ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        modulePath     = ExtensionUtils.getModulePath(module),
        classes        = {},
        Loader         = require('./Loader'),
        ClassManager   = require('./ClassManager'),
        Util           = require('./Util');

    Loader.setPath('Sencha', modulePath);

    function createAlias(method, scope) {
        return function() {
            return scope[method].apply(scope, arguments);
        };
    }

    window.Sencha = {
        ClassManager : ClassManager,
        Loader       : Loader,
        Util         : Util,

        modulePath : modulePath,

        apply   : createAlias('apply',   Util),
        define  : createAlias('define',  ClassManager),
        require : createAlias('require', Loader)
    };
});

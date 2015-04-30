/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require) {
    function getSuperMethod(name, superCls, caller) {
        var method = superCls.prototype[name];

        if (method) {
            if (method === caller) {
                if (superCls && superCls.$superclass) {
                    return getSuperMethod(name, superCls.$superclass, caller);
                }
            } else {
                return method;
            }
        }
    }

    /**
     * Base class for all classes.
     *
     * @class Sencha.Base
     */
    Sencha.define('Sencha.Base', {
        extend : function(config) {
            this.construct(config);

            return this;
        },

        construct : function(config) {
            Sencha.apply(this, config);

            this.initMenu();
        },

        callParent : function(args) {
            var caller = this.callParent.caller,
                name   = caller.$methodName,
                method = getSuperMethod(name, this.$superclass, caller);

            if (method) {
                return method.apply(this, args);
            }
        },

        initMenu : function() {
            var menus = this.menus;

            if (menus) {
                Sencha.menu.Manager.addMenus(menus, this);
            }
        }
    });
});

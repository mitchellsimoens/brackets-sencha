/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, $, brackets, window */

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

    inheritableStatics : {
        callParent : function(args) {
            var method,
                superMethod = (
                        method = this.callParent.caller
                    )
                    &&
                    (
                        method.$previous
                        ||
                        (
                            (
                                method = method.$owner ? method : method.caller
                            )
                            &&
                            method.$owner.$superclass[method.$name]
                        )
                    );

            return superMethod.apply(this, args || []);
        }
    },

    construct : function(config) {
        Sencha.Util.apply(this, config);
    },

    callParent : function(args) {
        var method,
            superMethod = (
                    method = this.callParent.caller
                )
                &&
                (
                    method.$previous
                    ||
                    (
                        (
                            method = method.$owner ? method : method.caller
                        )
                        &&
                        method.$owner.$superclass[method.$name]
                    )
                );

        return superMethod.apply(this, args || []);
    },

    callSuper : function(args) {
        var method,
            superMethod = (
                    method = this.callSuper.caller
                )
                &&
                (
                    method.$owner.$superclass.prototype.$superclass.prototype[method.$name]
                    ||
                    (
                        method = method.$owner ? method : method.caller
                    )
                    &&
                    method.$owner.$superclass[method.$name]
                );

        return superMethod.apply(this, args || []);
    }
});

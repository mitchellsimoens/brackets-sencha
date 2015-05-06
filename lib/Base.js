function generateGetterSetter(property) {
    var parsed  = '_' + property,
        capped  = Sencha.Format.capitalize(property),
        getter  = 'get'    + capped,
        setter  = 'set'    + capped,
        applier = 'apply'  + capped,
        updater = 'update' + capped;

    return {
        parsed     : parsed,
        getterName : getter,
        setterName : setter,
        getterFn   : function() {
            return this[parsed];
        },
        setterFn   : function(value) {
            var me      = this,
                current = me[parsed];

            if (me[applier]) {
                value = me[applier](value, current);
            }

            if (value !== current) {
                me[parsed] = value;

                if (me[updater] && value !== current) {
                    me[updater](value, current);
                }
            }

            return me;
        }
    };
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

    /**
     * @protected
     * @property {Boolean} [$isClass=true] Signifies this is a class.
     */
    $isClass : true,

    inheritableStatics : {
        /**
         * Calls the superclass' static method.
         *
         * @param {Array} args The arguments to pass to the superclass' static method.
         * @returns {*}
         */
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

    /**
     * The first method executed when the class is created. This will apply the config object values onto the instance.
     *
     * @param {Object} config The configuration object to be applied to the instance.
     */
    construct : function(config) {
        Sencha.Util.apply(this, config);
    },

    /**
     * Calls the superclass' method.
     *
     * @param {Array} args The arguments to pass to the superclass' method.
     * @returns {*}
     */
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

    /**
     * Skips the superclass and calls it's superclass' method.
     *
     * @param {Array} args The arguments to pass.
     * @returns {*}
     */
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
    },

    /**
     * Initializes the getters/setters for the config object.
     *
     * @param {Object} instanceConfig The instance config usually from the `construct` method.
     */
    initConfig : function(instanceConfig) {
        var me          = this,
            classConfig = me.config,
            getters     = {},
            setters     = {},
            config,
            property, value,
            generated;

        if (classConfig) {
            classConfig = Sencha.Util.clone(classConfig);
            config      = Sencha.Util.apply(classConfig, instanceConfig);

            for (property in classConfig) {
                if (classConfig.hasOwnProperty(property)) {
                    value     = config[property];
                    generated = generateGetterSetter(property);

                    if (!me[generated.getterName]) {
                        me[generated.getterName] = generated.getterFn;
                    }

                    getters[generated.getterName] = true;
                    setters[generated.setterName] = {
                        getterName : generated.getterName,
                        value      : value
                    };

                    if (!me[generated.setterName]) {
                        me[generated.setterName] = generated.setterFn;
                    } else {
                        me[generated.parsed] = value;
                    }
                }
            }

            for (property in getters) {
                if (me[property]) {
                    me[property]();
                }
            }

            for (property in setters) {
                if (me[property]) {
                    generated = setters[property];
                    value     = me[generated.getterName].call(me) || generated.value;

                    me[property](value);
                }
            }
        }
    }
});

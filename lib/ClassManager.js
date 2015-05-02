/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, define, $, brackets, window */

define(function() {
    var classMap       = {},
        preProcessors  = {},
        postProcessors = {};

    /**
     * Manager to create and hold references to class definitions.
     *
     * @class Sencha.ClassManager
     */
    function ClassManager() {}

    /**
     * Registers a class using it's class name.
     *
     * @param {String} name The class name as a string.
     * @param {Sencha.Base} cls The class definition.
     * @returns {Sencha.Base} The class definition.
     */
    ClassManager.prototype.register = function(name, cls) {
        if (classMap[name]) {
            console.warn('Registering a new class (%s) with the same name as an existing class.', name);
        }

        var parts  = name.split('.'),
            i      = 0,
            length = parts.length,
            root   = window,
            part;

        for (; i < length; i++) {
            part = parts[i];

            if (i === length - 1) {
                root[part] = cls;
            } else  if (!root[part]) {
                root = root[part] = {};
            } else {
                root = root[part];
            }
        }

        return classMap[name] = cls;
    };

    /**
     * Getes the class definition using the class name. If a class is not registered with that name, {@link Sencha.Loader}
     * will attempt to load the class.
     *
     * @param {String} name The class name to retrieve.
     * @returns {Sencha.Base}
     */
    ClassManager.prototype.get = function(name) {
        if (typeof name === 'function') {
            return name;
        }

        var cls = classMap[name];

        if (!cls) {
            Sencha.Loader.load([name]);

            cls = classMap[name];
        }

        return cls;
    };

    /**
     * Defines a new class.
     *
     * @param {String} name The class name to assign the new class definition.
     * @param {Object/Function} config An object to apply properties onto the new class' prototype.
     * @param {Function} callback An optional function to execute when the class has been defined (after all post processors have run).
     * @returns {Sencha.Base}
     */
    ClassManager.prototype.define = function(className, config, callback) {
        if (typeof config === 'function') {
            config = config();
        }

        config = config || {};

        var extend     = config.extend || 'Sencha.Base',
            superclass = this.get(extend),
            cls        = function(config) {
                this.construct(config);

                return this;
            },
            temp, constructorProto, superProto;

        delete config.extend;

        if (!superclass) {
            superclass = this.get(extend);
        }

        if (cls.prototype.onBeforeClassExtends) {
            temp = cls.prototype.onBeforeClassExtends(cls, config);

            if (temp) {
                config = temp;
            }
        }

        if (superclass.prototype.onBeforeClassExtended) {
            temp = superclass.prototype.onBeforeClassExtended(cls, config);

            if (temp) {
                config = temp;
            }
        }

        //do the actual extending
        superProto       = superclass.prototype;
        constructorProto = cls.prototype = Object.create(superProto, {
            constructor : {
                value        : cls,
                enumerable   : false,
                writable     : true,
                configurable : true
            }
        });

        //apply the config object onto the proto
        Sencha.Util.apply(
            constructorProto,
            {
                $className  : className,
                $superclass : superclass
            },
            config
        );

        this.runPreprocessors(cls, config);

        if (constructorProto.onClassDefined) {
            constructorProto.onClassDefined(config);
        }

        if (superProto.onClassExtended) {
            superProto.onClassExtended(cls, config);
        }

        this.runPostprocessors(cls, config);

        if (callback) {
            callback.call(cls, cls);
        }

        return cls;
    };

    /**
     * Creates an instance of a class. If a class has not yet been registered, {@link Sencha.Loader} will attempt to load
     * the class.
     *
     * @param {String} name The class name to be created.
     * @param {Object} config The optional instance config to be applied to the class instance.
     * @returns {Sencha.Base}
     */
    ClassManager.prototype.create = function(name, config) {
        var cls = typeof name === 'string' ? this.get(name) : name;

        if (cls) {
            var instance = new cls(config);

            if (instance.onClassCreated) {
                instance.onClassCreated(config);
            }

            if (config && config.singleton) {
                this.setSingleton(name, instance);

                classMap[name] = false;
            }

            return instance;
        } else {
            console.warn('Class %s was not found.', name);
        }
    };
    /**
     * Creates the namespace for classes.
     *
     * @param {String} ns The namespace to create.
     * @returns {Object}
     */
    ClassManager.prototype.namespace = function(ns) {
        var arr    = ns.split('.'),
            i      = 0,
            length = arr.length,
            root   = window,
            name;

        for (; i < length; i++) {
            name = arr[i];

            if (!root[name]) {
                root[name] = {};
            }

            root = root[name];
        }

        return root;
    };

    /**
     * Set the class instance as a singleton. This will overwrite the class definition with the class instance.
     *
     * @param {String} className The class name to use for the singleton
     * @param {Sencha.Base} cls The class instance to use.
     */
    ClassManager.prototype.setSingleton = function(className, cls) {
        var arr    = className.split('.'),
            proper = arr.pop(),
            root   = this.namespace(arr.join('.'));

        root[proper] = cls;
    };

    /**
     * Register a pre-processor that will run before the classes is extended.
     *
     * @param {String} name The name of the pre-processor.
     * @param {Function} func The function to execute.
     */
    ClassManager.prototype.registerPreprocessor = function(name, func) {
        preProcessors[name] = func;
    };

    /**
     * Register a post-processor that will run after the classes is extended.
     *
     * @param {String} name The name of the post-processor.
     * @param {Function} func The function to execute.
     */
    ClassManager.prototype.registerPostprocessor = function(name, func) {
        postProcessors[name] = func;
    };

    /**
     * Run the pre-processors.
     *
     * @param {Sencha.Base} cls The new class definition.
     * @param {Object} config The config object being applied to the new class.
     */
    ClassManager.prototype.runPreprocessors = function(cls, config) {
        var name, preprocessor, temp;

        for (name in preProcessors) {
            if (preProcessors.hasOwnProperty(name)) {
                preprocessor = preProcessors[name];

                temp = preprocessor(cls, config);

                if (temp) {
                    cls = temp;
                }
            }
        }
    };

    /**
     * Run the post-processors.
     *
     * @param {Sencha.Base} cls The new class definition.
     * @param {Object} config The config object being applied to the new class.
     */
    ClassManager.prototype.runPostprocessors = function(cls, config) {
        var name, postprocessor, temp;

        for (name in postProcessors) {
            if (postProcessors.hasOwnProperty(name)) {
                postprocessor = postProcessors[name];

                temp = postprocessor(cls, config);

                if (temp) {
                    cls = temp;
                }
            }
        }
    };

    //create the ClassManager instance
    ClassManager = new ClassManager();

    ClassManager.registerPreprocessor('requires', function(cls, config) {
        if (config.requires) {
            Sencha.require(config.requires);
        }
    });

    ClassManager.registerPreprocessor('statics', function(cls, config) {
        if (config.statics) {
            Sencha.Util.apply(cls, config.statics);
        }
    });

    ClassManager.registerPreprocessor('inheritable statics', function(cls, config) {
        var superCls = cls.prototype.$superclass,
            statics;

        if (superCls) {
            while(superCls) {
                statics = superCls.prototype.inheritableStatics;

                if (statics) {
                    Sencha.Util.apply(cls, statics);
                }

                superCls = superCls.prototype.$superclass;
            }
        }

        statics = config.inheritableStatics;

        if (statics) {
            Sencha.Util.apply(cls, statics);
        }
    });

    ClassManager.registerPreprocessor('mixin', function(cls, config) {
        if (config.mixins) {
            config.mixins.forEach(function(mixin) {
                if (typeof mixin === 'string') {
                    mixin = ClassManager.get(mixin);
                }

                Sencha.Util.applyIf(cls.prototype, mixin.prototype);
            });
        }
    });

    ClassManager.registerPreprocessor('interface', function(cls, config) {
        var interfaces = cls.prototype.interfaces;

        if (interfaces) {
            var proto = cls.prototype;

            interfaces.forEach(function(interfaceCls) {
                if (typeof interfaceCls === 'string') {
                    interfaceCls = ClassManager.get(interfaceCls);
                }

                var interfaceProto = interfaceCls.prototype,
                    properties     = interfaceProto.properties;

                if (properties) {
                    var name, msg;

                    for (name in properties) {
                        if (properties.hasOwnProperty(name)) {
                            msg = properties[name];

                            if (!proto[name]) {
                                proto[name] = interfaceProto.createErrorFunction(msg);
                            }
                        }
                    }
                }
            });
        }
    });

    ClassManager.registerPreprocessor('class registration', function(cls, config) {
        ClassManager.register(cls.prototype.$className, cls);
    });

    ClassManager.registerPostprocessor('singleton', function(cls, config) {
        if (config.singleton) {
            cls = new cls();

            ClassManager.setSingleton(cls.$className, cls);
        }

        return cls;
    });

    return ClassManager;
});

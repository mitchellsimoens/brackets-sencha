/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports, module) {
    var ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        modulePath     = ExtensionUtils.getModulePath(module),
        classes        = {};

    function apply(destination, source) {
        var name, value, type;

        if (source) {
            for (name in source) {
                value = source[name];
                type  = typeof value;

                if (type === 'function') {
                    value.$methodName = name;
                }

                destination[name] = value;
            }
        }

        return destination;
    }

    function bind(fn, scope) {
        return function() {
            return fn.apply(scope, arguments);
        };
    }

    window.Sencha = {
        Loader : require('./Loader'),
        /**
         * Gets the class definition.
         *
         * @param {String/Function} className The class name as a string to retrieve.
         * If passed a Function, will return the Function.
         * @returns {Function} class
         */
        get : function(className) {
            return typeof className === 'string' ? classes[className] : className;
        },

        /**
         * Sets the new class definition on the class.
         *
         * @param {String} className The class name as a string to set.
         * @param {Function} cls The class defintion.
         * @returns {Function} The class definition that was set.
         */
        set : function(className, cls) {
            if (classes[className]) {
                throw ('Class already defined: ' + className);
            }

            var parts  = className.split('.'),
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

            return classes[className] = cls;
        },

        /**
         * Define a new class.
         *
         * @param {String} className The class name for this new class.
         * @param {Object} definition The object with properties/methods to set on the new class.
         * @returns {Function} The new class that was defined.
         */
        define : function(className, definition) {
            if (typeof definition === 'function') {
                definition = definition();
            }

            var extend      = definition.extend || 'Sencha.Base',
                superCls    = this.get(extend),
                constructor = function(config) {
                    superCls.call(this, config);

                    return this;
                };

            delete definition.extend;

            constructor.prototype = Object.create(superCls.prototype, {
                constructor : {
                    value        : constructor,
                    enumerable   : false,
                    writable     : true,
                    configurable : true
                }
            });

            constructor.prototype.$superclass = superCls;
            constructor.prototype.$className  = className;

            apply(constructor.prototype, definition);

            if (definition.singleton) {
                constructor = new constructor();
            }

            this.set(className, constructor);
        },

        apply : apply,
        bind  : bind,

        require : function(classes, callback) {
            if (typeof classes === 'string') {
                classes = [classes];
            }

            var i      = 0,
                length = classes.length,
                need   = [];

            for (; i < length; i++) {
                if (!this.get(classes[i])) {
                    need.push(classes[i]);
                }
            }

            if (need.length) {
                Sencha.Loader.load(need, callback);
            } else {
                callback();
            }
        }
    };

    Sencha.Loader.setPath('Sencha', modulePath + 'lib/');

    Sencha.require([
        'Sencha.Base'
    ]);
});

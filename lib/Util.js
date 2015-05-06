/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, define, $, brackets, window */

define(function() {
    return {
        /**
         * Applies source values onto the target. If a collision happens, the value from the source will overwrite the target.
         *
         * @param {Object} target The target object to apply the source to.
         * @param {Object} source The source object to apply to the target.
         * @param {Object} defaults The default object to apply to the target before the source is applied.
         * @returns {Object}
         */
        apply : function(destination, source, defaults) {
            var name, value, type;

            if (defaults) {
                Sencha.Util.apply(destination, defaults);
            }

            if (source) {
                for (name in source) {
                    value = source[name];
                    type  = typeof value;

                    if (type === 'function') {
                        value.$methodName = value.$name = name;
                        value.$owner      = destination;
                        value.$previous   = destination[name];
                    }

                    destination[name] = value;
                }
            }

            return destination;
        },

        /**
         * Applies source values onto the target. If a collision happens, the target value will *not* be overwritten by the source.
         *
         * @param {Object} target The target object to apply the source to.
         * @param {Object} source The source object to apply to the target.
         * @param {Object} defaults The default object to apply to the target before the source is applied.
         * @returns {Object}
         */
        applyIf : function(destination, source, defaults) {
            var name, value, type;

            if (defaults) {
                Sencha.Util.applyIf(destination, defaults);
            }

            if (source) {
                for (name in source) {
                    if (destination[name]) {
                        continue;
                    }

                    value = source[name];
                    type  = typeof value;

                    if (type === 'function') {
                        value.$methodName = name;
                    }

                    destination[name] = value;
                }
            }

            return destination;
        },

        merge : function(destination, source, defaults) {
            var name, value, type;

            if (defaults) {
                Sencha.Util.merge(destination, defaults);
            }

            if (source) {
                for (name in source) {
                    value = source[name];
                    type  = typeof value;

                    if (type === 'function') {
                        value.$methodName = value.$name = name;
                        value.$owner      = destination;
                        value.$previous   = destination[name];
                    } else if (Sencha.Util.isArray(value)) {
                        //
                    } else if (value && value.constructor === Object) {
                        value = Sencha.Util.merge({}, value, destination[name]);
                    }

                    destination[name] = value;
                }
            }

            return destination;
        },

        /**
         * Clone an Object recursively.
         *
         * @param {Object} obj The object to clone recursively.
         */
        clone : function(obj) {
            return Sencha.Util.apply({}, obj);
        },

        /**
         * Attempts to turn the `arguments` keyword into a qualified Array.
         *
         * @param {Object} arr The `arguments` keyword.
         * @returns {Array}
         */
        toArray : function(arr) {
            return Array.prototype.slice.call(arr);
        },

        /**
         * Checks if the value is an Array. Using `typeof` will report an Array as an object which is not always what's needed.
         *
         * @param {*} value Value to check. This can be any arbitrary value, only an Array will return `true`.
         * @returns {Boolean}
         */
        isArray : function(value) {
            return Object.prototype.toString.call(value) === '[object Array]';
        },

        /**
         * Checks if the value is not `undefined`. `null` will return `true`.
         *
         * @param {*} value The value to test.
         * @returns {Boolean}
         */
        isDefined : function(value) {
            return value !== undefined;
        },

        /**
         * Returns `true` if the passed value is a number. Returns `false` for non-finite numbers.
         * @param {Object} value The value to test.
         * @return {Boolean}
         */
        isNumber : function(value) {
            return typeof value === 'number' && isFinite(value);
        }
    };
});

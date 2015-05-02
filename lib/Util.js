/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, define, $, brackets, window */

define(function() {
    var Util = {
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
                        value.$name     = name;
                        value.$owner    = destination;
                        value.$previous = destination[name];
                    }

                    destination[name] = value;
                }
            }

            return destination;
        },

        applyIf : function(destination, source) {
            var name, value, type;

            if (source) {
                for (name in source) {
                    if (destination[name]) {
                        continue;
                    }

                    value = source[name];
                    type  = typeof value;

                    if (type === 'function') {
                        value.$name     = name;
                        value.$owner    = destination;
                        value.$previous = destination[name];
                    }

                    destination[name] = value;
                }
            }

            return destination;
        }
    };

    return Util;
});

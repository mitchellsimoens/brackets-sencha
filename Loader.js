/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports, module) {
    var paths = {};

    /**
     * Class to load classes.
     *
     * @class Sencha.Loader
     */
    function Loader() {}

    Loader.prototype.setPath = function(root, path) {
        if (typeof root === 'string') {
            paths[root] = path;
        } else {
            var name;

            for (name in root) {
                this.setPath(name, root[name]);
            }
        }
    };

    Loader.prototype.getPath = function(className, append) {
        var path = paths[className];

        if (!path) {
            className = className.split('.');

            if (!append) {
                append = [];
            }

            append.unshift(className.pop());

            return this.getPath(className.join('.'), append);
        }

        if (append && append.length) {
            path += append.join('/');
        }

        var FileUtils = brackets.getModule('file/FileUtils');

        path = 'file://' + FileUtils.encodeFilePath(path + '.js');

        return path;
    };

    Loader.prototype.load = function(classes, callback) {
        var i      = 0,
            length = classes.length,
            loaded = 0,
            className, path;

        for (; i < length; i++) {
            className = classes[i];
            path      = this.getPath(className);

            if (path) {
                requirejs(
                    {
                        context : 'mitchellsimoens.brackets-sencha'
                    },
                    [path],
                    function() {
                        if (callback) {
                            loaded++;

                            if (loaded === length) {
                                callback();
                            }
                        }
                    }
                );
            }
        }
    };

    return new Loader();
});

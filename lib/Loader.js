/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, define, $, brackets, window */

define(function() {
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

    Loader.prototype.require = function(classes) {
        if (typeof classes === 'string') {
            classes = [classes];
        }

        var i      = 0,
            length = classes.length;

        for (; i < length; i++) {
            Sencha.ClassManager.get(classes[i]);
        }
    };

    Loader.prototype.load = function(classes) {
        var i      = 0,
            length = classes.length,
            className, path, source;

        for (; i < length; i++) {
            className = classes[i];
            path      = this.getPath(className);
            source    = this.loadSyncXhr({
                url : path
            });

            eval(source);
        }
    };

    Loader.prototype.loadSyncXhr = function(config) {
        config = config || {};

        return $.ajax({
            method : config.method || 'GET',
            url    : config.url,
            async  : false
        }).responseText;
    };

    return new Loader();
});

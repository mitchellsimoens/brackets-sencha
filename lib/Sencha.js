/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, define, $, brackets, window */

define(function(require, exports, module) {
    var ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        modulePath     = ExtensionUtils.getModulePath(module),
        Loader         = require('./Loader'),
        ClassManager   = require('./ClassManager'),
        Util           = require('./Util'),
        Ajax           = require('./Ajax');

    Loader.setPath('Sencha', modulePath);

    window.Sencha = {
        Ajax         : Ajax,
        ClassManager : ClassManager,
        Loader       : Loader,
        Util         : Util,

        modulePath : modulePath,

        apply   : Util.apply.bind(Util),
        define  : ClassManager.define.bind(ClassManager),
        require : Loader.require.bind(Loader),

        //@private
        idPrefix : 'sencha-',
        //@private
        idSeed   : 0,

        _body : null,

        getBody : function() {
            var body = Sencha._body;

            if (!body) {
                body = Sencha._body = Sencha.get(document.body);
            }

            return body;
        },

        /**
         * Generates unique ids. If the object/element is passes and it already has an `id`, it is unchanged.
         * @param {Object} [obj] The object to generate an id for.
         * @param {String} [prefix=ext-gen] (optional) The `id` prefix.
         * @return {String} The generated `id`.
         */
        id : function(obj, prefix) {
            if (obj && obj.id) {
                return obj.id;
            }

            var id = (prefix || Sencha.idPrefix) + (++Sencha.idSeed);

            if (obj) {
                obj.id = id;
            }

            return id;
        },

        get : function(el) {
            if (el) {
                if (el.isVirtualNode) {
                    return el;
                }

                return new Sencha.virtual.Node({
                    dom : el
                });
            }
        }
    };
});

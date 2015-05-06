/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, $, brackets, window */

Sencha.define('App.Template', {
    singleton : true,

    templates : {},

    get : function(name) {
        var templates = this.templates,
            tpl       = templates[name];

        if (!tpl) {
            tpl = templates[name] = Sencha.Loader.loadSyncXhr({
                url : Sencha.modulePath + '../templates/' + name + '.html'
            }).responseText;
        }

        return tpl;
    }
});

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, $, brackets, window */

Sencha.define('App.Template', {
    singleton : true,

    config : {
        templates : {},
        tplPath   : null
    },

    construct : function(config) {
        this.initConfig(config);
        this.callParent([config]);
    },

    get : function(name) {
        var templates = this.getTemplates(),
            tpl       = templates[name];

        if (!tpl) {
            tpl = templates[name] = Sencha.Loader.loadSyncXhr({
                url : this.getTplPath() + name + '.html'
            }).responseText;
        }

        return tpl;
    }
});

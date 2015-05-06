Sencha.define('Sencha.Component', {
    config : {
        cls     : null,
        html    : null,
        tagName : 'DIV'
    },

    dom : null,

    construct : function(config) {
        var me = this;

        me.initConfig(config);

        me.callParent([config]);

        //create the dom node right away, this won't be rendered yet
        me.getDom();

        if (me.initComponent) {
            me.initComponent();
        }
    },

    getDom : function() {
        var dom = this.dom;

        if (!dom) {
            dom = this.dom = this.createDom();
        }

        return dom;
    },

    createDom : function() {
        return new Sencha.virtual.Node({
            className : this.getCls(),
            innerHTML : this.getHtml(),
            tagName   : this.getTagName()
        });
    },

    render : function(parent) {
        var dom = this.getDom();

        parent = Sencha.get(parent);

        parent.appendChild(dom);
    },

    isRendered : function() {
        var dom = this.getDom();

        return !!dom.getParentNode();
    },

    show : function() {
        var dom = this.getDom();

        dom.removeCls('sencha-hidden');
    },

    hide : function() {
        var dom = this.getDom();

        dom.addCls('sencha-hidden');
    },

    toggleHidden : function() {
        var dom = this.getDom();

        dom.toggleCls('sencha-hidden');
    },

    destroy : function() {
        var dom = this.getDom();

        dom.destroy();

        this.dom = null;
    }
});

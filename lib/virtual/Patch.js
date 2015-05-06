Sencha.define('Sencha.virtual.Patch', {
    config : {
        diff : null
    },

    isVirtualPatch : true,

    construct : function(config) {
        this.initConfig(config);

        this.callParent([config]);
    },

    patch : function() {
        var diffs  = this.getDiff(),
            i      = 0,
            length = diffs.length,
            diff;

        for (; i < length; i++) {
            diff = diffs[i];

            if (diff.modified) {
                this.handleDiff(diff);
            }
        }
    },

    handleDiff : function(diff) {
        var modified = diff.modified,
            node     = diff.node,
            name, value;

        for (name in modified) {
            value = modified[name];

            if (name === 'children') {
                this.handleChildren(node, value);
            } else {
                this.handleField(node, name, value);
            }

            delete modified[name];
        }
    },

    handleChildren : function(node, children) {
        if (children && children.length) {
            var dom    = node.getDom(),
                i      = 0,
                length = children.length,
                child, isDestroyed, childDom,
                grandChildren;

            for (; i < length; i++) {
                child         = children[i];
                isDestroyed   = child.isDestroyed;
                childDom      = child.getDom();
                grandChildren = child.getChildren();

                if (isDestroyed) {
                    dom.removeChild(childDom);

                    child.setDom(null);
                } else {
                    if (!childDom) {
                        child._create();

                        childDom = child.getDom();
                    }

                    if (grandChildren && grandChildren.length) {
                        this.handleChildren(child, grandChildren);
                    }

                    if (!childDom.parentNode) {
                        dom.appendChild(childDom);
                    }
                }
            }
        }
    },

    handleField : function(node, name, value) {
        node._update();
    }
});

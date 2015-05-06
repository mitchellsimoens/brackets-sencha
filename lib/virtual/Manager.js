Sencha.define('Sencha.virtual.Manager', {
    singleton : true,

    requires : [
        'Sencha.virtual.Node',
        'Sencha.virtual.Query',
        'Sencha.virtual.Scheduler'
    ],

    config : {
        dirty     : false,
        tree      : null,
        scheduler : null
    },

    dirtyNodes : [],

    idMap : {},

    tagMap : {},

    construct : function(config) {
        this.initConfig(config);

        this.callParent([config]);
    },

    init : function() {
        var body = Sencha.getBody();

        this.setTree(body);

        this.setDirty(true);
    },

    applyTree : function(node) {
        if (node && !node.isVirtualNode) {
            node.manager = this;

            node = new Sencha.virtual.Node(node);
        }

        return node;
    },

    updateDirty : function(dirty) {
        var scheduler = this.getScheduler();

        if (dirty) {
            if (!scheduler) {
                scheduler = new Sencha.virtual.Scheduler({
                    manager : this
                });

                this.setScheduler(scheduler);
            }

            scheduler.schedule();
        } else {
            var nodes  = this.dirtyNodes,
                i      = 0,
                length = nodes.length;

            for (; i < length; i++) {
                nodes[i].modified = null;
            }

            if (scheduler) {
                scheduler.cancel();
            }

            nodes.length = 0;
        }
    },

    notify : function(node) {
        this.dirtyNodes.push(node);

        this.setDirty(true);
    },

    appendChild : function(child, parent) {
        if (!parent) {
            parent = this.getTree();
        }

        parent.appendChild(child);

        return this;
    },

    removeChild : function(child, parent) {
        if (!parent) {
            parent = this.getTree();
        }

        parent.removeChild(child);

        return this;
    },

    registerNode : function(node) {
        var idMap  = this.idMap,
            tagMap = this.tagMap,
            id     = node.getId(),
            tag    = node.getTagName(),
            utag   = tag.toUpperCase(),
            tagArr = tagMap[utag];

        if (!tagArr) {
            tagArr = tagMap[utag] = [];
        }

        tagArr.push(node);

        //<debug>
        if (idMap[id]) {
            console.warn(id, 'already registered');
        }
        //</debug>

        idMap[id] = node;
    },

    unregisterNode : function(node) {
        var tagMap = this.tagMap,
            id     = node.getId(),
            tag    = node.getTagName(),
            utag   = tag.toUpperCase(),
            tagArr = tagMap[utag],
            i, length, newArr;

        if (tagArr) {
            i      = 0;
            length = tagArr.length;
            newArr = [];

            for (; i < length; i++) {
                if (tagArr[i] !== node) {
                    newArr.push(tagArr[i]);
                }
            }

            tagMap[utag] = newArr;
        }

        delete this.idMap[id];
    },

    getElementById : function(id) {
        return this.idMap[id];
    },

    getElementsByTagName : function(tag) {
        return this.tagMap[tag.toUpperCase()];
    }
});

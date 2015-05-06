Sencha.define('Sencha.virtual.Node', {
    config : {
        manager    : null,
        parentNode : null,

        checked         : null,
        children        : null,
        className       : '',
        firstChild      : null,
        height          : null,
        id              : '',
        innerHTML       : '',
        lastChild       : null,
        margin          : null,
        nextSibling     : null,
        padding         : null,
        previousSibling : null,
        tagName         : 'DIV',
        value           : null,
        width           : null,

        dom : null,

        listeners : null
    },

    propertyMap : {
        getClassName : 'className',
        getId        : 'id',
        getInnerHTML : 'innerHTML',
        getValue     : 'value'
    },

    styleMap : {
        getHeight  : 'height',
        getMargin  : 'margin',
        getPadding : 'padding',
        getWidth   : 'width'
    },

    newlineRe : /\r\n|\r|\n/gm,

    isVirtualNode : true,

    construct : function(config) {
        if (config instanceof HTMLBodyElement) {
            config = {
                dom : config
            };
        }

        config.manager = Sencha.virtual.Manager;

        this.initConfig(config);

        this.callParent([config]);
    },

    destroy : function() {
        var me       = this,
            children = me.getChildren(),
            parent   = me.getParentNode(),
            manager  = me.getManager(),
            i        = 0,
            length   = children && children.length,
            child;

        for (; i < length; i++) {
            child = children[i];

            child.destroy();
        }

        parent.removeChild(me, true);

        manager.unregisterNode(me);

        me.setManager(null);
        me.setNextSibling(null);
        me.setParentNode(null);
        me.setPreviousSibling(null);

        me.modified    = null;
        me.isDestroyed = true;
    },

    applyChildren : function(children) {
        var manager = this.getManager(),
            i       = 0,
            length  = children && children.length,
            child, last, next;

        if (length) {
            for (; i < length; i++) {
                child = children[i];
                next  = children[i + 1];

                if (child && !child.isVirtualNode) {
                    child.manager    = manager;
                    child.parentNode = this;

                    child = children[i] = new Sencha.virtual.Node(child);
                }

                child.setNextSibling(next);
                child.setPreviousSibling(last);

                last = child;
            }
        }

        return children;
    },

    applyHeight : function(height) {
        if (Sencha.Util.isNumber(height)) {
            height += 'px';
        }

        return height;
    },

    applyId : function(id, oldId) {
        var dom = this.getDom();

        if (dom) {
            if (!id) {
                id = Sencha.id(this, 'ext-virtual-dom-node');
            }

            if (oldId) {
                var manager = this.getManager();

                if (manager) {
                    manager.unregisterNode(this);
                }
            }
        }

        return id;
    },

    applyInnerHTML : function(innerHTML, oldHTML) {
        if (innerHTML && !innerHTML.replace(this.newlineRe, '')) {
            innerHTML = oldHTML;
        }

        return innerHTML;
    },

    applyMargin : function(margin) {
        if (Sencha.Util.isNumber(margin)) {
            margin += 'px';
        }

        return margin;
    },

    applyPadding : function(padding) {
        if (Sencha.Util.isNumber(padding)) {
            padding += 'px';
        }

        return padding;
    },

    applyWidth : function(width) {
        if (Sencha.Util.isNumber(width)) {
            width += 'px';
        }

        return width;
    },

    updateChecked : function(checked) {
        this.setModified('checked', checked);
    },

    updateChildren : function(children) {
        var first, last;

        if (children) {
            first = children[0];
            last  = children[children.length - 1];
        }

        this.setFirstChild(first);
        this.setLastChild(last);

        this.setModified('children', children);
    },

    updateDom : function(dom) {
        var me = this;

        if (dom) {
            me.setId(dom.id);
        }
    },

    updateId : function(id, oldId) {
        var manager = this.getManager();

        if (id) {
            manager.registerNode(this);
        }

        this.setModified('id', id);
    },

    updateMargin : function(margin) {
        this.setModified('margin', margin);
    },

    updatePadding : function(padding) {
        this.setModified('padding', padding);
    },

    setModified : function(field, value) {
        var me = this,
            manager, modified;

        //only notify if the node is in the real dom
        //otherwise it will be created by parent node
        if (me.getDom()) {
            manager  = me.getManager();
            modified = me.modified;

            if (!modified) {
                modified = me.modified = {};
            }

            modified[field] = value;

            manager.notify(me);
        }
    },

    addCls : function(cls) {
        var me      = this,
            classes = me.getClassName(),
            arr     = classes.split(' ');

        if (arr.indexOf(cls) === -1) {
            arr.push(cls);

            classes = arr.join(' ');

            me.setClassName(classes);
        }

        me.setModified('className', classes);

        return me;
    },

    removeCls : function(cls) {
        var me      = this,
            classes = me.getClassName(),
            arr     = classes.split(' '),
            i       = 0,
            length  = arr.length,
            newArr  = [],
            currentCls;

        for (; i < length; i++) {
            currentCls = arr[i];

            if (currentCls !== cls) {
                newArr.push(currentCls);
            }
        }

        classes = newArr.join(' ');

        me.setClassName(classes);

        me.setModified('className', classes);

        return me;
    },

    replaceCls : function(oldCls, newCls) {
        var me      = this,
            classes = me.getClassName(),
            arr     = classes.split(' '),
            i       = 0,
            length  = arr.length;

        for (; i < length; i++) {
            if (arr[i] === oldCls) {
                arr[i] = newCls;

                break;
            }
        }

        classes = arr.join(' ');

        me.setClassName(classes);

        me.setModified('className', classes);

        return me;
    },

    toggleCls : function(cls) {
        var me      = this,
            classes = me.getClassName(),
            arr     = classes.split(' '),
            i       = 0,
            length  = arr.length,
            newArr  = [],
            found;

        for (; i < length; i++) {
            if (arr[i] === cls) {
                found = true;
            } else {
                newArr.push(arr[i]);
            }
        }

        if (!found) {
            newArr.push(cls);
        }

        classes = newArr.join(' ');

        me.setClassName(classes);

        me.setModified('className', classes);

        return me;
    },

    appendChild : function(child) {
        var me       = this,
            children = me.getChildren(),
            parent;

        if (!children) {
            children = [];

            me.setChildren(children);
        }

        if (child.isVirtualNode) {
            parent = child.parentNode;

            if (parent) {
                parent.removeChild(child, true);
            }

            child.setParentNode(me);
        } else {
            child.manager    = me.getManager();
            child.parentNode = me;

            child = new Sencha.virtual.Node(child);
        }

        child.setPreviousSibling(children[children.length - 1]);

        children.push(child);

        me.setModified('children', children);

        return me;
    },

    removeChild : function(child, noDestroy) {
        var me       = this,
            children = me.getChildren(),
            i, length, node,
            newChildren, old;

        if (children) {
            i           = 0;
            length      = children.length;
            newChildren = [];
            old         = [];

            for (; i < length; i++) {
                node = children[i];

                if (node === child) {
                    if (noDestroy) {
                        node.setNextSibling(null);
                        node.setParentNode(null);
                        node.setPreviousSibling(null);
                    } else {
                        node.destroy();
                    }
                } else {
                    newChildren.push(node);
                }

                old.push(node);
            }

            me.setChildren(newChildren);

            me.setModified('children', old);
        }

        return me;
    },

    _create : function() {
        var me  = this,
            dom = document.createElement(me.getTagName());

        me.setDom(dom);

        me._update();
    },

    _update : function() {
        var me    = this,
            dom   = me.getDom(),
            style = dom.style,
            map   = me.propertyMap,
            getter, prop, value;

        if (dom.dom) {
            dom = dom.dom;
        }

        for (getter in map) {
            prop  = map[getter];
            value = me[getter]();

            if (value) {
                dom[prop] = value;
            }
        }

        map = me.styleMap;

        for (getter in map) {
            prop  = map[getter];
            value = me[getter]();

            if (value) {
                style[prop] = value;
            }
        }
    },

    scrollTo : function(x, y) {
        var dom = this.getDom();

        if (Sencha.Util.isNumber(x)) {
            dom.scrollLeft = x;
        }

        if (Sencha.Util.isNumber(y)) {
            dom.scrollTop = y;
        }
    },

    scrollToTop : function() {
        this.scrollTo(0, 0);
    },

    scrollToBottom : function() {
        var dom = this.getDom();

        this.scrollTo(null, dom.scrollHeight);
    },

    up : function(selector) {
        return Sencha.virtual.Query.up(selector, this);
    },

    child : function(selector) {
        return Sencha.virtual.Query.child(selector, this);
    },

    down : function(selector) {
        return Sencha.virtual.Query.down(selector, this);
    },

    query : function(selector) {
        return Sencha.virtual.Query.query(selector, this);
    }
});

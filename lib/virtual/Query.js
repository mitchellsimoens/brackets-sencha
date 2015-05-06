//this is vastly TODO, very primitive
Sencha.define('Sencha.virtual.Query', {
    singleton : true,

    isVirtualQuery : true,

    re : {
        cls   : /^\./,
        space : /\s+/
    },

    _getRoot : function(root) {
        return root || Sencha.virtual.Manager.getTree();
    },

    isTagMatch : function(tag, node) {
        return node.getTagName().toLowerCase() === tag.toLowerCase();
    },

    isClassNameMatch : function(cls, node) {
        var className = node.getClassName(),
            classes   = className.split(this.re.space),
            i         = 0,
            length    = classes.length;

        for (; i < length; i++) {
            if (classes[i] === cls.substr(1)) {
                return true;
            }
        }

        return false;
    },

    isMatch : function(selector, node) {
        //do matching magic here

        if (this.re.cls.test(selector)) {
            return this.isClassNameMatch(selector, node);
        } else {
            //need to support things like td.foo here
            return this.isTagMatch(selector, node);
        }
    },

    up : function(selector, root) {
        root = this._getRoot(root);

        var parent = root.parentNode;

        if (parent) {
            if (this.isMatch(selector, parent)) {
                //is match!
                //if more to selector, recurse up
                this.up(selector, parent);
            }
        }

        return null;
    },

    child : function(selector, root) {
        root = this._getRoot(root);

        var children = root.getChildren(),
            arr, i, length, child;

        if (children) {
            arr    = selector.split(this.re.space);
            i      = 0;
            length = children.length;

            for (; i < length; i++) {
                child = children[i];

                if (this.isMatch(arr[0], child)) {
                    return child;
                }
            }
        }

        return null;
    },

    down : function(selector, root) {
        root = this._getRoot(root);

        var children = root.getChildren(),
            arr, i, length, currentSelector,
            child;

        if (children) {
            arr             = selector.split(this.re.space);
            i               = 0;
            length          = children.length;
            currentSelector = arr.shift();

            for (; i < length; i++) {
                child = children[i];

                if (this.isMatch(currentSelector, child)) {
                    if (arr.length) {
                        return this.down(arr.join(' '), child);
                    } else {
                        return child;
                    }
                } else {
                    return this.down(selector, child);
                }
            }
        }

        return null;
    },

    query : function(selector, root, matches) {
        root    = this._getRoot(root);
        matches = matches || [];

        var children = root.getChildren(),
            arr, i, length, currentSelector,
            child;

        if (children) {
            arr             = selector.split(this.re.space);
            i               = 0;
            length          = children.length;
            currentSelector = arr.shift();

            for (; i < length; i++) {
                child = children[i];

                if (this.isMatch(currentSelector, child)) {
                    if (arr.length) {
                        this.query(arr.join(' '), child, matches);
                    } else {
                        matches.push(child);

                        this.query(currentSelector, child, matches);
                    }
                } else {
                    this.query(selector, child, matches);
                }
            }
        }

        return matches;
    }
});

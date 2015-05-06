Sencha.define('Sencha.virtual.Diff', {
    isVirtualDiff : true,

    diff : function(node, diff) {
        diff = diff || [];

        var modified = node.modified,
            children = node.getChildren(),
            i, length;

        if (modified) {
            diff.push({
                node     : node,
                modified : modified
            });
        }

        if (children) {
            i      = 0;
            length = children.length;

            for (; i < length; i++) {
                this.diff(children[i], diff);
            }
        }

        return diff;
    }
});

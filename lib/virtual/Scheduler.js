Sencha.define('Sencha.virtual.Scheduler', {
    requires : [
        'Sencha.virtual.Diff',
        'Sencha.virtual.Patch'
    ],

    config : {
        enabled : true,
        manager : null
    },

    isVirtualScheduler : true,

    timeout : null,

    construct : function(config) {
        this.initConfig(config);

        this.callParent([config]);
    },

    schedule : function() {
        var me = this;

        me.cancel();

        if (me.getEnabled()) {
            me.timeout = setTimeout(function() {
                me.exec();
            }, 50);
        } else {
            me.exec();
        }
    },

    cancel : function() {
        var timeout = this.timeout;

        if (timeout) {
            clearTimeout(timeout);
        }
    },

    exec : function() {
        var manager  = this.getManager(),
            tree     = manager.getTree(),
            Diff     = new Sencha.virtual.Diff(),
            diff     = Diff.diff(tree),
            patch;

        if (diff && diff.length) {
            patch = new Sencha.virtual.Patch({
                diff : diff
            });

            patch.patch();
        }

        manager.setDirty(false);
    }
});

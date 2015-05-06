Sencha.define('App.menu.Mixin', {
    menus : null,

    requires : [
        'App.menu.Manager'
    ],

    initMenu : function() {
        var menus = this.menus;

        if (menus) {
            App.menu.Manager.addMenus(menus, this);
        }
    }
});

Sencha.define('Sencha.menu.Mixin', {
    menus : null,

    initMenu : function() {
        var menus = this.menus;

        if (menus) {
            Sencha.menu.Manager.addMenus(menus, this);
        }
    }
});

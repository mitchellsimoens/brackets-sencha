/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require) {
    var CommandManager = brackets.getModule('command/CommandManager'),
        Menus          = brackets.getModule('command/Menus'),
        ContextMenuIds = Menus.ContextMenuIds;

    /**
     * Base class for all classes.
     *
     * @class Sencha.menu.Manager
     */
    Sencha.define('Sencha.menu.Manager', {
        singleton : true,

        registered : {},
        listened   : {},

        construct : function(config) {
            var me = this;

            me.callParent([config]);

            me.onBeforeMenuOpen = Sencha.bind(me.onBeforeMenuOpen, me);
        },

        onBeforeMenuOpen : function(e) {
            var target     = e.target,
                registered = this.registered,
                name, cfg, show,
                menus, i, length, menu, divider, item;

            for (name in registered) {
                cfg     = registered[name];
                show    = cfg.renderer ? cfg.renderer() : true;
                menus   = cfg.menu;
                i       = 0;
                length  = menus.length;
                divider = cfg.divider;

                for (; i < length; i++) {
                    menu = menus[i];

                    if (menu === target) {
                        if (cfg.lastId && Menus.getMenuItem(cfg.lastId)) {
                            if (divider) {
                                menu.removeMenuDivider(cfg.lastId);
                            } else {
                                menu.removeMenuItem(name);
                            }
                        }

                        if (show) {
                            if (divider) {
                                item = menu.addMenuDivider('before', divider);
                            } else {
                                item = menu.addMenuItem(name, cfg.keyBinding);
                            }

                            cfg.lastId = item.id
                        }

                        break;
                    }
                }
            }
        },

        registerCommand : function(label, name, fn) {
            CommandManager.register(label, name, fn);
        },

        addMenu : function(menus, item) {
            var i        = 0,
                length   = menus.length,
                listened = this.listened,
                name, menu, isContext;

            for (; i < length; i++) {
                name = menus[i];
                menu = ContextMenuIds[name];

                if (menu) {
                    isContext = true;
                    menu      = Menus.getContextMenu(Menus.ContextMenuIds[name]);
                } else {
                    isContext = false;
                    menu      = Menus.getMenu(name);
                }

                menus[i] = menu;

                if (isContext) {
                    if (!listened[name]) {
                        menu.on('beforeContextMenuOpen', this.onBeforeMenuOpen);

                        listened[name] = true;
                    }
                } else {
                    if (item.divider) {
                        menu.addMenuDivider('before', item.divider);
                    } else {
                        menu.addMenuItem(item.name, item.keyBinding);
                    }
                }
            }
        },

        addMenus : function(items, cls) {
            var i          = 0,
                length     = items.length,
                registered = this.registered,
                item, menus, menu, x, xLength, fn, scope;

            for (; i < length; i++) {
                item = items[i];

                if (Object.prototype.toString.call(item) === '[object Array]') {
                    this.addMenus(item, cls);

                    continue;
                }

                menus   = item.menu;
                x       = 0;
                xLength = menus.length;

                if (item.name) {
                    fn = item.fn;

                    if (typeof fn === 'string') {
                        scope = item.scope;

                        if (scope === 'this') {
                            scope = cls;
                        }

                        item.fn = scope[fn].bind(scope);
                    }

                    if (item.divider) {
                        this.addMenu(item.menu, item);
                    } else if (item.label && item.fn) {
                        if (!registered[item.name]) {
                            this.registerCommand(item.label, item.name, item.fn);

                            this.addMenu(item.menu, item);
                        }
                    } else {
                        item = null;
                    }

                    if (item) {
                        registered[item.name] = item;
                    }
                }
            }
        }
    });
});

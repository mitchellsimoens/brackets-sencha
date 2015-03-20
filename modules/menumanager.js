/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports) {
    'use strict';

    var CommandManager = brackets.getModule('command/CommandManager'),
        Menus          = brackets.getModule('command/Menus'),
        _registered    = {},
        _listened      = {};

    /**
     * context menu IDs:
     * EDITOR_MENU
     * INLINE_EDITOR_MENU
     * PROJECT_MENU
     * WORKING_SET_CONTEXT_MENU
     * WORKING_SET_CONFIG_MENU
     * SPLITVIEW_MENU
     */

    function _onBeforeMenuOpen(e) {
        var target = e.target,
            name, cfg, show,
            menus, i, length, menu, divider, item;

        for (name in _registered) {
            cfg     = _registered[name];
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
                            item = menu.addMenuItem(name);
                        }

                        cfg.lastId = item.id
                    }

                    break;
                }
            }
        }
    }

    function _registerCommand(label, name, fn) {
        CommandManager.register(label, name, fn);
    }

    function _addMenu(menus, item) {
        var i      = 0,
            length = menus.length,
            name, menu;

        for (; i < length; i++) {
            name = menus[i];
            menu = Menus.getContextMenu(Menus.ContextMenuIds[name]);

            menus[i] = menu;

            if (!_listened[name]) {
                menu.on('beforeContextMenuOpen', _onBeforeMenuOpen);

                _listened[name] = true;
            }
        }
    }

    function addMenus(items) {
        var i      = 0,
            length = items.length,
            item, menus, menu, x, xLength;

        for (; i < length; i++) {
            item    = items[i];
            menus   = item.menu;
            x       = 0;
            xLength = menus.length;

            if (item.name) {
                if (item.divider) {
                    _addMenu(item.menu, '-');
                } else if (item.label && item.fn) {
                    if (!_registered[item.name]) {
                        _registerCommand(item.label, item.name, item.fn);

                        _addMenu(item.menu, item);
                    }
                } else {
                    item = null;
                }

                if (item) {
                    _registered[item.name] = item;
                }
            }
        }
    }

    exports.addMenus = addMenus;
});

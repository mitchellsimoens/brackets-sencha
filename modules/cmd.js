/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports) {
    'use strict';

    var WorkspaceManager   = brackets.getModule('view/WorkspaceManager'),
        AppInit            = brackets.getModule('utils/AppInit'),
        CommandManager     = brackets.getModule('command/CommandManager'),
        Menus              = brackets.getModule('command/Menus'),
        ProjectManager     = brackets.getModule('project/ProjectManager'),
        InMemoryFile       = brackets.getModule('document/InMemoryFile'),
        FileSystem         = brackets.getModule('filesystem/FileSystem'),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        _outputPanel, _command;

    var commands = [
        {
            cmd   : 'sencha.cmd',
            label : '** Sencha Cmd **',
            fn    : function() {}
        },
        {
            label    : 'app',
            children : [
                {
                    cmd   : 'sencha.cmd.app.refresh',
                    label : 'app refresh',
                    fn    : function() {
                        _handleCmdCommand('sencha app refresh');
                    }
                },
                {
                    cmd   : 'sencha.cmd.app.watch',
                    label : 'app watch',
                    fn    : function() {
                        _handleCmdCommand('sencha app watch');
                    }
                }
            ]
        },
        {
            label    : 'build',
            children : [
                {
                    cmd   : 'sencha.cmd.build.production',
                    label : 'build [production]',
                    fn    : function() {
                        _handleCmdCommand('sencha app build production');
                    }
                },
                {
                    cmd   : 'sencha.cmd.build.testing',
                    label : 'build [testing]',
                    fn    : function() {
                        _handleCmdCommand('sencha app build testing');
                    }
                }
            ]
        }
    ];

    function _getSenchaCfg(Dir, callback) {
        if (Dir.isDirectory) {
            Dir.getContents(function(error, contents) {
                if (error) {
                    //error handling, couldn't get contents of directory
                } else {
                    var i      = 0,
                        length = contents.length,
                        item, name;

                    for (; i < length; i++) {
                        item = contents[i];
                        name = item.name;

                        if (name === '.sencha' || name === 'app') {
                            _getSenchaCfg(item, callback);
                            break;
                        } else  if (name === 'sencha.cfg') {
                            callback(item);
                            break;
                        } else {
                            item = null;
                        }
                    }
                }
            });
        }
    }

    function _findAppDir(Item, Root, callback) {
        var parent = FileSystem.getDirectoryForPath(Item.parentPath);

        if (!Root) {
            Root = ProjectManager.getProjectRoot();
        }

        if (Item.isFile) {
            _findAppDir(parent, Root, function(dir, SenchaCfg) {
                callback(dir, SenchaCfg);
            });
        } else {
            Item.getContents(function(error, contents) {
                if (error) {
                    //error handling, couldn't get contents of directory
                } else {
                    var i      = 0,
                        length = contents.length,
                        item;

                    for (; i < length; i++) {
                        item = contents[i];

                        if (item.name === '.sencha') {
                            break;
                        } else {
                            item = null;
                        }
                    }

                    if (item) {
                        _getSenchaCfg(Item, function(SenchaCfg) {
                            callback(Item, SenchaCfg);
                        });
                    } else {
                        _findAppDir(parent, Root, function(dir, SenchaCfg) {
                            callback(dir, SenchaCfg);
                        });
                    }
                }
            });
        }
    }

    function _doCmdCommand(cmd, cwd, version) {
        var cmd_root = prefs.get('cmd_root'),
            cmd_path = cmd_root + '/' + version + '/sencha';

        FileSystem.resolve(cmd_path, function(error) {
            if (error) {
                alert('Sencha Cmd was not found. Please provide the path to the directory where all the versions are held, for example ~/bin/Sencha/Cmd');

                FileSystem.showOpenDialog(
                    false,
                    true,
                    'Path to Sencha Cmd Root',
                    null,
                    null,
                    function(error, dirs) {
                        if (!error && dirs.length > 0) {
                            var dir = dirs.pop();

                            //TODO try to make sure this is correct directory by going up the path

                            prefs.set('cmd_root', dir);

                            _doCmdCommand(cmd, cwd, version);
                        }
                    }
                );
            } else {
                var replace  = '/usr/bin/java -Xms128m -Xmx1024m -Dapple.awt.UIElement=true -jar ' + cmd_path + '.jar ',
                    real_cmd = cmd.replace(/sencha\s/g, replace);

                _command.exec(real_cmd, cwd, cmd);
            }
        });
    }

    function _handleCmdCommand(cmd) {
        var selected = ProjectManager.getSelectedItem();

        _findAppDir(selected, null, function(dir, SenchaCfg) {
            if (dir && SenchaCfg) {
                SenchaCfg.read(function(error, source) {
                    if (error) {
                        alert('There was an unknown issue while reading the sencha.cfg file. Error: ' + error);
                    } else {
                        var version = source.match(/app.cmd.version=(.+)/m)[1];

                        if (version) {
                            _doCmdCommand(cmd, dir.fullPath, version);
                        } else {
                            alert('Could not detect what Sencha Cmd version this application is using. Could this not be a Sencha Cmd application?');
                        }
                    }
                });
            } else {
                if (!dir) {
                    alert('Could not detect the application directory. Could this not be a Sencha Cmd application?');
                } else if (!SenchaCfg) {
                    alert('Could not detect the .sencha directory Sencha Cmd creates. Could this not be a Sencha Cmd application?');
                }
            }
        })
    }

    /**
     * Recursively build out commands from pre-defined structure
     */
    function _registerCommands(cmds) {
        var i      = 0,
            length = cmds.length,
            item;

        for (; i < length; i++) {
            item = cmds[i];

            if (item.cmd && item.label && item.fn) {
                CommandManager.register(item.label, item.cmd, item.fn);
            }

            if (item.children && item.children.length) {
                _registerCommands(item.children);
            }
        }
    }

    /**
     * Recursively build out menus from pre-defined structure
     */
    function _registerMenuItems( menu, menuItems ) {
        var i      = 0,
            length = menuItems.length,
            item;

        for (; i < length; i++) {
            item = menuItems[i];

            if (item.cmd) {
                menu.addMenuItem(item.cmd);
            }

            // if we have children, call method recursively
            if (item.children && item.children.length) {
                _registerMenuItems(menu, item.children);
            }
        }
    }

    function initMenus() {
        _registerCommands(commands);

        var menu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU);

        menu.addMenuDivider();

        _registerMenuItems(menu, commands);
    }

    function init(config) {
        _command     = config.Command;
        _outputPanel = config.OutputPanel;

        initMenus();
    }

    exports.init = init;
});

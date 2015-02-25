/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports) {
    'use strict';

    var ProjectManager     = brackets.getModule('project/ProjectManager'),
        DocumentManager    = brackets.getModule('document/DocumentManager'),
        InMemoryFile       = brackets.getModule('document/InMemoryFile'),
        FileSystem         = brackets.getModule('filesystem/FileSystem'),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        _outputPanel, _command;

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

    function _handleCmdCommand(cmd, inEditor) {
        if (inEditor) {
            var selected = DocumentManager.getCurrentDocument().file;

            console.log('hi');
        } else {
            var selected = ProjectManager.getSelectedItem();
        }

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

    function init(config) {
        _command     = config.Command;
        _outputPanel = config.OutputPanel;

        config.MenuManager.addMenus([
            {
                name  : 'sencha.cmd',
                label : '** Sencha CMD **',
                menu  : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ],
                fn    : function() {}
            },
            {
                divider : 'sencha.cmd',
                name    : 'sencha.cmd.divider',
                menu    : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.app.refresh',
                label    : 'app refresh',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app refresh', false);
                }
            },
            {
                name     : 'sencha.cmd.app.watch',
                label    : 'app watch',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app watch', false);
                }
            },
            {
                name     : 'sencha.cmd.app.build.production',
                label    : 'app build [production]',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app build production', false);
                }
            },
            {
                name     : 'sencha.cmd.app.build.testing',
                label    : 'app build [testing]',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app build testing', false);
                }
            }
        ]);

        config.MenuManager.addMenus([
            {
                name  : 'sencha.cmd_editor',
                label : '** Sencha CMD **',
                menu  : [
                    'EDITOR_MENU'
                ],
                fn    : function() {}
            },
            {
                divider : 'sencha.cmd_editor',
                name    : 'sencha.cmd_editor.divider',
                menu    : [
                    'EDITOR_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.app.refresh_editor',
                label    : 'app refresh',
                menu     : [
                    'EDITOR_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app refresh', true);
                }
            },
            {
                name     : 'sencha.cmd.app.watch_editor',
                label    : 'app watch',
                menu     : [
                    'EDITOR_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app watch', true);
                }
            },
            {
                name     : 'sencha.cmd.app.build.production_editor',
                label    : 'app build [production]',
                menu     : [
                    'EDITOR_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app build production', true);
                }
            },
            {
                name     : 'sencha.cmd.app.build.testing_editor',
                label    : 'app build [testing]',
                menu     : [
                    'EDITOR_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app build testing', true);
                }
            }
        ]);
    }

    exports.init = init;
});

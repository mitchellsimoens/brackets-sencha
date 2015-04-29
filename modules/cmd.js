/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require, exports) {
    'use strict';

    var ProjectManager     = brackets.getModule('project/ProjectManager'),
        DocumentManager    = brackets.getModule('document/DocumentManager'),
        Dialogs            = brackets.getModule('widgets/Dialogs'),
        InMemoryFile       = brackets.getModule('document/InMemoryFile'),
        FileSystem         = brackets.getModule('filesystem/FileSystem'),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        userCmds           = require('modules/cmd/usercmds'),
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
                //hope the java path is already installed
                var replace  = 'java -Xms128m -Xmx1024m -Dapple.awt.UIElement=true -jar ' + cmd_path + '.jar ',
                    real_cmd = cmd.replace(/sencha\s/g, replace);

                _command.exec(real_cmd, cwd, cmd);
            }
        });
    }

    /**
     * Takes raw read content of app.json and turns it into an object, if possible
     * @param {String} content The raw app.json string content to parse
     * @return {Object}
     */
    function _getAppJsonAsObject(content) {
        var cleanerRegex  = /(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm,
            convertedJson, cleaned;

        try {
            // remove JS comments
            cleaned       = content.replace(cleanerRegex, '');
            convertedJson = JSON.parse(cleaned);
        }
        catch(e) {
            convertedJson = {};

            console.log(e);
        }

        return convertedJson;
    }

    /**
     * Master promise maker for selecting a build (if possible).
     * @param {Object} options Options to be used for the preprocessor.
     *  - **buildRequired** : If `true`, require a build to be selected. This will not show the none option.
     * @return {Function}
     */
    function _selectBuild(options) {
        options = options || {};

        /**
         * @param {String} cmd The command to run
         * @param {Object} dir The root directory where the .sencha folder resides
         * @param {String} version Version of Sencha Cmd being used
         * @return {Promise}
         */
        return function(cmd, dir, version) {
            var deferred = $.Deferred();

            // order of ops: find the app.json file, select a build, return new cmd string
            $.when()
                .then(function() {
                    // get app.json object
                    return _findAppJson(dir);
                })
                .then(function(appJson){
                    var builds = appJson.builds,
                        show   = builds && Object.keys(builds).length > 1;

                    if (show && !options.buildRequired) {
                        builds['none (all)'] = null;
                    }

                    return show ? _showAppBuildSelectionDialog(builds) : '';
                })
                .done(function(build) {
                    if (build && build !== 'none (all)') {
                        // concat cmd with build option, if needed
                        cmd += ' ' + build;
                    }

                    // resolve the promise
                    deferred.resolve(cmd, dir, version);
                });

            return deferred.promise();
        }
    }

    /**
     * Simple method which displays popup modal for selecting a build
     * @param {Object} builds The available builds for the current app
     * @return {Promise}
     */
    function _showAppBuildSelectionDialog(builds) {
        var modalTemplate = require('text!templates/cmd/buildSelectorModal.html'),
            buildArray    = [],
            deferred      = $.Deferred(),
            renderedTemplate,
            dialog,
            $element,
            $selectBuild,
            $selectButton,
            key;

        // convert keys to array for mustache
        for(key in builds) {
            buildArray.push(key);
        }

        renderedTemplate = Mustache.render(modalTemplate, { builds : buildArray });
        dialog           = Dialogs.showModalDialogUsingTemplate(renderedTemplate);
        $element         = dialog.getElement();
        $selectButton    = $element.find('.select-button');
        $selectBuild     = $element.find('#build_name');

        // add event listeners to elements
        $selectButton.on('click', function(){
            deferred.resolve($selectBuild.val());
        });

        return deferred.promise();
    }

    /**
     * Tries to find an app.json file relative to the .sencha cfg directory
     * @param {Object} dir The .sencha directory
     * @return {Promise}
     */
    function _findAppJson(dir) {
        var deferred = $.Deferred();

        dir.getContents(function(error, contents) {
            if (error) {
                //error handling, couldn't get contents of directory
            } else {
                var i      = 0,
                    length = contents.length,
                    item,
                    builds;

                for (; i < length; i++) {
                    item = contents[i];

                    if (item.name === 'app.json') {
                        item.read(function(error, source) {
                            var appJson;

                            if (error) {
                                alert('There was an error reading the app.json file. Error: ' + error);
                            } else {
                                // try to transform the source into an app.json object
                                appJson = _getAppJsonAsObject(source);
                            }

                            deferred.resolve(appJson || {});
                        });

                        break;
                    }
                }
            }
        });

        return deferred.promise();
    }

    /**
     * An empty promise to normalize handling of the preprocessor paradigm
     * @param {String} cmd The command to run
     * @param {Object} dir The root directory where the .sencha folder resides
     * @param {String} version Version of Sencha Cmd being used
     * @return {Promise}
     */
    function _emptyPromise(cmd, dir, version) {
        var deferred = $.Deferred();

        deferred.resolve(cmd, dir, version);

        return deferred.promise();
    }

    /**
     * Main method for marshalling context menu selections and sending them off to execute the commands
     * @param {String} cmd The command to execute
     * @param {Boolean} inEditor Whether the request was made in the editor, or in the project manager
     * @param {Function} preprocessor An options preprocessor method that can further manipulate the command
     */
    function _handleCmdCommand(cmd, inEditor, preprocessor) {
        var me       = this,
            selected = inEditor ? DocumentManager.getCurrentDocument().file : ProjectManager.getSelectedItem(),
            deferred;

        _findAppDir(selected, null, function(dir, SenchaCfg) {
            if (dir && SenchaCfg) {
                SenchaCfg.read(function(error, source) {
                    if (error) {
                        alert('There was an unknown issue while reading the sencha.cfg file. Error: ' + error);
                    } else {
                        var version = source.match(/app.cmd.version=(.+)/m)[1];

                        if (version) {
                            deferred     = $.Deferred();
                            // if we have a preprocessor, use it; otherwise, create an empty promise (sadpanda)
                            preprocessor = preprocessor || _emptyPromise;

                            // execute promise chain
                            deferred
                                .then(function(){
                                    // execute preprocessor
                                    return preprocessor.call(me, cmd, dir, version);
                                })
                                .done(function(cmd, dir, version) {
                                    // promise if fulfilled; execute command
                                    _doCmdCommand(cmd, dir.fullPath, version);
                                });

                            deferred.resolve();
                        } else {
                            alert('Could not detect what Sencha Cmd version this application is using. Could this not be a Sencha Cmd application?');
                        }
                    }
                });
            } else if (!dir) {
                alert('Could not detect the application directory. Could this not be a Sencha Cmd application?');
            } else if (!SenchaCfg) {
                alert('Could not detect the .sencha directory Sencha Cmd creates. Could this not be a Sencha Cmd application?');
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
                    _handleCmdCommand('sencha app refresh', false, _selectBuild());
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
                    _handleCmdCommand('sencha app watch', false, _selectBuild({
                        buildRequired : true
                    }));
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
                    _handleCmdCommand('sencha app build production', false, _selectBuild());
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
                    _handleCmdCommand('sencha app build testing', false, _selectBuild());
                }
            },
            {
                name     : 'sencha.cmd.user',
                label    : 'Run custom command',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('', false, userCmds._getUserCmd());
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
                    _handleCmdCommand('sencha app refresh', true, _selectBuild());
                }
            },
            {
                name     : 'sencha.cmd.app.watch_editor',
                label    : 'app watch',
                menu     : [
                    'EDITOR_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app watch', true, _selectBuild({
                        buildRequired : true
                    }));
                }
            },
            {
                name     : 'sencha.cmd.app.build.production_editor',
                label    : 'app build [production]',
                menu     : [
                    'EDITOR_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app build production', true, _selectBuild());
                }
            },
            {
                name     : 'sencha.cmd.app.build.testing_editor',
                label    : 'app build [testing]',
                menu     : [
                    'EDITOR_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('sencha app build testing', true, _selectBuild());
                }
            },
            {
                name     : 'sencha.cmd.user_editor',
                label    : 'Run custom command',
                menu     : [
                    'EDITOR_MENU'
                ],
                fn       : function() {
                    _handleCmdCommand('', true, userCmds._getUserCmd());
                }
            }
        ]);
    }

    exports.init = init;
});

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, $, brackets, window */

var ProjectManager     = brackets.getModule('project/ProjectManager'),
    DocumentManager    = brackets.getModule('document/DocumentManager'),
    Dialogs            = brackets.getModule('widgets/Dialogs'),
    FileSystem         = brackets.getModule('filesystem/FileSystem'),
    PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
    prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha');

//TODO use App.panel.Preferences

/**
 * Class to manage the Cmd integrations.
 *
 * @class App.cmd.Cmd
 */
Sencha.define('App.cmd.Cmd', {
    singleton : true,

    requires : [
        'App.cmd.User'
    ],

    mixins : [
        'App.menu.Mixin'
    ],

    menus : [
        [
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
                scope    : 'this',
                fn       : 'onAppRefresh',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.app.watch',
                label    : 'app watch',
                scope    : 'this',
                fn       : 'onAppWatch',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.app.build.production',
                label    : 'app build [production]',
                scope    : 'this',
                fn       : 'onAppBuildProd',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.app.build.testing',
                label    : 'app build [testing]',
                scope    : 'this',
                fn       : 'onAppBuildTest',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.user',
                label    : 'Run custom command',
                scope    : 'this',
                fn       : 'onCustomCommand',
                menu     : [
                    'PROJECT_MENU',
                    'WORKING_SET_CONTEXT_MENU'
                ]
            }
        ],
        [
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
                scope    : 'this',
                fn       : 'onAppRefresh',
                menu     : [
                    'EDITOR_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.app.watch_editor',
                label    : 'app watch',
                scope    : 'this',
                fn       : 'onAppWatch',
                menu     : [
                    'EDITOR_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.app.build.production_editor',
                label    : 'app build [production]',
                scope    : 'this',
                fn       : 'onAppBuildProd',
                menu     : [
                    'EDITOR_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.app.build.testing_editor',
                label    : 'app build [testing]',
                scope    : 'this',
                fn       : 'onAppBuildTest',
                menu     : [
                    'EDITOR_MENU'
                ]
            },
            {
                name     : 'sencha.cmd.user_editor',
                label    : 'Run custom command',
                scope    : 'this',
                fn       : 'onCustomCommand',
                menu     : [
                    'EDITOR_MENU'
                ]
            }
        ]
    ],

    construct : function(config) {
        this.callParent([config]);

        this.initMenu();
    },

    onAppRefresh : function() {
        this.handleCmdCommand('sencha app refresh', false, this.selectBuild());
    },

    onAppWatch : function() {
        this.handleCmdCommand('sencha app watch', false, this.selectBuild({
            buildRequired : true
        }));
    },

    onAppBuildProd : function() {
        this.handleCmdCommand('sencha app build production', false, this.selectBuild());
    },

    onAppBuildTest : function() {
        this.handleCmdCommand('sencha app build testing', false, this.selectBuild());
    },

    onCustomCommand : function() {
        this.handleCmdCommand('', false, App.cmd.User.getUserCmd());
    },

    getSenchaCfg : function(Dir, callback) {
        var me = this;

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
                            me.getSenchaCfg(item, callback);
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
    },

    findAppDir : function(Item, Root, callback) {
        var me = this,
            parent = FileSystem.getDirectoryForPath(Item.parentPath);

        if (!Root) {
            Root = ProjectManager.getProjectRoot();
        }

        if (Item.isFile) {
            me.findAppDir(parent, Root, function(dir, SenchaCfg) {
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
                        me.getSenchaCfg(Item, function(SenchaCfg) {
                            callback(Item, SenchaCfg);
                        });
                    } else {
                        me.findAppDir(parent, Root, function(dir, SenchaCfg) {
                            callback(dir, SenchaCfg);
                        });
                    }
                }
            });
        }
    },

    doCmdCommand : function(cmd, cwd, version) {
        var me       = this,
            cmd_root = prefs.get('cmd_root'),
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

                            me.doCmdCommand(cmd, cwd, version);
                        }
                    }
                );
            } else {
                //hope the java path is already installed
                var replace  = 'java -Xms128m -Xmx1024m -Dapple.awt.UIElement=true -jar ' + cmd_path + '.jar ',
                    real_cmd = cmd.replace(/sencha\s/g, replace);

                App.node.Command.execute(real_cmd, cwd, cmd);
            }
        });
    },

    /**
     * Takes raw read content of app.json and turns it into an object, if possible
     * @param {String} content The raw app.json string content to parse
     * @return {Object}
     */
    getAppJsonAsObject : function(content) {
        var convertedJson;

        try {
            convertedJson = this.stripJsonComments(content);
        }
        catch(e) {
            convertedJson = {};

            console.log(e);
        }

        return convertedJson;
    },

    /**
     * Strip comments from JSON.
     *
     * @param {String} json The JSON as a string.
     * @return {Object} Returns an object if the JSON is not empty.
     */
    stripJsonComments : function(json) {
        var ret           = '',
            insideString  = false,
            insideComment = false,
            i             = 0,
            length        = json.length,
            currentChar, nextChar;

        for (; i < length; i++) {
            currentChar = json[i];
            nextChar    = json[i + 1];

            if (!insideComment && json[i - 1] !== '\\' && currentChar === '"') {
                insideString = !insideString;
            }

            if (insideString) {
                ret += currentChar;
                continue;
            }

            if (!insideComment && currentChar + nextChar === '//') {
                insideComment = 'single';

                i++;
            } else if (insideComment === 'single' && currentChar + nextChar === '\r\n') {
                insideComment = false;

                ret += currentChar;
                ret += nextChar;

                i++;

                continue;
            } else if (insideComment === 'single' && currentChar === '\n') {
                insideComment = false;
            } else if (!insideComment && currentChar + nextChar === '/*') {
                insideComment = 'multi';

                i++;

                continue;
            } else if (insideComment === 'multi' && currentChar + nextChar === '*/') {
                insideComment = false;

                i++;

                continue;
            }

            if (insideComment) {
                continue;
            }

            ret += currentChar;
        }

        return ret ? JSON.parse(ret) : ret;
    },

    /**
     * Master promise maker for selecting a build (if possible).
     * @param {Object} options Options to be used for the preprocessor.
     *  - **buildRequired** : If `true`, require a build to be selected. This will not show the none option.
     * @return {Function}
     */
    selectBuild : function(options) {
        var me = this;

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
                    return me.findAppJson(dir);
                })
                .then(function(appJson){
                    var builds = appJson.builds,
                        show   = builds && Object.keys(builds).length > 1;

                    if (show && !options.buildRequired) {
                        builds['none (all)'] = null;
                    }

                    return show ? me.showAppBuildSelectionDialog(builds) : '';
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
    },

    /**
     * Simple method which displays popup modal for selecting a build
     * @param {Object} builds The available builds for the current app
     * @return {Promise}
     */
    showAppBuildSelectionDialog : function(builds) {
        var modalTemplate = App.Template.get('cmd/buildSelectorModal'),
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
    },

    /**
     * Tries to find an app.json file relative to the .sencha cfg directory
     * @param {Object} dir The .sencha directory
     * @return {Promise}
     */
    findAppJson : function(dir) {
        var me       = this,
            deferred = $.Deferred();

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
                                appJson = me.getAppJsonAsObject(source);
                            }

                            deferred.resolve(appJson || {});
                        });

                        break;
                    }
                }
            }
        });

        return deferred.promise();
    },

    /**
     * An empty promise to normalize handling of the preprocessor paradigm
     * @param {String} cmd The command to run
     * @param {Object} dir The root directory where the .sencha folder resides
     * @param {String} version Version of Sencha Cmd being used
     * @return {Promise}
     */
    emptyPromise : function(cmd, dir, version) {
        var deferred = $.Deferred();

        deferred.resolve(cmd, dir, version);

        return deferred.promise();
    },

    /**
     * Main method for marshalling context menu selections and sending them off to execute the commands
     * @param {String} cmd The command to execute
     * @param {Boolean} inEditor Whether the request was made in the editor, or in the project manager
     * @param {Function} preprocessor An options preprocessor method that can further manipulate the command
     */
    handleCmdCommand : function(cmd, inEditor, preprocessor) {
        var me       = this,
            selected = inEditor ? DocumentManager.getCurrentDocument().file : ProjectManager.getSelectedItem(),
            deferred;

        me.findAppDir(selected, null, function(dir, SenchaCfg) {
            if (dir && SenchaCfg) {
                SenchaCfg.read(function(error, source) {
                    if (error) {
                        alert('There was an unknown issue while reading the sencha.cfg file. Error: ' + error);
                    } else {
                        var version = source.match(/app.cmd.version=(.+)/m)[1];

                        if (version) {
                            deferred     = $.Deferred();
                            // if we have a preprocessor, use it; otherwise, create an empty promise (sadpanda)
                            preprocessor = preprocessor || me.emptyPromise;

                            // execute promise chain
                            deferred
                                .then(function(){
                                    // execute preprocessor
                                    return preprocessor.call(me, cmd, dir, version);
                                })
                                .done(function(cmd, dir, version) {
                                    // promise if fulfilled; execute command
                                    me.doCmdCommand(cmd, dir.fullPath, version);
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
});

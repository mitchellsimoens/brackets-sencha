/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function(require) {
    var ProjectManager     = brackets.getModule('project/ProjectManager'),
        FileSystem         = brackets.getModule('filesystem/FileSystem'),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        Dialogs            = brackets.getModule('widgets/Dialogs'),
        prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha'),
        baseURL            = 'https://fiddle.sencha.com/#fiddle/',
        shortRegex         = /^[a-z0-9]+$/i,
        urlRegex           = /https:\/\/fiddle.sencha.com\/\#fiddle\/[a-z0-9]{+}$/i;

    //TODO use Sencha.panel.Preferences instead of doing it here

    /**
     * Class to manage Fiddle.
     *
     * @class Sencha.fiddle.Fiddle
     */
    Sencha.define('Sencha.fiddle.Fiddle', {
        singleton : true,

        menus : [
            {
                name  : 'sencha.fiddle',
                label : '** Sencha Fiddle **',
                menu  : [
                    'PROJECT_MENU'
                ],
                fn    : function() {}
            },
            {
                divider : 'sencha.fiddle',
                name    : 'sencha.fiddle.divider',
                menu    : [
                    'PROJECT_MENU'
                ]
            },
            {
                name     : 'sencha.fiddle.download',
                label    : 'Download a Fiddle',
                scope    : 'this',
                fn       : 'onDownload',
                menu     : [
                    'PROJECT_MENU'
                ]
            }
        ],

        _template : null,

        getTemplate : function() {
            var tpl = this._template;

            if (!tpl) {
                tpl = this._template = require('text!templates/fiddle/downloadModal.html');
            }

            return tpl;
        },

        onDownload : function() {
            var me   = this,
                item = ProjectManager.getSelectedItem(),
                path = item ? item.fullPath : ProjectManager.getProjectRoot().fullPath;

            FileSystem.resolve(path, function(error, entry, stats) {
                // if there's an error or the target path is a file, show error
                if (error || (entry && entry._isFile)) {
                    alert('Fiddle download location *must* be a folder');
                } else {
                    me.getFiddleURL(path);
                }
            });
        },

        /**
         * @private
         * Validates the input from the user to ensure it's
         * either a fiddle url or a fiddle id
         */
        validateFiddleURL : function() {
            var url = $('.fiddle-url').val();

            return shortRegex.test(url) || urlRegex.test(url);
        },

        /**
         * @private
         * Toggles download button state based on validity of form
         * @param {Event} e The event which triggers this handler
         */
        toggleFiddleDownloadButton : function(e) {
            var $downloadButton = $('.download-button');

            // toggle button disabled state
            $downloadButton.prop('disabled', !this.validateFiddleURL());
        },

        /**
         * @private
         * Entry point for downloading fiddle. Displays modal for user to
         * enter fiddle url or id
         * @param {String} path The path clicked from the context menu
         */
        getFiddleURL : function(path) {
            var me               = this,
                modalTemplate    = me.getTemplate(),
                renderedTemplate = Mustache.render(modalTemplate, {
                    path : path
                }),
                dialog           = Dialogs.showModalDialogUsingTemplate(renderedTemplate),
                $element         = dialog.getElement(),
                $urlField        = $element.find('.fiddle-url'),
                $downloadButton  = $element.find('.download-button');

            // focus urlfield right away
            $urlField.focus();

            // add listeners
            // on keyup, check if entry is valid
            $urlField.on('keyup', Sencha.bind(me.toggleFiddleDownloadButton, me));

            // on click, we have a valid value; download the fiddle
            $downloadButton.on('click', function (e) {
                var $fld     = $(this),
                    value    = $urlField.val(),
                    url      = value.length < 10 ? baseURL + value : value, //TODO the length thing, test the value see if uri
                    // convert url to the correct api version
                    finalUrl = url.replace('#fiddle', 'export');

                // do the business
                me.downloadFiddleContent(path, finalUrl);
            });
        },

        /**
         * @private
         * Determines the version of the fiddle by inspecting the sdk urls
         * @param {String} html The html to inspect
         * @return {String}
         */
        getFiddleVersion : function(html) {
            var sdks        = this.sdks,
                version     = false,
                firstScript = html.match(/<script.*<\/script>/),
                key, regex;

            // did we match something?
            if (firstScript.length) {
                for (key in sdks) {
                    regex = new RegExp(key);

                    // does first script src contain a version number?
                    if (firstScript[0].search(regex) != -1) {
                        return key;
                    }
                }
            }
        },

        /**
         * @private
         * Replaces sdk urls in downloaded fiddle content with local sdk urls
         * @param {String} html The html in which the replacements will be made
         * @param {String} version The version of the sdk in the downloaded fiddle
         * @return {String}
         */
        replaceRemoteUrls : function(html, version) {
            var sdk           = this.sdks[version],
                sdkTpl        = prefs.get('sdk_tpl'),
                replaceURL    = new RegExp(sdk.remote, 'g'),
                path          = sdkTpl
                    .replace( '{framework}',     sdk.framework    )
                    .replace( '{full_version}',  sdk.full_version )
                    .replace( '{short_version}', version          )
                    .replace( '{label}',         sdk.label        );

            // replace remote urls with local ones
            return html.replace(replaceURL, path);
        },

        /**
         * @private
         * Convenience method for showing path selector
         * @param {String} title The title for the modal
         * @param {Function} callback The callback method to execute upon selection
         */
        showPathSelector : function(title,callback) {
            FileSystem.showOpenDialog(
                false,
                true,
                title,
                null,
                null,
                callback
            );
        },

        /**
         * @private
         * Helper to retrieve the index.html asset from the array of assets returned from webservice
         * @param {Array} assets Array of assets that belong to the fiddle
         * @return {Object}
         */
        getIndexAsset : function(assets) {
            var i      = 0,
                length = assets.length,
                indexAsset,
                asset;

            for (; i < length; i++) {
                asset = assets[i];

                if (asset.name === 'index.html') {
                    return asset;
                }
            }
        },

        /**
         * @private
         * Common method for writing a fiddle asset/mockdata to file
         * @param {String} name The name of the asset (file)
         * @param {String} content The content of the file
         * @param {String} rootPath The rootpath where the fiddle is being written
         */
        writeLocalAsset : function(name, content, rootPath) {
            var i = 0,
                length,
                folders,
                folder, folderPath,
                fileName, file;

            //TODO fiddle needs to provide the actual type of file instead of relying on the name
            if (prefs.get('fiddle_onready_wrap') && name.substr(-2).toLowerCase() === 'js') {
                content = 'Ext.onReady(function() {\n\n' + content + '\n\n});';
            }

            // roll over name, check
            folders    = name.split('/');
            length     = folders.length - 1;
            folderPath = rootPath;

            // follow the folder structre and create one folder for each level
            for (; i < length; i++) {
                // create folder
                folderPath = rootPath + folders.slice(0, i+1).join('/');
                folder     = FileSystem.getDirectoryForPath(folderPath);

                folder.create();
            }

            // final folder path should be the full path for the
            // file we want to write
            fileName = '/' + folders[folders.length-1];
            file     = FileSystem.getFileForPath(folderPath + fileName);

            file.write(content);
        },

        /**
         * @private
         * Once all the setup has been completed and the fiddle content has been downloaded,
         * this method will do the heavy lifting of creating the fiddle content on the machine
         * @param {Object} fiddle The downloaded and decoded fiddle content
         * @param {String} path The path selected by the user where the fiddle should be written
         * @param {String} version The version of the SDK to use
         */
        createLocalFiddle : function(fiddle, path, version) {
            var assets          = fiddle.assets,
                length          = assets.length,
                mockdata        = fiddle.mockdata,
                urlregex        = /^((http|https):\/\/)/,
                rootPath        = path + (path.substr(-1) === '/' ? '' : '/') + fiddle.id + '/',
                i               = 0,
                doRemoteReplace = prefs.get('fiddle_replace_remote'),
                indexAsset,
                asset,mock,folder;

            // create main folder that will contain the fiddle assets
            folder = FileSystem.getDirectoryForPath(rootPath);

            folder.create();

            // process the code file assets
            for (; i < length; i++) {
                asset = assets[i];

                // make sure that these are actual content, and not remote urls
                if (!urlregex.test(asset.name)) {
                    // replace index.html urls to use local ones
                    if (asset.name === 'index.html' && doRemoteReplace) {
                        asset.code = this.replaceRemoteUrls(asset.code, version)
                    }

                    this.writeLocalAsset(asset.name, asset.code, rootPath);
                }
            }

            i      = 0;
            length = mockdata.length;

            // process the mockdata items
            for (; i < length; i++) {
                asset = mockdata[i];

                this.writeLocalAsset(asset.url, asset.data, rootPath);
            }
        },

        /**
         * @private
         * This method will check the version of the fiddle and ensure that:
         *
         * 1.) A web server path preference has been set
         *
         * In this case, the answer could be "no", so this incorporates Deferred()
         * so that we can allow the async path selection to complete
         *
         * @param {Object} fiddle The downloaded, decoded fiddle content
         * @param {String} path The path selected from the context menu
         */
        preFiddleCheck : function(fiddle, path) {
            var indexAsset = this.getIndexAsset(fiddle.assets),
                version    = this.getFiddleVersion(indexAsset.code);

            if (version) {
                this.createLocalFiddle(fiddle, path, version);
            } else {
                Dialogs.showModalDialog('', 'Whoops!', 'Sorry, the version used by the Fiddle is not available.');
            }
        },

        /**
         * @private
         * Retrieves fiddle data from web service
         * @param {String} path The path selected from the context menu
         * @param {String} url  The url of the fiddle to download
         * @param {String} sdkPath Path to the SDK
         */
        downloadFiddleContent : function(path, url) {
            var me = this;

            $.ajax(url)
                .success(function(response, textStatus, jqXHR) {
                    var data   = response.data,
                        fiddle = data.fiddle;

                    if (data.success && fiddle) {
                        me.preFiddleCheck(fiddle, path);
                    } else {
                        Dialogs.showModalDialog('', 'Fiddle could not be downloaded', data.msg);
                    }
                })
                .error(function(jqXHR, textStatus, errorThrown){
                    Dialogs.showModalDialog('', 'Whoops!', 'Sorry, an unknown error occurred. Please try again!');
                });
        },

        sdks : {
            // ext js
            '5.1.0': {
                framework    : 'ext',
                full_version : '5.1.0.107',
                remote       : 'https://extjs.cachefly.net/ext/gpl/5.1.0',
                label        : 'Ext JS 5.1.0'
            },
            '5.0.1': {
                framework    : 'ext',
                full_version : '5.0.1.1255',
                remote       : 'https://extjs.cachefly.net/ext/gpl/5.0.1',
                label        : 'Ext JS 5.0.1'
            },
            '5.0.0': {
                framework    : 'ext',
                full_version : '5.0.0.970',
                remote       : 'https://extjs.cachefly.net/ext/gpl/5.0.0',
                label        : 'Ext JS 5.0.0'
            },
            'ext-5.0.0.736': {
                framework    : 'ext',
                full_version : '5.0.0.736',
                remote       : 'https://extjs.cachefly.net/ext/beta/ext-5.0.0.736',
                label        : 'Ext JS 5.0.0.736'
            },
            '4.2.1': {
                framework    : 'ext',
                full_version : '4.2.1.883',
                remote       : 'https://extjs.cachefly.net/ext/gpl/4.2.1',
                label        : 'Ext JS 4.2.1'
            },
            '4.2.0': {
                framework    : 'ext',
                full_version : '4.2.0.663',
                remote       : 'https://extjs.cachefly.net/ext/gpl/4.2.0',
                label        : 'Ext JS 4.2.0'
            },
            'ext-4.1.1-gpl': {
                framework    : 'ext',
                full_version : '4.1.1',
                remote       : 'https://extjs.cachefly.net/ext-4.1.1-gpl',
                label        : 'Ext JS 4.1.1'
            },
            'ext-4.1.0-gpl': {
                framework    : 'ext',
                full_version : '4.1.0',
                remote       : 'https://extjs.cachefly.net/ext-4.1.0-gpl',
                label        : 'Ext JS 4.1.0'
            },
            'ext-4.0.7-gpl': {
                framework    : 'ext',
                full_version : '4.0.7',
                remote       : 'https://extjs.cachefly.net/ext-4.0.7-gpl',
                label        : 'Ext JS 4.0.7'
            },
            '3.4.1.1': {
                framework    : 'ext',
                full_version : '3.4.1.1',
                remote       : 'https://extjs.cachefly.net/ext/gpl/3.4.1.1',
                label        : 'Ext JS 3.4.1.1'
            },
            'ext-3.4.0': {
                framework    : 'ext',
                full_version : '3.4.0',
                remote       : 'https://extjs.cachefly.net/ext-3.4.0',
                label        : 'Ext JS 3.4.0'
            },
            'ext-3.3.0': {
                framework    : 'ext',
                full_version : '3.3.0',
                remote       : 'https://extjs.cachefly.net/ext-3.3.0',
                label        : 'Ext JS 3.3.0'
            },
            'ext-3.0.0': {
                framework    : 'ext',
                full_version : '3.0.0',
                remote       : 'https://extjs.cachefly.net/ext-3.0.0',
                label        : 'Ext JS 3.0.0'
            },
            'ext-2.3.0': {
                framework    : 'ext',
                full_version : '2.3.0',
                remote       : 'https://extjs.cachefly.net/ext-2.3.0',
                label        : 'Ext JS 2.3.0'
            },
            // touch
            'touch-2.4.1': {
                framework    : 'touch',
                full_version : '2.4.1',
                remote       : 'https://extjs.cachefly.net/touch/sencha-touch-2.4.1',
                label        : 'Sencha Touch 2.4.1'
            },
            'touch-2.4.0': {
                framework    : 'touch',
                full_version : '2.4.0',
                remote       : 'https://extjs.cachefly.net/touch/sencha-touch-2.4.0',
                label        : 'Sencha Touch 2.4.0'
            },
            'touch-2.3.0': {
                framework    : 'touch',
                full_version : '2.3.0',
                remote       : 'https://extjs.cachefly.net/touch/sencha-touch-2.3.0',
                label        : 'Sencha Touch 2.3.0'
            },
            'touch-2.2.1': {
                framework    : 'touch',
                full_version : '2.2.1',
                remote       : 'https://extjs.cachefly.net/touch/sencha-touch-2.2.1',
                label        : 'Sencha Touch 2.2.1'
            },
            'touch-2.2.0': {
                framework    : 'touch',
                full_version : '2.2.0',
                remote       : 'https://extjs.cachefly.net/touch/sencha-touch-2.2.0',
                label        : 'Sencha Touch 2.2.0'
            },
            'touch-2.1.1': {
                framework    : 'touch',
                full_version : '2.1.1',
                remote       : 'https://extjs.cachefly.net/touch/sencha-touch-2.1.1',
                label        : 'Sencha Touch 2.1.1'
            },
            'touch-2.0.1.1': {
                framework    : 'touch',
                full_version : '2.0.1.1',
                remote       : 'https://extjs.cachefly.net/touch/sencha-touch-2.0.1.1',
                label        : 'Sencha Touch 2.0.1.1'
            }
        }
    });
});

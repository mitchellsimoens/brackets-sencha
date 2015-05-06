/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global Sencha, $, brackets, window */

var PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
    Dialogs            = brackets.getModule('widgets/Dialogs'),
    prefs              = PreferencesManager.getExtensionPrefs('brackets-sencha');

//TODO use Sencha.panel.Preferences

/**
 * Class to manage custom commands.
 *
 * @class Sencha.cmd.User
 */
Sencha.define('App.cmd.User', {
    singleton : true,

    /**
     * Saves custom user cmd
     * @param {String} key The key to use
     * @param {String} cmd The cmd to save
     */
    saveUserCmd : function(key, cmd) {
        if (key && cmd) {
            var pref  = prefs.get('user_cmds');

            // slugify the key
            key = $.trim(key)
                   .replace(/[^a-z0-9-]/gi, '-')
                   .replace(/-+/g, '-')
                   .replace(/^-|-$/g, '');

            pref[key] = cmd;

            prefs.set('user_cmds', pref);
        }
    },

    /**
     * Deletes custom user cmd
     * @param {String} key The key to use
     * @param {String} cmd The cmd to save
     */
    deleteUserCmd : function(key) {
        var pref = prefs.get('user_cmds');

        delete pref[key];

        // now just re-set the pref with updated data
        prefs.set('user_cmds', pref);
    },

    /**
     * Display modal for select/entering custom cmd
     */
    showUserCmdModal : function() {
        var me            = this,
            modalTemplate = Sencha.Template.get('cmd/userCmdModal'),
            userCmds      = prefs.get('user_cmds'),
            cmds          = [],
            deferred      = $.Deferred(),
            renderedTemplate,
            dialog,
            $element,
            $executeButton,
            $customCmd,
            $cmdSlug,
            key;

        // convert keys to array for mustache
        for (key in userCmds) {
            cmds.push({
                name  : key,
                value : userCmds[key]
            });
        }

        renderedTemplate = Mustache.render(modalTemplate, {
            cmds: cmds
        });

        dialog         = Dialogs.showModalDialogUsingTemplate(renderedTemplate);
        $element       = dialog.getElement();
        $executeButton = $element.find('.execute-button');
        $customCmd     = $element.find('#custom_cmd');
        $cmdSlug       = $element.find('#cmd_slug');

        // add listener to monitor textarea for changes to turn button on/off
        $customCmd.on('keyup change', function(){
            $executeButton.prop('disabled', !$customCmd.val());
        });

        // add event listeners to save button
        $executeButton.on('click', function(e){
            deferred.resolve($customCmd.val());

            me.saveUserCmd($cmdSlug.val(), $customCmd.val());
        });

        // add click listener for delete buttons
        $element.on('click', '.delete-button', function(e){
            var val = $(this).prev().val(),
                row = $(this).closest('tr');

            e.preventDefault();

            $(row).remove();

            me.deleteUserCmd(val);
        });

        // add mouseover/mouseout events for style purposes
        $element.on('mouseover', 'tr', function(e) {
            $(this).css('background','#000');
        });

        $element.on('mouseout', 'tr', function(e) {
            $(this).css('background','transparent');
        });

        // add click listener to row; will populate textarea with content
        $element.on('click', '.chooser', function(e) {
            var td = $(this).closest('tr').find('td:nth-child(2)');

            e.preventDefault();

            if (td) {
                $customCmd.val(td.html());
                $customCmd.change();
            }
        });

        return deferred.promise();
    },

    /**
     * Master promise maker for selecting a build (if possible).
     * @param {Object} options Options to be used for the preprocessor.
     *  - **buildRequired** : If `true`, require a build to be selected. This will not show the none option.
     * @return {Function}
     */
    getUserCmd: function(options) {
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
                .then(function(){
                    return me.showUserCmdModal();
                })
                .done(function(cmd) {
                    // resolve the promise
                    deferred.resolve(cmd, dir, version);
                });

            return deferred.promise();
        }
    }
});

Sencha.define('Sencha.Format', {
    singleton : true,

    capitalize : function(str) {
        return str.substr(0, 1).toUpperCase() + str.substr(1);
    }
});

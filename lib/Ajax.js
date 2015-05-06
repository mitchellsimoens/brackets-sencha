define(function() {
    return {
        _xhr : null,

        load : function(options) {
            options = options || {};

            if (!options.url) {
                throw Error('url is required');
            }

            if (!options.method) {
                options.method = 'GET';
            }

            if (typeof options.async === undefined) {
                options.async = true;
            }

            return this.loadXhr(options);
        },

        loadXhr : function(options) {
            var xhr     = this.getXhrCls(),
                request = new xhr();

            request.open(options.method, options.url, options.async);
            request.send(null);

            return request;
        },

        loadFetch : function(options) {},

        getXhrCls : function() {
            var xhr = this._xhr;

            if (!xhr) {
                if (window.XMLHttpRequest) { // Mozilla, Safari, ...
                  xhr = XMLHttpRequest;
                } else if (window.ActiveXObject) { // IE old
                  try {
                    xhr = ActiveXObject('Msxml2.XMLHTTP');
                  }
                  catch (e) {
                    try {
                      xhr = ActiveXObject('Microsoft.XMLHTTP');
                    }
                    catch (e) {}
                  }
                }

                this._xhr = xhr;
            }

            return xhr;
        }
    };
    return Sencha.define('Sencha.Ajax', {
        extend : function() {},

        singleton : true,

        _xhr : null,

        load : function(options) {
            options = options || {};

            if (!options.url) {
                throw Error('url is required');
            }

            if (!options.method) {
                options.method = 'GET';
            }

            if (typeof options.async === undefined) {
                options.async = true;
            }

            return this.loadXhr(options);
        },

        loadXhr : function(options) {
            var xhr     = this.getXhrCls(),
                request = new xhr();

            request.open(options.method, options.url, options.async);
            request.send(null);

            return request;
        },

        loadFetch : function(options) {},

        getXhrCls : function() {
            var xhr = this._xhr;

            if (!xhr) {
                if (window.XMLHttpRequest) { // Mozilla, Safari, ...
                  xhr = XMLHttpRequest;
                } else if (window.ActiveXObject) { // IE old
                  try {
                    xhr = ActiveXObject('Msxml2.XMLHTTP');
                  }
                  catch (e) {
                    try {
                      xhr = ActiveXObject('Microsoft.XMLHTTP');
                    }
                    catch (e) {}
                  }
                }

                this._xhr = xhr;
            }

            return xhr;
        }
    });
});

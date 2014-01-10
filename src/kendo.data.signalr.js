kendo_module({
    id: "data.signalr",
    name: "SignalR",
    category: "framework",
    depends: [ "data" ],
    hidden: true
});

(function() {
    kendo.data.transports.signalr = kendo.data.RemoteTransport.extend({
        init: function (options) {
            options = options || {};

            var promise = options.promise;

            if (!promise) {
                throw new Error('The "promise" option must be set.');
            }

            if (typeof promise.done != "function" || typeof promise.fail != "function") {
                throw new Error('The "promise" option must be a Promise.');
            }

            this.promise = promise;

            var hub = options.hub;

            if (!hub) {
                throw new Error('The "hub" option must be set.');
            }

            if (typeof hub.on != "function" || typeof hub.invoke != "function") {
                throw new Error('The "hub" option is not a valid SignalR hub proxy.');
            }

            this.hub = hub;

            kendo.data.RemoteTransport.fn.init.call(this, options);
        },

        push: function(options) {
            var client = this.options.client || {};

            if (client.create) {
                this.hub.on(client.create, options.pushCreate);
            }

            if (client.update) {
                this.hub.on(client.update, options.pushUpdate);
            }

            if (client.destroy) {
                this.hub.on(client.destroy, options.pushDestroy);
            }
        },

        _crud: function(options, type) {
            var hub = this.hub;

            var server = this.options.server;

            if (!server || !server[type]) {
                throw new Error(kendo.format('The "server.{0}" option must be set.', type));
            }

            var args = [server[type]];

            var data = this.parameterMap(options.data, type);

            if (!$.isEmptyObject(data)) {
                args.push(data);
            }

            this.promise.done(function() {
                hub.invoke.apply(hub, args)
                          .done(options.success)
                          .fail(options.error);
            });
        },

        read: function(options) {
            this._crud(options, "read");
        },

        create: function(options) {
            this._crud(options, "create");
        },

        update: function(options) {
            this._crud(options, "update");
        },

        destroy: function(options) {
            this._crud(options, "destroy");
        }
    });
})();

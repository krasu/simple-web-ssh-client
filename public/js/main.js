/**
 * Author: krasu
 * Date: 10/8/13
 * Time: 9:43 AM
 */
$(function () {
    var tabTpl = _.template('<div class="tab-pane" id="<%= id %>"><div class="header"></div></div>')
    var handlerTpl = _.template('<li><a href="#<%= id %>" data-toggle="tab"><span class="name"><%= name %></span> <span class="remove">x</span></a></li>')

    var TerminalManager = function (container) {
        this.connections = {}
        this.pending = []
        this.status = 'disconnected'
        this.handlers = container.find('.nav-tabs')
        this.tabs = container.find('.tab-content')

        this.bindEvents()
        return _.bind(this.spawn, this)
    }

    TerminalManager.prototype.onConnect = function () {
        this.status = 'connected';
        _.each(this.pending, this.spawn, this)
        this.pending = []
    }

    TerminalManager.prototype.connect = function () {
        if (this.status != 'disconnected') return

        this.status = 'connecting'
        this.sockjs = new SockJS(window.location.origin + '/terminals')

        this.sockjs.onopen = _.bind(this.onConnect, this)
        this.sockjs.onmessage = _.bind(this.listen, this)
        this.sockjs.onclose = _.bind(function () {
            this.status = 'disconnected';
            _.invoke(this.connections, 'remove')
        }, this);
    }

    TerminalManager.prototype.bindEvents = function () {
        this.handlers
            .on('click', '.name', function (e) {
                e.preventDefault();
                var link = $(this).parent()
                link.tab('show');
                $(link.attr('href')).find('.terminal').focus()
            })
            .on('click', '.remove', _.bind(function (e) {
                e.preventDefault();
                var link = $(e.currentTarget).parent()
                var uuid = _.findKey(this.connections, function (item) {
                    return item.handler.is(link)
                })

                if (!uuid) return

                this.remove(uuid)
            }, this))
    }

    TerminalManager.prototype.spawn = function (credentials) {
        if (this.status != 'connected') {
            this.pending.push(credentials)
            this.connect()
        } else {
            this.send('spawn', credentials);
        }
    }

    TerminalManager.prototype.create = function (uuid, name) {
        var tabId = name.replace(/[^0-9a-z-_]+/ig, '_') + '_' + (new Date()).getTime()
        $(handlerTpl({id: tabId, name: name})).appendTo(this.handlers)
        $(tabTpl({id: tabId})).appendTo(this.tabs)

        var tab = this.tabs.find('.tab-pane:last')
        var handler = this.handlers.find('a:last').tab('show');
        var term = new Terminal({
            cols: 80,
            rows: 24,
            screenKeys: true
        })

        term.open(tab[0]);
        term.on('title', function (title) {
            tab.find('.header').html(title);
        });

        term.on('data', _.bind(function (data) {
            this.send('data', data, uuid);
        }, this));

        this.connections[uuid] = {
            term: term,
            tab: tab,
            handler: handler
        }

        return this.connections[uuid]
    }

    TerminalManager.prototype.remove = function (uuid) {
        if (!this.connections[uuid]) return
        this.send('kill', null, uuid)
        this.connections[uuid].term.destroy();
        this.connections[uuid].handler.remove()
        this.connections[uuid].tab.remove()
    }

    TerminalManager.prototype.listen = function (e) {
        if (!e || e.type != 'message') return;
        var msg = JSON.parse(e.data);

        if (msg.event == 'data' && this.connections[msg.uuid]) {
            this.connections[msg.uuid].term.write(msg.data)
        }

        if (msg.event == 'spawned') {
            this.create(msg.uuid, msg.data)
        }
    }

    TerminalManager.prototype.send = function (event, data, uuid) {
        this.sockjs.send(JSON.stringify({event: event, uuid: uuid, data: data}));
    }

    var manager = new TerminalManager($('#terminals'))

    $('.predefined a').on('click', function () {
        var params = $(this).html().split('@')
        manager({
            username: params[0],
            server: params[1]
        })
    })

    $('.connect').on('click', function () {
        var params = $('#server-string').val().split('@')
        manager({
            username: params[0],
            server: params[1]
        })
    })
})

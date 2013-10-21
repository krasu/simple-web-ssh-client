/**
 * Author: krasu
 * Date: 10/15/13
 * Time: 7:30 PM
 */
var _ = require('lodash'),
    uuidGen = require('node-uuid'),
    pty = require('pty.js'),
    SockEmitter = require('./sock.emitter')

function ChannelManager() {
    this.channels = {}
}

ChannelManager.prototype.get = function (uuid) {
    return this.channels[uuid]
}

ChannelManager.prototype.killAll = function (conn) {
    var channels = _.filter(this.channels, {connectionId: conn.id})
    _.each(channels, function (channel) {
        this.kill(channel.uuid)
    }, this)
}

ChannelManager.prototype.kill = function (uuid) {
    if (!this.channels[uuid]) return;

    this.channels[uuid].term && this.channels[uuid].term.destroy()
    delete this.channels[uuid]
}

ChannelManager.prototype.resize = function (uuid, size) {
    if (!this.channels[uuid] || !_.isObject(size)) return;
	_.invoke(size, parseInt, 10);
	_.invoke(size, Math.abs);
    if (isNaN(size.cols) || isNaN(size.rows) || !size.cols || !size.rows) return;

    this.channels[uuid].term.resize(size.cols, size.rows);
}

ChannelManager.prototype.create = function (conn, options) {
    var uuid = uuidGen.v4()
    var params = []
    var port = Math.abs(parseInt(options.port))
    if (!isNaN(port)) {
        params.push('-p ' + port)
    }
    params.push(options.username + '@' + options.server)

    var channel = this.channels[uuid] = {
        term: pty.spawn('ssh', params),
        emitter: new SockEmitter(conn, uuid),
        connectionId: conn.id,
        uuid: uuid
    }

    channel.term.on('data', function (data) {
        channel.emitter.emit('data', {
	        input: data,
	        cols: channel.term.cols,
	        rows: channel.term.rows
        });
    });

    channel.emitter.emit('spawned', {
        clientId: options.clientId
    });

    return channel
}

module.exports = (function () {
    return new ChannelManager()
})()
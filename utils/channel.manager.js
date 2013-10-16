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
    _.each(channels, function(channel) {
        this.kill(channel.uuid)
    }, this)
}

ChannelManager.prototype.kill = function (uuid) {
    if (!this.channels[uuid]) return;

    this.channels[uuid].term && this.channels[uuid].term.destroy()
    delete this.channels[uuid]
}

ChannelManager.prototype.create = function (conn, options) {
    var uuid = uuidGen.v4()
    var channel = this.channels[uuid] = {
        term: pty.spawn('ssh', [options.username + '@' + options.server]),
        emitter: new SockEmitter(conn, uuid),
        connectionId: conn.id,
        uuid: uuid
    }

    channel.term.on('data', function (data) {
        channel.emitter.emit('data', data);
    });

    channel.emitter.emit('spawned', {
        clientId: options.clientId
    });

    return channel
}

module.exports = (function () {
    return new ChannelManager()
})()
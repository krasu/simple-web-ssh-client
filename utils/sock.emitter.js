/**
 * Author: krasu
 * Date: 10/15/13
 * Time: 7:30 PM
 */
var EventEmitter = require('events').EventEmitter,
    util = require('util')


function SockJSEmitter(conn, uuid) {
    this.conn = conn;
    this.uuid = uuid;
}

util.inherits(SockJSEmitter, EventEmitter);

// "emit" an event over the SockJS connection
SockJSEmitter.prototype.emit = function (event, data) {
    if (event === 'newListener') return;
    this.conn.write(JSON.stringify({event: event, uuid: this.uuid, data: data}));
}

// call this when we receive an event from the remote end
SockJSEmitter.prototype.emit_event = function (event, data) {
    EventEmitter.prototype.emit.call(this, event, data);
}

module.exports = SockJSEmitter

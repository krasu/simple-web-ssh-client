/**
 * Author: krasu
 * Date: 10/8/13
 * Time: 8:27 AM
 */
var instance,
    io = require('./socket.io')(),
    uuidGen = require('node-uuid'),
    pty = require('pty.js')


module.exports = (function () {
    return new TerminalManager()
})()

function TerminalManager() {
//    if (!(this instanceof TerminalManager)) return new TerminalManager();
//    if (instance instanceof TerminalManager) return instance

    this.terminals = {}
}

TerminalManager.prototype.create = function (id, username, servername) {
//    var term = pty.spawn('zsh')
    var term = pty.spawn('ssh', [username + '@' + servername]);

    term.on('data', function (data) {
        io.of('/terminals').in(id).emit('data', data);
    });

    console.log(''
        + 'Created shell with pty master/slave'
        + ' pair (master: %d, pid: %d)',
        term.fd, term.pid);

    this.terminals[id] = term
    return term
}

TerminalManager.prototype.getById = function (id) {
    return this.terminals[id]
}

TerminalManager.prototype.claimId = function () {
    return uuidGen.v4()
}
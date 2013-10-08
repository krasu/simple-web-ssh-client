/**
 * Author: krasu
 * Date: 10/8/13
 * Time: 8:27 AM
 */
var uuidGen = require('node-uuid'),
    pty = require('pty.js')


module.exports = TerminalManager

function TerminalManager() {
    this.terminals = {}
}

TerminalManager.prototype.create = function (id) {

}

TerminalManager.prototype.getById = function (id) {
    if (this.terminals[id]) return this.terminals[id]

    this.create(id)
}

TerminalManager.prototype.claimId = function () {
    return uuidGen.v4()
}
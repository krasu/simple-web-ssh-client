/**
 * Author: krasu
 * Date: 10/8/13
 * Time: 8:27 AM
 */
var instance

module.exports = function (server) {
    if (instance) return instance

    var io = require('socket.io').listen(server);

    io.configure('production', function () {
        io.enable('browser client minification');
        io.enable('browser client etag');
        io.enable('browser client gzip');
        io.set('transports', [
            'websocket',
            'flashsocket',
            'htmlfile',
            'xhr-polling',
            'jsonp-polling'
        ]);
        io.set('polling duration', 10);
    });

    io.configure('development', function () {
        io.set('transports', ['websocket']);
    });

    io.configure(function (){
        io.set('authorization', function (handshakeData, callback) {
            callback(null, true); // error first callback style
        });
    });

    instance = io
    return instance
}
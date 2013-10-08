/**
 * Author: krasu
 * Date: 10/8/13
 * Time: 9:43 AM
 */
$(function () {
    $('.predefined a').on('click', function () {
        var params = $(this).html().split('@')
        createTerminal(params[0], params[1])
    })
})

function createTerminal(username, servername) {
    var container = $('#terminals')
    var socket = io.connect(window.location.origin + '/terminals', {
        'force new connection': true,
        query: 'username=' + username + '&servername=' + servername
    })

    socket.on('connect', function () {
        var term = new Terminal({
            cols: 80,
            rows: 24,
            screenKeys: true
        });

        term.on('data', function (data) {
            socket.emit('data', data);
        });
        term.on('title', function (title) {
            document.title = title;
        });
        term.open(container[0]);

        socket.on('data', function (data) {
            term.write(data);
        });

        socket.on('disconnect', function () {
            term.destroy();
        });
    });
}
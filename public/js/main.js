/**
 * Author: krasu
 * Date: 10/8/13
 * Time: 9:43 AM
 */
$(function () {
    var container = $('#terminals')
    var navTabs = container.find('.nav-tabs')
    var tabs = container.find('.tab-content')

    $('.predefined a').on('click', function () {
        var params = $(this).html().split('@')
        createTerminal(params[0], params[1])
    })

    $('.connect').on('click', function () {
        var params = $('#server-string').val().split('@')
        createTerminal(params[0], params[1])
    })

    $('.nav-tabs').on('click', 'a', function (e) {
        e.preventDefault();
        $(this).tab('show');
    })

    function createTab(username, servername) {
        var tabId = (username + '@' + servername).replace(/[^0-9a-z-_]+/ig, '_') + '_' + (new Date()).getTime()
        $('<li><a href="#' + tabId + '" data-toggle="tab">' + username + '@' + servername + '</a></li>').appendTo(navTabs)
        $('<div class="tab-pane" id="' + tabId + '"><div class="header"></div><div class="terminal"></div></div>').appendTo(tabs)
        navTabs.find('a:last').tab('show');
    }

    function createTerminal(username, servername) {
        if (!username || !servername) return

        var socket = io.connect(window.location.origin + '/terminals', {
            'force new connection': true,
            query: 'username=' + username + '&servername=' + servername
        })

        socket.on('connect', function () {
            var term = new Terminal({
                cols: 80,
                rows: 24,
                screenKeys: true
            }), tab;

            term.on('data', function (data) {
                socket.emit('data', data);
            });
            term.on('title', function (title) {
                tab.find('.header').html(title);
            });

            createTab(username, servername)
            tab = tabs.find('.tab-pane:last')
            term.open(tab.find('.terminal')[0]);

            socket.on('data', function (data) {
                term.write(data);
            });

            socket.on('disconnect', function () {
                term.destroy();
                container.find('.nav-tabs a [href="#' + tabId + '"]').remove()
            });
        });
    }
})

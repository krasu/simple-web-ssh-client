/**
 * Module dependencies.
 */

var http = require('http'),
    connect = require('connect'),
    express = require('express'),
    terminal = require('term.js'),
    sockjs = require('sockjs'),
    channelManager = require('./utils/channel.manager'),
    path = require('path');

var app = express(),
    sessionSecret = 'asdasdas dasd asd',
    cookieParser = express.cookieParser(sessionSecret),
    sessionStore = new connect.middleware.session.MemoryStore();

/**
 * App & Server
 */

app.use(function (req, res, next) {
    var setHeader = res.setHeader;
    res.setHeader = function (name) {
        switch (name) {
        case 'Cache-Control':
        case 'Last-Modified':
        case 'ETag':
            return;
        }
        return setHeader.apply(res, arguments);
    };
    next();
});

app.use(cookieParser);
app.use(express.session({ store: sessionStore }));
app.use(terminal.middleware());
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

require('./routes/')(app);

var server = http.createServer(app);
var echo = sockjs.createServer()

echo.on('connection', function (conn) {
    conn.on('data', function (data) {
        var msg = {}
        try {
            msg = JSON.parse(data);
        } catch (e) {
        }

        if (msg.event === 'spawn') {
            channelManager.create(conn, {
                username: msg.data.username,
                server: msg.data.server
            })
        }

        if (msg.event === 'kill') {
            channelManager.kill(msg.uuid)
        }

        if (msg.event === 'data' && msg.uuid) {
            var channel = channelManager.get(msg.uuid)
            channel.term.write(msg.data);
        }
    });

    conn.on('close', function () {
        channelManager.killAll(conn)
        conn = null;
    });
})

echo.installHandlers(server, {prefix: '/terminals'});
server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

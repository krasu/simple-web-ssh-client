/**
 * Module dependencies.
 */

var http = require('http'),
    connect = require('connect'),
    express = require('express'),
    terminal = require('term.js'),
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
var io = require('./utils/socket.io')(server)
var terminalManager = require('./utils/terminal.manager')

io.of('/terminals')
    .on('connection', function (socket) {
        var termId = terminalManager.claimId()
        var term = terminalManager.create(termId, socket.handshake.query.username, socket.handshake.query.servername)

        socket.join(termId)
        socket.on('data', function(data) {
            term.write(data);
        });

        socket.on('disconnect', function() {
            socket = null;
        });
    })

server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

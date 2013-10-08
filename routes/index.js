/*
 * GET home page.
 */

module.exports = function (app) {

	app.get('/create-connection', function (req, res) {
		var buff = [], socket, term = pty.spawn('ssh', ['nethack@alt.org']);

		term.on('data', function (data) {
			return !socket
				? buff.push(data)
				: socket.emit('data', data);
		});

		console.log(''
			+ 'Created shell with pty master/slave'
			+ ' pair (master: %d, pid: %d)',
			term.fd, term.pid);

		app.locals.sessionSockets.on('connection', function (err, sock, session) {
			console.log(arguments)
			socket = sock;

			socket.on('data', function (data) {
				if (stream) stream.write('IN: ' + data + '\n-\n');
				term.write(data);
			});

			socket.on('disconnect', function () {
				socket = null;
			});

			while (buff.length) {
				socket.emit('data', buff.shift());
			}
		});
		res.render('index', { title: 'Express' });
	})

	app.get('/', function (req, res) {
		res.render('index', { title: 'Express' });
	})
};

/*
 io.sockets.on('connection', function (sock) {
 console.log(arguments)
 socket = sock;

 socket.on('data', function (data) {
 if (stream) stream.write('IN: ' + data + '\n-\n');
 term.write(data);
 });

 socket.on('disconnect', function () {
 socket = null;
 });

 while (buff.length) {
 socket.emit('data', buff.shift());
 }
 });
 */
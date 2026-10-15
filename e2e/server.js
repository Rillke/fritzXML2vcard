/* jshint node: true, esversion: 6 */
// Minimal static file server for the web version in dist/, used by the
// browser tests so the page is loaded over HTTP like on GitHub Pages.
(function() {
	'use strict';

	var http = require('http'),
		fs = require('fs'),
		path = require('path'),
		root = path.join(__dirname, '..', 'dist'),
		port = Number(process.env.PORT) || 4173,
		types = {
			'.html': 'text/html; charset=utf-8',
			'.js': 'text/javascript; charset=utf-8',
			'.map': 'application/json',
			'.css': 'text/css; charset=utf-8',
			'.png': 'image/png',
			'.svg': 'image/svg+xml',
			'.eot': 'application/vnd.ms-fontobject',
			'.ttf': 'font/ttf',
			'.woff': 'font/woff',
			'.woff2': 'font/woff2'
		};

	http.createServer(function(req, res) {
		var urlPath = decodeURIComponent(req.url.split('?')[0]),
			file = path.join(root, urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath);

		if (!file.startsWith(root + path.sep)) {
			res.writeHead(403);
			res.end();
			return;
		}
		fs.readFile(file, function(err, data) {
			if (err) {
				res.writeHead(404);
				res.end('Not found');
				return;
			}
			res.writeHead(200, {
				'Content-Type': types[path.extname(file)] || 'application/octet-stream'
			});
			res.end(data);
		});
	}).listen(port, '127.0.0.1', function() {
		console.log('Serving ' + root + ' at http://127.0.0.1:' + port + '/');
	});
}());

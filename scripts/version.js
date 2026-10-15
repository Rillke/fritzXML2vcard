#!/usr/bin/env node
/* jshint node: true, esversion: 6 */
// Write src/version.js with the git tag and short commit hash of HEAD,
// shown in the footer of the web version.
(function() {
	'use strict';

	var execSync = require('child_process').execSync,
		fs = require('fs'),
		path = require('path');

	function git(args) {
		try {
			return execSync('git ' + args, {
				stdio: ['ignore', 'pipe', 'ignore']
			}).toString().trim() || null;
		} catch (e) {
			return null;
		}
	}

	var hash = git('rev-parse --short HEAD');
	if (!hash) {
		console.error('Cannot determine the git commit hash of HEAD.');
		process.exit(1);
	}

	var versionInfo = {
		tag: git('describe --tags --exact-match HEAD'),
		hash: hash,
		timestamp: Math.floor(Date.now() / 1000)
	};

	fs.writeFileSync(path.join(__dirname, '..', 'src', 'version.js'),
		'module.exports = ' + JSON.stringify(versionInfo, null, '\t') + ';\n');
}());

#!/usr/bin/env node
/* jshint node: true, esversion: 6 */
(function() {
	'use strict';

	var inputFile = process.argv[2],
		outputDir = process.argv[3],
		requiredModules = ['fs', 'pixl-xml', 'vcards-js', './src/lib-convert'];

	if (!inputFile || !outputDir ||
		/^(?:\/|--?)?help$/.test(inputFile) ||
		/^[\/-]h$/.test(inputFile)) {
		console.log('Help:');
		dieUsage();
	}

	// Ensure all modules are available
	for (var m of requiredModules) {
		try {
			require.resolve(m);
		} catch (e) {
			console.error(m +
				' is required but was not found.');
			dieInstall();
		}
	}

	// load modules
	var fs = require('fs'),
		libConvert = require('./src/lib-convert');

	// Try locating inputFile
	if (!fs.existsSync(inputFile)) {
		inputFile = __dirname + inputFile;
	}

	if (!fs.existsSync(inputFile)) {
		console.error(
			'Can not locate input XML file: ' +
			process.argv[2]);
		dieUsage();
	}

	if (!fs.existsSync(outputDir)) {
		console.error(
			'Can not locate output directory where to place the vcf files: ' +
			process.argv[3]);
		console.error('Please make sure it exists, or create it.');
		dieUsage();
	}

	function dieInstall() {
		console.log(
			'Please install the required modules. Run:'
		);
		console.log('npm install');
		dieUsage();
	}

	function dieUsage() {
		console.log(
			'fritzXML2vcard - https://github.com/Rillke/fritzXML2vcard\n' +
			'Convert addresses exported by AVM\'s FritzBox ' +
			'to vCard (*.vcf) files.\n\n' +
			'Usage:\n' +
			' node convert.js phone-book-input.xml /path/to/outputDir\n\n' +
			'Or if globally installed by npm:\n' +
			' fritz-xml-2vcard phone-book-input.xml /path/to/outputDir'
		);
		process.exit(1);
	}

	var xmlString = fs.readFileSync(inputFile, 'utf8'),
		result = libConvert.fritzXML2vcard(xmlString);

		for ( var vcfFile in result ) {
			if ( result.hasOwnProperty( vcfFile ) ) {
				fs.writeFileSync( outputDir + '/' + vcfFile, result[vcfFile] );
			}
		}
}());

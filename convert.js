#!/usr/bin/env node
/* jshint node: true, esversion: 6 */
(function() {
	'use strict';

	var inputFile = process.argv[2],
		outputDir = process.argv[3],
		requiredModules = ['fs','xml2js', 'vcards-js'];

	if (!inputFile || !outputDir ||
		/^--help$/.test(inputFile) ||
		/^-h$/.test(inputFile)) {
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
		xml2js = require('xml2js'),
		vCard = require('vcards-js'),
		parser = new xml2js.Parser();

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

	// map FritzXML properties to vcf
	var phonePropertyMapping = {
		'home': 'homePhone',
		'work': 'workPhone',
		'fax_work': 'workFax',
		'mobile': 'cellPhone'
	};

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
			'to vCard (*.vcf) files.\n' +
			'Usage:\n' +
			'node convert.js phone-book-input.xml /path/to/outputDir'
		);
		process.exit(1);
	}

	function run(err, result) {
		var contacts = result.phonebooks.phonebook[0].contact;
		for (var contact of contacts) {
			var card = vCard(),
				contactName = contact.person[0].realName[0]
					.split(','),
				saveFileName = contact.person[0].realName[0]
					.replace(/[ ,:\/\\]/gi, '_') + '.vcf';

			if (contactName.length > 1) {
				card.lastName = contactName.pop().trim();
				card.firstName = contactName.join(',').trim();
			} else {
				card.lastName = contact.person[0].realName[0];
			}

			for (var number of contact.telephony[0].number) {
				if (number.$.type in phonePropertyMapping) {
					card[
						phonePropertyMapping[number.$.type]
					] = number._;
				}
			}

			for (var service of contact.services) {
				for (var email of (service.email || [])) {
					card.email = email._;
				}
			}

			//save to file
			card.saveToFile(outputDir + '/' + saveFileName);
		}
	}

	fs.readFile(inputFile, function(err, data) {
		parser.parseString(data, run);
	});
}());

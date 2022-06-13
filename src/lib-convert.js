/* jshint node: true, esversion: 6 */
(function() {
	'use strict';

	// load modules
	var XML = require('pixl-xml'),
		vCard = require('vcards-js');

	// map FritzXML properties to vcf
	var phonePropertyMapping = {
		'home': 'homePhone',
		'work': 'workPhone',
		'fax_work': 'workFax',
		'mobile': 'cellPhone',
		'': 'otherPhone'
	};

	function needsAreaCode(number) {
		// starts with 1 to 9 (not 0, nor +), is an actual number
		return /^[1-9]\d+$/.test(number);
	}

	function needsCountryCode(number) {
		// starts with 01 to 99 (not 00, nor +), is an actual number
		// do not add country code if phone number comes without area code
		// and area code wasn't supplied
		return /^[0-9][1-9]\d+$/.test(number);
	}

	function run(parsedXML, area_code, country_code) {
		var contacts = parsedXML.phonebook.contact,
			output = {vCardStrings:{},vCardObjects:{}};

		country_code = (country_code || '').trim();
		area_code = (area_code || '').trim();
		if (country_code && /^0/.test(area_code)) {
			area_code = area_code.slice(1);
		}
		if (!contacts.length) {
			contacts = [contacts];
		}
		for (var contact of contacts) {
			var card = vCard(),
				contactName = contact.person.realName
					.split(','),
				saveFileName = contact.person.realName
					.replace(/[ ,:\/\\]/gi, '_') + '.vcf';

			if (contactName.length > 1) {
				card.lastName = contactName.shift().trim();
				card.firstName = contactName.join(',').trim();
			} else {
				card.lastName = contact.person.realName;
			}

			if (contact.telephony && contact.telephony.number) {
				if ( !Array.isArray(contact.telephony.number) ) {
					contact.telephony.number = [contact.telephony.number];
				}

				for (var number of contact.telephony.number) {
					if (number.type in phonePropertyMapping && number._Data) {
						if (!card[phonePropertyMapping[number.type]]) {
							card[phonePropertyMapping[number.type]] = [];
						}
						var phoneNumber = [number._Data.trim()],
							cleanPhoneNumber = phoneNumber[0]
								.replace(/[\(\) -]/g, '');

						if (area_code && needsAreaCode(cleanPhoneNumber)) {
							phoneNumber.push(area_code);
						}

						if (country_code && needsCountryCode(cleanPhoneNumber) &&
							(area_code || !needsAreaCode(cleanPhoneNumber))) {
								// Try eliminating leading 0, if exists
								phoneNumber[0] = phoneNumber[0].replace(/^([\(]*)0/, '$1');
								phoneNumber.push(country_code);
						}
						card[
							phonePropertyMapping[number.type]
						].push(phoneNumber.reverse().join(' '));
					}
				}
			}

			if (contact.services && contact.services.email) {
				if (!contact.services.email._Data) {
					contact.services.email = contact.services.email[0];
				}
				if (!card.email) {
					card.email = [];
				}
				card.email.push(contact.services.email._Data);
			}

			output.vCardStrings[saveFileName] = card.getFormattedString();
			output.vCardObjects[saveFileName] = card;
		}
		return output;
	}

	/**
	 * @var string xml_string FritzBox Phone book XML string
	 * @var string [area_code] Area code to prefix if number does not contain one
	 * @var string [country_code] Country code to prefix if number does not contain one
	 * @return object Hash mapping suggested file names to vCard strings
	 */
	module.exports.fritzXML2vcard = function ( xml_string, area_code, country_code ) {
		return run( XML.parse( xml_string ), area_code, country_code ).vCardStrings;
	};

	/**
	 * @var string xml_string FritzBox Phone book XML string
	 * @var string [area_code] Area code to prefix if number does not contain one
	 * @var string [country_code] Country code to prefix if number does not contain one
	 * @return object Hash {vCardStrings:{},vCardObjects:{}}
	 *         vCardStrings: Mapping suggested file names to vCard strings
	 *         vCardObjects: Mapping suggested file names to vCard objects
	 */
	module.exports.fritzXML2vcardObjects = function ( xml_string, area_code, country_code ) {
		return run( XML.parse( xml_string ), area_code, country_code );
	};

}());

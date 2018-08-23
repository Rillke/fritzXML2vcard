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
		'mobile': 'cellPhone'
	};

	function run(result) {
		var contacts = result.phonebook.contact,
			output = {vCardStrings:{},vCardObjects:{}};

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
				if ( contact.telephony.number.type ) {
					contact.telephony.number = [contact.telephony.number];
				}

				for (var number of contact.telephony.number) {
					if (number.type in phonePropertyMapping) {
						if (!card[phonePropertyMapping[number.type]]) {
							card[phonePropertyMapping[number.type]] = [];
						}
						card[
							phonePropertyMapping[number.type]
						].push(number._Data);
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
	 * @var string FritzBox Phone book XML string
	 * @return object Hash mapping suggested file names to vCard strings
	 */
	module.exports.fritzXML2vcard = function ( xml_string ) {
		return run( XML.parse( xml_string ) ).vCardStrings;
	}

	/**
	 * @var string FritzBox Phone book XML string
	 * @return object Hash {vCardStrings:{},vCardObjects:{}}
	 *         vCardStrings: Mapping suggested file names to vCard strings
	 *         vCardObjects: Mapping suggested file names to vCard objects
	 */
	module.exports.fritzXML2vcardObjects = function ( xml_string ) {
		return run( XML.parse( xml_string ) );
	}

}());

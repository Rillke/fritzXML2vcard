'use strict';

/* jshint node: true, esversion: 6 */
(function () {
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
		    output = {};

		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = contacts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var contact = _step.value;

				var card = vCard(),
				    contactName = contact.person.realName.split(','),
				    saveFileName = contact.person.realName.replace(/[ ,:\/\\]/gi, '_') + '.vcf';

				if (contactName.length > 1) {
					card.lastName = contactName.shift().trim();
					card.firstName = contactName.join(',').trim();
				} else {
					card.lastName = contact.person.realName;
				}

				if (contact.telephony && contact.telephony.number) {
					if (contact.telephony.number.type) {
						contact.telephony.number = [contact.telephony.number];
					}

					var _iteratorNormalCompletion2 = true;
					var _didIteratorError2 = false;
					var _iteratorError2 = undefined;

					try {
						for (var _iterator2 = contact.telephony.number[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
							var number = _step2.value;

							if (number.type in phonePropertyMapping) {
								card[phonePropertyMapping[number.type]] = number._Data;
							}
						}
					} catch (err) {
						_didIteratorError2 = true;
						_iteratorError2 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion2 && _iterator2.return) {
								_iterator2.return();
							}
						} finally {
							if (_didIteratorError2) {
								throw _iteratorError2;
							}
						}
					}
				}

				if (contact.services && contact.services.email) {
					if (!contact.services.email._Data) {
						contact.services.email = contact.services.email[0];
					}
					card.email = contact.services.email._Data;
				}

				output[saveFileName] = card.getFormattedString();
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		return output;
	}

	/**
  * @var string FritzBox Phone book XML string
  * @return object Hash mapping suggested file names to vCard strings
  */
	module.exports.fritzXML2vcard = function (xml_string) {
		return run(XML.parse(xml_string));
	};
})();
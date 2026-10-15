/* jshint node: true, esversion: 6 */
describe("lib-convert", function() {
  var srcConvert = require('../src/lib-convert');
  var libConvert = require('../lib/lib-convert');
  var fs = require('fs');
  var fritzXML = fs.readFileSync(__dirname + '/fritz-phonebook.xml',
    'utf8');
  var fritzJSON = fs.readFileSync(__dirname +
    '/fritz-phonebook.json', 'utf8');
  var fritzVCard = fs.readFileSync(__dirname +
    '/fritz-phonebook.vcard.wo-area-code-wo-country-code.json', 'utf8');
  var fritzVCardAreaCountry = fs.readFileSync(__dirname +
    '/fritz-phonebook.vcard.w-area-code-w-country-code.json', 'utf8');
  var XML;
  var vCard;

  it('pixl-xml', function() {
    var parsedXML;
    XML = require('pixl-xml');
    expect(XML.parse).toEqual(jasmine.any(Function));
    expect(parsedXML = XML.parse(fritzXML)).toEqual(jasmine.any(
      Object));
    expect(JSON.parse(fritzJSON)).toEqual(parsedXML);
  });

  it('lib-convert: No area code, no country code', function() {
    expect(srcConvert.fritzXML2vcard).toEqual(jasmine.any(Function));
    expect(libConvert.fritzXML2vcard).toEqual(jasmine.any(Function));

    var vCardsFromSrc, vCardsFromLib;
    expect(vCardsFromSrc = srcConvert.fritzXML2vcard(fritzXML)).toEqual(
      jasmine.any(Object));
    expect(vCardsFromLib = libConvert.fritzXML2vcard(fritzXML)).toEqual(
      jasmine.any(Object));

    // Re-create fritzbox vcard
    // fs.writeFileSync(__dirname + '/fritz-phonebook.vcard.wo-area-code-wo-country-code.json',
    //   JSON.stringify(vCardsFromLib),'utf8');

    vCardsFromSrc = JSON.parse(JSON.stringify(vCardsFromSrc).replace(
      /REV:[^"\n\r]+/g, 'REV:'));
    vCardsFromLib = JSON.parse(JSON.stringify(vCardsFromLib).replace(
      /REV:[^"\n\r]+/g, 'REV:'));
    fritzVCard = JSON.parse(fritzVCard.replace(/REV:[^"\n\r]+/g, 'REV:'));

    expect(fritzVCard).toEqual(vCardsFromSrc);
    expect(fritzVCard).toEqual(vCardsFromLib);
  });

  it('lib-convert: Area code, Country code', function() {
    var vCardsFromSrc, vCardsFromLib;
    expect(vCardsFromSrc = srcConvert.fritzXML2vcard(fritzXML, '030', '+49')).toEqual(
      jasmine.any(Object));
    expect(vCardsFromLib = libConvert.fritzXML2vcard(fritzXML, '030', '+49')).toEqual(
      jasmine.any(Object));

    // Re-create fritzbox vcard
    // fs.writeFileSync(__dirname + '/fritz-phonebook.vcard.w-area-code-w-country-code.json',
    //   JSON.stringify(vCardsFromLib),'utf8');

    vCardsFromSrc = JSON.parse(JSON.stringify(vCardsFromSrc).replace(
      /REV:[^"\n\r]+/g, 'REV:'));
    vCardsFromLib = JSON.parse(JSON.stringify(vCardsFromLib).replace(
      /REV:[^"\n\r]+/g, 'REV:'));
    fritzVCardAreaCountry = JSON.parse(fritzVCardAreaCountry.replace(/REV:[^"\n\r]+/g, 'REV:'));

    expect(fritzVCardAreaCountry).toEqual(vCardsFromSrc);
    expect(fritzVCardAreaCountry).toEqual(vCardsFromLib);
  });
});


describe("lib-convert: edge cases", function() {
  var libConvert = require('../src/lib-convert');

  function convertContact(contactXML, areaCode, countryCode) {
    var result = libConvert.fritzXML2vcard('<?xml version="1.0" encoding="utf-8"?>' +
      '<phonebooks><phonebook name="Telefonbuch"><contact>' +
      '<person><realName>Doe, John</realName></person>' + contactXML +
      '</contact></phonebook></phonebooks>', areaCode, countryCode);
    return result['Doe__John.vcf'].split(/\r?\n/).filter(function(line) {
      return /^(TEL|EMAIL)/.test(line);
    });
  }

  it('keeps multiple phone numbers of the same type', function() {
    expect(convertContact('<telephony nid="2">' +
      '<number type="home" prio="1" id="0">123456</number>' +
      '<number type="home" prio="0" id="1">654321</number>' +
      '</telephony>')).toEqual([
      'TEL;TYPE=HOME,VOICE:123456',
      'TEL;TYPE=HOME,VOICE:654321'
    ]);
  });

  it('skips empty number elements and unknown number types', function() {
    expect(convertContact('<telephony nid="4">' +
      '<number type="work" prio="0" id="0"></number>' +
      '<number type="fax_work" prio="0" id="1" />' +
      '<number type="intern" prio="0" id="2">**610</number>' +
      '<number type="mobile" prio="1" id="3">0170 1234567</number>' +
      '</telephony>')).toEqual([
      'TEL;TYPE=CELL:0170 1234567'
    ]);
  });

  it('converts all email addresses and maps classifiers', function() {
    expect(convertContact('<services nid="3">' +
      '<email classifier="private" id="0">home@example.com</email>' +
      '<email classifier="work" id="1">work@example.com</email>' +
      '<email classifier="other" id="2">other@example.com</email>' +
      '</services>')).toEqual([
      'EMAIL;CHARSET=UTF-8;type=HOME,INTERNET:home@example.com',
      'EMAIL;CHARSET=UTF-8;type=WORK,INTERNET:work@example.com',
      'EMAIL;CHARSET=UTF-8;type=OTHER,INTERNET:other@example.com'
    ]);
  });

  it('skips empty email elements', function() {
    expect(convertContact('<services nid="1">' +
      '<email classifier="private" id="0" />' +
      '</services>')).toEqual([]);
    expect(convertContact('<services nid="2">' +
      '<email classifier="private" id="0"></email>' +
      '<email>plain@example.com</email>' +
      '</services>')).toEqual([
      'EMAIL;CHARSET=UTF-8;type=HOME,INTERNET:plain@example.com'
    ]);
  });
});

describe("lib-convert: file names", function() {
  var libConvert = require('../src/lib-convert');

  function convert(names) {
    return libConvert.fritzXML2vcard('<?xml version="1.0" encoding="utf-8"?>' +
      '<phonebooks><phonebook name="Telefonbuch">' +
      names.map(function(name, i) {
        return '<contact><person><realName>' + name + '</realName></person>' +
          '<telephony><number type="home" id="0">' + (100 + i) + '</number>' +
          '</telephony></contact>';
      }).join('') + '</phonebook></phonebooks>');
  }

  it('keeps contacts whose names produce the same file name', function() {
    var result = convert(['Doe, John', 'Doe, John', 'Doe John', 'doe, john']);
    expect(Object.keys(result)).toEqual([
      'Doe__John.vcf', 'Doe__John_2.vcf', 'Doe_John.vcf', 'doe__john_3.vcf'
    ]);
    expect(result['Doe__John.vcf']).toContain('TEL;TYPE=HOME,VOICE:100');
    expect(result['Doe__John_2.vcf']).toContain('TEL;TYPE=HOME,VOICE:101');
    expect(result['doe__john_3.vcf']).toContain('TEL;TYPE=HOME,VOICE:103');
  });

  it('does not reuse a file name taken by another contact', function() {
    expect(Object.keys(convert(['Doe_John_2', 'Doe_John', 'Doe_John']))).toEqual([
      'Doe_John_2.vcf', 'Doe_John.vcf', 'Doe_John_3.vcf'
    ]);
  });
});

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
    '/fritz-phonebook.vcard.json', 'utf8');
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

  it('lib-convert', function() {
    expect(srcConvert.fritzXML2vcard).toEqual(jasmine.any(Function));
    expect(libConvert.fritzXML2vcard).toEqual(jasmine.any(Function));

    var vCardsFromSrc, vCardsFromLib;
    expect(vCardsFromSrc = srcConvert.fritzXML2vcard(fritzXML)).toEqual(
      jasmine.any(Object));
    expect(vCardsFromLib = libConvert.fritzXML2vcard(fritzXML)).toEqual(
      jasmine.any(Object));

    // Re-create fritzbox vcard
    // fs.writeFileSync(__dirname + '/fritz-phonebook.vcard.json',
    //   JSON.stringify(vCardsFromLib),'utf8');

    vCardsFromSrc = JSON.parse(JSON.stringify(vCardsFromSrc).replace(
      /REV:[^"\n\r]+/g, 'REV:'));
    vCardsFromLib = JSON.parse(JSON.stringify(vCardsFromLib).replace(
      /REV:[^"\n\r]+/g, 'REV:'));
    fritzVCard = JSON.parse(fritzVCard.replace(/REV:[^"\n\r]+/g, 'REV:'));

    expect(fritzVCard).toEqual(vCardsFromSrc);
    expect(fritzVCard).toEqual(vCardsFromLib);
  });
});

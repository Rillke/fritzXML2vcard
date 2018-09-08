# fritzXML2vcard [![Build Status](https://api.travis-ci.com/Rillke/fritzXML2vcard.svg?branch=master)](https://travis-ci.com/Rillke/fritzXML2vcard)

Convert FRITZ!Box address book XML format to vCards.

## Web interface/ online version

An [online web-version is available](https://blog.rillke.com/fritzXML2vcard/). You may also [download the entire website](https://github.com/Rillke/fritzXML2vcard/zipball/gh-pages).

[![Screenshot Web interface/ online version](https://raw.githubusercontent.com/Rillke/fritzXML2vcard/gh-pages/img/web-tool-screenshot.png)](https://blog.rillke.com/fritzXML2vcard/)

## CLI user installation

Requires [nodejs and npm](https://nodejs.org/en/download/).

Install the [fritz-xml-2vcard](https://www.npmjs.com/package/fritz-xml-2vcard) package from npm.

```bash
npm i -g fritz-xml-2vcard
fritz-xml-2vcard /path/to/contact.xml /path/to/output/dir
```

## Developer installation

```bash
git clone https://github.com/Rillke/fritzXML2vcard.git
cd fritzXML2vcard
npm install
npm run build
npm test
mkdir -p /path/to/output/dir
/path/to/node_or_nodejs ./convert.js /path/to/contact.xml /path/to/output/dir
```

## Node.js API usage

```javascript
var libConvert = require('fritz-xml-2vcard');
// area code and country code are optional arguments
var result = libConvert.fritzXML2vcard(xmlString, '030', '+49');
for (var vcfFile in result) {
	if (result.hasOwnProperty(vcfFile)) {
		fs.writeFileSync(outputDir + '/' + vcfFile, result[vcfFile]);
	}
}
```

## Web Browser API usage

Get [fritzXML2vcard-browser-api-min.js](https://raw.githubusercontent.com/Rillke/fritzXML2vcard/gh-pages/fritzXML2vcard-browser-api-min.js) or [fritzXML2vcard-browser-api.js](https://raw.githubusercontent.com/Rillke/fritzXML2vcard/gh-pages/fritzXML2vcard-browser-api.js). Put it side by side with the following html file:

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>Cool vcf converter.</title>
	</head>
	<body>
		<!-- page content -->
		<script src="fritzXML2vcard-browser-api-min.js"></script>
		<script>
		var fritzXML = '<?xml version="1.0" encoding="utf-8"?>' +
			'<phonebooks><phonebook name="Telefonbuch">' +
			'<contact><person><realName>Test GmbH</realName></person>' +
			'<telephony nid="2"><number type="work" prio="1" id="0">(01234) 567890</number>' +
			'<number type="fax_work" prio="0" id="1">56789-2</number></telephony>' +
			'</contact></phonebook></phonebooks>';
		var vCards = window.libConvert.fritzXML2vcard(fritzXML, '030', '+49');
		console.log(vCards);
		for (var vcfFile in vCards) {
			if (vCards.hasOwnProperty(vcfFile)) {
				alert(vcfFile + ': ' + vCards[vcfFile]);
			}
		}
		</script>
	</body>
</html>
```

## Weitere Tool

| Tool                                                                             | Programmiersprache / Plattform                                          | Web-Version                                  | Import                                                         | Export                                                                                                                             | Lizenz |
|----------------------------------------------------------------------------------|-------------------------------------------------------------------------|----------------------------------------------|----------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|--------|
| [Contact-Conversion-Wizard](https://github.com/Rillke/Contact-Conversion-Wizard) | C# bevorzugt Windows; MacOS und Linux ggf. möglich                      | -                                            | Outlook, Fritz!Box XML, vCard, Fritz!Adr, CSV, Google Contacts | Outlook, Fritz!Box XML, vCard, Fritz!Adr, Snom v7, Snom v8, Gigaset Talk&Surf CSV, Asstra, Grandstream, Auerswald, Google Contacts | GPLv3  |
| [fritzXML2vcard](https://github.com/Rillke/fritzXML2vcard)                       | JavaScript - Node.js Nahezu alle Betriebssysteme                        | [verfügbar](https://blog.rillke.com/fritzXML2vcard/) | Fritz!Box XML                                                  | vCard(s)                                                                                                                           | MIT    |
| [vcard2fritzXML](https://github.com/berkholz/vcard2fritzXML)                     | Java Nahezu alle Betriebssysteme                                        | -                                            | vCard                                                          | Fritz!Box XML                                                                                                                      | GPLv2  |

# fritzXML2vcard [![Build Status](https://api.travis-ci.com/Rillke/fritzXML2vcard.svg?branch=master)](https://travis-ci.com/Rillke/fritzXML2vcard)

Convert FRITZ!Box address book XML format to vCards.

Requires [nodejs and npm](https://nodejs.org/en/download/).

## CLI user installation

Install the [fritz-xml-2vcard](https://www.npmjs.com/package/fritz-xml-2vcard) package from npm.

```
npm i -g fritz-xml-2vcard
fritz-xml-2vcard /path/to/contact.xml /path/to/output/dir
```

## Developer installation
```
git clone https://github.com/Rillke/fritzXML2vcard.git
cd fritzXML2vcard
npm install
npm test
npm run build
mkdir -p /path/to/output/dir
/path/to/node_or_nodejs ./convert.js /path/to/contact.xml /path/to/output/dir
```

## API usage
```
var libConvert = require('fritz-xml-2vcard');
var result = libConvert.fritzXML2vcard(xmlString);
for (var vcfFile in result) {
	if (result.hasOwnProperty(vcfFile)) {
		fs.writeFileSync(outputDir + '/' + vcfFile, result[vcfFile]);
	}
}
```


# Conversion specification

This document describes how fritzXML2vcard maps a FRITZ!Box phone book
export (XML) to vCards. It applies to the CLI, the Node.js API and the web
version alike.

## Input

The input is a FRITZ!Box phone book export with a single `<phonebook>` inside
`<phonebooks>`. Every `<contact>` becomes one vCard (version 3.0, UTF-8).

Only the elements listed below are read. Everything else, for example
`<category>`, `<setup>`, `<features>`, `<mod_time>`, `<uniqueid>` and
attributes like `prio`, `vanity` or `quickdial`, is ignored.

## Output

The result maps a suggested file name to the vCard text of each contact.

The file name is the contact's `<realName>` with spaces, commas, colons,
slashes and backslashes replaced by `_`, plus `.vcf`. For example
`Doe, John` becomes `Doe__John.vcf`.

If several contacts produce the same file name, ignoring case, the later ones
get a numeric suffix: `Doe__John.vcf`, `Doe__John_2.vcf`, `Doe__John_3.vcf`.

Every vCard carries a `REV` property with the time of conversion.

## Name

| FRITZ!Box `<realName>`  | vCard `N`              | vCard `FN`         |
|-------------------------|------------------------|--------------------|
| `Doe, John`             | `Doe;John;;;`          | `John Doe`         |
| `Doe, John, Jr.`        | `Doe;John\, Jr.;;;`    | `John\, Jr. Doe`   |
| `Test GmbH`             | `Test GmbH;;;;`        | `Test GmbH`        |

The text before the first comma is the last name, the rest is the first name.
A name without a comma is used as last name only.

## Phone numbers

Every `<number>` inside `<telephony>` is mapped by its `type` attribute:

| FRITZ!Box `type` | vCard property          |
|------------------|-------------------------|
| `home`           | `TEL;TYPE=HOME,VOICE`   |
| `work`           | `TEL;TYPE=WORK,VOICE`   |
| `mobile`         | `TEL;TYPE=CELL`         |
| `fax_work`       | `TEL;TYPE=WORK,FAX`     |
| empty (`""`)     | `TEL;TYPE=OTHER`        |

- **Multiple numbers of the same type** are all kept, as separate `TEL`
  lines in the order they appear in the XML.
- **Empty `<number>` elements** (`<number type="work"></number>` or
  `<number type="work" />`) are skipped. A contact without any usable number
  simply has no `TEL` line.
- **Numbers of any other type** (for example `intern` or `memo`) and numbers
  without a `type` attribute are skipped.
- Leading and trailing whitespace is removed; the number is otherwise kept as
  written, including spaces, dashes and parentheses.

### Area code and country code

The Node.js API and the web version accept an optional area code (for example
`030`) and country code (for example `+49`). The CLI does not use them. They
are applied as follows, where the "digits" of a number are what is left after
removing spaces, dashes and parentheses:

- **Area code**: prefixed to numbers whose digits do not start with `0` or
  `+`, i.e. local numbers without an area code (`23456` → `030 23456`).
- **Country code**: prefixed to numbers that already contain an area code
  (their digits start with a single `0`), or that just got one prefixed. The
  leading `0` of the number (or area code) is dropped
  (`01234 567890` → `+49 1234 567890`, `(01234) 56789-2` → `+49 (1234) 56789-2`,
  `23456` → `+49 30 23456`). If only a country code is given, local numbers
  without an area code are left alone, because the result would be wrong.
- Numbers that start with `+` or `00`, or that contain other characters (such
  as `/`, `*`, letters or `@` in SIP addresses like
  `500@hd-telefonie.avm.de`) are never changed.

## Email addresses

Every non-empty `<email>` inside `<services>` is converted. The `classifier`
attribute selects the vCard type:

| FRITZ!Box `classifier`          | vCard property                |
|---------------------------------|-------------------------------|
| `work`                          | `EMAIL;type=WORK,INTERNET`    |
| `other`                         | `EMAIL;type=OTHER,INTERNET`   |
| `private`, missing or any other | `EMAIL;type=HOME,INTERNET`    |

Empty `<email>` elements are skipped.

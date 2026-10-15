# Changelog

## 4.0.0

### Breaking changes

- Node.js 22 or newer is required.
- All email addresses of a contact are converted, not only the first one.
  The `classifier` selects the vCard type: `work` becomes `TYPE=WORK`,
  `other` becomes `TYPE=OTHER`, everything else stays `TYPE=HOME`.
- Contacts whose names produce the same file name no longer overwrite each
  other. Later ones get a numeric suffix, e.g. `Doe__John_2.vcf`, so the
  result of `fritzXML2vcard()` can contain more entries than before
  ([#169](https://github.com/Rillke/fritzXML2vcard/issues/169)).

### Fixes

- An empty `<email/>` element no longer aborts the conversion.
- The web version shows its commit hash as version again instead of `null`.

### New

- [CONVERSION.md](CONVERSION.md) describes how names, phone numbers and
  email addresses are mapped
  ([#3](https://github.com/Rillke/fritzXML2vcard/issues/3)).
- Man page for the command line tool
  ([#2](https://github.com/Rillke/fritzXML2vcard/issues/2)).
- The web version is tested in a real browser.
- Builds, tests and deployments run on GitHub Actions instead of Travis CI;
  npm packages are published with provenance via npm trusted publishing.

### Dependencies

- Babel 8, jasmine 7, jQuery 4 and other updates for the build tooling.
  `vcards-js` stays at 2.10, because 2.11 changes the generated vCards.

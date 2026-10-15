/* jshint node: true, esversion: 8 */
// Browser tests for the web version in dist/. Run `npm run build` first.
const { test, expect } = require('@playwright/test');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const libConvert = require('../src/lib-convert');

const xmlPath = path.join(__dirname, '..', 'spec', 'fritz-phonebook.xml');
const xml = fs.readFileSync(xmlPath, 'utf8');

// The REV property holds the time of conversion
function withoutRev(vCard) {
	return vCard.replace(/^REV:.*$/gm, 'REV:');
}

// What the Node.js library makes of the sample phone book
function expectedVCards(areaCode, countryCode) {
	const vCards = libConvert.fritzXML2vcard(xml, areaCode, countryCode);
	for (const fileName of Object.keys(vCards)) {
		vCards[fileName] = withoutRev(vCards[fileName]);
	}
	return vCards;
}

async function convertFile(page, areaCode, countryCode) {
	await page.setInputFiles('#fritzxml-file', xmlPath);
	await expect(page.locator('#fritzxml-text')).toHaveValue(/<phonebooks>/);
	await page.fill('#area-code', areaCode || '');
	await page.fill('#country-code', countryCode || '');
	await page.click('#run');
	await expect(page.locator('#vcards li.vcard').first()).toBeVisible();
}

async function downloadText(page, click) {
	const [download] = await Promise.all([page.waitForEvent('download'), click()]);
	return {
		name: download.suggestedFilename(),
		content: fs.readFileSync(await download.path(), 'utf8')
	};
}

let errors;

test.beforeEach(async ({ page }) => {
	errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		// The site has no favicon of its own; the browser asks for one anyway
		if (message.type() === 'error' && !/\/favicon\.ico$/.test(message.location().url)) {
			errors.push(message.text());
		}
	});
	await page.goto('/');
	await expect(page.locator('#loader')).toBeHidden();
});

test.afterEach(() => {
	expect(errors).toEqual([]);
});

test('shows the commit hash as version', async ({ page }) => {
	const hash = childProcess.execSync('git rev-parse --short HEAD').toString().trim();
	await expect(page.locator('#version')).toHaveText(hash);
});

test('converts an uploaded phone book like the Node.js library', async ({ page }) => {
	const expected = expectedVCards('030', '+49');
	await convertFile(page, '030', '+49');

	await expect(page.locator('#vcards .vcf-filename')).toHaveText(Object.keys(expected));
	await expect(page.locator('#vcards .vcf-name').first()).toHaveText('Test GmbH');
	await expect(page.locator('#vcards .vcf-name').nth(2))
		.toHaveText('Very long name because it consists of Praxis and two names. Arzt');
});

test('shows a vCard in a dialog', async ({ page }) => {
	await convertFile(page, '030', '+49');

	await page.locator('#vcards li.vcard').first().locator('a[href="#view"]').click();
	const dialog = page.locator('.jquery-modal.blocker');
	await expect(dialog).toBeVisible();
	await expect(dialog).toContainText('FN;CHARSET=UTF-8:Test GmbH');
	await expect(dialog).toContainText('TEL;TYPE=WORK,VOICE:+49 1234 567890');

	await page.keyboard.press('Escape');
	await expect(dialog).toHaveCount(0);
});

test('downloads a single vCard', async ({ page }) => {
	const expected = expectedVCards('030', '+49');
	await convertFile(page, '030', '+49');

	const download = await downloadText(page,
		() => page.locator('#vcards li.vcard').first().locator('a[href="#get"]').click());
	expect(download.name).toBe('Test_GmbH.vcf');
	expect(withoutRev(download.content)).toBe(expected['Test_GmbH.vcf']);
});

test('downloads all vCards as zip', async ({ page }) => {
	const expected = expectedVCards();
	await convertFile(page);

	const [download] = await Promise.all([page.waitForEvent('download'), page.click('#get-all')]);
	expect(download.suggestedFilename()).toBe('fritz-phonebook.zip');
	const zip = await JSZip.loadAsync(fs.readFileSync(await download.path()));
	expect(Object.keys(zip.files)).toEqual(Object.keys(expected));
	for (const fileName of Object.keys(expected)) {
		expect(withoutRev(await zip.file(fileName).async('string'))).toBe(expected[fileName]);
	}
});

test('downloads all vCards as one Multi-vCard file', async ({ page }) => {
	const expected = expectedVCards('030', '+49');
	await convertFile(page, '030', '+49');

	const download = await downloadText(page, () => page.click('#get-multi'));
	expect(download.name).toBe('fritz-phonebook.vcf');
	expect(withoutRev(download.content)).toBe(Object.values(expected).join('\r\n'));
});

test('copies a vCard to the clipboard', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await convertFile(page, '030', '+49');

	const copyLink = page.locator('#vcards li.vcard').first().locator('a[href="#copy"]');
	await copyLink.click();
	await expect(copyLink.locator('.fas')).toHaveClass(/fa-clipboard-check/);
	// Copying through a text field turns the CRLF line breaks into LF
	const clipboard = await page.evaluate(() => navigator.clipboard.readText());
	expect(withoutRev(clipboard).replace(/\r\n/g, '\n'))
		.toBe(expectedVCards('030', '+49')['Test_GmbH.vcf'].replace(/\r\n/g, '\n'));
});

test('deletes single and all vCards', async ({ page }) => {
	await convertFile(page);
	const items = page.locator('#vcards li.vcard');
	await expect(items).toHaveCount(10);

	await items.first().locator('a[href="#delete"]').click();
	await expect(items).toHaveCount(9);
	await expect(page.locator('#vcards .vcf-filename').first()).toHaveText('Guter_Nachbar.vcf');

	await page.click('#delete-all');
	await expect(items).toHaveCount(0);
});

test('converts pasted XML and keeps contacts with the same name', async ({ page }) => {
	await page.fill('#fritzxml-text', '<?xml version="1.0" encoding="utf-8"?>' +
		'<phonebooks><phonebook name="Telefonbuch">' +
		'<contact><person><realName>Müller, Anna</realName></person>' +
		'<telephony><number type="home" id="0">111</number></telephony></contact>' +
		'<contact><person><realName>Müller, Anna</realName></person>' +
		'<telephony><number type="work" id="0">222</number></telephony></contact>' +
		'</phonebook></phonebooks>');
	await page.click('#run');

	await expect(page.locator('#vcards .vcf-filename'))
		.toHaveText(['Müller__Anna.vcf', 'Müller__Anna_2.vcf']);
	await expect(page.locator('#vcards .vcf-name')).toHaveText(['Anna Müller', 'Anna Müller']);
});

test('reports XML it cannot convert', async ({ page }) => {
	let message;
	// The alert blocks the page until it is dismissed
	page.once('dialog', (dialog) => {
		message = dialog.message();
		dialog.dismiss();
	});
	await page.fill('#fritzxml-text', '<phonebooks><phonebook>');
	await page.click('#run');
	await expect.poll(() => message).toContain('there was an error processing your XML');
	await expect(page.locator('#vcards li.vcard')).toHaveCount(0);
});

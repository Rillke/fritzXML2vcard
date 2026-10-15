/* jshint node: true, esversion: 6 */
// Browser tests for the web version. Run `npm run build` first.
var defineConfig = require('@playwright/test').defineConfig;

module.exports = defineConfig({
	testDir: './e2e',
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://127.0.0.1:4173/',
		acceptDownloads: true,
		trace: 'retain-on-failure',
		launchOptions: {
			// Use a preinstalled Chromium instead of Playwright's own download
			executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined
		}
	},
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium' } }
	],
	webServer: {
		command: 'node e2e/server.js',
		url: 'http://127.0.0.1:4173/',
		reuseExistingServer: !process.env.CI
	}
});

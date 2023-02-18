import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { chromium, devices } from '@playwright/test';

expect.extend({ toMatchImageSnapshot });

const computeStyles = async function (page, selector) {
	return await page.evaluate((selector) => {
		const result = {};
		const handle = document.querySelector(selector);
		const computedStyle = window.getComputedStyle(handle); //TODO: pseudo elements: https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
		for (let key in computedStyle) {
			const name = computedStyle.item(key);
			const value = computedStyle.getPropertyValue(name);
			result[name] = value;
		}
		return result;
	}, `[data-test-element="${selector}"]`);
};

const takeElementScreenshot = async function (page, selector) {
	const handle = await page.locator(
		'[data-test-screenshot-target="' + selector + '"]'
	);
	const screenshot = await handle.screenshot();
	return screenshot;
};

const testDevices = [
	{ name: 'iPhone 13' },
	{ name: 'iPad (gen 7)' },
	{ name: 'Desktop Chrome HiDPI' }
];

var run = function (options) {
	describe.each(testDevices)('$name', async (testDevice) => {
		let browser;
		let page;

		beforeAll(async () => {
			browser = await chromium.launch();
			const context = await browser.newContext({ ...devices[testDevice.name] });
			page = await context.newPage();
			await page.goto(options.url, { waitUntil: 'networkidle' });

			/*
			await page.coverage.startCSSCoverage();
			const cssCoverage = await page.coverage.stopCSSCoverage();
			pti.write(cssCoverage);
			*/
		});

		describe('computed style', async () => {
			options.elements.forEach((element) => {
				it('should match style snapshot of ' + element, async () => {
					const computedStyle = await computeStyles(page, element);
					expect(computedStyle).toMatchSnapshot();
				});
			});
		});

		describe('screenshot', async () => {
			options.elements.forEach((element) => {
				it('should match image snapshot of ' + element, async () => {
					const elementScreenshot = await takeElementScreenshot(page, element);
					expect(elementScreenshot).toMatchImageSnapshot({
						customSnapshotsDir: './tests/__image_snapshots__',
						customDiffDir: './tests/__image_snapshots__/__diff__',
						customSnapshotIdentifier: `${element} - ${testDevice.name} `
					});
				});
			});
		});

		afterAll(async () => {
			await browser.close();
		});
	});
};

module.exports = run; // eslint-disable-line

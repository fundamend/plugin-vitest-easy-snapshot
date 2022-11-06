import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import puppeteer from 'puppeteer'; // TODO: replace puppeteer with playwright
import pti from 'puppeteer-to-istanbul';

expect.extend({ toMatchImageSnapshot });

const computeStyles = async function (page, selector) {
	const computedStyles = await page.$$eval('[data-test-element="' + selector + '"]', elements => elements.map(element => {
		const result = {};
		const computedStyle = window.getComputedStyle(element); //TODO: pseudo elements: https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
		for (let key in computedStyle) {
			const name = computedStyle.item(key);
			const value = computedStyle.getPropertyValue(name);
			result[name] = value;
		}
		return result;
	}));
	return computedStyles;
};

const takeElementScreenshot = async function (page, selector) {
	const handle = await page.$('[data-test-screenshot-target="' + selector + '"]');
	const screenshot = await handle.screenshot();
	return screenshot;
};

const devices = [
	{
		name: 'small device',
		userAgent:
			'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 7 Build/MOB30X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3765.0 Safari/537.36',
		viewport: {
			width: 600,
			height: 960,
			deviceScaleFactor: 2,
			isMobile: true,
			hasTouch: true,
			isLandscape: false
		}
	},
	{
		name: 'medium device',
		userAgent:
			'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1',
		viewport: {
			width: 1024,
			height: 768,
			deviceScaleFactor: 2,
			isMobile: true,
			hasTouch: true,
			isLandscape: true
		}
	},
	{
		name: 'large device',
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0',
		viewport: {
			width: 1920,
			height: 1200,
			deviceScaleFactor: 1,
			isMobile: false,
			hasTouch: false,
			isLandscape: true
		}
	}
];

var run = function (options) {
	describe.each(devices)('$name', async (device) => {

		let browser;
		let page;

		beforeAll(async () => {
			browser = await puppeteer.launch();
			page = await browser.newPage();
			await page.goto(options.url, { waitUntil: 'networkidle0' });
			await page.emulate(device);
			/*
			** Changing devices changes the screen size, which can bring different sections into view, which can change the URL.
			** If so, we have to wait for the navigation, otherwise we get a 'execution context destroyed' error.
			*/
			try {
				await page.waitForNavigation({ timeout: 10000 });
			} catch (e){
				if (e instanceof puppeteer.errors.TimeoutError) {
					// If there is no navigation after the timeout, just continue.
				}
			}

			// Wait for a second for any layout shifts
			await page.waitForTimeout(1000);

			const pageHeight = await page.evaluate(
				() => document.body.scrollHeight
			);
			await page.setViewport(
				Object.assign({}, device.viewport, {
					height: parseInt(pageHeight)
				})
			);
			await page.coverage.startCSSCoverage();
			const cssCoverage = await page.coverage.stopCSSCoverage();
			pti.write(cssCoverage);
		});

		describe('computed style', async () => {
			options.elements.forEach((element) => {
				it('should match style snapshot of ' + element, async () => {
					const computedStyles = await computeStyles(page, element);
					computedStyles.forEach(computedStyle => {
						expect(computedStyle).toMatchSnapshot();
					});
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
						customSnapshotIdentifier: `${element} - ${device.name} `
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

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import puppeteer from 'puppeteer';
import pti from 'puppeteer-to-istanbul';

expect.extend({ toMatchImageSnapshot });

let browser;
let page;

const computeStyle = async function (selector) {
	const handle = await page.$('[data-test-id="' + selector + '"]');
	const result = await page.evaluate((handle) => {
		var result = {};
		var computedStyle = window.getComputedStyle(handle);
		for (var key in computedStyle) {
			var name = computedStyle.item(key);
			var value = computedStyle.getPropertyValue(name);
			result[name] = value;
		}
		return result;
	}, handle);
	await handle.dispose();
	return JSON.stringify(result, null, '\t');
};

const takeElementScreenshot = async function (selector) {
	const handle = await page.$('[data-test-id="' + selector + '"]');
	const parentHandle = (await handle.$x('..'))[0];
	const screenshot = await parentHandle.screenshot();
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
	devices.forEach((device) => {
		// eslint-disable-next-line jest/valid-title
		describe(device.name, () => {
			beforeAll(async () => {
				browser = await puppeteer.launch();
				page = await browser.newPage();
				await page.goto(options.url, { waitUntil: 'networkidle0' });
				await page.emulate(device);
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

			describe('computed style', () => {
				options.elements.forEach((element) => {
					it('should match style snapshot of ' + element, async () => {
						const computedStyle = await computeStyle(element);
						expect(computedStyle).toMatchSnapshot();
					});
				});
			});

			describe('screenshot', () => {
				options.elements.forEach((element) => {
					it('should match image snapshot of ' + element, async () => {
						const elementScreenshot = await takeElementScreenshot(element);
						expect(elementScreenshot).toMatchImageSnapshot();
					});
				});
			});

			afterAll(async () => {
				await browser.close();
			});
		});
	});
};

module.exports = run; // eslint-disable-line

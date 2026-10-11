// Optional Playwright end-to-end checks for dev, built output and live Pages.
// SITE_URL includes the deployment base, e.g. https://bennetze.github.io/reference.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const site = (process.env.SITE_URL || 'http://localhost:4321').replace(/\/$/, '');
const output = process.env.SCREENSHOT_DIR;
if (output) await mkdir(output, { recursive: true });
const results = [], unavailable = [];
const routes = ['', 'handwerk/', 'ueber-uns/', 'projekte/', 'impressum/', 'datenschutz/', '404.html'];
for (const name of (process.env.BROWSERS || 'chromium,firefox,webkit').split(',')) {
	let browser;
	try { browser = await engines[name].launch({ headless: true, timeout: 15000 }); }
	catch (error) { unavailable.push({ browser: name, reason: error.message }); console.log(`UNAVAILABLE ${name}: ${error.message}`); continue; }
	try {
		for (const [width, height] of [[1440, 900], [390, 844], [844, 390]]) {
			const context = await browser.newContext({ viewport: { width, height }, locale: 'en-GB', reducedMotion: 'reduce', hasTouch: width < 900 });
			try {
				const page = await context.newPage();
				page.setDefaultTimeout(10000);
				let errors = [], badResponses = [];
				page.on('pageerror', error => errors.push(error.message));
				page.on('response', response => { if (response.status() >= 400 && !/404(?:\.html|\/)/.test(new URL(response.url()).pathname)) badResponses.push(`${response.status()} ${response.url()}`); });
				await page.addInitScript(() => { window.cspFailures = []; document.addEventListener('securitypolicyviolation', event => window.cspFailures.push(event.violatedDirective)); });
				for (const route of routes) {
					const label = `${name} ${width}x${height} de /${route}`;
					try {
						errors = []; badResponses = [];
						const response = await page.goto(`${site}/${route}`, { waitUntil: 'domcontentloaded' });
						assert.ok(response.status() === 200 || (route === '404.html' && response.status() === 404), `HTTP ${response.status()}`);
						await page.evaluate(() => document.fonts.ready);
						assert.equal(await page.locator('html').getAttribute('lang'), 'de');
						assert.equal(await page.locator('main#main-content[tabindex="-1"]').count(), 1);
						assert.ok(await page.locator('main h1').first().innerText());
						assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'horizontal overflow');
						assert.match(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily), /Jost/);
						for (const property of ['og:title', 'og:description', 'og:image', 'og:image:alt', 'og:url']) assert.ok(await page.locator(`meta[property="${property}"]`).getAttribute('content'), property);
						if (site.includes('github.io') || site.includes('/reference')) {
							assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
							assert.equal(await page.locator('link[rel="canonical"],script[type="application/ld+json"]').count(), 0);
						}
						if (!route) {
							assert.equal(await page.locator('.demo-intro').isVisible(), true);
							assert.equal(await page.locator('.site-header').isVisible(), false);
							assert.match(await page.locator('#demo-title').innerText(), /Website-Demo/);
							if (output && name === 'chromium') await page.screenshot({ caret: 'initial', path: resolve(output, `${name}-${width}-${height}-de-disclosure.png`) });
							await page.locator('.demo-intro__enter').focus(); await page.keyboard.press('Enter');
							await page.waitForFunction(() => Math.abs(document.querySelector('#start').getBoundingClientRect().top) < 2);
							assert.equal(await page.locator('.site-header').isVisible(), true, 'header appears after entry');
							await page.reload({ waitUntil: 'domcontentloaded' });
							await page.waitForFunction(() => Math.abs(document.querySelector('#start').getBoundingClientRect().top) < 2);
							assert.equal(await page.locator('.site-header').isVisible(), true, 'entry survives reload');
						}
						assert.equal(await page.locator('[data-language],.language-switch').count(), 0);
						await page.locator('.menu-toggle').focus(); await page.keyboard.press('Enter');
						await page.waitForFunction(() => document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true');
						assert.equal(await page.locator('#site-menu').evaluate(el => el.inert), false);
						for (const link of await page.locator('.menu-nav__link').all()) {
							assert.equal(await link.isVisible(), true);
							const box = await link.boundingBox(); assert.ok(box.y >= 0 && box.y + box.height <= height + 1, 'menu link fits short screen');
						}
						for (let i = 0; i < 10; i++) { await page.keyboard.press(i === 0 ? 'Shift+Tab' : 'Tab'); assert.equal(await page.evaluate(() => !!document.activeElement.closest('#site-menu')), true, 'menu contains focus'); }
						await page.keyboard.press('Escape');
						assert.equal(await page.evaluate(() => document.activeElement.matches('.menu-toggle')), true, 'focus restored');
						assert.equal(await page.locator('#site-menu').evaluate(el => el.inert && el.getAttribute('aria-hidden') === 'true'), true);
						await page.locator('#site-footer').scrollIntoViewIfNeeded();
						for (const link of await page.locator('.footer-primary a,.footer-legal a').all()) {
							assert.equal(await link.isVisible(), true);
							assert.ok((await link.getAttribute('href')).startsWith(`${new URL(site).pathname.replace(/\/$/, '')}/`), 'footer preserves deployment base');
						}
						for (const target of await page.locator('[data-section-target]').evaluateAll(els => els.map(el => el.dataset.sectionTarget))) {
							await page.goto(`${site}/${route}${target}`, { waitUntil: 'domcontentloaded' });
							await page.waitForTimeout(100);
							assert.equal(await page.locator(target).count(), 1, `anchor ${target}`);
						}
						if (route === '404.html') { await page.locator('.not-found__link').click(); await page.waitForURL(`${site}/`); assert.equal(await page.locator('.demo-intro').isVisible(), true, '404 home link'); }
						if (route === 'projekte/') assert.equal(await page.locator('.projects-triptych a,.projects-triptych [tabindex]').count(), 0);
						if (['impressum/', 'datenschutz/'].includes(route)) assert.equal(await page.locator('main > *').count(), 1);
						assert.deepEqual(errors, [], 'JS errors'); assert.deepEqual(badResponses, [], 'failed assets'); assert.deepEqual(await page.evaluate(() => window.cspFailures), [], 'CSP');
						results.push({ label, pass: true }); console.log(`PASS ${label}`);
					} catch (error) { results.push({ label, pass: false, error: error.message, errors, badResponses }); console.log(`FAIL ${label}: ${error.message}`); }
				}
			} finally { await context.close(); }
		}
		// German pages remain usable without client scripts, including disclosure entry.
		const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
		try {
			const page = await context.newPage();
			for (const route of routes) {
				const label = `${name} no-JS de /${route}`;
				try {
					await page.goto(`${site}/${route}`, { waitUntil: 'domcontentloaded' });
					assert.equal(await page.locator('html').getAttribute('lang'), 'de');
					assert.ok(await page.locator('main h1').first().innerText());
					if (!route) { await page.locator('.demo-intro__enter').click(); assert.equal(await page.locator('.site-header').isVisible(), true); }
					for (const link of await page.locator('.footer-primary a,.footer-legal a').all()) assert.equal(await link.isVisible(), true);
					results.push({ label, pass: true }); console.log(`PASS ${label}`);
				} catch (error) { results.push({ label, pass: false, error: error.message }); console.log(`FAIL ${label}: ${error.message}`); }
			}
		} finally { await context.close(); }
	} finally { await browser.close(); }
}
const report = { site, checkedAt: new Date().toISOString(), results, unavailable };
if (process.env.REPORT_FILE) await writeFile(process.env.REPORT_FILE, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ site, passed: results.filter(result => result.pass).length, failed: results.filter(result => !result.pass).length, unavailable: unavailable.map(item => item.browser) }));
if (results.some(result => !result.pass) || !results.length) process.exitCode = 1;

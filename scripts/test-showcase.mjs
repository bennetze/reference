// Verify the retained showcase against built/preview output with optional Playwright.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const site = (process.env.SITE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const output = process.env.SCREENSHOT_DIR;
if (output) await mkdir(output, { recursive: true });
for (const name of (process.env.BROWSERS || 'chromium,firefox,webkit').split(',')) {
	const browser = await engines[name].launch({ headless: true, timeout: 15000 });
	try {
		for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [800, 600], [844, 390]]) {
			const context = await browser.newContext({ viewport: { width, height }, locale: 'de-DE', reducedMotion: 'reduce', hasTouch: width < 900 });
			try {
				const page = await context.newPage();
				const errors = [], violations = [];
				page.on('pageerror', error => errors.push(error.message));
				await page.exposeFunction('recordCspViolation', directive => violations.push(directive));
				await page.addInitScript(() => document.addEventListener('securitypolicyviolation', event => window.recordCspViolation(event.violatedDirective)));
				for (const route of ['handwerk/', 'ueber-uns/', 'projekte/', 'impressum/', 'datenschutz/', '404.html']) {
					const label = `${name} ${width}px de ${route}`;
					await page.goto(`${site}/${route}`);
					await page.evaluate(() => document.fonts.ready);
					assert.equal(await page.locator('html').getAttribute('lang'), 'de', label);
					const layout = await page.evaluate(() => {
						const header = document.querySelector('.site-header').getBoundingClientRect();
						const brand = document.querySelector('.brand').getBoundingClientRect();
						const label = document.querySelector('.brand span').getBoundingClientRect();
						return {
							height: header.height,
							overflow: document.documentElement.scrollWidth > innerWidth + 1,
							brandFits: brand.top >= header.top && brand.bottom <= header.bottom && label.left >= brand.left && label.right <= brand.right + 1,
							font: getComputedStyle(document.body).fontFamily,
							titleClear: [...document.querySelectorAll('main h1:not(.visually-hidden),main h2')].every(el => el.getBoundingClientRect().top >= header.bottom - 1),
							texture: !!document.querySelector('.background-texture'),
						};
					});
					assert.equal(layout.height, width < 761 ? 88 : 112, label);
					assert.equal(layout.overflow, false, label);
					assert.equal(layout.brandFits, true, label);
					assert.match(layout.font, /Jost/, label);
					assert.equal(layout.titleClear, true, label);
					assert.equal(layout.texture, false, label);
					for (const link of await page.locator('.footer-primary a').all()) {
						assert.equal(await link.isVisible(), true, `${label}: footer navigation remains available`);
					}
					assert.equal(await page.locator('.development-notice').isVisible(), true, `${label}: demonstration label`);
					const wrappedLabels = await page.locator('.project-panel__title-line, .contact-label, .legal-page h1').evaluateAll(elements => elements.filter(element => {
						const range = document.createRange();
						range.selectNodeContents(element);
						return range.getClientRects().length > 1;
					}).map(element => element.textContent));
					assert.deepEqual(wrappedLabels, [], `${label}: labels should fit without mid-word breaks`);
					if (width < 761) assert.equal(await page.locator('.cursor').evaluate(el => getComputedStyle(el).display), 'none', label);
					if (route === 'projekte/') {
						assert.equal(await page.locator('.projects-triptych a, .projects-triptych [tabindex]').count(), 0);
						assert.equal(await page.locator('.project-panel img').count(), 3);
					}
					if (['impressum/', 'datenschutz/'].includes(route)) {
						assert.equal(await page.locator('main > *').count(), 1);
						assert.equal(await page.locator('main > h1').count(), 1);
						assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
					}
					await page.locator('.menu-toggle').focus();
					await page.keyboard.press('Enter');
					await page.waitForFunction(() => document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true');
					for (let tab = 0; tab < 8; tab++) {
						await page.keyboard.press('Tab');
						assert.equal(await page.evaluate(() => !!document.activeElement.closest('#site-menu')), true, `${label}: focus contained`);
					}
					await page.keyboard.press('Escape');
					assert.equal(await page.evaluate(() => document.activeElement.matches('.menu-toggle')), true, `${label}: focus restored`);
					assert.equal(await page.locator('#site-menu').evaluate(el => el.inert), true);
					await page.evaluate(() => document.activeElement.blur());
					// WebKit screenshot helpers inject styles rejected by the real CSP.
					if (output && name === 'chromium') {
						await page.evaluate(() => Promise.all([...document.images].filter(image => image.loading !== 'lazy').map(image => image.decode().catch(() => {}))));
						await page.screenshot({ caret: 'initial', path: resolve(output, `${name}-${width}-${height}-de-${route.replace(/\W/g, '')}.png`) });
					}
					console.log(`Passed ${label}`);
				}
				assert.deepEqual(errors, [], `${name}: browser errors`);
				assert.deepEqual(violations, [], `${name}: CSP violations`);
			} finally { await context.close(); }
		}
	} finally { await browser.close(); }
}

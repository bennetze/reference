import test from 'node:test';
import assert from 'node:assert/strict';
import { fragmentId } from '../src/config/fragments.js';
import { pageModified } from '../src/config/modificationDates.js';
import { sitemapEntries, renderSitemap, checkCrawlerFiles, productionOrigin } from '../scripts/lib/crawlers.mjs';

test('fragment lookup handles encoded, malformed and selector-like IDs safely', () => {
	assert.equal(fragmentId('#über-uns'), 'über-uns');
	assert.equal(fragmentId('#%C3%BCber-uns'), 'über-uns');
	assert.equal(fragmentId('#a[b]'), 'a[b]');
	assert.equal(fragmentId('#%'), null);
	assert.equal(fragmentId('#'), null);
});

const entries = sitemapEntries();
const files = {
	sitemap: renderSitemap(entries),
	llms: `# Site\n\n> Summary\n\n## Pages\n\n[Home](${productionOrigin}/start/)\n`,
	robots: `User-agent: *\nAllow: /\nSitemap: ${productionOrigin}/sitemap.xml\n`,
};

test('retained showcase pages keep canonical routes with stable reviewed dates', () => {
	assert.equal(entries.length, 4);
	assert.deepEqual(entries.map(([path]) => path), ['/start/', '/ueber-uns/', '/handwerk/', '/projekte/']);
	assert.ok(entries.every(([path, date]) => date === pageModified(path)));
	assert.equal(pageModified('/handwerk/', ['9999-12-31']), '9999-12-31');
	assert.equal(pageModified('/handwerk/', ['2000-01-01']), pageModified('/handwerk/'));
	assert.equal(renderSitemap(sitemapEntries()), files.sitemap);
});

test('crawler validation preserves approved manual wording and rejects drift', () => {
	checkCrawlerFiles(files, entries);
	assert.throws(() => checkCrawlerFiles({ ...files, sitemap: files.sitemap.replace(/<lastmod>[^<]+<\/lastmod>/, '<lastmod>2000-01-01</lastmod>') }, entries), /npm run crawlers:sync/);
	for (const path of ['/', '/404.html', '/impressum/', '/absent/', '/projekte/aktuelle-projekte/']) {
		assert.throws(() => checkCrawlerFiles({ ...files, llms: files.llms + `[Bad](${productionOrigin}${path})` }, entries), /non-canonical/);
	}
	assert.throws(() => checkCrawlerFiles({ ...files, robots: files.robots.replace(productionOrigin, 'https://example.com') }, entries), /production sitemap/);
});

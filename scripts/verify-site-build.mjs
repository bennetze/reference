import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';
import sharp from 'sharp';
import { verifyDeploymentArtifacts } from './lib/deployment-artifacts.mjs';

const pages = process.argv[2] === 'github-pages';
const base = pages ? '/reference/' : '/';
const origin = pages ? 'https://bennetze.github.io' : 'https://www.oldtimermanufaktur.de';
const root = join(process.cwd(), 'dist');
await verifyDeploymentArtifacts(root, { removeOsMetadata: true });
const files = [];
async function collect(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) await collect(path);
		else if (entry.name.endsWith('.html')) files.push(path);
	}
}
await collect(root);
const expected = ['404.html', 'index.html', 'handwerk/index.html', 'ueber-uns/index.html', 'projekte/index.html', 'impressum/index.html', 'datenschutz/index.html'];
assert.deepEqual(files.map(file => file.slice(root.length + 1)).sort(), expected.sort(), 'Only retained showcase routes may be published.');
const imageCache = new Map();
const sitemap = load(await readFile(join(root, 'sitemap.xml'), 'utf8'), { xmlMode: true });
const dates = new Map(sitemap('url').toArray().map((node) => [sitemap(node).find('loc').text(), sitemap(node).find('lastmod').text()]));
for (const file of files) {
	const $ = load(await readFile(file, 'utf8'));
	assert.equal($('html').attr('lang'), 'de', `${file}: German document`);
	assert.equal($('meta[property="og:locale"]').attr('content'), 'de_DE');
	assert.equal($('[data-language],.language-switch,link[hreflang]').length, 0, `${file}: no language controls or alternates`);
	assert.equal($('a[href*="?lang="],a[href*="&lang="]').length, 0, `${file}: no language query parameters`);
	const ids = new Set();
	$('[id]').each((_, element) => {
		const id = $(element).attr('id');
		assert.ok(!ids.has(id), `${file}: duplicate ID ${id}`);
		ids.add(id);
	});
	assert.equal($('#main-content[tabindex="-1"]').length, 1, `${file}: accessible main`);
	$('[aria-labelledby], [aria-controls]').each((_, element) => {
		for (const attribute of ['aria-labelledby', 'aria-controls']) {
			for (const id of ($(element).attr(attribute) ?? '').split(/\s+/).filter(Boolean)) assert.ok(ids.has(id), `${file}: missing ${attribute} target ${id}`);
		}
	});
	if ($('.legal-page').length) {
		assert.equal($('.legal-page').children().length, 1, `${file}: legal pages contain only their heading`);
		assert.equal($('.legal-page > h1').length, 1);
	}
	if ($('.projects-triptych').length) {
		assert.equal($('.projects-triptych > section').length, 3);
		assert.equal($('.projects-triptych a,.projects-triptych [tabindex]').length, 0, `${file}: project panels are noninteractive`);
	}
	const policy = $('meta[http-equiv="content-security-policy"]').attr('content');
	assert.ok(policy, `${file}: missing CSP`);
	const head = $('head').children().toArray();
	assert.equal(head[1], $('meta[http-equiv="content-security-policy"]')[0], `${file}: CSP must immediately follow charset`);
	assert.ok($(head[0]).is('meta[charset]'), `${file}: charset must precede CSP`);
	const directives = new Map(policy.split(';').map((part) => { const [name, ...values] = part.trim().split(/\s+/); return [name, values]; }));
	assert.deepEqual(directives.get('script-src-attr'), ["'none'"]);
	const scripts = directives.get('script-src-elem') ?? directives.get('script-src');
	assert.ok(scripts && !scripts.includes("'unsafe-inline'"), `${file}: inline script permission`);
	$('script:not([src])').each((_, script) => {
		const digest = createHash('sha256').update($(script).html() ?? '').digest('base64');
		assert.ok(scripts.includes(`'sha256-${digest}'`), `${file}: missing inline script hash`);
	});
	for (const property of ['title', 'type', 'image', 'url', 'description', 'locale', 'site_name', 'image:alt', 'image:width', 'image:height', 'image:type', 'image:secure_url']) {
		assert.ok($(`meta[property="og:${property}"]`).attr('content'), `${file}: missing og:${property}`);
	}
	for (const element of $('[href], [src]').toArray()) {
		const value = $(element).attr('href') ?? $(element).attr('src');
		if (!value || !value.startsWith('/')) continue;
		assert.ok(value.startsWith(base), `${file}: incorrect base ${value}`);
		let path = new URL(value, origin).pathname.slice(base.length);
		if (!path || path.endsWith('/')) path += 'index.html';
		await access(join(root, decodeURIComponent(path)));
	}
	for (const element of $('.image-layer img,.project-panel img').toArray()) {
		const image = $(element);
		const filename = new URL(image.attr('src'), origin).pathname.slice(base.length);
		const path = join(root, filename);
		if (!imageCache.has(path)) imageCache.set(path, await sharp(path).metadata());
		const metadata = imageCache.get(path);
		assert.equal(Number(image.attr('width')), metadata.width, `${file}: intrinsic image width`);
		assert.equal(Number(image.attr('height')), metadata.height, `${file}: intrinsic image height`);
		for (const candidate of (image.attr('srcset') || '').split(',').filter(Boolean)) {
			const [url, descriptor] = candidate.trim().split(/\s+/);
			const variantPath = join(root, new URL(url, origin).pathname.slice(base.length));
			if (!imageCache.has(variantPath)) imageCache.set(variantPath, await sharp(variantPath).metadata());
			assert.equal(descriptor, `${imageCache.get(variantPath).width}w`, `${file}: responsive width descriptor`);
		}
	}
	const ogUrl = $('meta[property="og:url"]').attr('content');
	assert.ok(ogUrl.startsWith(origin + base));
	const indexable = !$('meta[name="robots"]').attr('content')?.includes('noindex');
	if (pages) assert.equal(indexable, false);
	if (indexable) {
		assert.equal($('link[rel="canonical"]').attr('href'), ogUrl);
		const json = JSON.parse($('script[type="application/ld+json"]').text());
		for (const node of json['@graph'].filter(node => node.inLanguage)) assert.equal(node.inLanguage, 'de-DE');
		assert.ok(!JSON.stringify(json).includes('__authored'));
		const page = json['@graph'].find((node) => node['@id'] === `${ogUrl}#webpage`);
		assert.equal(page.dateModified, dates.get(ogUrl), `${file}: sitemap/JSON-LD date mismatch`);
		assert.equal($('meta[name="date"]').attr('content'), page.dateModified);
	} else {
		assert.equal($('link[rel="canonical"],script[type="application/ld+json"]').length, 0);
	}
	const imageUrl = new URL($('meta[property="og:image"]').attr('content'));
	assert.equal(imageUrl.origin, origin);
	const imagePath = join(root, imageUrl.pathname.slice(base.length));
	if (!imageCache.has(imagePath)) imageCache.set(imagePath, await sharp(imagePath).metadata());
	const metadata = imageCache.get(imagePath);
	assert.equal(Number($('meta[property="og:image:width"]').attr('content')), metadata.width, `${file}: image width`);
	assert.equal(Number($('meta[property="og:image:height"]').attr('content')), metadata.height, `${file}: image height`);
	for (const node of $('[data-motion-src], [data-motion-mobile-src], [data-motion-avif], [data-motion-webp]').toArray()) {
		for (const name of ['data-motion-src', 'data-motion-mobile-src', 'data-motion-avif', 'data-motion-webp']) {
			const value = $(node).attr(name);
			if (!value) continue;
			assert.ok(value.startsWith(base), `${file}: deferred media base`);
			await access(join(root, new URL(value, origin).pathname.slice(base.length)));
		}
	}
	assert.equal($('[data-site-motion][role="switch"]').length, 1, 'One shared motion switch per page.');
	$('[data-motion-panel]').each((_, panel) => {
		assert.equal($(panel).find('[data-motion-toggle]').length, 0);
		assert.equal($(panel).find('video source[src]').length, 0, 'Media sources wait for eligible playback.');
		assert.equal($(panel).find('video').attr('preload'), 'none');
		assert.equal($(panel).find('video[poster]').length, 0, 'The responsive still supplies the poster after selection.');
		assert.equal($(panel).find('video[autoplay]').length, 0, 'Autoplay must wait for the motion preference check.');
		assert.equal($(panel).find('source[data-motion-generated-source]').length, 0);
	});
}
assert.match(await readFile(join(root, '.htaccess'), 'utf8'), /ErrorDocument 404 \/404\.html/);
console.log(`Verified ${files.length} pages: CSP, IDs, links, image dimensions, metadata dates and motion controls.`);

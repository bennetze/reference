import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sitemapEntries, renderSitemap, checkCrawlerFiles } from './lib/crawlers.mjs';

const check = process.argv.includes('--check');
const entries = sitemapEntries();
const publicPath = filename => join(process.cwd(), 'public', filename);
if (!check) await writeFile(publicPath('sitemap.xml'), renderSitemap(entries));
checkCrawlerFiles({
	sitemap: await readFile(publicPath('sitemap.xml'), 'utf8'),
	llms: await readFile(publicPath('llms.txt'), 'utf8'),
	robots: await readFile(publicPath('robots.txt'), 'utf8'),
}, entries);
console.log(`${check ? 'Validated' : 'Synchronized'} ${entries.length} sitemap URLs; manual llms.txt and robots.txt validated without rewriting.`);

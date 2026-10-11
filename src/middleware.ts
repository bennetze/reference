import { defineMiddleware } from 'astro:middleware';
import { load } from 'cheerio';
import { finalizeCsp } from './utils/csp.js';

// Keep the CSP before inline scripts, including early head scripts.
export const onRequest = defineMiddleware(async (_context, next) => {
	const response = await next();
	if (!response.headers.get('content-type')?.includes('text/html')) return response;
	const $ = load(await response.text());
	finalizeCsp($);
	return new Response($.html(), { status: response.status, statusText: response.statusText, headers: response.headers });
});

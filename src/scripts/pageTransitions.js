import { getSiteMotion } from './siteMotion.js';

// Older engines use a short dissolve around ordinary document navigation.
// Never intercept fragments, downloads, external links or modified clicks.
const motion = getSiteMotion();
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let pending;
window.addEventListener('pageshow', () => {
	window.clearTimeout(pending);
	pending = undefined;
	delete document.body.dataset.pageLeaving;
});
document.addEventListener('click', event => {
	if (document.documentElement.dataset.pageTransitions !== 'fade' || !motion.enabled || reduced.matches) return;
	if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
	if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
	const destination = new URL(link.href, window.location.href);
	if (destination.origin !== window.location.origin || destination.protocol !== window.location.protocol) return;
	if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
	event.preventDefault();
	window.clearTimeout(pending);
	document.body.dataset.pageLeaving = 'true';
	pending = window.setTimeout(() => window.location.assign(destination.href), 160);
});

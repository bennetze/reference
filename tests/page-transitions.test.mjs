import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = (await readFile(new URL('../src/scripts/pageTransitions.js', import.meta.url), 'utf8')).replace(/^import .*;\n/, '');
function setup({ enabled = true, reduced = false, native = false } = {}) {
	const handlers = {}, timers = new Map(), navigations = [];
	const document = { documentElement: { dataset: { pageTransitions: native ? 'native' : 'fade' } }, body: { dataset: {} }, addEventListener: (name, listener) => handlers[name] = listener };
	const window = { matchMedia: () => ({ matches: reduced }), addEventListener: (name, listener) => handlers[name] = listener,
		location: { href: 'https://example.com/oldtimer/?lang=en', origin: 'https://example.com', protocol: 'https:', pathname: '/oldtimer/', search: '?lang=en', assign: url => navigations.push(url) },
		clearTimeout: id => timers.delete(id), setTimeout: callback => { timers.set(1, callback); return 1; } };
	class Element { constructor(link) { this.link = link; } closest() { return this.link; } }
	vm.runInNewContext(source, { getSiteMotion: () => ({ enabled }), window, document, Element, URL });
	return { document, navigations,
		click(href, extra = {}, linkExtra = {}) { const event = { button: 0, target: new Element({ href, target: '', hasAttribute: () => false, ...linkExtra }), preventDefault() { this.defaultPrevented = true; }, ...extra }; handlers.click(event); return event; },
		flush() { [...timers.values()].forEach(callback => callback()); }, restore() { handlers.pageshow(); } };
}
test('fallback dissolves an internal document navigation while preserving its base, language and fragment', () => {
	const state = setup(); const target = 'https://example.com/oldtimer/en/handwerk/?lang=en#motorbau';
	assert.equal(state.click(target).defaultPrevented, true);
	assert.equal(state.navigations.length, 0); state.flush();
	assert.deepEqual(state.navigations, [target]);
	state.restore(); assert.equal(state.document.body.dataset.pageLeaving, undefined);
});
test('native transitions, still mode and reduced motion keep immediate browser navigation', () => {
	for (const options of [{ enabled: false }, { reduced: true }, { native: true }]) {
		const state = setup(options);
		assert.equal(state.click('https://example.com/handwerk/').defaultPrevented, undefined);
	}
});
test('fallback preserves modified clicks, anchors, downloads, external destinations and handled events', () => {
	const state = setup();
	for (const [href, event, link] of [
		['https://example.com/oldtimer/?lang=en#handwerk', {}, {}],
		['https://elsewhere.com/', {}, {}], ['mailto:test@example.com', {}, {}],
		['https://example.com/handwerk/', { ctrlKey: true }, {}],
		['https://example.com/handwerk/', { button: 1 }, {}],
		['https://example.com/handwerk/', { defaultPrevented: true }, {}],
		['https://example.com/file.pdf', {}, { hasAttribute: () => true }],
		['https://example.com/handwerk/', {}, { target: '_blank' }],
	]) {
		const result = state.click(href, event, link);
		assert.equal(result.defaultPrevented, event.defaultPrevented);
	}
	state.flush(); assert.deepEqual(state.navigations, []);
});

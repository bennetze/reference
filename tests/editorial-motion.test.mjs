import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const component = readFileSync(new URL('../src/layouts/EditorialPageLayout.astro', import.meta.url), 'utf8');
const script = component.split('<script>')[1].split('</script>')[0].replace(/^\s*import .*;/gm, '');

test('editorial scrolling respects the shared motion choice and page visibility without browser errors', () => {
	class Element {
		style = { setProperty() {}, getPropertyValue() { return '0px'; } };
		querySelector() { return null; }
		querySelectorAll() { return []; }
		getBoundingClientRect() { return { top: 200, height: 200 }; }
	}
	const group = new Element();
	const handlers = {}, frames = new Map();
	let nextFrame = 1, observer, subscriber;
	const motion = { enabled: false, subscribe(callback) { subscriber = callback; } };
	const document = {
		hidden: false, readyState: 'complete',
		querySelector: selector => selector === '.editorial-page' ? new Element() : null,
		querySelectorAll: selector => selector === '[data-parallax-group]' ? [group] : [],
	};
	class IntersectionObserver {
		constructor(callback) { observer = callback; }
		observe() {}
	}
	const window = {
		IntersectionObserver, location: { hash: '' }, innerHeight: 900, innerWidth: 1440,
		addEventListener(name, callback) { handlers[name] = callback; },
		requestAnimationFrame(callback) { const id = nextFrame++; frames.set(id, callback); return id; },
	};
	runInNewContext(script, { document, window, HTMLElement: Element, IntersectionObserver, getSiteMotion: () => motion });
	const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); };
	observer([{ target: group, isIntersecting: true }]); flush();
	assert.doesNotThrow(() => handlers.scroll());
	assert.equal(frames.size, 0, 'still mode does not schedule scrolling effects');
	motion.enabled = true;
	handlers.scroll(); assert.equal(frames.size, 1, 'explicit playback enables parallax'); flush();
	document.hidden = true;
	handlers.scroll(); assert.equal(frames.size, 0, 'background page does not schedule effects');
	document.hidden = false;
	motion.enabled = false; subscriber(); flush();
	handlers.scroll(); assert.equal(frames.size, 0, 'a live pause stops scrolling effects');
});

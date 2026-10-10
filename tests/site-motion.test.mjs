import test from 'node:test';
import assert from 'node:assert/strict';
import { createMotionPreference } from '../src/scripts/siteMotion.js';

function setup({ reduced = false, storage = new Map(), blocked = false } = {}) {
	const mediaListeners = [], pageListeners = [];
	const query = { matches: reduced, addEventListener: (_, listener) => mediaListeners.push(listener) };
	const doc = { documentElement: { dataset: {} } };
	const win = {
		matchMedia: () => query,
		addEventListener: (_, listener) => pageListeners.push(listener),
		sessionStorage: {
			getItem(key) { if (blocked) throw new Error('disabled'); return storage.get(key); },
			setItem(key, value) { if (blocked) throw new Error('disabled'); storage.set(key, value); },
		},
	};
	return { motion: createMotionPreference(win, doc), doc, storage,
		reduce(value) { query.matches = value; mediaListeners.forEach(listener => listener()); },
		restore() { pageListeners.forEach(listener => listener()); },
	};
}

test('one explicit motion choice reaches every surface and survives page navigation and history restoration', () => {
	const first = setup(); const video = [], parallax = [];
	first.motion.subscribe(state => video.push(state));
	first.motion.subscribe(state => parallax.push(state));
	first.motion.set(false);
	assert.deepEqual(video, [{ enabled: false, userGesture: true }]);
	assert.deepEqual(parallax, video);
	const second = setup({ storage: first.storage });
	assert.equal(second.motion.enabled, false);
	second.motion.set(true); first.restore();
	assert.equal(first.motion.enabled, true);
	assert.equal(first.doc.documentElement.dataset.motion, 'on');
});

test('reduced motion defaults to still, permits explicit playback, and a live OS reduction cancels it', () => {
	const state = setup({ reduced: true });
	assert.equal(state.motion.enabled, false);
	state.motion.set(true); assert.equal(state.motion.enabled, true);
	state.reduce(true); assert.equal(state.motion.enabled, false);
	assert.equal(setup({ storage: state.storage }).motion.enabled, false);
});

test('storage-disabled browsers retain functional motion controls', () => {
	const state = setup({ blocked: true });
	state.motion.set(false); state.restore();
	assert.equal(state.motion.enabled, false);
	state.motion.set(true); assert.equal(state.doc.documentElement.dataset.motion, 'on');
});

import { watchMedia } from './accessibility.js';

// One preference for every motion surface. Session storage carries an explicit
// choice across full-page navigation without requiring persistent storage.
export function createMotionPreference(win, doc) {
	const query = win.matchMedia('(prefers-reduced-motion: reduce)');
	const key = 'oldtimer.motion';
	let saved;
	try { saved = win.sessionStorage.getItem(key); } catch { /* Storage is optional. */ }
	let enabled = saved === 'on' || (saved !== 'off' && !query.matches);
	const listeners = new Set();
	const publish = (userGesture = false) => {
		doc.documentElement.dataset.motion = enabled ? 'on' : 'off';
		for (const listener of listeners) listener({ enabled, userGesture });
	};
	const save = () => {
		try { win.sessionStorage.setItem(key, enabled ? 'on' : 'off'); } catch { /* Keep the current page usable. */ }
	};
	watchMedia(query, () => {
		// A new OS preference takes effect immediately, including pending playback.
		enabled = !query.matches && saved !== 'off';
		if (query.matches) { saved = 'off'; save(); }
		publish();
	});
	win.addEventListener('pageshow', () => {
		try { saved = win.sessionStorage.getItem(key); } catch { /* Storage is optional. */ }
		enabled = saved === 'on' || (saved !== 'off' && !query.matches);
		publish();
	});
	publish();
	return {
		get enabled() { return enabled; },
		set(value) { enabled = Boolean(value); saved = enabled ? 'on' : 'off'; save(); publish(true); },
		subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
	};
}

let preference;
export function getSiteMotion() {
	return preference ??= createMotionPreference(window, document);
}

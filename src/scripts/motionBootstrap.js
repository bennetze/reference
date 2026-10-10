(() => {
	const root = document.documentElement;
	root.dataset.pageTransitions = 'onpageswap' in window && 'onpagereveal' in window ? 'native' : 'fade';
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
	const update = () => {
		let saved;
		try { saved = window.sessionStorage.getItem('oldtimer.motion'); } catch { /* Storage is optional. */ }
		root.dataset.motion = saved === 'on' || (saved !== 'off' && !reduced.matches) ? 'on' : 'off';
	};
	update();
	for (const name of ['pageswap', 'pagereveal']) {
		window.addEventListener(name, event => {
			update();
			if (root.dataset.motion === 'off' || reduced.matches) event.viewTransition?.skipTransition();
		});
	}
})();

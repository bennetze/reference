// Reviewed content dates, never the build clock. Advance shared when site-wide
// output changes; advance a template/page date for a more limited change.
export const modificationDates = {
	shared: '2026-10-11',
	pages: {
		'/impressum/': '2026-10-10',
		'/datenschutz/': '2026-10-10',
		'/404.html': '2026-09-28',
		'/': '2026-10-11',
		'/handwerk/': '2026-10-04',
		'/ueber-uns/': '2026-10-04',
		'/projekte/': '2026-10-10',
	},
};

export function pageModified(path, contentDates = []) {
	return [modificationDates.shared, modificationDates.pages[path], ...contentDates]
		.filter(Boolean).sort().at(-1);
}

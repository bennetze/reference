import translations from './en.json' with { type: 'json' };

export const normalize = text => text.replace(/\s+/g, ' ').trim();
export function translate(text) {
	const key = normalize(text);
	if (!key) return text;
	let value = translations[key];
	if (value === undefined && key.endsWith(' | Die Oldtimermanufaktur')) {
		value = `${translate(key.replace(' | Die Oldtimermanufaktur', ''))} | Die Oldtimermanufaktur`;
	}
	return text.replace(text.trim(), value ?? key);
}

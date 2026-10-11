export const SITE_TITLE = 'Behind Media';
export const SITE_AUTHOR = 'Werner Altewischer';
export const SITE_DESCRIPTION =
	'Software architecture, signal processing and mobile engineering.';
/** Formspree form endpoint. The address it forwards to is never exposed in the page. */
export const CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/xjygrlyb';

/** Permalinks match the previous WordPress site: /YYYY/MM/DD/slug/ */
export function postPath(pubDate: Date, id: string): string {
	const y = pubDate.getUTCFullYear();
	const m = String(pubDate.getUTCMonth() + 1).padStart(2, '0');
	const d = String(pubDate.getUTCDate()).padStart(2, '0');
	return `/${y}/${m}/${d}/${id}/`;
}

export const SITE_TITLE = 'Behind Media';
export const SITE_AUTHOR = 'Werner Altewischer';
export const SITE_DESCRIPTION =
	'Software architecture, signal processing and mobile engineering.';
export const CONTACT_EMAIL = 'werner@behindmedia.com';

/** Permalinks match the previous WordPress site: /YYYY/MM/DD/slug/ */
export function postPath(pubDate: Date, id: string): string {
	const y = pubDate.getUTCFullYear();
	const m = String(pubDate.getUTCMonth() + 1).padStart(2, '0');
	const d = String(pubDate.getUTCDate()).padStart(2, '0');
	return `/${y}/${m}/${d}/${id}/`;
}

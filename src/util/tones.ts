import type { Editor } from 'ckeditor5/src/core.js';
import { getDefaultAiAgentToneDropdownMenu } from './translations.js';

export interface ToneItem {
	label: string;
	key: string;
	tone: string;
	tid?: number;
}

/**
 * Returns the tone of voice menu: the "Default tone" entry, followed by the
 * configured tones or, without `tonesDropdown`, the built-in tones.
 *
 * When `defaultToneOfVoice` names one of these tones by key or term ID, the
 * "Default tone" entry carries that tone and shows its name.
 *
 * @param editor - The editor instance.
 * @returns The tone menu items, "Default tone" first.
 */
export function getAvailableTones( editor: Editor ): Array<ToneItem> {
	const t = editor.t;
	const config = editor.config.get( 'aiAgent' );
	const defaultTones: Array<ToneItem> = getDefaultAiAgentToneDropdownMenu( editor );
	const configTones = config?.tonesDropdown?.map( item => ( {
		label: item.label,
		key: item.tid ? String( item.tid ) : item.label.toLowerCase().replace( / /g, '_' ),
		tone: item.tone,
		tid: item.tid
	} ) );
	const tones = configTones ? [ defaultTones[ 0 ], ...configTones ] : defaultTones;

	const defaultKey = config?.defaultToneOfVoice;
	const defaultTone = defaultKey !== undefined && defaultKey !== null && defaultKey !== '' ?
		tones.slice( 1 ).find( item => item.key === String( defaultKey ) ) :
		undefined;

	if ( defaultTone ) {
		tones[ 0 ] = {
			...tones[ 0 ],
			label: t( 'Default tone (%0)', [ defaultTone.label ] ),
			tone: defaultTone.tone
		};
	}

	return tones;
}

/**
 * Returns the tone text for a stored tone key; no key means "Default tone".
 *
 * @param editor - The editor instance.
 * @param storedKey - The key saved when the user picked a tone, if any.
 * @returns The tone text, empty for the plain "Default tone", or null for an unknown key.
 */
export function getToneForKey( editor: Editor, storedKey: string | null ): string | null {
	const key = storedKey || 'default_tone';
	const match = getAvailableTones( editor ).find( item => item.key === key );

	return match ? match.tone : null;
}

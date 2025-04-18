import { ALL_MODERATION_FLAGS, MODERATION_URL } from '../const.js';
import CustomError, { getError } from './custom-error.js';
import { aiAgentContext } from '../aiagentcontext.js';
import { getErrorMessages } from './translations.js';
import type { ModerationResponse, ModerationFlagsTypes } from '../type-identifiers.js';
import type { LocaleTranslate } from 'ckeditor5';

export async function moderateContent( {
	content,
	moderationKey,
	timeOutDuration,
	disableFlags,
	t
}: {
	content: string;
	moderationKey: string;
	timeOutDuration: number;
	disableFlags: Array<ModerationFlagsTypes>;
	t: LocaleTranslate;
} ): Promise<boolean> {
	if ( !moderationKey ) {
		return true;
	}
	const controller = new AbortController();

	// Set timeout for moderation request
	const timeoutId = setTimeout( () => controller.abort(), timeOutDuration );

	try {
		const response = await fetch( MODERATION_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${ moderationKey }`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify( { content } ),
			signal: controller.signal
		} );

		clearTimeout( timeoutId );

		if ( !response.ok ) {
			const { error, status } = await getError( response );
			throw new CustomError( error, status );
		}

		const data = await response.json() as ModerationResponse;

		if ( !data?.results?.[ 0 ] ) {
			throw new Error( t( 'Invalid moderation response format' ) );
		}

		const flags = ALL_MODERATION_FLAGS.filter( flag => !disableFlags.includes( flag ) );

		if ( data.results[ 0 ].flagged ) {
			let error = false;
			const categories = data.results[ 0 ].categories;
			for ( let index = 0; index < flags.length; index++ ) {
				const flag = flags[ index ];
				if ( flags.includes( flag ) ) {
					if ( categories[ flag ] ) {
						error = true;
						break;
					}
				}
			}

			if ( error ) {
				aiAgentContext.showError( t( 'I\'m sorry, but I cannot assist with that request.' ) );
				return false;
			}
		}

		return true;
	} catch ( error: any ) {
		console.error( 'Moderation error:', error );
		let errorMessage: string = t(
			'We couldn\'t connect to the AI. Please check your internet'
		);
		if ( error.status ) {
			errorMessage = getErrorMessages( error.status, t );
		} else {
			errorMessage = error?.message?.trim();
			if ( errorMessage === 'ReadableStream not supported' ) {
				errorMessage = t( 'Browser does not support readable streams' );
			}
		}
		aiAgentContext.showError( errorMessage );

		// Fail open for moderation errors
		return true;
	} finally {
		clearTimeout( timeoutId );
	}
}

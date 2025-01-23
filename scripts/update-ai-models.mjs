/* eslint-env node */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { dirname } from 'path';
import fetch from 'node-fetch';

const MODEL_DATA_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';
const MODELS_PATH = 'src/config/ai-model.json';
const TYPES_PATH = 'src/type-ai-model.ts';

async function updateModels() {
	try {
		const fallbackModels = existsSync( MODELS_PATH ) ?
			JSON.parse( readFileSync( MODELS_PATH, 'utf8' ) ) :
			{};

		const response = await fetch( MODEL_DATA_URL );
		const models = await response.json();

		const optimizedModels = {};

		for ( const [ modelName, modelData ] of Object.entries( models ) ) {
			if ( modelName === 'sample_spec' || modelData.mode !== 'chat' ) {
				continue;
			}

			optimizedModels[ modelName ] = {
				minOutputTokens: 0,
				maxOutputTokens: modelData.max_output_tokens ||
                    modelData.max_tokens ||
                    Math.floor( ( modelData.max_input_tokens || 4096 ) * 0.5 ),
				maxInputContextTokens: modelData.max_input_tokens ||
                    modelData.max_tokens ||
                    4096
			};
		}

		const finalModels = Object.keys( optimizedModels ).length > 0 ? optimizedModels : fallbackModels;

		mkdirSync( dirname( MODELS_PATH ), { recursive: true } );
		writeFileSync( MODELS_PATH, JSON.stringify( finalModels, null, 2 ) );

		// eslint-disable-next-line max-len
		const typeContent = `export type AiModel =\n${ Object.keys( finalModels ).map( model => `'${ model }'` ).join( ' |\n' ) };\n`;

		writeFileSync( TYPES_PATH, typeContent );

		console.log( '✓ Updated model data and types' );
	} catch ( error ) {
		console.error( 'Failed to update models:', error );
		process.exit( 1 );
	}
}

updateModels();

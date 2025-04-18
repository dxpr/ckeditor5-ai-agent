import type { AiEngine } from '../type-identifiers.js';
import {
	loadModels
} from 'multi-llm-ts/dist/index.js';
import { STORAGE_PREFIX } from '../const.js';

function getCachedModels( engine: string ) {
	const key = `${ STORAGE_PREFIX }:${ engine }_models`;
	let models = [];
	const localStorageModels = localStorage.getItem( key );
	const now = new Date();
	if ( localStorageModels ) {
		const item = JSON.parse( localStorageModels );
		if ( now.getTime() <= item.expiry ) {
			models = item.models;
		} else {
			localStorage.removeItem( key );
		}
	}
	return models;
}

function cacheModels( engine: string, models: Array<string> ) {
	const key = `${ STORAGE_PREFIX }:${ engine }_models`;
	const now = new Date();
	const data = {
		expiry: now.getTime() + 24 * 60 * 60 * 1000, // 24 hours
		models
	};
	localStorage.setItem( key, JSON.stringify( data ) );
}

export async function checkModel( engine: AiEngine, model: string, apiKey?: string ): Promise<{
	success: boolean;
	error?: string;
}> {
	const models = getCachedModels( engine );
	if ( !models.length ) {
		const apiModels = await loadModels( engine, { apiKey } );
		if ( !apiModels?.chat?.length ) {
			throw new Error( `Unable to load models - please verify your ${ engine } API key` );
		}
		const modelIds = apiModels.chat.map( model => model.id );
		cacheModels( engine, modelIds );
		models.push( ...modelIds );
	}

	const modelExists = models.find( ( item: string ) => item === model );
	if ( !modelExists ) {
		console.error( `Invalid AI model specified: "${ model }". Available models:`, models );
		return {
			success: false,
			error: models.join( ' | ' )
		};
	}

	return {
		success: true
	};
}

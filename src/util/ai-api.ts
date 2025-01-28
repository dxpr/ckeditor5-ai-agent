import type { AiModel } from '../type-identifiers.js';
import CustomError, { getError } from './custom-error.js';
export class AIApi {
	private apiKey: string | undefined;
	private baseURL: string;

	constructor( config: {
		apiKey: string | undefined;
		baseURL: string;
	} ) {
		this.apiKey = config.apiKey ?? '';
		this.baseURL = config.baseURL;
	}

	/**
	 * Asynchronously streams data from a ReadableStream.
	 * @param stream - The ReadableStream to read from.
	 * @returns An AsyncGenerator that yields Uint8Array chunks from the stream.
	 */
	private async* streamAsyncIterator( stream: ReadableStream<Uint8Array> ): AsyncGenerator<Uint8Array, void, unknown> {
		const reader = stream.getReader();
		try {
			while ( true ) {
				const { done, value } = await reader.read();
				if ( done ) {
					return;
				}
				yield value;
			}
		} finally {
			reader.releaseLock();
		}
	}

	/**
	 * Fetches AI response from the API.
	 *
	 * This method sends a POST request to the AI API with the specified model and messages.
	 * It handles retries in case of failure and throws a CustomError if the response is not ok.
	 *
	 * @param aiModel - The AI model to use for the request.
	 * @param messages - An object containing system and user messages.
	 * @param config - Configuration options for the request, including temperature, max_tokens, and stop sequences.
	 * @param controller - An AbortController to manage request cancellation.
	 * @param retries - The number of retries to attempt in case of failure.
	 *
	 * @returns A Promise that resolves to the Response object from the fetch call.
	 *
	 * @throws CustomError if the response is not ok after the specified number of retries.
	 */
	private async fetchAI(
		aiModel: AiModel,
		messages: { system: string; user: string },
		config: {
			temperature: number | undefined;
			// eslint-disable-next-line camelcase
			max_tokens: number;
			stop: Array<string>;
		},
		controller: AbortController,
		retries: number
	): Promise<Response> {
		const response = await fetch( this.baseURL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${ this.apiKey }` // Add your API key here
			},
			body: JSON.stringify( {
				model: aiModel,
				messages: [
					{ role: 'system', content: messages.system },
					{ role: 'user', content: messages.user }
				],
				stream: true,
				...config
			} ),
			signal: controller.signal
		} );

		if ( !response.ok ) {
			if ( retries > 0 ) {
				return await this.fetchAI( aiModel, messages, config, controller, retries - 1 );
			} else {
				const { status, error } = await getError( response );
				throw new CustomError( error, status );
			}
		}
		return response;
	}

	/**
	 * Fetches a stream of AI responses from the API.
	 *
	 * This asynchronous generator method sends a request to the AI API and processes the response as a stream.
	 * It yields chunks of data as they are received, handling retries in case of failure.
	 * The method decodes the response and parses it line-by-line, yielding objects containing the type and text of the response.
	 *
	 * @param aiModel - The AI model to use for the request.
	 * @param messages - An object containing system and user messages.
	 * @param config - Configuration options for the request, including temperature, max_tokens, and stop sequences.
	 * @param controller - An AbortController to manage request cancellation.
	 * @param retries - The number of retries to attempt in case of failure.
	 *
	 * @returns An AsyncGenerator that yields objects containing the type and text of the response.
	 *
	 * @throws CustomError if the response cannot be parsed or if an error occurs during the fetch operation.
	 */
	public async* fetchAIStream(
		aiModel: AiModel,
		messages: { system: string; user: string },
		config: {
			temperature: number | undefined;
			// eslint-disable-next-line camelcase
			max_tokens: number;
			stop: Array<string>;
		},
		controller: AbortController,
		retries: number
	): AsyncGenerator<{ type: string; text: string }> {
		try {
			const response = await this.fetchAI( aiModel, messages, config, controller, retries );
			const decoder = new TextDecoder( 'utf-8' );

			let buffer = ''; // Buffer for incomplete data chunks

			if ( response.body ) {
				for await ( const chunk of this.streamAsyncIterator( response.body ) ) {
					const text = decoder.decode( chunk, { stream: true } );
					buffer += text; // Append the current chunk to the buffer

					// Process the buffer line-by-line
					const lines = buffer.split( '\n' );
					buffer = lines.pop()!; // Save the last partial line back to the buffer

					for ( const line of lines ) {
						if ( line.trim() ) {
							const dataString = line.substring( 5 ).trim(); // Remove 'data: '
							if ( dataString === '[DONE]' ) {
								break;
							}

							try {
								const parsedData = JSON.parse( dataString );
								let text = '';
								let type = 'content';
								if ( parsedData.method === 'agent/status' ) {
									type = 'status';
									text = parsedData.params.status;
								} else {
									const content = parsedData.choices[ 0 ]?.delta?.content;
									if ( content !== null && content !== undefined ) {
										text = content;
									}
								}

								yield {
									text,
									type
								};
							} catch ( err ) {
								console.warn( 'Error parsing JSON:', err );
							}
						}
					}
				}
			}
		} catch ( error: any ) {
			throw new CustomError( error, error?.status );
		}
	}
}

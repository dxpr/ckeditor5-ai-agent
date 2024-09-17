import type { Editor } from 'ckeditor5/src/core.js';
import type { Element } from 'ckeditor5';
import type { AiModel, MarkdownContent } from './type-identifiers.js';
import { aiAssistContext } from './aiassistcontext.js';
import sbd from 'sbd';

export default class AiAssistService {
	private editor: Editor;
	private aiModel: AiModel;
	private openAIKey: string | undefined;
	private endpointUrl: string;
	private temperature: number | undefined;
	private timeOutDuration: number;
	private maxTokens: number;
	private retryAttempts: number;
	private contextSize: number;
	private stopSequences: Array<string>;
	private responseOutputFormat: Array<string>;
	private responseContextData: Array<string>;
	private responseFilters: Array<string>;
	private debugMode: boolean;

	/**
	 * Initializes the AiAssistService with the provided editor and configuration settings.
	 *
	 * @param editor - The CKEditor instance to be used with the AI assist service.
	 */
	constructor( editor: Editor ) {
		this.editor = editor;
		const config = editor.config.get( 'aiAssist' )!;

		this.aiModel = config.model!;
		this.openAIKey = config.openAIKey;
		this.endpointUrl = config.endpointUrl!;
		this.temperature = config.temperature;
		this.timeOutDuration = config.timeOutDuration ?? 20000;
		this.maxTokens = config.maxTokens!;
		this.retryAttempts = config.retryAttempts!;
		this.contextSize = config.contextSize!;
		this.stopSequences = config.stopSequences!;
		this.responseOutputFormat = config.promptSettings?.outputFormat ?? [];
		this.responseContextData = config.promptSettings?.contextData ?? [];
		this.responseFilters = config.promptSettings?.filters ?? [];
		this.debugMode = config.debugMode ?? false;
	}

	/**
	 * Handles the slash command input from the user, processes it, and interacts with the AI model.
	 *
	 * @returns A promise that resolves when the command has been processed.
	 */
	public async handleSlashCommand(): Promise<void> {
		const editor = this.editor;
		const model = editor.model;
		const mapper = editor.editing.mapper;
		const view = editor.editing.view;
		let content: string | undefined;
		let parent: Element | undefined;
		const position = model.document.selection.getFirstPosition();
		if ( position ) {
			parent = position.parent as Element;
			const equivalentView = mapper.toViewElement( parent );
			if ( equivalentView ) {
				content =
					view.domConverter.mapViewToDom( equivalentView )?.innerText;
			}
		}

		try {
			const domSelection = window.getSelection();
			const domRange: any = domSelection?.getRangeAt( 0 );
			const rect = domRange.getBoundingClientRect();

			aiAssistContext.showLoader( rect );
			const gptPrompt = await this.generateGptPromptBasedOnUserPrompt(
				content ?? ''
			);
			if ( parent ) {
				await this.fetchAndProcessGptResponse( gptPrompt, parent );
			}
		} catch ( error ) {
			console.error( 'Error handling slash command:', error );
			throw error;
		} finally {
			aiAssistContext.hideLoader();
		}
	}

	/**
	 * Fetches and processes the GPT response based on the provided prompt and parent element.
	 *
	 * @param prompt - The prompt to send to the GPT model.
	 * @param parent - The parent element in the editor where the response will be inserted.
	 * @param retries - The number of retry attempts for the API call (default is the configured retry attempts).
	 * @returns A promise that resolves when the response has been processed.
	 */
	private async fetchAndProcessGptResponse(
		prompt: string,
		parent: Element,
		retries: number = this.retryAttempts
	): Promise<void> {
		const editor = this.editor;
		const t = editor.t;
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			this.timeOutDuration
		);

		try {
			const response = await fetch( this.endpointUrl, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${ this.openAIKey }`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					model: this.aiModel,
					messages: [ { role: 'user', content: prompt } ],
					temperature: this.temperature,
					max_tokens: this.maxTokens,
					stop: this.stopSequences,
					stream: true
				} ),
				signal: controller.signal
			} );

			clearTimeout( timeoutId );

			if ( !response.ok ) {
				throw new Error( 'Fetch failed' );
			}

			aiAssistContext.hideLoader();

			const reader = response.body!.getReader();
			const decoder = new TextDecoder( 'utf-8' );

			this.clearParentContent( parent );

			let buffer = '';
			let hasReceivedValidData = false;
			for ( ; ; ) {
				const { done, value } = await reader.read();
				if ( done ) {
					break;
				}

				buffer += decoder.decode( value, { stream: true } );
				const lines = buffer.split( '\n' );
				buffer = lines.pop() || '';

				for ( const line of lines ) {
					const trimmedLine = line.replace( /^data: /, '' ).trim();
					if (
						trimmedLine === '' ||
						trimmedLine === 'DONE' ||
						trimmedLine === '[DONE]'
					) {
						continue;
					}

					hasReceivedValidData = true;

					try {
						const { choices } = JSON.parse( trimmedLine );
						const { delta, finish_reason: finishReason } =
							choices[ 0 ];
						const { content } = delta ?? null;
						if ( `${ finishReason }`.trim() == 'stop' ) {
							continue;
						}

						// Handle newlines and insert content into the editor
						if ( content.includes( '\n' ) ) {
							const contentToWrite = ( content as string )
								.replace( /(\n)+/g, '\n' )
								.split( '\n' );
							for ( const info of contentToWrite ) {
								this.editor.model.change( writer => {
									writer.insertText( info, parent, 'end' );
								} );
								this.editor.execute( 'shiftEnter' );
							}
						} else {
							this.editor.model.change( writer => {
								writer.insertText( content, parent, 'end' );
							} );
						}
					} catch ( parseError ) {
						console.warn( 'Error parsing line:', trimmedLine );
					}
				}
			}

			// Process any remaining buffer content
			if ( buffer.trim() ) {
				console.warn( 'Unprocessed buffer content:', buffer );
			}

			// Check if we've received any valid data after processing all chunks
			if ( !hasReceivedValidData ) {
				aiAssistContext.showError(
					t(
						'Oops! Something went wrong while processing your request'
					)
				);
				console.error( 'No valid data received in the entire response' );
			}
		} catch ( error: any ) {
			const errorIdentifier =
				( error?.message || '' ).trim() || ( error?.name || '' ).trim();
			const isRetryableError = [
				'AbortError',
				'ReadableStream not supported',
				'AiAssist: Fetch failed'
			].includes( errorIdentifier );
			if ( retries > 0 && isRetryableError ) {
				console.warn( `Retrying... (${ retries } attempts left)` );
				return this.fetchAndProcessGptResponse(
					prompt,
					parent,
					retries - 1
				);
			}
			let errorMessage: string;
			switch ( error?.name || error?.message?.trim() ) {
				case 'ReadableStream not supported':
					errorMessage = t(
						'Browser does not support readable streams'
					);
					break;
				case 'AiAssist: Fetch failed':
					errorMessage = t(
						'We couldn\'t connect to the AI. Please check your internet'
					);
					break;
				default:
					errorMessage = t(
						'We couldn\'t connect to the AI. Please check your internet'
					);
			}

			aiAssistContext.showError( errorMessage );
		}
	}

	/**
	 * Clears the content of the specified parent element in the editor.
	 *
	 * @param parent - The parent element whose content will be cleared.
	 */
	private clearParentContent( parent: Element ): void {
		this.editor.model.change( writer => {
			while ( parent.childCount > 0 ) {
				const child = parent.getChild( 0 );
				if ( child ) {
					writer.remove( child );
				}
			}
		} );
	}

	/**
	 * Generates a GPT prompt based on the user's input and the current context in the editor.
	 *
	 * @param prompt - The user's input prompt.
	 * @returns A promise that resolves to the generated GPT prompt string.
	 */
	private async generateGptPromptBasedOnUserPrompt(
		prompt: string
	): Promise<string> {
		const context = this.trimContext( prompt );
		let request = prompt.slice( 1 ); // Remove the leading slash
		let markDownContents: Array<MarkdownContent> = [];
		if ( prompt.includes( ':' ) && prompt.includes( 'https' ) ) {
			const [ cmd, urlString ] = [
				prompt.substring( 0, prompt.indexOf( ':' ) ),
				prompt.substring( prompt.indexOf( ':' ) + 1 )
			];
			request = cmd.slice( 1 ); // Remove the leading slash
			const urls = urlString
				.split( ',' )
				.map( url => url.trim() )
				.filter( Boolean );
			markDownContents = await this.generateMarkDownForUrls( urls );
		}

		const isEditorEmpty = context === '"@@@cursor@@@"';
		return this.formatFinalPrompt(
			request,
			context,
			markDownContents,
			isEditorEmpty
		);
	}

	/**
	 * Formats the final prompt to be sent to the GPT model, including context and instructions.
	 *
	 * @param request - The user's request string.
	 * @param context - The trimmed context string.
	 * @param markDownContents - An array of MarkdownContent objects for additional context.
	 * @param isEditorEmpty - A boolean indicating if the editor is empty.
	 * @returns The formatted prompt string.
	 */
	private formatFinalPrompt(
		request: string,
		context: string,
		markDownContents: Array<MarkdownContent>,
		isEditorEmpty: boolean
	): string {
		const editor = this.editor;
		const contentLanguageCode = editor.locale.contentLanguage;
		const corpus = [];
		corpus.push( 'CONTEXT:' );
		corpus.push( `\n"""\n${ context }\n"""\n` );
		corpus.push( '\n\nTASK:\n\n' );
		corpus.push( `"""\n${ request }\n"""\n` );

		if ( markDownContents.length ) {
			corpus.push(
				'Refer to following markdown content as a source of information, but generate new text that fits the given context & task.'
			);
			markDownContents.forEach( ( markdown, index ) => {
				corpus.push(
					`\n\n------------ stating markdown content - ${
						index + 1
					} ------------\n\n`
				);
				corpus.push( markdown.content );
				corpus.push(
					`\n\n------------ ending markdown content - ${
						index + 1
					} ------------\n\n`
				);
			} );
		}

		corpus.push( '\n\nOUTPUT:\n\n' );
		corpus.push(
			'Provide only the new text content that should replace "@@@cursor@@@" based on the context above.'
		);
		corpus.push(
			'Do not include any part of the context in the output at any cost.'
		);

		corpus.push( '\n\nINSTRUCTIONS:\n\n' );

		// Add the language code instruction.
		corpus.push(
			`The response must follow the language code - ${ contentLanguageCode }.`
		);

		// Add response output format instructions if available.
		if ( this.responseOutputFormat.length ) {
			corpus.push( ...this.responseOutputFormat );
		}

		if ( markDownContents.length ) {
			corpus.push(
				'Use information from provided markdown content to generate new text, but do not copy it verbatim.'
			);
			corpus.push(
				'Ensure the new text flows naturally with the existing context and integrates smoothly.'
			);
			corpus.push( 'Do not use markdown formatting in your response.' );
			markDownContents.forEach( markdown => {
				const allowedToken = markdown.tokenInResponse;
				const contentUrl = markdown.url;
				corpus.push(
					`- Response must include ${ allowedToken } tokens of the content from the source: ${ contentUrl }`
				);
			} );
			corpus.push(
				'consider whole markdown of single source as content and then generate % content requested'
			);
		}

		// Add response filters or default instructions if filters are not available.
		if ( this.responseFilters.length ) {
			corpus.push( ...this.responseFilters );
		} else {
			const defaultFilterInstructions = [
				'All content should be in plain text without markdown formatting unless explicitly requested.',
				'If the response involves adding an item to a list, only generate the item itself,',
				'matching the format of the existing items in the list.',
				'Ensure that the content is free of grammar errors and correctly formatted to avoid parsing errors.',
				'The response should directly follow the context, avoiding any awkward transitions or noticeable gaps.'
			];
			corpus.push( ...defaultFilterInstructions );
		}

		// Add context-specific instructions if the editor is not empty.
		if ( !isEditorEmpty ) {
			const defaultContextInstructions = [
				'Ensure the inserted content maintains a seamless connection with the surrounding text,',
				'making the transition smooth and natural.',
				'Do not modify the original text except to replace the "@@@cursor@@@" placeholder with the generated content.'
			];
			corpus.push( ...defaultContextInstructions );
		}

		if ( this.debugMode ) {
			console.group( 'AiAssist Prompt Debug' );
			console.log( 'User Prompt:', prompt );
			console.log( 'Generated GPT Prompt:' );
			console.log( corpus.join( '\n' ) );
			console.groupEnd();
		}

		// Join all instructions into a single formatted string.
		return corpus.join( '\n' );
	}

	/**
	 * Allocates tokens to the fetched content based on the available limit and the user's prompt.
	 *
	 * @param prompt - The user's prompt string.
	 * @param fetchedContent - An array of MarkdownContent objects containing fetched content.
	 * @returns An array of MarkdownContent objects with calculated tokenInResponse values.
	 */
	public allocateTokensToFetchedContent(
		prompt: string,
		fetchedContent: Array<MarkdownContent>
	): Array<MarkdownContent> {
		const editorContent =
			this.editor?.editing?.view?.domRoots?.get( 'main' )?.innerText ?? '';
		const editorToken =
			this.countTokens( editorContent ) - this.countTokens( prompt );
		let availableLimit = 4000 - editorToken;

		fetchedContent = fetchedContent
			.map( content => ( {
				...content,
				availableToken: this.countTokens( content.content )
			} ) )
			.sort( ( a, b ) => ( a.availableToken ?? 0 ) - ( b.availableToken ?? 0 ) );

		let maxTokenFromEachURL = availableLimit / fetchedContent.length;

		return fetchedContent.map( ( content, index ) => {
			if (
				content.availableToken &&
				content.availableToken <= maxTokenFromEachURL
			) {
				content.tokenInResponse = content.availableToken;
				availableLimit -= content.availableToken;
			} else if ( content.availableToken ) {
				content.tokenInResponse = maxTokenFromEachURL;
				availableLimit -= maxTokenFromEachURL;
			}
			maxTokenFromEachURL =
				availableLimit / ( fetchedContent.length - ( index + 1 ) );
			return content;
		} );
	}

	/**
	 * Counts the number of tokens in the provided content string.
	 *
	 * @param content - The content string to count tokens in.
	 * @returns The number of tokens in the content.
	 */
	public countTokens( content: string ): number {
		if ( !content || typeof content !== 'string' ) {
			return 0;
		}

		// Normalize the content to handle different types of whitespace uniformly.
		const normalizedContent = content
			.trim() // Remove leading and trailing whitespace.
			.replace( /\s+/g, ' ' ); // Replace multiple whitespace characters with a single space.

		// Use a regex to match words and punctuation marks as tokens.
		const tokens = normalizedContent.match( /[\w'-]+|[.,!?;:(){}[\]]/g );

		// Return the count of tokens or 0 if there are none.
		return tokens ? tokens.length : 0;
	}

	/**
	 * Trims the context around the user's prompt to create a suitable context for the AI model.
	 *
	 * @param prompt - The user's prompt string.
	 * @returns The trimmed context string with a cursor placeholder.
	 */
	public trimContext( prompt: string ): string {
		let contentBeforePrompt = '';
		let contentAfterPrompt = '';

		const editor = this.editor;
		const view = editor?.editing?.view?.domRoots?.get( 'main' );
		const context = view?.innerText ?? '';
		const contextParts = context.split( prompt );

		if ( contextParts.length > 1 ) {
			if ( contextParts[ 0 ].length < contextParts[ 1 ].length ) {
				contentBeforePrompt = this.extractContent(
					contextParts[ 0 ],
					this.contextSize / 2,
					true
				);
				contentAfterPrompt = this.extractContent(
					contextParts[ 1 ],
					this.contextSize - contentBeforePrompt.length / 4
				);
			} else {
				contentAfterPrompt = this.extractContent(
					contextParts[ 1 ],
					this.contextSize / 2
				);
				contentBeforePrompt = this.extractContent(
					contextParts[ 0 ],
					this.contextSize - contentAfterPrompt.length / 4,
					true
				);
			}
		}

		// Combine the trimmed context with the cursor placeholder
		const trimmedContext = `${ contentBeforePrompt }\n"@@@cursor@@@"\n${ contentAfterPrompt }`;
		return trimmedContext.trim();
	}

	/**
	 * Extracts a portion of content based on the specified context size and direction.
	 *
	 * @param contentAfterPrompt - The content string to extract from.
	 * @param contextSize - The maximum size of the context to extract.
	 * @param reverse - A boolean indicating whether to extract in reverse order (default is false).
	 * @returns The extracted content string.
	 */
	public extractContent(
		contentAfterPrompt: string,
		contextSize: number,
		reverse: boolean = false
	): string {
		let trimmedContent = '';
		let charCount = 0;
		// Tokenize the content into sentences using the sbd library
		const sentences = sbd.sentences( contentAfterPrompt, {
			preserve_whitespace: true
		} );

		// Iterate over the sentences based on the direction
		const iterator = reverse ? sentences.reverse() : sentences;

		for ( const sentence of iterator ) {
			const sentenceLength = sentence.length;
			// Check if adding this sentence would exceed the context size
			if ( ( charCount + sentenceLength ) / 4 <= contextSize ) {
				trimmedContent = reverse ?
					sentence + trimmedContent :
					trimmedContent + sentence;
				charCount += sentenceLength;
			} else {
				break; // Stop if adding the next sentence would exceed the context size
			}
		}

		// Trim to remove any trailing whitespace and return the final trimmed content
		return trimmedContent.trim();
	}

	/**
	 * Generates Markdown content for an array of URLs by fetching their content.
	 *
	 * @param urls - An array of URLs to fetch content from.
	 * @returns A promise that resolves to an array of MarkdownContent objects.
	 */
	public async generateMarkDownForUrls(
		urls: Array<string>
	): Promise<Array<MarkdownContent>> {
		const markDownContents = await Promise.all(
			urls.map( async url => {
				const content = await this.fetchUrlContent( url );
				return content ? { content, url } : null;
			} )
		);
		return markDownContents.filter(
			( content ): content is MarkdownContent => content !== null
		);
	}

	/**
	 * Fetches the content of a given URL and returns it as a string.
	 *
	 * @param url - The URL to fetch content from.
	 * @returns A promise that resolves to the fetched content as a string.
	 * @throws Will throw an error if the URL is invalid or if the fetch fails.
	 */
	public async fetchUrlContent( url: string ): Promise<string> {
		const editor = this.editor;
		const t = editor.t;
		let errorMsg: string | undefined;
		const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
		if ( !urlRegex.test( url.trim() ) ) {
			throw new Error( 'Invalid URL' );
		}

		try {
			// Use a regular expression to remove hidden characters
			const cleanedUrl = url.replace( /[^\x20-\x7E]/g, '' );
			const requestURL = `https://r.jina.ai/${ cleanedUrl.trim() }`;
			const response = await fetch( requestURL.trim() );
			if ( !response.ok ) {
				throw new Error( `HTTP error! status: ${ response.status }` );
			}
			return await response.text();
		} catch ( error ) {
			errorMsg = t( 'Failed to fetch content of : %0', url );
			console.error( `Failed to fetch content: ${ url }`, error );
			return '';
		} finally {
			if ( errorMsg ) {
				aiAssistContext.showError( errorMsg );
			}
		}
	}
}
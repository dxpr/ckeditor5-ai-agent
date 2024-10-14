import type { Editor } from 'ckeditor5/src/core.js';
import type { Element } from 'ckeditor5/src/engine.js';
import type { AiModel, MarkdownContent } from './type-identifiers.js';
import { aiAssistContext } from './aiassistcontext.js';
import { PromptHelper } from './util/prompt.js';
import { HtmlParser } from './util/htmlparser.js';

export default class AiAssistService {
	private editor: Editor;
	private aiModel: AiModel;
	private apiKey: string | undefined;
	private endpointUrl: string;
	private temperature: number | undefined;
	private timeOutDuration: number;
	private maxTokens: number;
	private retryAttempts: number;
	private streamContent: boolean;
	private stopSequences: Array<string>;
	private aiAssistFeatureLockId = Symbol( 'ai-assist-feature' );
	private promptHelper: PromptHelper;
	private htmlParser: HtmlParser;

	private buffer = '';
	private openTags: Array<string> = [];

	/**
	 * Initializes the AiAssistService with the provided editor and configuration settings.
	 *
	 * @param editor - The CKEditor instance to be used with the AI assist service.
	 */
	constructor( editor: Editor ) {
		this.editor = editor;
		this.promptHelper = new PromptHelper( editor );
		this.htmlParser = new HtmlParser( editor );
		const config = editor.config.get( 'aiAssist' )!;

		this.aiModel = config.model!;
		this.apiKey = config.apiKey;
		this.endpointUrl = config.endpointUrl!;
		this.temperature = config.temperature;
		this.timeOutDuration = config.timeOutDuration ?? 45000;
		this.maxTokens = config.maxTokens!;
		this.retryAttempts = config.retryAttempts!;
		this.stopSequences = config.stopSequences!;
		this.streamContent = config.streamContent ?? true;
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
			if ( parent && gptPrompt ) {
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
		console.log( 'Starting fetchAndProcessGptResponse' );
		const editor = this.editor;
		const t = editor.t;
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			this.timeOutDuration
		);

		let buffer = '';
		let contentBuffer = '';

		try {
			const response = await fetch( this.endpointUrl, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${ this.apiKey }`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					model: this.aiModel,
					messages: [
						{ role: 'system', content: this.promptHelper.getSystemPrompt() },
						{ role: 'user', content: prompt }
					],
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
			this.editor.enableReadOnlyMode( this.aiAssistFeatureLockId );

			console.log( 'Starting to process response' );
			for ( ;; ) {
				const { done, value } = await reader.read();
				if ( done ) {
					console.log( 'Finished reading response' );
					break;
				}

				const chunk = decoder.decode( value, { stream: true } );
				buffer += chunk;

				let newlineIndex;
				while ( ( newlineIndex = buffer.indexOf( '\n' ) ) !== -1 ) {
					const line = buffer.slice( 0, newlineIndex ).trim();
					buffer = buffer.slice( newlineIndex + 1 );

					if ( line.startsWith( 'data: ' ) ) {
						const jsonStr = line.slice( 5 ).trim();
						if ( jsonStr === '[DONE]' ) {
							console.log( 'Received [DONE] signal' );
							break;
						}

						try {
							const data = JSON.parse( jsonStr );
							const content = data.choices[ 0 ]?.delta?.content;
							if ( content ) {
								contentBuffer += content;
								if ( this.htmlParser.isCompleteHtmlChunk( contentBuffer ) ) {
									await this.processContent( contentBuffer, parent );
									contentBuffer = '';
								}
							}
						} catch ( parseError ) {
							console.warn( 'Error parsing JSON:', parseError );
						}
					}
				}
			}

			// Process any remaining content in the buffer
			if ( contentBuffer.trim() ) {
				this.processContent( contentBuffer.trim(), parent );
			}
		} catch ( error: any ) {
			console.error( 'Error in fetchAndProcessGptResponse:', error );
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
		} finally {
			this.editor.disableReadOnlyMode( this.aiAssistFeatureLockId );
		}
	}

	/**
	 * Processes the provided content and inserts it into the specified parent element.
	 * Depending on the feature flag, it either uses a simple HTML insertion method
	 * or processes the content as HTML.
	 *
	 * @param content - The content to be processed and inserted.
	 * @param parent - The parent element in the editor where the content will be inserted.
	 */
	private async processContent( content: string, parent: Element ): Promise<void> {
		console.log( '--- Start of processContent ---' );
		console.log( 'Processing content:', content );

		if ( this.streamContent ) {
			// Existing complex content processing logic
			await this.proceedHtmlResponse( content );
		} else {
			// Use the simple HTML insertion method
			await this.htmlParser.insertSimpleHtml( content );
		}

		console.log( '--- End of processContent ---' );
	}

	/**
	 * Processes the provided HTML string and inserts its content into the editor.
	 * It creates a temporary div to parse the HTML and handles different types of
	 * elements (lists, tables, headings, etc.) accordingly.
	 *
	 * @param html - The HTML string to be processed and inserted into the editor.
	 */
	private async proceedHtmlResponse( html: string ): Promise<void> {
		const tempDiv: HTMLElement = document.createElement( 'div' );
		tempDiv.innerHTML = html;

		for ( const child of Array.from( tempDiv.childNodes ) ) {
			const element = child as HTMLElement;
			if ( element.nodeType === Node.ELEMENT_NODE ) {
				const elementName = element.tagName.toLowerCase();
				let isStreamingNotAllow = elementName === 'table';
				isStreamingNotAllow = isStreamingNotAllow || elementName === 'blockquote';
				isStreamingNotAllow = isStreamingNotAllow || elementName === 'pre';
				isStreamingNotAllow = isStreamingNotAllow || elementName === 'img';
				isStreamingNotAllow = isStreamingNotAllow || elementName === 'form';
				isStreamingNotAllow = isStreamingNotAllow || elementName === 'figure';
				if ( isStreamingNotAllow ) {
					await this.htmlParser.insertSimpleHtml( element.outerHTML );
				}
				else if ( elementName === 'ul' || elementName === 'ol' ) {
					await this.htmlParser.insertAsText( element || '', true, true );
				}
				else {
					await this.htmlParser.insertAsText( element || '', true );
				}
			} else if ( element.nodeType === Node.TEXT_NODE && element.textContent ) {
				const tempParagraph: HTMLElement = document.createElement( 'div' );
				tempParagraph.innerText = element.textContent;
				await this.htmlParser.insertAsText( tempParagraph || '', true, true );
			}
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
	): Promise<string | null> {
		try {
			const context = this.promptHelper.trimContext( prompt );
			const request = prompt.slice( 1 ); // Remove the leading slash
			let markDownContents: Array<MarkdownContent> = [];
			const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
			const urls = prompt.match( urlRegex );
			if ( Array.isArray( urls ) && urls.length ) {
				const formattedUrl = urls.map( url => {
					return url.replace( /[,.]$/, '' );
				} );
				markDownContents = await this.promptHelper.generateMarkDownForUrls( formattedUrl );
				markDownContents = this.promptHelper.allocateTokensToFetchedContent( prompt, markDownContents );
			}

			const isEditorEmpty = context === '"@@@cursor@@@"';
			return this.promptHelper.formatFinalPrompt(
				request,
				context,
				markDownContents,
				isEditorEmpty
			);
		} catch ( error ) {
			console.error( error );
			return null;
		}
	}
}

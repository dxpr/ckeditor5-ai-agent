import type { Editor } from 'ckeditor5/src/core.js';
import type { Element, Item, Position } from 'ckeditor5/src/engine.js';
import type { AiModel, AiEngine, MarkdownContent, ModerationResponse, ModerationFlagsTypes } from './type-identifiers.js';
import { aiAgentContext } from './aiagentcontext.js';
import { PromptHelper } from './util/prompt.js';
import { HtmlParser } from './util/htmlparser.js';
import { ButtonView } from 'ckeditor5/src/ui.js';
import { env } from 'ckeditor5/src/utils.js';
import { ALL_MODERATION_FLAGS, MODERATION_URL, AI_ENGINE } from './const.js';
import { getErrorMessages } from './util/translations.js';
import {
	type EngineCreateOpts,
	type LlmEngine,
	type LlmCompletionOpts,
	igniteEngine,
	Message,
	loadModels
} from 'multi-llm-ts/dist/index.js';
import { AIApi } from './util/ai-api.js';
import CustomError, { getError } from './util/custom-error.js';

export default class AiAgentService {
	private editor: Editor;
	private aiEngine: AiEngine;
	private aiModel: string;
	private apiKey: string | undefined;
	private endpointUrl: string;
	private temperature: number | undefined;
	private timeOutDuration: number;
	private maxTokens: number;
	private retryAttempts: number;
	private streamContent: boolean;
	private stopSequences: Array<string>;
	private aiAgentFeatureLockId = Symbol( 'ai-agent-feature' );
	private promptHelper: PromptHelper;
	private htmlParser: HtmlParser;

	private isInlineInsertion: boolean = false;
	private abortGeneration: boolean = false;
	private moderationKey: string;
	private moderationEnable: boolean;
	private disableFlags: Array<ModerationFlagsTypes> = [];
	private s: any;

	private readonly STORAGE_PREFIX = 'ck5-ai-agent';

	/**
	 * Initializes the AiAgentService with the provided editor and configuration settings.
	 *
	 * @param editor - The CKEditor instance to be used with the AI assist service.
	 */
	constructor( editor: Editor ) {
		this.editor = editor;
		this.promptHelper = new PromptHelper( editor );
		this.htmlParser = new HtmlParser( editor );
		const config = editor.config.get( 'aiAgent' )!;

		this.aiModel = config.model!;
		this.apiKey = config.apiKey;
		this.aiEngine = config.engine!;
		this.endpointUrl = config.endpointUrl!;
		this.temperature = config.temperature;
		this.timeOutDuration = config.timeOutDuration ?? 45000;
		this.maxTokens = config.maxOutputTokens ?? config.maxTokens!;
		this.retryAttempts = config.retryAttempts!;
		this.stopSequences = config.stopSequences!;
		this.streamContent = config.streamContent ?? true;
		this.moderationKey = config.moderationKey ?? '';
		this.moderationEnable = config.moderationEnable ?? false;
		this.disableFlags = config.moderationDisableFlags ?? [];
	}

	/**
	 * Handles the slash command input from the user, processes it, and interacts with the AI model.
	 *
	 * @returns A promise that resolves when the command has been processed.
	 */
	public async handleSlashCommand( command?: string ): Promise<void> {
		const editor = this.editor;
		const model = editor.model;
		const mapper = editor.editing.mapper;
		const view = editor.editing.view;
		const root = model.document.getRoot();

		let content: string | undefined;
		let selectedContent: string | undefined;
		let parentEquivalentHTML: HTMLElement | undefined;
		let parent: Element | undefined;
		const position = model.document.selection.getLastPosition();

		if ( position && root ) {
			parent = position.parent as Element;
			const inlineSlash = parent.name === 'inline-slash' ? parent : undefined;
			const equivalentView = mapper.toViewElement( parent );
			parentEquivalentHTML = equivalentView ? view.domConverter.mapViewToDom( equivalentView ) : undefined;

			if ( inlineSlash ) {
				editor.model.change( writer => {
					const endPosition = writer.createPositionAt( inlineSlash, 'end' );
					writer.setSelection( endPosition );
				} );

				this.isInlineInsertion = true;
				const startPosition = editor.model.createPositionAt( inlineSlash, 0 );
				const endPosition = editor.model.createPositionAt( inlineSlash, 'end' );
				const range = model.createRange( startPosition, endPosition );
				parentEquivalentHTML = equivalentView?.parent ?
					view.domConverter.mapViewToDom( equivalentView.parent ) as HTMLElement :
					undefined;
				content = '';

				for ( const item of range.getItems() ) {
					if ( item.is( '$textProxy' ) ) {
						content += item.data.trim(); // Add text data
					}
				}
			} else if ( parentEquivalentHTML ) {
				content = parentEquivalentHTML?.innerText;
			}
		}

		if ( command ) {
			const selection = model.document.selection;
			const selectedContentFragment = model.getSelectedContent( selection );

			const viewFragment = editor.data.toView( selectedContentFragment );
			const html = editor.data.processor.toData( viewFragment );

			content = command;
			selectedContent = html;
		}

		if ( this.moderationEnable ) {
			const moderateContent = await this.moderateContent( content ?? '' );
			if ( !moderateContent ) {
				return;
			}
		}

		try {
			const domSelection = window.getSelection();
			const domRange: any = domSelection?.getRangeAt( 0 );
			const rect = domRange.getBoundingClientRect();

			aiAgentContext.showLoader( rect );
			const gptPrompt = await this.generateGptPromptBasedOnUserPrompt(
				content ?? '',
				parentEquivalentHTML?.innerText,
				selectedContent
			);
			if ( parent && gptPrompt ) {
				await this.fetchAndProcessGptResponse( !!command, gptPrompt, parent );
			}
		} catch ( error ) {
			console.error( 'Error handling slash command:', error );
			throw error;
		} finally {
			this.isInlineInsertion = false;
			aiAgentContext.hideLoader();
		}
	}

	/**
	 * Moderates the input content using OpenAI's moderation API to check for inappropriate content.
	 *
	 * @param input - The text content to be moderated
	 * @returns A promise that resolves to:
	 * - `true` if content is acceptable or if moderation fails (fail-open)
	 * - `false` if content is flagged as inappropriate
	 *
	 * @throws Shows user-friendly error messages via aiAgentContext for:
	 * - Flagged content ("Cannot process your query...")
	 * - API errors ("Error in content moderation")
	 */
	private async moderateContent( input: string ): Promise<boolean> {
		if ( !this.moderationKey ) {
			return true;
		}
		const editor = this.editor;
		const t = editor.t;
		const controller = new AbortController();

		// Set timeout for moderation request
		const timeoutId = setTimeout( () => controller.abort(), this.timeOutDuration );

		try {
			const response = await fetch( MODERATION_URL, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${ this.moderationKey }`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( { input } ),
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

			const flags = ALL_MODERATION_FLAGS.filter( flag => !this.disableFlags.includes( flag ) );

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
				errorMessage = getErrorMessages( error.status, editor );
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

	/**
	 * Fetches and processes the GPT response based on the provided prompt and parent element.
	 *
	 * @param prompt - The prompt to send to the GPT model.
	 * @param parent - The parent element in the editor where the response will be inserted.
	 * @param retries - The number of retry attempts for the API call (default is the configured retry attempts).
	 * @returns A promise that resolves when the response has been processed.
	 */
	private async fetchAndProcessGptResponse(
		command: boolean,
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

		const blockID = `ai-${ new Date().getTime() }`;
		try {
			let llm: LlmEngine | undefined;
			let response;

			if ( AI_ENGINE.includes( this.aiEngine as any ) ) {
				const config = {
					apiKey: this.apiKey
				};
				const { success, error } = await this.checkModel( this.aiEngine, this.aiModel, this.apiKey );
				if ( !success ) {
					aiAgentContext.showError( `${ t( 'Invalid AI model specified. Available models' ) }: ${ error } ` );
					return;
				}
				llm = igniteEngine( this.aiEngine, config as EngineCreateOpts );
				const messages = [
					new Message( 'system', this.promptHelper.getSystemPrompt( this.isInlineInsertion ) ),
					new Message( 'user', prompt )
				];
				const completionOpts: LlmCompletionOpts = {
					maxTokens: this.maxTokens,
					...( this.temperature !== undefined && { temperature: this.temperature } )
				};

				if ( this.streamContent ) {
					// Streaming path
					const stream = llm.generate( this.aiModel, messages, completionOpts );
					await this.handleStreamingResponse( stream, blockID, parent, command, controller, llm );
				} else {
					// Non-streaming path
					const result = await llm.complete( this.aiModel, messages, completionOpts );
					if ( !result.content ) {
						throw new Error( t( 'Empty response from AI model' ) );
					}
					await this.handleNonStreamingResponse( result.content, blockID, parent, command );
				}
			} else {
				const config = {
					apiKey: this.apiKey,
					baseURL: this.endpointUrl
				};
				const llmCustom = new AIApi( config );
				const messages = {
					system: this.promptHelper.getSystemPrompt( this.isInlineInsertion ),
					user: prompt
				};
				response = llmCustom.fetchAIStream(
					this.aiModel as AiModel,
					messages,
					{
						temperature: this.temperature,
						max_tokens: this.maxTokens,
						stop: this.stopSequences
					},
					controller,
					retries
				);
				await this.handleStreamingResponse( response, blockID, parent, command, controller, llm );
			}
		} catch ( error: any ) {
			if ( this.abortGeneration ) {
				return;
			}
			console.error( 'Error in fetchAndProcessGptResponse:', error );
			let errorMessage: string = t(
				'We couldn\'t connect to the AI. Please check your internet'
			);
			if ( error?.status ) {
				errorMessage = getErrorMessages( error.status, editor );
			} else {
				errorMessage = error?.message?.trim();
			}

			aiAgentContext.showError( errorMessage );
			this.processCompleted( blockID );
		} finally {
			clearTimeout( timeoutId );
			this.editor.disableReadOnlyMode( this.aiAgentFeatureLockId );
		}
	}

	/**
	 * Checks if the specified AI model exists for the given engine.
	 * If the models are not cached, it fetches them from the API and caches them.
	 *
	 * @param engine - The AI engine to check the model against.
	 * @param model - The model identifier to verify.
	 * @param apiKey - Optional API key for authentication with the AI engine.
	 * @returns A promise that resolves to an object containing:
	 * - `success`: A boolean indicating whether the model exists.
	 * - `error`: An optional string containing error details if the model is invalid.
	 *
	 * @throws Will throw an error if unable to load models from the API.
	 */
	private async checkModel( engine: AiEngine, model: string, apiKey?: string ): Promise<{
		success: boolean;
		error?: string;
	}> {
		const models = this.getCachedModels( engine );
		if ( !models.length ) {
			const apiModels = await loadModels( engine, { apiKey } );
			if ( !apiModels?.chat?.length ) {
				throw new Error( `Unable to load models - please verify your ${ engine } API key` );
			}
			const modelIds = apiModels.chat.map( model => model.id );
			this.cacheModels( engine, modelIds );
			models.push( ...modelIds );
		}

		const modelExists = models.find( ( item: string ) => item === model );
		if ( !modelExists ) {
			console.error( 'Invalid AI model specified. Available models:', models );
			return {
				success: false,
				error: models.join( ' | ' )
			};
		}

		return {
			success: true
		};
	}

	/**
	 * Retrieves cached models from local storage based on the provided key.
	 * If the cached models are expired, they are removed from local storage.
	 *
	 * @param engine - The key used to access the cached models in local storage.
	 * @returns An array of model identifiers retrieved from local storage, or an empty array if no valid models are found.
	 */
	private getCachedModels( engine: string ) {
		const key = `${ this.STORAGE_PREFIX }:${ engine }_models`;
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

	private cacheModels( engine: string, models: Array<string> ) {
		const key = `${ this.STORAGE_PREFIX }:${ engine }_models`;
		const now = new Date();
		const data = {
			expiry: now.getTime() + 24 * 60 * 60 * 1000, // 24 hours
			models
		};
		localStorage.setItem( key, JSON.stringify( data ) );
	}

	private async handleStreamingResponse(
		stream: any,
		blockID: string,
		parent: Element,
		command: boolean,
		controller: AbortController,
		llm: LlmEngine | undefined
	): Promise<void> {
		let isFirstChunk = true;
		let contentBuffer = '';

		for await ( const c of stream ) {
			if ( isFirstChunk ) {
				aiAgentContext.hideLoader();
				this.cancelGenerationButton( blockID, controller, llm, stream );
				this.undoRedoHandler();
				this.insertAiTag( blockID );
				this.clearParentContent( parent, command );
				isFirstChunk = false;
			}

			this.s = c;
			const chunk = c as any;

			if ( chunk.type === 'status' ) {
				await this.animatedStatusMessages( chunk.text, blockID );
			}

			if ( chunk.type === 'content' ) {
				contentBuffer += chunk.text;
			}
			await this.updateContent( contentBuffer, blockID );
		}
		this.processCompleted( blockID );
	}

	private async handleNonStreamingResponse(
		content: string,
		blockID: string,
		parent: Element,
		command: boolean
	): Promise<void> {
		aiAgentContext.hideLoader();
		this.insertAiTag( blockID );
		this.clearParentContent( parent, command );
		await this.htmlParser.insertSimpleHtml( content );
		this.processCompleted( blockID );
	}

	/**
     * Creates and configures a cancel generation button with keyboard shortcut support.
     *
     * @param blockID - Unique identifier for the AI generation block
     * @param controller - AbortController to cancel the ongoing AI generation
     * @private
     */
	private cancelGenerationButton( blockID: string, controller: AbortController, llm: LlmEngine | undefined, stream: any ) {
		const editor = this.editor;
		const t = editor.t;

		const view = new ButtonView();
		let label = t( 'Cancel Generation' );

		if ( env.isMac ) {
			label = `\u2318 + \u232B ${ t( 'Cancel Generation' ) }`;
		}

		if ( env.isWindows ) {
			label = `Ctrl + \u232B ${ t( 'Cancel Generation' ) }`;
		}

		view.set( {
			label,
			withText: true,
			class: 'ck-cancel-request-button'
		} );

		view.on( 'execute', () => {
			this.abortGeneration = true;
			if ( llm ) {
				llm.stop( llm );
			} else {
				controller.abort();
			}
			this.processCompleted( blockID );
		} );

		view.render();

		editor.keystrokes.set( 'Ctrl+Backspace', ( keyEvtData, cancel ) => {
			if ( keyEvtData.ctrlKey || keyEvtData.metaKey ) {
				this.abortGeneration = true;
				if ( llm ) {
					llm.stop( stream );
				} else {
					controller.abort();
				}
				this.processCompleted( blockID );
			}
			cancel();
		} );

		const toolbarElement = ( editor.ui.view as any ).toolbar.element;
		if ( toolbarElement && view.element ) {
			const panelContent = toolbarElement.querySelector( '.ck-toolbar__items' );
			if ( panelContent ) {
				panelContent.append( view.element );
			}
		}

		setTimeout( () => view.set( { class: 'ck-cancel-request-button visible' } ), 2000 );
	}

	/**
	 * Handles cleanup after AI generation is completed or cancelled.
	 * Removes the cancel button from the UI and cleans up the temporary AI tag from editor content.
	 *
	 * @param blockID - Unique identifier for the AI generation block to be cleaned up
	 * @private
	 */
	private processCompleted( blockID: string ) {
		const editor = this.editor;
		const toolbarElement = ( editor.ui.view as any ).toolbar.element;
		if ( toolbarElement ) {
			const cancelButton = toolbarElement.querySelector( '.ck-cancel-request-button' );
			if ( cancelButton ) {
				cancelButton.remove();
			}
		}

		const modelRoot = editor.model.document.getRoot();
		if ( modelRoot ) {
			const modelRange = editor.model.createRangeIn( modelRoot );
			for ( const item of modelRange.getItems() ) {
				if ( item.is( 'element', 'ai-animated-status' ) ) {
					editor.model.change( writer => {
						writer.remove( item );
					} );
				}
			}
		}

		const editorData = editor.getData();
		let editorContent = editorData.replace( new RegExp( `<ai-tag id="${ blockID }-inline">&nbsp;</ai-tag>`, 'g' ), '' );
		editorContent = editorContent.replace( new RegExp( `<ai-tag id="${ blockID }">&nbsp;</ai-tag>`, 'g' ), '' );
		editorContent = editorContent.replace( /<\/ai-tag>\s*<[^>]+>\s*&nbsp;\s*<\/[^>]+>/g, '' );
		editorContent = editorContent.replace( `<ai-tag id="${ blockID }-inline">`, '' );
		editorContent = editorContent.replace( `<ai-tag id="${ blockID }">`, '' );

		editor.execute( 'selectAll' );
		const viewFragment = editor.data.processor.toView( editorContent );
		const modelFragment = editor.data.toModel( viewFragment );
		editor.model.insertContent( modelFragment );
	}

	/**
	 * Recursively retrieves all child elements of a given view element that match the specified block ID.
	 *
	 * @param viewElement - The parent view element from which to retrieve children.
	 * @param blockID - The unique identifier of the AI block to search for.
	 * @returns An array of matching child elements.
	 */
	private getViewChildrens( viewElement: any, blockID: string ): any {
		const results = [];
		for ( const child of viewElement.getChildren() ) {
			if ( child.is( 'element' ) ) {
				if ( child.is( 'element', 'ai-tag' ) && child.getAttribute( 'id' ) === blockID ) {
					results.push( child );
				} else {
					const nestedResults = this.getViewChildrens( child, blockID );
					results.push( ...nestedResults );
				}
			}
		}
		return results;
	}

	private async animatedStatusMessages( status: string, blockID: string ): Promise<void> {
		const editor = this.editor;
		const root = editor.model.document.getRoot();
		let targetElement: any;
		if ( root ) {
			const inlineChildrens = this.getViewChildrens( root, `${ blockID }-inline` );
			const childrens = this.getViewChildrens( root, blockID );
			if ( inlineChildrens.length ) {
				targetElement = inlineChildrens.length ? inlineChildrens[ 0 ] : null;
			} else if ( childrens.length ) {
				targetElement = childrens.length ? childrens[ 0 ] : null;
			}

			if ( targetElement ) {
				editor.model.enqueueChange( { isUndoable: false }, writer => {
					const range = editor.model.createRangeIn( targetElement );
					writer.remove( range );

					const aiAnimatedStatus = writer.createElement( 'ai-animated-status', {
						class: 'ck-loading-shimmer'
					} );
					writer.insert( aiAnimatedStatus, targetElement );
					writer.insertText( `${ status }...`, aiAnimatedStatus, 'end' );
				} );
			}
		}
		await new Promise( resolve => setTimeout( resolve ) );
	}

	/**
	 * Updates the content of an AI-generated block in the editor.
	 *
	 * @param newHtml - The new HTML content to insert
	 * @param blockID - The unique identifier of the AI block to update
	 * @param insertParent - Whether to insert at parent level or child level
	 * @returns Promise that resolves when the update is complete
	 * @private
	 */
	private async updateContent( newHtml: string, blockID: string ): Promise<void> {
		const editor = this.editor;
		const tempParagraph: HTMLElement = document.createElement( 'div' );
		tempParagraph.innerHTML = newHtml;
		let textContent = '';

		const root = editor.model.document.getRoot();
		if ( root ) {
			const childrens = this.getViewChildrens( root, `${ blockID }-inline` );
			if ( childrens.length ) {
				if ( tempParagraph.querySelector( 'ul' ) === null && tempParagraph.querySelector( 'li' ) === null ) {
					textContent = tempParagraph.textContent ?? '';
					tempParagraph.innerHTML = '';
				}
			}
		}

		if ( textContent ) {
			editor.model.enqueueChange( { isUndoable: false }, writer => {
				const root = editor.model.document.getRoot();
				if ( root ) {
					const childrens = this.getViewChildrens( root, `${ blockID }-inline` );
					const targetElement = childrens.length ? childrens[ 0 ] : null;
					if ( targetElement ) {
						const range = editor.model.createRangeIn( targetElement );
						writer.remove( range );
						writer.insertText( textContent, targetElement, 'end' );
					}
				}
			} );
		}
		if ( tempParagraph.innerHTML ) {
			editor.model.enqueueChange( { isUndoable: false }, writer => {
				const root = editor.model.document.getRoot();
				if ( root ) {
					const childrens = this.getViewChildrens( root, blockID );
					const targetElement = childrens.length ? childrens[ 0 ] : null;

					if ( targetElement ) {
						const range = editor.model.createRangeIn( targetElement );
						writer.remove( range );
						const viewFragment = editor.data.processor.toView( tempParagraph.innerHTML );
						const modelFragment = editor.data.toModel( viewFragment );
						writer.insert( modelFragment, targetElement, 'end' );
					}
				}
			} );
		}

		await new Promise( resolve => setTimeout( resolve ) );
	}

	/**
	 * Processes the provided content and inserts it into the specified parent element.
	 * Depending on the feature flag, it either uses a simple HTML insertion method
	 * or processes the content as HTML.
	 *
	 * @param content - The content to be processed and inserted.
	 * @param parent - The parent element in the editor where the content will be inserted.
	 */
	private async processContent( content: string ): Promise<void> {
		try {
			console.log( '--- Start of processContent ---' );
			console.log( 'Processing content:', content, this.isInlineInsertion );
			if ( this.isInlineInsertion ) {
				const position = this.editor.model.document.selection.getLastPosition();
				const tempParagraph: HTMLElement = document.createElement( 'div' );
				tempParagraph.innerHTML = content;
				await this.htmlParser.insertAsText( tempParagraph || '', position ?? undefined, this.streamContent );
			} else {
				if ( this.streamContent ) {
					// Existing complex content processing logic
					await this.proceedHtmlResponse( content );
				} else {
					// Use the simple HTML insertion method
					await this.htmlParser.insertSimpleHtml( content );
				}
			}

			console.log( '--- End of processContent ---' );
		} catch ( error ) {
			console.error( error );
		}
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
				const isStreamingNotAllow = [
					'table', 'blockquote', 'pre', 'img', 'form', 'figure'
				].includes( elementName );

				if ( isStreamingNotAllow ) {
					await this.htmlParser.insertSimpleHtml( element.outerHTML );
				}
				else if ( elementName === 'ul' || elementName === 'ol' ) {
					await this.htmlParser.insertAsText( element, undefined, true, true );
				}
				else {
					await this.htmlParser.insertAsText( element, undefined, true );
				}
			} else if ( element.nodeType === Node.TEXT_NODE && element.textContent ) {
				const tempParagraph: HTMLElement = document.createElement( 'div' );
				tempParagraph.innerText = element.textContent;
				await this.htmlParser.insertAsText( tempParagraph, undefined, true );
			}
		}
	}

	/**
	 * Clears the content of the specified parent element in the editor.
	 *
	 * @param parent - The parent element whose content will be cleared.
	 */
	private clearParentContent( parent: Element, command: boolean ): void {
		const editor = this.editor;
		const model = editor.model;
		const root = model.document.getRoot();
		const positionFirst = model.document.selection.getFirstPosition();
		const positionLast = model.document.selection.getLastPosition();

		if ( root && positionFirst && positionLast ) {
			editor.model.change( writer => {
				if ( command ) {
					const range = model.createRange(
						model.createPositionFromPath( root, positionFirst.path ),
						model.createPositionFromPath( root, positionLast.path )
					);
					writer.remove( range );
					const positionFirstAfterRemove = model.document.selection.getFirstPosition();
					if ( positionFirstAfterRemove ) {
						const positionParentFirst = positionFirstAfterRemove.parent as Item;
						if ( positionFirstAfterRemove.parent.childCount === 0 ) {
							writer.remove( positionParentFirst );
						} else if ( positionFirstAfterRemove.parent.childCount === 1 ) {
							const tag = positionFirstAfterRemove.parent?.getChild( 0 ) as Element;
							if ( tag.name === 'ai-tag' && positionFirstAfterRemove.parent.name !== '$root' ) {
								writer.remove( positionParentFirst );
							}
						}
					}

					const positionLastAfterRemove = model.document.selection.getLastPosition();
					if ( positionLastAfterRemove ) {
						const positionParentLast = positionLastAfterRemove.parent as Item;
						if ( positionLastAfterRemove.parent.childCount === 0 ) {
							writer.remove( positionParentLast );
						} else if ( positionLastAfterRemove.parent.childCount === 1 ) {
							const tag = positionLastAfterRemove.parent?.getChild( 0 ) as Element;
							if ( tag.name === 'ai-tag' && positionLastAfterRemove.parent.name !== '$root' ) {
								writer.remove( positionParentLast );
							}
						}
					}
				} else {
					const startingPath = parent.getPath();
					const range = model.createRange(
						model.createPositionFromPath( root, startingPath ),
						model.createPositionFromPath( root, positionLast.path )
					);
					writer.remove( range );

					if ( parent.getPath() ) {
						if ( parent.name === 'inline-slash' ) {
							const position = model.document.selection.getLastPosition();
							const positionParent = position?.parent as Item;
							let lineEmpty = true;
							if ( position?.parent ) {
								if ( position?.parent?.getChildren().next().value ) {
									lineEmpty = false;
								}
							}
							if ( lineEmpty ) {
								writer.remove( positionParent );
							}
						} else {
							const positionParent = parent as Item;
							writer.remove( positionParent );
						}
					}
				}
			} );
		}
	}

	/**
	 * Generates a GPT prompt based on the user's input and the current context in the editor.
	 * This method processes the input prompt, extracts any URLs, and formats the final prompt
	 * to be sent to the GPT model. It also handles the case where the editor is empty.
	 *
	 * @param prompt - The user's input prompt, typically starting with a slash.
	 * @param promptContainerText - Optional text from the container that may provide additional context.
	 * @returns A promise that resolves to the generated GPT prompt string or null if an error occurs.
	*/
	private async generateGptPromptBasedOnUserPrompt(
		prompt: string,
		promptContainerText?: string,
		selectedContent?: string
	): Promise<string | null> {
		try {
			const context = this.promptHelper.trimContext( prompt, promptContainerText );
			const request = selectedContent ? prompt : prompt.slice( 1 );
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

			const isEditorEmpty = context === '@@@cursor@@@';
			return this.promptHelper.formatFinalPrompt(
				request,
				context,
				selectedContent,
				markDownContents,
				isEditorEmpty
			);
		} catch ( error ) {
			console.error( error );
			return null;
		}
	}

	/**
	 * Handles the undo and redo commands for the editor.
	 *
	 * This function adds event listeners to the undo and redo commands.
	 * If the editor's data contains any AI tags, executing the undo or redo command
	 * will trigger the respective command, allowing for proper management of AI-generated content.
	 *
	 * @returns void
	 */
	private undoRedoHandler() {
		const editor = this.editor;
		const undoCommand = editor.commands.get( 'undo' );
		if ( undoCommand ) {
			undoCommand.on( 'execute', () => {
				const editorData = editor.getData();
				if ( editorData.indexOf( 'ai-tag' ) > -1 ) {
					editor.execute( 'undo' );
				}
			} );
		}

		const redoCommand = editor.commands.get( 'redo' );
		if ( redoCommand ) {
			redoCommand.on( 'execute', () => {
				const editorData = editor.getData();
				if ( editorData.indexOf( 'ai-tag' ) > -1 ) {
					editor.execute( 'redo' );
				}
			} );
		}
	}

	/**
	 * Inserts AI tags into the editor at the current selection position.
	 *
	 * This function creates two AI tags: one inline tag and one block tag.
	 * The inline tag is inserted immediately after the current selection,
	 * while the block tag is inserted after the parent element of the selection.
	 *
	 * @param blockID - The unique identifier for the AI block, used to set the ID of the tags.
	 *
	 * @returns A Promise that resolves when the tags have been successfully inserted.
	 */
	private async insertAiTag( blockID: string ) {
		const editor = this.editor;
		editor.model.change( writer => {
			const position = this.editor.model.document.selection.getLastPosition();
			let newPosition: Position | undefined;
			if ( position ) {
				if ( position?.parent.name === 'inline-slash' ) {
					if ( position?.parent?.parent ) {
						newPosition = writer.createPositionAt( position.parent.parent, 'after' );
					}
					if ( position?.parent ) {
						const parentJson = position?.parent?.parent?.toJSON() as any;
						if ( parentJson.children.length > 1 ) {
							const positionInline = writer.createPositionAt( position.parent, 'after' );
							const aiTagInline = writer.createElement( 'ai-tag', {
								id: `${ blockID }-inline`
							} );
							writer.insert( aiTagInline, positionInline );
						}
					}
				} else {
					const aiTagInline = writer.createElement( 'ai-tag', {
						id: `${ blockID }-inline`
					} );
					writer.insert( aiTagInline, position );
					newPosition = writer.createPositionAt( position.parent, 'after' );
				}
				if ( newPosition ) {
					const aiTag = writer.createElement( 'ai-tag', {
						id: blockID
					} );
					writer.insert( aiTag, newPosition );
				}
			}
		} );
	}
}

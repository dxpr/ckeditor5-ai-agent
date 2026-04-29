import {
	type EngineCreateOpts,
	type LlmEngine,
	type LlmCompletionOpts,
	igniteEngine,
	Message
} from 'multi-llm-ts/dist/index.js';
import type { Editor } from 'ckeditor5/src/core.js';
import type { LocaleTranslate } from 'ckeditor5';
import type { ModelElement as Element } from 'ckeditor5/src/engine.js';
import { ButtonView } from 'ckeditor5/src/ui.js';
import { env } from 'ckeditor5/src/utils.js';
import { PromptHelper } from './util/prompt.js';
import { ProcessContentHelper } from './util/process-content.js';
import { HtmlParser } from './util/htmlparser.js';
import { getErrorMessages } from './util/translations.js';
import { moderateContent } from './util/moderate-content.js';
import { AIApi } from './util/ai-api.js';
import { checkModel } from './util/check-model.js';
import { setContextDomains, clearContextDomains } from './util/ai-output-filter.js';
import type { AiModel, AiEngine, ModerationFlagsTypes, AIApiConfig } from './type-identifiers.js';
import { aiAgentContext } from './aiagentcontext.js';
import { AI_ENGINE } from './const.js';

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
	private providers?: string;
	private creditsUrl?: string;

	private isInlineInsertion: boolean = false;
	private abortGeneration: boolean = false;
	private moderationKey: string;
	private moderationEnable: boolean;
	private disableFlags: Array<ModerationFlagsTypes> = [];
	private stream: any;
	private writesPerSecond: number;
	private processContentHelper: ProcessContentHelper;
	private readonly FILTERED_STRINGS = /```html|```|html\n|@@@cursor@@@/g;

	private getOutputMetrics( content: string ): { outputLength: number; outputWordCount: number } {
		const safeContent = content || '';
		const outputLength = safeContent.length;
		const tempElement = document.createElement( 'div' );
		tempElement.innerHTML = safeContent;
		const plainText = ( tempElement.textContent || tempElement.innerText || '' ).trim();
		const outputWordCount = plainText ? plainText.split( /\s+/ ).length : 0;

		return { outputLength, outputWordCount };
	}

	/**
	 * Initializes the AiAgentService with the provided editor and configuration settings.
	 *
	 * @param editor - The CKEditor instance to be used with the AI assist service.
	 */
	constructor( editor: Editor ) {
		this.editor = editor;
		const config = editor.config.get( 'aiAgent' )!;
		this.promptHelper = new PromptHelper( editor );
		this.htmlParser = new HtmlParser( editor );

		// Wire up blocked URL notifications to the UI component
		const filterConfig = {
			allowedDomains: config.aiOutputSecurity?.allowedDomains,
			onUrlBlocked: ( blockedUrls: string[] ) => {
				const uiComponent = aiAgentContext.uiComponent;
				if ( uiComponent?.showBlockedUrlsWarning ) {
					uiComponent.showBlockedUrlsWarning( blockedUrls );
				}
			}
		};
		this.processContentHelper = new ProcessContentHelper( editor, filterConfig );

		this.aiModel = config.model!;
		this.apiKey = config.apiKey;
		this.aiEngine = config.engine!;
		this.endpointUrl = config.endpointUrl!;
		this.temperature = config.temperature;
		this.timeOutDuration = config.timeOutDuration ?? 120000;
		this.maxTokens = config.maxOutputTokens ?? config.maxTokens!;
		this.retryAttempts = config.retryAttempts!;
		this.stopSequences = config.stopSequences!;
		this.streamContent = config.streamContent ?? true;
		this.moderationKey = config.moderationKey ?? '';
		this.moderationEnable = config.moderationEnable ?? false;
		this.disableFlags = config.moderationDisableFlags ?? [];
		this.writesPerSecond = config.writesPerSecond ?? 10;
		this.providers = config.providers;
		this.creditsUrl = config.creditsUrl;
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

			const firstPos = selection.getFirstPosition();
			const lastPos  = selection.getLastPosition();
			const blocks = Array.from(selection.getSelectedBlocks());
			const block = blocks[0];
			let pathsEqual = false;
			if (block) {
				const range = model.createRangeIn(block);
				const startLine = range.start.path;
				const endLine = range.end.path;
				const firstPosPath = firstPos?.path;
				const lastPosPath = lastPos?.path;
				
				pathsEqual = Boolean(firstPosPath && lastPosPath && 
					firstPosPath.length === startLine.length && 
					lastPosPath.length === endLine.length &&
					firstPosPath.every((val, i) => val === startLine[i]) &&
					lastPosPath.every((val, i) => val === endLine[i]));
				
			}

			if (pathsEqual && block) {
				const fragHtml = editor.model.change( writer => {
					const rangeOnBlock = writer.createRangeOn(block);
					const frag = model.getSelectedContent( model.createSelection(rangeOnBlock) );
					
					const viewFrag = editor.data.toView(frag);
					return editor.data.processor.toData(viewFrag);
				});
				selectedContent = fragHtml;
			} else {
				const viewFragment = editor.data.toView( selectedContentFragment );
				selectedContent = editor.data.processor.toData( viewFragment );
			}
			content = command;
		}

		if ( this.moderationEnable ) {
			const moderateContentData = await moderateContent( {
				content: content!,
				moderationKey: this.moderationKey,
				timeOutDuration: this.timeOutDuration,
				disableFlags: this.disableFlags,
				t: editor.t
			} );
			if ( !moderateContentData ) {
				return;
			}
		}

		try {
			aiAgentContext.showLoader( editor );
			const prompt = await this.promptHelper.generateGptPromptBasedOnUserPrompt(
				content!,
				parentEquivalentHTML?.innerHTML,
				selectedContent
			);
			if ( parent && prompt ) {
				// Set context domains for URL filtering - preserve URLs from user's prompt and existing content
				setContextDomains( `${ content || '' } ${ selectedContent || '' } ${ parentEquivalentHTML?.innerHTML || '' }` );
				await this.fetchAndProcessGptResponse( !!command, prompt, parent );
			}
		} catch ( error ) {
			console.error( 'Error handling slash command:', error );
			throw error;
		} finally {
			this.isInlineInsertion = false;
			aiAgentContext.hideLoader( editor );
			clearContextDomains();
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
		const editor = this.editor;
		const t = editor.t;
		const controller = new AbortController();
		this.abortGeneration = false;

		// Create a timeout that can be reset
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		const resetTimeout = () => {
			if ( timeoutId ) {
				clearTimeout( timeoutId );
			}
			timeoutId = setTimeout( () => controller.abort(), this.timeOutDuration );
		};

		// Set initial timeout
		resetTimeout();

		const blockID = `ai-${ new Date().getTime() }`;
		const generationStartTime = performance.now();
		try {
			let llm: LlmEngine | undefined;
			let response;
			let outputMetrics = {
				outputLength: 0,
				outputWordCount: 0
			};

			const contentMatch = prompt.match(
				/<CONTEXT>([\s\S]*?)<\/CONTEXT>/,
			);
			let prediction;
			if (contentMatch && contentMatch[1]) {
				prediction = {
					type: "content",
					content: contentMatch[1]
				};
			}

			if ( AI_ENGINE.includes( this.aiEngine as any ) ) {
				const config = {
					apiKey: this.apiKey
				};

				const { success, error } = await checkModel( this.aiEngine, this.aiModel, this.apiKey );
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
				if (prediction) {
					completionOpts.customOpts = {
						prediction
					};
				}
				
				if ( this.streamContent ) {
					// Streaming path
					const stream = this.generate( llm, this.aiModel, messages, completionOpts );
					outputMetrics = await this.handleStreamingResponse( stream, blockID, parent, command, controller, llm, resetTimeout );
				} else {
					// Non-streaming path
					const result = await llm.complete( this.aiModel, messages, completionOpts );
					if ( !result.content ) {
						throw new Error( t( 'Empty response from AI model' ) );
					}
					outputMetrics = await this.handleNonStreamingResponse( result.content, blockID, parent, command );
				}
			} else {
				const config: AIApiConfig = {
					apiKey: this.apiKey,
					baseURL: this.endpointUrl,
					engine: this.aiEngine,
					editor: this.editor
				};

				// Add providers if engine is dxai and model is kavya-m1 (default model)
				if ( this.aiEngine === 'dxai' && this.aiModel === 'kavya-m1' && this.providers ) {
					config.providers = this.providers;
				}

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
						stop: this.stopSequences,
						...(prediction !== undefined && {prediction})
					},
					controller,
					retries
				);
				outputMetrics = await this.handleStreamingResponse( response, blockID, parent, command, controller, llm, resetTimeout );
			}

			// Dispatch success event for external analytics integration
			if ( this.abortGeneration ) {
				return;
			}
			document.dispatchEvent( new CustomEvent( 'dxpr:ai:generation:success', {
				detail: {
					model: this.aiModel,
					responseModel: this.aiModel,
					promptLength: prompt?.length || 0,
					generationDurationMs: Math.round( performance.now() - generationStartTime ),
					outputLength: outputMetrics.outputLength,
					outputWordCount: outputMetrics.outputWordCount
				}
			} ) );
		} catch ( error: any ) {
			if ( this.abortGeneration ) {
				return;
			}
			console.error( 'Error in fetchAndProcessGptResponse:', error );

			const { message: errorMessage, options: toastOptions } =
				this.getErrorNotification( error, t );

			// Dispatch failure event for external analytics integration
			document.dispatchEvent( new CustomEvent( 'dxpr:ai:generation:failure', {
				detail: {
					model: this.aiModel,
					promptLength: prompt?.length || 0,
					generationDurationMs: Math.round( performance.now() - generationStartTime ),
					errorType: error?.name || 'Error',
					errorCode: error?.status || error?.code || ''
				}
			} ) );

			aiAgentContext.showError( errorMessage, toastOptions );
			this.processContentHelper.processCompleted( blockID );
		} finally {
			if ( timeoutId ) {
				clearTimeout( timeoutId );
			}
			this.editor.disableReadOnlyMode( this.aiAgentFeatureLockId );
		}
	}

	private async handleStreamingResponse(
		stream: any,
		blockID: string,
		parent: Element,
		command: boolean,
		controller: AbortController,
		llm: LlmEngine | undefined,
		resetTimeout: () => void
	): Promise<{ outputLength: number; outputWordCount: number }> {
		let isFirstChunk = true;
		let contentBuffer = '';
		let generatedContent = '';
		const updateInterval = 1000 / this.writesPerSecond; // Calculate interval in ms

		const updateContent = async () => {
			if ( contentBuffer ) {
				await this.processContentHelper.updateContent( contentBuffer, blockID );
			}
		};

		const updateContentTimer = setInterval( updateContent, updateInterval );
		try {
			for await ( const c of stream ) {
				if ( isFirstChunk ) {
					aiAgentContext.hideLoader( this.editor );
					this.cancelGenerationButton( blockID, controller, llm );
					this.processContentHelper.undoRedoHandler();
					this.processContentHelper.insertAiTag( blockID );
					this.processContentHelper.clearParentContent( parent, command );
					isFirstChunk = false;
				}
				const chunk = c as any;

				if ( chunk.type === 'status' ) {
					await this.processContentHelper.animatedStatusMessages( chunk.text, blockID );
				}

				// Filter out markdown code blocks and normalize content
				const filteredText = chunk.text
					.replace( this.FILTERED_STRINGS, '' );

				if ( chunk.type === 'content' ) {
					contentBuffer += filteredText;
				}

				// Reset timeout when data is received
				resetTimeout();
			}
		} finally {
			clearInterval( updateContentTimer );
			await updateContent();
			this.processContentHelper.processCompleted( blockID );
			generatedContent = contentBuffer;
		}

		return this.getOutputMetrics( generatedContent );
	}

	private async handleNonStreamingResponse(
		content: string,
		blockID: string,
		parent: Element,
		command: boolean
	): Promise<{ outputLength: number; outputWordCount: number }> {
		aiAgentContext.hideLoader(this.editor);
		this.processContentHelper.insertAiTag( blockID );
		this.processContentHelper.clearParentContent( parent, command );

		// Filter out markdown code blocks and normalize content
		const filteredContent = content
			.replace( this.FILTERED_STRINGS, '' );

		if ( filteredContent ) {
			await this.htmlParser.insertSimpleHtml( filteredContent );
		}
		this.processContentHelper.processCompleted( blockID );

		return this.getOutputMetrics( filteredContent );
	}

	/**
     * Creates and configures a cancel generation button with keyboard shortcut support.
     *
     * @param blockID - Unique identifier for the AI generation block
     * @param controller - AbortController to cancel the ongoing AI generation
     * @private
     */
	private cancelGenerationButton( blockID: string, controller: AbortController, llm: LlmEngine | undefined ) {
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
				llm.stop( this.stream );
			} else {
				controller.abort();
			}
			this.processContentHelper.processCompleted( blockID );
		} );

		view.render();

		editor.keystrokes.set( 'Ctrl+Backspace', ( keyEvtData, cancel ) => {
			if ( keyEvtData.ctrlKey || keyEvtData.metaKey ) {
				this.abortGeneration = true;
				if ( llm ) {
					llm.stop( this.stream );
				} else {
					controller.abort();
				}
				this.processContentHelper.processCompleted( blockID );
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
	 * Generates a stream of messages from the specified language model (LLM) based on the provided input thread.
	 * This method handles the streaming of responses, yielding each message as it is received.
	 *
	 * @param llm - The language model instance used for generating responses.
	 * @param model - The identifier of the model to be used for generation.
	 * @param thread - An array of messages that form the context for the generation.
	 * @param opts - Options for the LLM completion, such as max tokens and temperature.
	 * @returns An async generator that yields messages from the LLM as they are received.
	 *
	 * @throws Will throw an error if the streaming process fails or if the model is invalid.
	 */
	private async* generate( llm: any, model: string, thread: Array<Message>, opts: LlmCompletionOpts ): any {
		const chatModel = llm.toModel(model);
		const response = await llm.stream(chatModel, thread, opts);
		this.stream = response?.stream;

		while (true) {
			let stream2 = null;
			for await (const chunk of this.stream) {
				const stream3 = llm.nativeChunkToLlmChunk(chunk, response.context);
				for await (const msg of stream3) {
					if (msg.type === "stream") {
						stream2 = msg.stream;
					} else {
						if (stream2 !== null && msg.type === "content" && msg.done) {
							msg.done = false;
						}
						yield msg;
					}
				}
			}
			if (!stream2) break;
			this.stream = stream2;
		}
	}

	private escapeHtml( text: string ): string {
		const div = document.createElement( 'div' );
		div.textContent = text;
		return div.innerHTML;
	}

	private getErrorNotification(
		error: any,
		t: LocaleTranslate
	): { message: string; options?: { type?: 'error' | 'warning'; html?: boolean } } {
		const status = error?.status;

		if ( status === 402 ) {
			if ( this.creditsUrl ) {
				const safeUrl = this.escapeHtml( this.creditsUrl );
				return {
					message: `${ t( 'You\'ve run out of AI credits.' ) } <a href="${ safeUrl }" target="_blank" rel="noopener">${ t( 'Add credits' ) } &rarr;</a>`,
					options: { type: 'error', html: true }
				};
			}
			return {
				message: t( 'You\'ve run out of AI credits.' ),
				options: { type: 'error' }
			};
		}

		if ( status === 401 ) {
			return {
				message: t( 'Invalid API key. Check your AI configuration.' ),
				options: { type: 'error' }
			};
		}

		if ( status === 429 ) {
			return {
				message: t( 'Too many requests. Please wait a moment and try again.' ),
				options: { type: 'warning' }
			};
		}

		if ( status >= 500 ) {
			return {
				message: t( 'The AI service is temporarily unavailable. Try again shortly.' ),
				options: { type: 'warning' }
			};
		}

		if ( !status && error?.name === 'AbortError' ) {
			return {
				message: t( 'Request timed out. Check your connection and try again.' ),
				options: { type: 'warning' }
			};
		}

		if ( status ) {
			return { message: getErrorMessages( status, t ) };
		}

		return {
			message: error?.message?.trim() ||
				t( 'We couldn\'t connect to the AI. Please check your internet connection.' ),
			options: { type: 'warning' }
		};
	}
}

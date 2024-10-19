import { Plugin, Command } from '@ckeditor/ckeditor5-core/dist/index.js';
import { createDropdown, SplitButtonView, ButtonView } from '@ckeditor/ckeditor5-ui/dist/index.js';
import sbd from 'sbd';

var ckeditor = "<svg width='68' height='64' viewBox='0 0 68 64' xmlns='http://www.w3.org/2000/svg'><g fill='none' fill-rule='evenodd'><path d='M43.71 11.025a11.508 11.508 0 0 0-1.213 5.159c0 6.42 5.244 11.625 11.713 11.625.083 0 .167 0 .25-.002v16.282a5.464 5.464 0 0 1-2.756 4.739L30.986 60.7a5.548 5.548 0 0 1-5.512 0L4.756 48.828A5.464 5.464 0 0 1 2 44.089V20.344c0-1.955 1.05-3.76 2.756-4.738L25.474 3.733a5.548 5.548 0 0 1 5.512 0l12.724 7.292z' fill='#FFF'/><path d='M45.684 8.79a12.604 12.604 0 0 0-1.329 5.65c0 7.032 5.744 12.733 12.829 12.733.091 0 .183-.001.274-.003v17.834a5.987 5.987 0 0 1-3.019 5.19L31.747 63.196a6.076 6.076 0 0 1-6.037 0L3.02 50.193A5.984 5.984 0 0 1 0 45.003V18.997c0-2.14 1.15-4.119 3.019-5.19L25.71.804a6.076 6.076 0 0 1 6.037 0L45.684 8.79zm-29.44 11.89c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49.001zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h18.479c.833 0 1.509-.67 1.509-1.498v-.715c0-.827-.676-1.498-1.51-1.498H16.244zm0 9.227c-.834 0-1.51.671-1.51 1.498v.715c0 .828.676 1.498 1.51 1.498h25.489c.833 0 1.51-.67 1.51-1.498v-.715c0-.827-.677-1.498-1.51-1.498h-25.49.001zm41.191-14.459c-5.835 0-10.565-4.695-10.565-10.486 0-5.792 4.73-10.487 10.565-10.487C63.27 3.703 68 8.398 68 14.19c0 5.791-4.73 10.486-10.565 10.486v-.001z' fill='#1EBC61' fill-rule='nonzero'/><path d='M60.857 15.995c0-.467-.084-.875-.251-1.225a2.547 2.547 0 0 0-.686-.88 2.888 2.888 0 0 0-1.026-.531 4.418 4.418 0 0 0-1.259-.175c-.134 0-.283.006-.447.018-.15.01-.3.034-.446.07l.075-1.4h3.587v-1.8h-5.462l-.214 5.06c.319-.116.682-.21 1.089-.28.406-.071.77-.107 1.088-.107.218 0 .437.021.655.063.218.041.413.114.585.218s.313.244.422.419c.109.175.163.391.163.65 0 .424-.132.745-.396.961a1.434 1.434 0 0 1-.938.325c-.352 0-.656-.1-.912-.3-.256-.2-.43-.453-.523-.762l-1.925.588c.1.35.258.664.472.943.214.279.47.514.767.706.298.191.63.339.995.443.365.104.749.156 1.151.156.437 0 .86-.064 1.272-.193.41-.13.778-.323 1.1-.581a2.8 2.8 0 0 0 .775-.981c.193-.396.29-.864.29-1.405h-.001z' fill='#FFF' fill-rule='nonzero'/></g></svg>\n";

var aiAssistIcon = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n    <path d=\"M4.00815 5.01816H19.3851V10.9145H21.1594V3.2439H2.23389V22.1694H12.3955V20.3951H4.00815V5.01816Z\" fill=\"#222330\"/>\n    <path d=\"M15.1908 20.046L20.9028 12.7065L22.9998 14.3385L17.2878 21.678L15.0341 22.755C14.8582 22.8391 14.6619 22.6862 14.7002 22.4951L15.1908 20.046Z\" fill=\"#222330\"/>\n    <path d=\"M16.1211 8.43794V15.7494H14.5753V8.43794H16.1211Z\" fill=\"#222330\"/>\n    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8.31458 15.7495H6.65807L9.18211 8.43804H11.1742L13.6947 15.7495H12.0382L11.4968 14.0823H8.85696L8.31458 15.7495ZM10.2067 10.1088L11.1051 12.8756H9.24951L10.1496 10.1088H10.2067Z\" fill=\"#222330\"/>\n</svg>";

/**
 * The AiAssistContext class provides a context for the AI Assist plugin,
 * allowing access to shared resources and state across different components.
 */ class AiAssistContext {
    static instance;
    _uiComponent;
    constructor(){}
    static getInstance() {
        if (!AiAssistContext.instance) {
            AiAssistContext.instance = new AiAssistContext();
        }
        return AiAssistContext.instance;
    }
    set uiComponent(component) {
        this._uiComponent = component;
    }
    showError(message) {
        if (this._uiComponent) {
            console.log('Showing error message...', message);
            this._uiComponent.showGptErrorToolTip(message);
        }
    }
    showLoader(rect) {
        if (this._uiComponent) {
            this._uiComponent.showLoader(rect);
        }
    }
    hideLoader() {
        if (this._uiComponent) {
            this._uiComponent.hideLoader();
        }
    }
}
const aiAssistContext = AiAssistContext.getInstance();

// const
const TOKEN_LIMITS = {
    'gpt-3': {
        min: 1,
        max: 4096,
        context: 16385
    },
    'gpt-3.5-turbo': {
        min: 1,
        max: 4096,
        context: 16385
    },
    'gpt-4': {
        min: 1,
        max: 4096,
        context: 128000
    },
    'gpt-4o': {
        min: 0,
        max: 4096,
        context: 128000
    },
    'gpt-4-turbo': {
        min: 1,
        max: 4096,
        context: 128000
    },
    'gpt-4o-mini': {
        min: 1,
        max: 4096,
        context: 128000
    }
};
const SUPPORTED_LANGUAGES = [
    'en',
    'es',
    'hi',
    'nl'
];

class AiAssistUI extends Plugin {
    PLACEHOLDER_TEXT_ID = 'slash-placeholder';
    GPT_RESPONSE_LOADER_ID = 'gpt-response-loader';
    GPT_RESPONSE_ERROR_ID = 'gpt-error';
    static get pluginName() {
        return 'AiAssistUI';
    }
    /**
	 * Initializes the AI Assist UI plugin, setting up UI components and event listeners.
	 * This method is called when the plugin is loaded.
	 */ init() {
        try {
            aiAssistContext.uiComponent = this;
            // Initialize UI components like buttons, placeholders, loaders, etc.
            this.initializeUIComponents();
            // Set displays content in the appropriate language.
            this.initializeUILanguage();
            // Attach event listeners for handling editor events and user interactions
            this.attachListener();
        } catch (error) {
            console.error(error.message);
        }
    }
    /**
	 * Initializes UI components such as placeholders, loaders, and buttons for the editor.
	 */ initializeUIComponents() {
        const editor = this.editor;
        const t = editor.t;
        // Register the inline-slash schema
        editor.model.schema.register('inline-slash', {
            inheritAllFrom: '$block',
            isInline: true,
            isObject: true,
            allowWhere: '$text',
            allowAttributes: [
                'class'
            ]
        });
        // Allow the inline-slash element to have text inside it
        editor.model.schema.extend('$text', {
            allowIn: 'inline-slash'
        });
        // Set up upcast conversion for inline-slash
        editor.conversion.for('upcast').elementToElement({
            view: {
                name: 'inline-slash',
                attributes: [
                    'class'
                ]
            },
            model: (viewElement, { writer })=>{
                return writer.createElement('inline-slash', {
                    class: viewElement.getAttribute('class')
                });
            },
            converterPriority: 'high'
        });
        editor.conversion.for('downcast').elementToElement({
            model: {
                name: 'inline-slash',
                attributes: [
                    'class'
                ]
            },
            view: (modelElement, { writer })=>{
                return writer.createContainerElement('inline-slash', {
                    class: modelElement.getAttribute('class')
                });
            }
        });
        this.addPlaceholder();
        this.addLoader();
        this.addGptErrorToolTip();
        editor.ui.componentFactory.add('aiAssistButton', (locale)=>{
            createDropdown(locale, SplitButtonView);
            const view = new ButtonView(locale);
            // const view =  dropdownView.buttonView;
            view.set({
                label: t('Ai assist'),
                icon: aiAssistIcon,
                tooltip: true
            });
            view.on('execute', ()=>{
                this.editor.model.change((writer)=>{
                    const position = this.editor.model.document.selection.getLastPosition();
                    if (position) {
                        const inlineSlashContainer = writer.createElement('inline-slash', {
                            class: 'ck-slash'
                        });
                        writer.insertText('/', inlineSlashContainer);
                        writer.insert(inlineSlashContainer, position);
                        const newPosition = writer.createPositionAt(inlineSlashContainer, 'end');
                        writer.setSelection(newPosition);
                    }
                });
                editor.editing.view.focus();
            });
            return view;
        });
    }
    /**
	 * Initializes the UI language settings based on the editor's locale.
	 * Displays an error tooltip if the current language is unsupported.
	 */ initializeUILanguage() {
        const editor = this.editor;
        const t = editor.t;
        const contentLanguageCode = editor.locale.contentLanguage;
        const supportedLanguages = SUPPORTED_LANGUAGES;
        if (!supportedLanguages.includes(contentLanguageCode)) {
            this.showGptErrorToolTip(t('Unsupported language code'));
        }
    }
    /**
	 * Attaches event listeners to the editor for handling user interactions and content changes.
	 */ attachListener() {
        const editor = this.editor;
        const model = editor.model;
        model.document.on('change:data', ()=>{
            setTimeout(()=>{
                this.applyPlaceholderToCurrentLine();
            }, 10);
        });
        model.document.selection.on('change:range', ()=>{
            setTimeout(()=>{
                this.applyPlaceholderToCurrentLine();
            }, 10);
            const modelRoot = editor.model.document.getRoot();
            if (modelRoot) {
                const modelRange = editor.model.createRangeIn(modelRoot);
                const itemsToRemove = [];
                for (const item of modelRange.getItems()){
                    if (item.is('element', 'inline-slash') && item.isEmpty) {
                        itemsToRemove.push(item); // Collect empty items
                    }
                }
                // Remove collected empty inline-slash elements
                editor.model.change((writer)=>{
                    for (const item of itemsToRemove){
                        writer.remove(item);
                    }
                });
            }
        });
        editor.editing.view.document.on('scroll', ()=>{
            this.hidePlaceHolder();
        });
        document.addEventListener('scroll', ()=>{
            this.hidePlaceHolder();
        });
    }
    /**
	 * Applies the placeholder to the current line in the editor if it is empty.
	 * Hides the placeholder if the line is not empty.
	 */ applyPlaceholderToCurrentLine() {
        const editor = this.editor;
        const model = editor.model;
        const modelSelection = model.document.selection;
        const block = modelSelection.getFirstPosition()?.parent;
        if (block && block.isEmpty) {
            this.hidePlaceHolder();
            setTimeout(async ()=>{
                if (block.is('element')) {
                    const rect = await this.getRectDomOfGivenModelElement(block);
                    if (rect) {
                        this.showPlaceHolder(rect);
                    }
                }
            }, 100);
        } else {
            this.hidePlaceHolder();
        }
    }
    /**
	 * Retrieves the DOM rectangle of a given model element.
	 *
	 * @param element - The model element for which to get the DOM rectangle.
	 * @returns A promise that resolves to the DOMRect of the element, or null if not found.
	 */ async getRectDomOfGivenModelElement(element) {
        const editor = this.editor;
        const mapper = editor.editing.mapper;
        const view = editor.editing.view;
        const equivalentView = mapper.toViewElement(element);
        if (equivalentView) {
            const domElement = view.domConverter.mapViewToDom(equivalentView);
            if (domElement) {
                return domElement.getBoundingClientRect();
            }
        }
        return null;
    }
    /**
	 * Adds a placeholder element to the document body for user interaction.
	 */ addPlaceholder() {
        const editor = this.editor;
        const t = editor.t;
        const placeholder = document.createElement('p');
        placeholder.id = this.PLACEHOLDER_TEXT_ID;
        placeholder.onclick = ()=>{
            editor.focus();
        };
        placeholder.classList.add('place-holder');
        placeholder.textContent = t('Type / to request AI content');
        document.body.appendChild(placeholder);
    }
    /**
	 * Shows the placeholder at the specified position.
	 *
	 * @param rect - The DOMRect object defining the position to show the placeholder.
	 */ showPlaceHolder(rect) {
        const ele = document.getElementById(this.PLACEHOLDER_TEXT_ID);
        const isReadOnlyMode = this.editor.isReadOnly;
        if (ele && rect && !isReadOnlyMode) {
            ele.classList.add('show-place-holder');
            ele.style.left = `${rect.left}px`;
            ele.style.top = `${rect.top}px`;
        } else if (ele) {
            ele.classList.remove('show-place-holder');
        }
    }
    /**
	 * Hides the placeholder element from the document.
	 */ hidePlaceHolder() {
        const ele = document.getElementById(this.PLACEHOLDER_TEXT_ID);
        if (ele) {
            ele.classList.remove('show-place-holder');
        }
    }
    /**
	 * Adds a loader element to the document body for indicating processing.
	 */ addLoader() {
        const loaderElement = document.createElement('div');
        loaderElement.id = this.GPT_RESPONSE_LOADER_ID;
        loaderElement.classList.add('gpt-loader');
        document.body.appendChild(loaderElement);
    }
    /**
	 * Shows the loader at the specified position.
	 *
	 * @param rect - The DOMRect object defining the position to show the loader.
	 */ showLoader(rect) {
        const ele = document.getElementById(this.GPT_RESPONSE_LOADER_ID);
        if (ele && rect) {
            ele.style.left = `${rect.left + 10}px`;
            ele.style.top = `${rect.top + 10}px`;
            ele.classList.add('show-gpt-loader');
        } else if (ele) {
            ele.classList.remove('show-gpt-loader');
        }
    }
    /**
	 * Hides the loader element from the document.
	 */ hideLoader() {
        const ele = document.getElementById(this.GPT_RESPONSE_LOADER_ID);
        if (ele) {
            ele.classList.remove('show-gpt-loader');
        }
    }
    /**
	 * Adds an error tooltip element to the document body for displaying error messages.
	 */ addGptErrorToolTip() {
        const tooltipElement = document.createElement('p');
        tooltipElement.id = this.GPT_RESPONSE_ERROR_ID;
        tooltipElement.classList.add('response-error');
        document.body.appendChild(tooltipElement);
    }
    /**
	 * Displays an error tooltip with the specified message.
	 *
	 * @param message - The error message to display in the tooltip.
	 */ showGptErrorToolTip(message) {
        console.log('Showing error message...', message);
        const editor = this.editor;
        const view = editor?.editing?.view?.domRoots?.get('main');
        const tooltipElement = document.getElementById(this.GPT_RESPONSE_ERROR_ID);
        const editorRect = view?.getBoundingClientRect();
        if (tooltipElement && editorRect) {
            tooltipElement.classList.add('show-response-error');
            tooltipElement.textContent = message;
            setTimeout(()=>{
                this.hideGptErrorToolTip();
            }, 2000);
        }
    }
    /**
	 * Hides the error tooltip element from the document.
	 */ hideGptErrorToolTip() {
        const tooltipElement = document.getElementById(this.GPT_RESPONSE_ERROR_ID);
        if (tooltipElement) {
            tooltipElement.classList.remove('show-response-error');
        }
    }
}

class AiAssistCommand extends Command {
    aiAssistService;
    /**
	 * Creates an instance of the AiAssistCommand.
	 *
	 * @param editor - The editor instance to which this command belongs.
	 * @param aiAssistService - The service instance that handles AI assist functionality.
	 */ constructor(editor, aiAssistService){
        super(editor);
        this.aiAssistService = aiAssistService;
    }
    /**
	 * Checks whether the command can be executed based on the current selection.
	 *
	 * @returns A boolean indicating if the command can be executed.
	 */ refresh() {
        // Enable the command when the selection is in an empty block or at the beginning of a block
        this.isEnabled = true;
    }
    /**
	 * Executes the AI assist command, processing the user's input and interacting with the AI service.
	 *
	 * @param options - An optional parameter for additional execution options.
	 */ async execute() {
        await this.aiAssistService.handleSlashCommand();
    }
}

class PromptHelper {
    editor;
    contextSize;
    responseOutputFormat;
    responseContextData;
    responseFilters;
    debugMode;
    constructor(editor){
        this.editor = editor;
        const config = editor.config.get('aiAssist');
        this.contextSize = config.contextSize;
        this.responseOutputFormat = config.promptSettings?.outputFormat ?? [];
        this.responseContextData = config.promptSettings?.contextData ?? [];
        this.responseFilters = config.promptSettings?.filters ?? [];
        this.debugMode = config.debugMode ?? false;
    }
    /**
	 * Constructs the system prompt that guides the AI in generating responses.
	 *
	 * This method assembles a comprehensive set of instructions and context
	 * that the AI will utilize to formulate responses based on user input
	 * and the provided content, ensuring adherence to specified rules and formats.
	 *
	 * @param isInlineResponse - A boolean indicating whether the response should be inline.
	 * @returns A string containing the formatted system prompt for the AI.
	*/ getSystemPrompt(isInlineResponse = false) {
        const corpus = [];
        corpus.push(`You will be provided with a partially written article with """@@@cursor@@@""" somewhere 
			under a CONTEXT section, user input under a TASK section, and sometimes there will be articles 
			(delimited with marked-up language) separated by Starting Markdown Content \${ number } and 
			Ending Markdown Content \${ index } with certain instructions to follow while generating a response 
			under an INSTRUCTION section`);
        corpus.push(`If there is an article with """Stating Markdown Content""", your task is to 
			use that provided information solely to respond to the user request in the TASK section.`);
        corpus.push('Follow these step-by-step instructions to respond to user inputs:');
        corpus.push(`Step 1 - Summarize information under the CONTEXT section, set a tone for the article, and 
			later use that summarized information to generate a response`);
        corpus.push(`Step 2: If there is an article with """Stating Markdown Content""", 
			break it into derived sections and eliminate unnecessary information 
			that does not relate to the context and user prompt.`);
        corpus.push('Final Step - use all summarized information to respond to user input under the TASK section');
        corpus.push('While generating the response, adhere to the following rules:');
        corpus.push(`1. Provide only the new text content that should replace "@@@cursor@@@" based on the context above, 
			ensuring that the response must primarily based on the request.`);
        corpus.push(`2. Avoid including any part of the context in the output at any cost, 
			except for necessary glimpses that enhance the response.`);
        corpus.push(`3. Ensure response adheres to the specified tone or style, such as 
			formal, informal, or technical, as appropriate for the context.`);
        corpus.push('4. Do not use any markdown formatting in your response. (e.g., **, ##, ###, ---, ===, ____).');
        corpus.push(`5. Use a relaxed, formal or informal tone based on the summary of context with lots of personal touches. 
			Feel free to include spontaneous thoughts, offhand comments, or quirky observations.`);
        corpus.push(`6. Vary sentence lengths and styles—include fragments, casual interjections, 
			and minor grammar slips, but avoid spelling mistakes.`);
        corpus.push('7. Add in personal anecdotes or emotional reactions to make it sound like a genuine conversation.');
        corpus.push('8. Avoid overly polished language or structured sentences, aim for a natural and solely human-like tone.');
        if (isInlineResponse) {
            corpus.push(`9: Determine from the context, task, and the position of the @@@cursor@@@ whether the request 
				involves list items, table cells, or inline content.
				- List items: Format each item as <li> within an <ol> or <ul> as appropriate.
				- Table cells: Present each item in plain text, wrapping it within <p> tags.
				- Inline content: Wrap entire response in a single <p> tag, ensuring it fits seamlessly within the existing paragraph or 
				sentence structure where the @@@cursor@@@ is located.
				Strictly adherence to these rules is mandatory to avoid errors, based on where the @@@cursor@@@ is placed within content.`);
        }
        corpus.push('Above are the rules apply every time, but below will only be applied if markdown content is present');
        corpus.push('1. Extract each content as plain text without any special formatting, emphasis, or markdown');
        corpus.push('2. The response should synthesize information from both the editor content ' + 'and the fetched sources, maintaining a balance between them.');
        corpus.push('3. Highlight key points from the fetched sources while ensuring that ' + 'the context from the editor is acknowledged and integrated where relevant.');
        corpus.push('4. Clearly differentiate between the information derived from the editor ' + 'content and that from the fetched sources to avoid confusion.');
        corpus.push('When generating content, adhere to the following HTML-specific rules:');
        corpus.push('1. Generate an HTML snippet, not a full HTML document.');
        corpus.push('2. You are an HTML generator. When providing HTML code, ensure it follows standard HTML norms and best practices.');
        corpus.push('4. Block-level elements (e.g., <p>, <div>, <section>) must not contain other block-level elements.');
        corpus.push('5. Ensure valid nesting of elements.');
        corpus.push('6. Use the following allowed HTML tags:');
        corpus.push(`${this.getAllowedHtmlTags().join(', ')}`);
        corpus.push('7. Do not include any HTML, HEAD, or BODY tags.');
        corpus.push('8. Ensure all HTML tags are properly closed and nested.');
        corpus.push('9. Do not include any HTML, HEAD, or BODY tags.');
        corpus.push('10. Avoid using inline styles or class attributes unless specifically requested.');
        corpus.push('11. Provide clean, valid HTML that adheres to best practices and is ready for use in web development.');
        corpus.push('12. Beginning word of response must be a valid html tag');
        // Join all instructions into a single formatted string.
        const systemPrompt = corpus.join('\n');
        // Log the system prompt if debug mode is enabled
        if (this.debugMode) {
            console.group('AiAssist System Prompt Debug');
            console.log('System Prompt:');
            console.log(systemPrompt);
            console.groupEnd();
        }
        return systemPrompt;
    }
    /**
	 * Formats the final prompt to be sent to the GPT model, including context and instructions.
	 *
	 * @param request - The user's request string.
	 * @param context - The trimmed context string.
	 * @param markDownContents - An array of MarkdownContent objects for additional context.
	 * @param isEditorEmpty - A boolean indicating if the editor is empty.
	 * @returns The formatted prompt string.
	 */ formatFinalPrompt(request, context, markDownContents, isEditorEmpty) {
        const editor = this.editor;
        const contentLanguageCode = editor.locale.contentLanguage;
        const corpus = [];
        // Context and Task
        corpus.push('CONTEXT:');
        corpus.push(`\n"""\n${context}\n"""\n`);
        corpus.push('\n\nTASK:\n\n');
        corpus.push(`"""\n${request}\n"""\n`);
        // Markdown Content
        if (markDownContents.length) {
            corpus.push('Refer to following markdown content as a source of information, but generate new text that fits the given context & task.');
            markDownContents.forEach((markdown, index)=>{
                corpus.push(`\n\n------------ Stating Markdown Content ${index + 1} ------------\n\n`);
                corpus.push(markdown.content);
                corpus.push(`\n\n------------ Ending Markdown Content ${index + 1} ------------\n\n`);
            });
        }
        // Instructions
        corpus.push('\n\nINSTRUCTIONS:\n\n');
        corpus.push(`The response must follow the language code - ${contentLanguageCode}.`);
        // Response Output Format
        if (this.responseOutputFormat.length) {
            corpus.push(...this.responseOutputFormat);
        }
        // Markdown Content Usage
        if (markDownContents.length) {
            corpus.push('Use information from provided markdown content to generate new text, but do not copy it verbatim.');
            corpus.push('Ensure the new text flows naturally with the existing context and integrates smoothly.');
            corpus.push('Do not use any markdown formatting in your response. ' + 'specially for title and list item like """**Performance**""" is not acceptable where as """performance""" is.');
            corpus.push('consider whole markdown of single source as content and then generate % content requested');
        }
        // Response Filters
        if (this.responseFilters.length) {
            corpus.push(...this.responseFilters);
        } else {
            const defaultFilterInstructions = [
                'The response should directly follow the context, avoiding any awkward transitions or noticeable gaps.'
            ];
            corpus.push(...defaultFilterInstructions);
        }
        // Context-Specific Instructions
        if (!isEditorEmpty) {
            const defaultContextInstructions = [
                'Ensure the inserted content maintains a seamless connection with the surrounding text,',
                'making the transition smooth and natural.',
                'Do not modify the original text except to replace the "@@@cursor@@@" placeholder with the generated content.'
            ];
            corpus.push(...defaultContextInstructions);
        }
        if (this.responseContextData.length) {
            corpus.push(...this.responseContextData);
        }
        // Debugging Information
        if (this.debugMode) {
            console.group('AiAssist Prompt Debug');
            console.log('User Prompt:', request);
            console.log('Generated GPT Prompt:');
            console.log(corpus.join('\n'));
            console.groupEnd();
        }
        // Join all instructions into a single formatted string.
        return corpus.join('\n');
    }
    /**
	 * Trims the context around the user's prompt to create a suitable context for the AI model.
	 * This method identifies the position of the user's prompt within the provided text and extracts
	 * the surrounding context, placing a cursor placeholder where the prompt is located.
	 *
	 * @param prompt - The user's prompt string to locate within the context.
	 * @param promptContainerText - The text container in which the prompt is located (optional).
	 * @returns The trimmed context string with a cursor placeholder indicating the prompt's position.
	*/ trimContext(prompt, promptContainerText = '') {
        let contentBeforePrompt = '';
        let contentAfterPrompt = '';
        const splitText = promptContainerText ?? prompt;
        const editor = this.editor;
        const view = editor?.editing?.view?.domRoots?.get('main');
        const context = view?.innerText ?? '';
        const matchIndex = context.indexOf(splitText);
        const nextEnterIndex = context.indexOf('\n', matchIndex);
        const firstNewlineIndex = nextEnterIndex !== -1 ? nextEnterIndex : matchIndex + splitText.length;
        const beforeNewline = context.substring(0, firstNewlineIndex);
        const afterNewline = context.substring(firstNewlineIndex + 1);
        const contextParts = [
            beforeNewline,
            afterNewline
        ];
        const allocatedEditorContextToken = Math.floor(this.contextSize * 0.3);
        if (contextParts.length > 1) {
            if (contextParts[0].length < contextParts[1].length) {
                contentBeforePrompt = this.extractEditorContent(contextParts[0], allocatedEditorContextToken / 2, true);
                contentAfterPrompt = this.extractEditorContent(contextParts[1], allocatedEditorContextToken - contentBeforePrompt.length / 4);
            } else {
                contentAfterPrompt = this.extractEditorContent(contextParts[1], allocatedEditorContextToken / 2);
                contentBeforePrompt = this.extractEditorContent(contextParts[0], allocatedEditorContextToken - contentAfterPrompt.length / 4, true);
            }
        }
        // Combine the trimmed context with the cursor placeholder
        const escapedPrompt = prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
        contentBeforePrompt = contentBeforePrompt.trim().replace(new RegExp(escapedPrompt.slice(1)), '@@@cursor@@@');
        const trimmedContext = `${contentBeforePrompt}\n${contentAfterPrompt}`;
        return trimmedContext.trim();
    }
    /**
	 * Allocates tokens to the fetched content based on the available limit and the user's prompt.
	 *
	 * @param prompt - The user's prompt string.
	 * @param fetchedContent - An array of MarkdownContent objects containing fetched content.
	 * @returns An array of MarkdownContent objects with calculated tokenToRequest values.
	 */ allocateTokensToFetchedContent(prompt, fetchedContent) {
        const editorContent = this.editor?.editing?.view?.domRoots?.get('main')?.innerText ?? '';
        const editorToken = Math.min(Math.floor(this.contextSize * 0.3), this.countTokens(editorContent));
        let availableLimit = this.contextSize - editorToken;
        fetchedContent = fetchedContent.map((content)=>({
                ...content,
                availableToken: this.countTokens(content.content)
            })).sort((a, b)=>(a.availableToken ?? 0) - (b.availableToken ?? 0));
        let maxTokenFromEachURL = availableLimit / fetchedContent.length;
        return fetchedContent.map((content, index)=>{
            if (content.availableToken && content.availableToken <= maxTokenFromEachURL) {
                content.tokenToRequest = content.availableToken;
                availableLimit -= content.availableToken;
            } else if (content.availableToken) {
                content.tokenToRequest = maxTokenFromEachURL;
                availableLimit -= maxTokenFromEachURL;
            }
            maxTokenFromEachURL = availableLimit / (fetchedContent.length - (index + 1));
            if (content.tokenToRequest) {
                content.content = this.trimLLMContentByTokens(content.content, content.tokenToRequest);
            }
            return content;
        });
    }
    /**
	 * Generates Markdown content for an array of URLs by fetching their content.
	 *
	 * @param urls - An array of URLs to fetch content from.
	 * @returns A promise that resolves to an array of MarkdownContent objects.
	 */ async generateMarkDownForUrls(urls) {
        const editor = this.editor;
        const t = editor.t;
        let errorMsg;
        const markDownContents = await Promise.all(urls.map(async (url)=>{
            const content = await this.fetchUrlContent(url);
            return {
                content,
                url
            };
        }));
        const emptyContent = markDownContents.filter((content)=>!content?.content);
        if (emptyContent.length) {
            const urlStr = emptyContent?.map((content)=>content?.url).join(',');
            errorMsg = t('Failed to fetch content of : %0', urlStr);
            if (errorMsg) {
                aiAssistContext.showError(errorMsg);
            }
            throw new Error('Unable to fetch content for few urls');
        }
        return markDownContents.filter((content)=>content !== null);
    }
    /**
	 * Fetches the content of a given URL and returns it as a string.
	 *
	 * @param url - The URL to fetch content from.
	 * @returns A promise that resolves to the fetched content as a string.
	 * @throws Will throw an error if the URL is invalid or if the fetch fails.
	 */ async fetchUrlContent(url) {
        const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
        const trimmedUrl = url.trim();
        if (!urlRegex.test(trimmedUrl)) {
            throw new Error('Invalid URL');
        }
        try {
            // Use a regular expression to remove hidden characters
            const cleanedUrl = trimmedUrl.replace(/[^\x20-\x7E]/g, '');
            const requestURL = `https://r.jina.ai/${cleanedUrl.trim()}`;
            const response = await fetch(requestURL.trim(), {
                headers: {
                    'X-With-Generated-Alt': 'true'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            // Updated error matching
            if (content.includes('Warning: Target URL returned error')) {
                throw new Error(`Target URL (${trimmedUrl}) returned an error`);
            }
            if (content.trim().length === 0) {
                throw new Error('Empty content received');
            }
            return content.replace(/\(https?:\/\/[^\s]+\)/g, '').replace(/^\s*$/gm, '').trim();
        } catch (error) {
            console.error(`Failed to fetch content: ${url}`, error);
            return '';
        }
    }
    /**
	 * Counts the number of tokens in the provided content string.
	 *
	 * @param content - The content string to count tokens in.
	 * @returns The number of tokens in the content.
	 */ countTokens(content) {
        if (!content || typeof content !== 'string') {
            return 0;
        }
        // Normalize the content by trimming and reducing multiple whitespaces.
        const normalizedContent = content.trim().replace(/\s+/g, ' ');
        // Approximate tokens by breaking words, contractions, and common punctuation marks.
        const tokens = normalizedContent.match(/\b\w+('\w+)?\b|[.,!?;:"(){}[\]]/g) || [];
        // Heuristic: Long words (over 10 characters) are likely to be split into multiple tokens.
        // GPT often breaks down long words into smaller subword chunks.
        let approxTokenCount = 0;
        tokens.forEach((token)=>{
            // Break long words into chunks to approximate GPT subword tokenization.
            if (token.length > 10) {
                approxTokenCount += Math.ceil(token.length / 4); // Approximation: 4 characters per token.
            } else {
                approxTokenCount += 1;
            }
        });
        return approxTokenCount;
    }
    /**
	 * Trims the LLM content by tokens while ensuring that sentences or other structures (e.g., bullet points, paragraphs)
	 * are not clipped mid-way.
	 *
	 * @param content - The LLM-generated content string to trim.
	 * @param maxTokens - The maximum number of tokens allowed.
	 * @returns The trimmed content string.
	 */ trimLLMContentByTokens(content, maxTokens) {
        const elements = content.split('\n');
        let accumulatedTokens = 0;
        let trimmedContent = '';
        for (const element of elements){
            const elementTokenCount = this.countTokens(element);
            if (accumulatedTokens + elementTokenCount > maxTokens) {
                break; // Stop if adding this element would exceed the token limit.
            }
            accumulatedTokens += elementTokenCount;
            trimmedContent += element + '\n'; // Add the whole structural element.
        }
        return trimmedContent;
    }
    /**
	 * Retrieves the allowed HTML tags based on the CKEditor schema.
	 *
	 * @returns An array of allowed HTML tags.
	 */ getAllowedHtmlTags() {
        const editor = this.editor;
        const schema = editor.model.schema;
        const definitions = schema.getDefinitions();
        const schemaNodes = Object.keys(definitions).sort();
        // Map of CKEditor nodes to HTML tags
        const nodeToHtmlMap = {
            blockQuote: 'blockquote',
            caption: 'figcaption',
            codeBlock: 'pre',
            heading1: 'h1',
            heading2: 'h2',
            heading3: 'h3',
            imageBlock: 'img',
            imageInline: 'img',
            paragraph: 'p',
            table: 'table',
            tableCell: 'td',
            tableRow: 'tr',
            $listItem: 'li',
            horizontalLine: 'hr'
        };
        // Map text attributes to HTML tags
        const textAttributeToHtmlMap = {
            bold: 'strong',
            italic: 'em',
            code: 'code',
            strikethrough: 's',
            subscript: 'sub',
            superscript: 'sup',
            underline: 'u',
            linkHref: 'a'
        };
        // Collect allowed tags
        const allowedTags = new Set();
        // Add tags from node mappings
        schemaNodes.forEach((node)=>{
            if (node in nodeToHtmlMap) {
                allowedTags.add(nodeToHtmlMap[node]);
            }
        });
        // Add tags from text attributes
        const textDefinition = definitions.$text;
        if (textDefinition && textDefinition.allowAttributes) {
            textDefinition.allowAttributes.forEach((attr)=>{
                if (attr in textAttributeToHtmlMap) {
                    allowedTags.add(textAttributeToHtmlMap[attr]);
                }
            });
        }
        // If listItem is present, add ul and ol
        if (allowedTags.has('li')) {
            allowedTags.add('ul');
            allowedTags.add('ol');
        }
        // Sort and return the unique allowed tags
        return Array.from(allowedTags).sort();
    }
    /**
	 * Extracts a portion of content based on the specified context size and direction.
	 *
	 * @param contentAfterPrompt - The content string to extract from.
	 * @param contextSize - The maximum size of the context to extract.
	 * @param reverse - A boolean indicating whether to extract in reverse order (default is false).
	 * @returns The extracted content string.
	 */ extractEditorContent(contentAfterPrompt, contextSize, reverse = false) {
        let trimmedContent = '';
        let charCount = 0;
        // Tokenize the content into sentences using the sbd library
        const sentences = sbd.sentences(contentAfterPrompt, {
            preserve_whitespace: true,
            html_boundaries: true,
            allowed_tags: [
                'blockquote',
                'figcaption',
                'pre',
                'h2',
                'h1',
                'h3',
                'img',
                'p',
                'table',
                'td',
                'tr',
                'li',
                'hr',
                'br'
            ]
        });
        // Iterate over the sentences based on the direction
        const iterator = reverse ? sentences.reverse() : sentences;
        for (const sentence of iterator){
            const sentenceLength = sentence.length;
            // Check if adding this sentence would exceed the context size
            if ((charCount + sentenceLength) / 4 <= contextSize) {
                trimmedContent = reverse ? sentence + trimmedContent : trimmedContent + sentence;
                charCount += sentenceLength;
            } else {
                break; // Stop if adding the next sentence would exceed the context size
            }
        }
        // Trim to remove any trailing whitespace and return the final trimmed content
        return trimmedContent.trim();
    }
}

class HtmlParser {
    editor;
    model;
    constructor(editor){
        this.editor = editor;
        this.model = editor.model;
    }
    /**
	 * Inserts simple HTML content into the editor.
	 *
	 * @param html - The HTML string to be inserted into the editor.
	 * @returns A promise that resolves when the HTML has been inserted.
	 */ async insertSimpleHtml(html) {
        console.log('Attempting to insert simple HTML:', html);
        const viewFragment = this.editor.data.processor.toView(html);
        const modelFragment = this.editor.data.toModel(viewFragment, '$root');
        const selection = this.model.document.selection;
        const root = this.model.document.getRoot();
        let insertionPosition = selection.getLastPosition();
        const lastInsertedChild = modelFragment.getChild(modelFragment.childCount - 1);
        const currentChildIndex = selection.getLastPosition()?.path[0];
        const lastUpdatedElementInRoot = root?.getChild(currentChildIndex ?? 0);
        this.model.change((writer)=>{
            if (lastUpdatedElementInRoot?.is('element')) {
                insertionPosition = lastUpdatedElementInRoot.isEmpty ? writer.createPositionAt(lastUpdatedElementInRoot, 'end') : writer.createPositionAfter(lastUpdatedElementInRoot);
            }
            if (insertionPosition && root) {
                // Insert element to current selection
                writer.setSelection(insertionPosition);
                this.model.insertContent(modelFragment, insertionPosition);
                // Check if it required to add break to current context of list etc.
                // More to will be added during testing any edge case
                let isBreakElementReq = lastInsertedChild?.getAttribute('listItemId');
                if (lastInsertedChild?.is('element')) {
                    isBreakElementReq = isBreakElementReq || lastInsertedChild.name === 'table';
                }
                if (isBreakElementReq && lastInsertedChild) {
                    const paragraph = writer.createElement('paragraph');
                    writer.insert(paragraph, writer.createPositionAfter(lastInsertedChild));
                    writer.setSelection(paragraph, 'in');
                } else if (lastInsertedChild) {
                    writer.setSelection(writer.createPositionAfter(lastInsertedChild));
                }
            }
        });
        // Maintain a delay to simulate asynchronous behavior
        await new Promise((resolve)=>setTimeout(resolve, 100));
    }
    /**
	 * Inserts HTML content as text into the editor.
	 *
	 * @param content - The HTML element containing the text to be inserted.
	 * @param position - The position at which to insert the text (optional).
	 * @param stream - Indicates whether to insert text in a streaming manner (default is false).
	 * @param shouldAddBreakAtEnd - Indicates whether to add a paragraph break at the end of the inserted content (default is false).
	 * @returns A promise that resolves when the text has been inserted.
	 *
	 * This method processes the provided HTML element, converting it to a model fragment,
	 * and inserts it into the editor at the specified position. If streaming is enabled,
	 * elements are inserted one at a time, allowing for a more dynamic insertion experience.
	 * An optional paragraph break can be added at the end of the inserted content.
	*/ async insertAsText(content, position, stream = false, shouldAddBreakAtEnd = false) {
        const viewFragment = this.editor.data.processor.toView(content.outerHTML);
        const modelFragment = this.editor.data.toModel(viewFragment, '$root');
        const childrenToInsert = Array.from(modelFragment.getChildren());
        const root = this.model.document.getRoot();
        for (const [index, element] of childrenToInsert.entries()){
            if (element.is('element')) {
                const insertPosition = index === 0 ? position : undefined; // Determine position for insertion
                if (stream) {
                    await this.insertElementAsStream(element, insertPosition);
                } else {
                    await this.batchInsertOfElement(element, insertPosition);
                }
            }
        }
        if (shouldAddBreakAtEnd) {
            this.model.change((writer)=>{
                const lastPosition = this.model.document.selection.getLastPosition();
                const currentChildIndex = lastPosition?.path[0];
                if (root && currentChildIndex != undefined) {
                    const paragraph = writer.createElement('paragraph');
                    writer.insert(paragraph, root, currentChildIndex + 1);
                    writer.setSelection(paragraph, 'in');
                }
            });
        }
    }
    /**
	 * Inserts a given element into the editor at the specified position.
	 *
	 * @param element - The element to be inserted into the editor.
	 * @param position - The position at which to insert the element.
	 * If not provided, the element will be inserted at the current selection position.
	 * @returns A promise that resolves when the element has been inserted.
	 */ async batchInsertOfElement(element, position) {
        const selection = this.model.document.selection;
        const root = this.model.document.getRoot();
        let insertionPosition = position;
        if (!position) {
            const currentChildIndex = selection.getFirstPosition()?.path[0];
            const lastUpdatedElementInRoot = root?.getChild(currentChildIndex ?? 0);
            if (lastUpdatedElementInRoot?.is('element')) {
                insertionPosition = lastUpdatedElementInRoot.isEmpty ? this.model.createPositionAt(lastUpdatedElementInRoot, 'end') : this.model.createPositionAfter(lastUpdatedElementInRoot);
            }
        }
        // insert content at current identified position
        this.model.change((writer)=>{
            this.model.insertContent(element, insertionPosition);
            writer.setSelection(element, 'end');
        });
    }
    /**
	 * Inserts a given element into the editor at the specified position in a streaming manner.
	 *
	 * @param element - The element to be inserted into the editor.
	 * @param position - The position at which to insert the element.
	 * If not provided, the element will be inserted at the current selection position.
	 * @returns A promise that resolves when the element has been inserted and all text has been streamed in.
	 */ async insertElementAsStream(element, position) {
        const selection = this.model.document.selection;
        const root = this.model.document.getRoot();
        const lastRecognizedPosition = selection.getLastPosition();
        let insertionPosition = position;
        let targetElement;
        // Determine insertion position
        if (!position) {
            const currentChildIndex = lastRecognizedPosition?.path[0];
            const lastUpdatedElement = root?.getChild(currentChildIndex ?? 0);
            if (lastUpdatedElement?.is('element')) {
                insertionPosition = lastUpdatedElement.isEmpty ? this.model.createPositionAt(lastUpdatedElement, 'end') : this.model.createPositionAfter(lastUpdatedElement);
            }
            this.model.change((writer)=>{
                targetElement = writer.createElement(element.name);
                // Set attributes in a more concise way
                for (const [key, value] of element.getAttributes()){
                    targetElement._setAttribute(key, value);
                }
                this.model.insertContent(targetElement, insertionPosition);
                if (insertionPosition) {
                    writer.setSelection(targetElement, 'end');
                }
            });
        } else {
            // current element from the offset
            const currentElement = lastRecognizedPosition?.parent;
            if (currentElement?.is('element')) {
                targetElement = currentElement;
            }
        }
        const textChildren = Array.from(element.getChildren()).filter((child)=>child.is('$text'));
        for (const textNode of textChildren){
            if (!textNode.is('$text')) {
                continue;
            }
            const textAttributes = Array.from(textNode.getAttributes());
            const textContent = textNode._data;
            for (const char of textContent){
                await new Promise((resolve)=>{
                    this.model.change((writer)=>{
                        const currentPosition = this.editor.model.document.selection.getLastPosition();
                        const newPosition = currentPosition.getShiftedBy(1);
                        const shouldAppendAtEnd = newPosition.offset === currentPosition?.parent.maxOffset;
                        writer.insertText(char, textAttributes, targetElement, shouldAppendAtEnd ? 'end' : currentPosition?.offset);
                        writer.setSelection(this.editor.model.document.selection.getLastPosition());
                    });
                    setTimeout(resolve, 5); // Maintain the streaming effect
                });
            }
        }
        // Set selection
        if (!position) {
            this.model.change((writer)=>{
                writer.setSelection(targetElement, 'end');
            });
        }
    }
    /**
	 * Validate given string as a HTML content
	 * @param content string containing html content
	 * @returns A boolean value as result of validation
	 */ isCompleteHtmlChunk(html) {
        const openingTags = (html.match(/<[^/][^>]*>/g) || []).length;
        const closingTags = (html.match(/<\/[^>]+>/g) || []).length;
        // Check if all opening tags have corresponding closing tags
        if (openingTags !== closingTags) {
            return false;
        }
        // Check for incomplete tags
        if (html.includes('<') && !html.includes('>')) {
            return false;
        }
        // Check if the HTML starts with an opening tag and ends with a closing tag
        const trimmedHtml = html.trim();
        if (!trimmedHtml.startsWith('<') || !trimmedHtml.endsWith('>')) {
            return false;
        }
        return true;
    }
}

class AiAssistService {
    editor;
    aiModel;
    apiKey;
    endpointUrl;
    temperature;
    timeOutDuration;
    maxTokens;
    retryAttempts;
    streamContent;
    stopSequences;
    aiAssistFeatureLockId = Symbol('ai-assist-feature');
    promptHelper;
    htmlParser;
    buffer = '';
    openTags = [];
    isInlineInsertion = false;
    /**
	 * Initializes the AiAssistService with the provided editor and configuration settings.
	 *
	 * @param editor - The CKEditor instance to be used with the AI assist service.
	 */ constructor(editor){
        this.editor = editor;
        this.promptHelper = new PromptHelper(editor);
        this.htmlParser = new HtmlParser(editor);
        const config = editor.config.get('aiAssist');
        this.aiModel = config.model;
        this.apiKey = config.apiKey;
        this.endpointUrl = config.endpointUrl;
        this.temperature = config.temperature;
        this.timeOutDuration = config.timeOutDuration ?? 45000;
        this.maxTokens = config.maxTokens;
        this.retryAttempts = config.retryAttempts;
        this.stopSequences = config.stopSequences;
        this.streamContent = config.streamContent ?? true;
    }
    /**
	 * Handles the slash command input from the user, processes it, and interacts with the AI model.
	 *
	 * @returns A promise that resolves when the command has been processed.
	 */ async handleSlashCommand() {
        const editor = this.editor;
        const model = editor.model;
        const mapper = editor.editing.mapper;
        const view = editor.editing.view;
        const root = model.document.getRoot();
        let content;
        let parentEquivalentHTML;
        let parent;
        const position = model.document.selection.getLastPosition();
        if (position && root) {
            parent = position.parent;
            const inlineSlash = parent.name === 'inline-slash' ? parent : undefined;
            const equivalentView = mapper.toViewElement(parent);
            parentEquivalentHTML = equivalentView ? view.domConverter.mapViewToDom(equivalentView) : undefined;
            if (inlineSlash) {
                this.isInlineInsertion = true;
                const startingPath = inlineSlash.getPath();
                const endingPath = position?.path;
                const startPosition = model.createPositionFromPath(root, startingPath); // Example path
                const endPosition = model.createPositionFromPath(root, endingPath); // Example path
                const range = model.createRange(startPosition, endPosition);
                parentEquivalentHTML = equivalentView?.parent ? view.domConverter.mapViewToDom(equivalentView.parent) : undefined;
                content = '';
                for (const item of range.getItems()){
                    if (item.is('$textProxy')) {
                        content += item.data.trim(); // Add text data
                    }
                }
            } else if (parentEquivalentHTML) {
                content = parentEquivalentHTML?.innerText;
            }
        }
        try {
            const domSelection = window.getSelection();
            const domRange = domSelection?.getRangeAt(0);
            const rect = domRange.getBoundingClientRect();
            aiAssistContext.showLoader(rect);
            const gptPrompt = await this.generateGptPromptBasedOnUserPrompt(content ?? '', parentEquivalentHTML?.innerText);
            if (parent && gptPrompt) {
                await this.fetchAndProcessGptResponse(gptPrompt, parent);
            }
        } catch (error) {
            console.error('Error handling slash command:', error);
            throw error;
        } finally{
            this.isInlineInsertion = false;
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
	 */ async fetchAndProcessGptResponse(prompt, parent, retries = this.retryAttempts) {
        console.log('Starting fetchAndProcessGptResponse');
        const editor = this.editor;
        const t = editor.t;
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), this.timeOutDuration);
        let buffer = '';
        let contentBuffer = '';
        try {
            const response = await fetch(this.endpointUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.aiModel,
                    messages: [
                        {
                            role: 'system',
                            content: this.promptHelper.getSystemPrompt(this.isInlineInsertion)
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: this.temperature,
                    max_tokens: this.maxTokens,
                    stop: this.stopSequences,
                    stream: true
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error('Fetch failed');
            }
            aiAssistContext.hideLoader();
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            this.clearParentContent(parent);
            this.editor.enableReadOnlyMode(this.aiAssistFeatureLockId);
            console.log('Starting to process response');
            for(;;){
                const { done, value } = await reader.read();
                if (done) {
                    console.log('Finished reading response');
                    break;
                }
                const chunk = decoder.decode(value, {
                    stream: true
                });
                buffer += chunk;
                let newlineIndex;
                while((newlineIndex = buffer.indexOf('\n')) !== -1){
                    const line = buffer.slice(0, newlineIndex).trim();
                    buffer = buffer.slice(newlineIndex + 1);
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(5).trim();
                        if (jsonStr === '[DONE]') {
                            console.log('Received [DONE] signal');
                            break;
                        }
                        try {
                            const data = JSON.parse(jsonStr);
                            const content = data.choices[0]?.delta?.content;
                            if (content) {
                                contentBuffer += content;
                                if (this.htmlParser.isCompleteHtmlChunk(contentBuffer)) {
                                    await this.processContent(contentBuffer, parent);
                                    contentBuffer = '';
                                }
                            }
                        } catch (parseError) {
                            console.warn('Error parsing JSON:', parseError);
                        }
                    }
                }
            }
            // Process any remaining content in the buffer
            if (contentBuffer.trim()) {
                await this.processContent(contentBuffer.trim(), parent);
            }
        } catch (error) {
            console.error('Error in fetchAndProcessGptResponse:', error);
            const errorIdentifier = (error?.message || '').trim() || (error?.name || '').trim();
            const isRetryableError = [
                'AbortError',
                'ReadableStream not supported',
                'AiAssist: Fetch failed'
            ].includes(errorIdentifier);
            if (retries > 0 && isRetryableError) {
                console.warn(`Retrying... (${retries} attempts left)`);
                return await this.fetchAndProcessGptResponse(prompt, parent, retries - 1);
            }
            let errorMessage;
            switch(error?.name || error?.message?.trim()){
                case 'ReadableStream not supported':
                    errorMessage = t('Browser does not support readable streams');
                    break;
                case 'AiAssist: Fetch failed':
                    errorMessage = t('We couldn\'t connect to the AI. Please check your internet');
                    break;
                default:
                    errorMessage = t('We couldn\'t connect to the AI. Please check your internet');
            }
            aiAssistContext.showError(errorMessage);
        } finally{
            this.editor.disableReadOnlyMode(this.aiAssistFeatureLockId);
        }
    }
    /**
	 * Processes the provided content and inserts it into the specified parent element.
	 * Depending on the feature flag, it either uses a simple HTML insertion method
	 * or processes the content as HTML.
	 *
	 * @param content - The content to be processed and inserted.
	 * @param parent - The parent element in the editor where the content will be inserted.
	 */ async processContent(content, parent) {
        try {
            console.log('--- Start of processContent ---');
            console.log('Processing content:', content, this.isInlineInsertion);
            if (this.isInlineInsertion) {
                const position = this.editor.model.document.selection.getLastPosition();
                const tempParagraph = document.createElement('div');
                tempParagraph.innerHTML = content;
                await this.htmlParser.insertAsText(tempParagraph || '', position ?? undefined, this.streamContent);
            } else {
                if (this.streamContent) {
                    // Existing complex content processing logic
                    await this.proceedHtmlResponse(content);
                } else {
                    // Use the simple HTML insertion method
                    await this.htmlParser.insertSimpleHtml(content);
                }
            }
            console.log('--- End of processContent ---');
        } catch (error) {
            console.error(error);
        }
    }
    /**
	 * Processes the provided HTML string and inserts its content into the editor.
	 * It creates a temporary div to parse the HTML and handles different types of
	 * elements (lists, tables, headings, etc.) accordingly.
	 *
	 * @param html - The HTML string to be processed and inserted into the editor.
	 */ async proceedHtmlResponse(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        for (const child of Array.from(tempDiv.childNodes)){
            const element = child;
            if (element.nodeType === Node.ELEMENT_NODE) {
                const elementName = element.tagName.toLowerCase();
                const isStreamingNotAllow = [
                    'table',
                    'blockquote',
                    'pre',
                    'img',
                    'form',
                    'figure'
                ].includes(elementName);
                if (isStreamingNotAllow) {
                    await this.htmlParser.insertSimpleHtml(element.outerHTML);
                } else if (elementName === 'ul' || elementName === 'ol') {
                    await this.htmlParser.insertAsText(element, undefined, true, true);
                } else {
                    await this.htmlParser.insertAsText(element, undefined, true);
                }
            } else if (element.nodeType === Node.TEXT_NODE && element.textContent) {
                const tempParagraph = document.createElement('div');
                tempParagraph.innerText = element.textContent;
                await this.htmlParser.insertAsText(tempParagraph, undefined, true);
            }
        }
    }
    /**
	 * Clears the content of the specified parent element in the editor.
	 *
	 * @param parent - The parent element whose content will be cleared.
	 */ clearParentContent(parent) {
        const editor = this.editor;
        const model = editor.model;
        const root = model.document.getRoot();
        const position = model.document.selection.getLastPosition();
        const inlineSlash = Array.from(parent.getChildren()).find((child)=>child.name === 'inline-slash');
        if (root && position) {
            editor.model.change((writer)=>{
                const startingPath = inlineSlash?.getPath() || parent.getPath();
                const range = model.createRange(model.createPositionFromPath(root, startingPath), model.createPositionFromPath(root, position.path));
                writer.remove(range);
                writer.setSelection(model.createPositionFromPath(root, startingPath));
            });
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
	*/ async generateGptPromptBasedOnUserPrompt(prompt, promptContainerText) {
        try {
            const context = this.promptHelper.trimContext(prompt, promptContainerText);
            const request = prompt.slice(1); // Remove the leading slash
            let markDownContents = [];
            const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
            const urls = prompt.match(urlRegex);
            if (Array.isArray(urls) && urls.length) {
                const formattedUrl = urls.map((url)=>{
                    return url.replace(/[,.]$/, '');
                });
                markDownContents = await this.promptHelper.generateMarkDownForUrls(formattedUrl);
                markDownContents = this.promptHelper.allocateTokensToFetchedContent(prompt, markDownContents);
            }
            const isEditorEmpty = context === '"@@@cursor@@@"';
            return this.promptHelper.formatFinalPrompt(request, context, markDownContents, isEditorEmpty);
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}

class AiAssistEditing extends Plugin {
    static get pluginName() {
        return 'AiAssistEditing';
    }
    /**
	 * Initializes the AI Assist editing plugin, setting up commands and key handling.
	 */ init() {
        const editor = this.editor;
        const aiAssistService = new AiAssistService(editor);
        editor.commands.add('aiAssist', new AiAssistCommand(editor, aiAssistService));
        this.setupEnterKeyHandling();
    }
    /**
	 * Sets up handling for the Enter key to trigger AI assist functionality.
	 * If the content starts with a slash, it cancels the default action and executes the AI assist command.
	 */ setupEnterKeyHandling() {
        const editor = this.editor;
        const model = editor.model;
        const mapper = editor.editing.mapper;
        const view = editor.editing.view;
        editor.keystrokes.set('enter', async (_, cancel)=>{
            const position = model.document.selection.getFirstPosition();
            if (position) {
                const paragraph = position.parent;
                const inlineSlash = Array.from(paragraph.getChildren()).find((child)=>child.name === 'inline-slash');
                const equivalentView = mapper.toViewElement(paragraph);
                let content;
                if (equivalentView) {
                    content = view.domConverter.mapViewToDom(equivalentView)?.innerText;
                }
                if (typeof content === 'string' && content.startsWith('/') || inlineSlash) {
                    cancel();
                    await editor.execute('aiAssist');
                }
            }
        });
    }
}

class AiAssist extends Plugin {
    DEFAULT_GPT_MODEL = 'gpt-4o';
    DEFAULT_AI_END_POINT = 'https://api.openai.com/v1/chat/completions';
    constructor(editor){
        super(editor);
        const config = editor.config.get('aiAssist') || {};
        // Set default values and merge with provided config
        const defaultConfig = {
            model: this.DEFAULT_GPT_MODEL,
            apiKey: '',
            endpointUrl: this.DEFAULT_AI_END_POINT,
            temperature: undefined,
            timeOutDuration: 45000,
            maxTokens: TOKEN_LIMITS[this.DEFAULT_GPT_MODEL].max,
            retryAttempts: 1,
            contextSize: TOKEN_LIMITS[this.DEFAULT_GPT_MODEL].context * 0.75,
            stopSequences: [],
            promptSettings: {
                outputFormat: [],
                contextData: [],
                filters: [] // Default filters
            },
            debugMode: false,
            streamContent: true // Default streaming mode
        };
        const updatedConfig = {
            ...defaultConfig,
            ...config
        };
        // Set the merged config back to the editor
        editor.config.set('aiAssist', updatedConfig);
        // Validate configuration
        this.validateConfiguration(updatedConfig);
    }
    static get requires() {
        return [
            AiAssistUI,
            AiAssistEditing
        ];
    }
    static get pluginName() {
        return 'AiAssist';
    }
    validateConfiguration(config) {
        if (!config.apiKey) {
            throw new Error('AiAssist: apiKey is required.');
        }
        if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
            throw new Error('AiAssist: Temperature must be a number between 0 and 2.');
        }
        // Validate maxTokens based on the model's token limits
        const { min, max } = TOKEN_LIMITS[config.model];
        if (config.maxTokens < min || config.maxTokens > max) {
            throw new Error(`AiAssist: maxTokens must be a number between ${min} and ${max}.`);
        }
    }
    init() {
    // Any additional initialization if needed
    }
}

const icons = {
    ckeditor
};

export { AiAssist, icons };
//# sourceMappingURL=index.js.map

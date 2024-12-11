import { Plugin } from 'ckeditor5/src/core.js';
// import { ButtonView, createDropdown, SplitButtonView } from 'ckeditor5/src/ui.js';
import { ButtonView } from 'ckeditor5/src/ui.js';
import aiAgentIcon from '../theme/icons/ai-agent.svg';
import { aiAgentContext } from './aiagentcontext.js';
import { SUPPORTED_LANGUAGES, SHOW_ERROR_DURATION } from './const.js';
import { Widget, toWidget } from 'ckeditor5/src/widget.js';
import { env } from 'ckeditor5/src/utils.js';
export default class AiAgentUI extends Plugin {
    constructor(editor) {
        var _a;
        super(editor);
        this.PLACEHOLDER_TEXT_ID = 'slash-placeholder';
        this.GPT_RESPONSE_LOADER_ID = 'gpt-response-loader';
        this.GPT_RESPONSE_ERROR_ID = 'gpt-error';
        this.showErrorDuration = SHOW_ERROR_DURATION;
        const config = editor.config.get('aiAgent');
        this.showErrorDuration = (_a = config === null || config === void 0 ? void 0 : config.showErrorDuration) !== null && _a !== void 0 ? _a : SHOW_ERROR_DURATION;
    }
    static get pluginName() {
        return 'AiAgentUI';
    }
    static get requires() {
        return [Widget];
    }
    /**
     * Initializes the AI Agent UI plugin, setting up UI components and event listeners.
     * This method is called when the plugin is loaded.
     */
    init() {
        try {
            aiAgentContext.uiComponent = this;
            // Initialize UI components like buttons, placeholders, loaders, etc.
            this.initializeUIComponents();
            // Set displays content in the appropriate language.
            this.initializeUILanguage();
            // Attach event listeners for handling editor events and user interactions
            this.attachListener();
        }
        catch (error) {
            console.error(error.message);
        }
    }
    /**
     * Initializes UI components such as placeholders, loaders, and buttons for the editor.
     */
    initializeUIComponents() {
        const editor = this.editor;
        const t = editor.t;
        // Register the inline-slash schema
        editor.model.schema.register('inline-slash', {
            inheritAllFrom: '$block',
            isInline: true,
            isObject: true,
            allowWhere: '$text',
            allowAttributes: ['class']
        });
        // Allow the inline-slash element to have text inside it
        editor.model.schema.extend('$text', {
            allowIn: 'inline-slash'
        });
        // Set up upcast conversion for inline-slash
        editor.conversion.for('upcast').elementToElement({
            view: {
                name: 'inline-slash',
                attributes: ['class']
            },
            model: (viewElement, { writer }) => {
                return writer.createElement('inline-slash', {
                    class: viewElement.getAttribute('class')
                });
            },
            converterPriority: 'high'
        });
        editor.conversion.for('downcast').elementToElement({
            model: {
                name: 'inline-slash',
                attributes: ['class']
            },
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('inline-slash', {
                    class: modelElement.getAttribute('class')
                });
            }
        });
        this.addPlaceholder();
        this.addLoader();
        this.addGptErrorToolTip();
        editor.ui.componentFactory.add('aiAgentButton', locale => {
            // const dropdownView = createDropdown( locale, SplitButtonView );
            const view = new ButtonView(locale);
            // const view =  dropdownView.buttonView;
            view.set({
                label: t('Ai agent'),
                icon: aiAgentIcon,
                tooltip: true
            });
            view.on('execute', () => {
                this.editor.model.change(writer => {
                    const position = this.editor.model.document.selection.getLastPosition();
                    if (position) {
                        const inlineSlashContainer = writer.createElement('inline-slash', { class: 'ck-slash' });
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
        editor.accessibility.addKeystrokeInfos({
            keystrokes: [
                {
                    label: t('Insert slash command (AI Agent)'),
                    keystroke: '/'
                }
            ]
        });
        editor.model.schema.register('ai-tag', {
            inheritAllFrom: '$block',
            isInline: true,
            isObject: true,
            allowWhere: '$block',
            allowAttributes: ['id']
        });
        editor.model.schema.extend('$block', { allowIn: 'ai-tag' });
        this.addCustomTagConversions();
        let keystroke = '';
        if (env.isMac) {
            keystroke = 'Cmd + Backspace';
        }
        if (env.isWindows) {
            keystroke = 'Ctrl + Backspace';
        }
        editor.accessibility.addKeystrokeInfos({
            keystrokes: [
                {
                    label: t('Cancel AI Generation'),
                    keystroke
                }
            ]
        });
    }
    addCustomTagConversions() {
        const editor = this.editor;
        editor.conversion.for('upcast').elementToElement({
            view: {
                name: 'ai-tag',
                attributes: ['id']
            },
            model: (viewElement, { writer }) => {
                return writer.createElement('ai-tag', {
                    id: viewElement.getAttribute('id')
                });
            }
        });
        editor.conversion.for('dataDowncast').elementToElement({
            model: 'ai-tag',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('ai-tag', {
                    id: modelElement.getAttribute('id')
                });
            }
        });
        editor.conversion.for('editingDowncast').elementToElement({
            model: 'ai-tag',
            view: (modelElement, { writer }) => {
                const customTag = writer.createContainerElement('ai-tag', {
                    id: modelElement.getAttribute('id')
                });
                return toWidget(customTag, writer);
            }
        });
    }
    /**
     * Initializes the UI language settings based on the editor's locale.
     * Displays an error tooltip if the current language is unsupported.
     */
    initializeUILanguage() {
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
     */
    attachListener() {
        const editor = this.editor;
        const model = editor.model;
        model.document.on('change:data', () => {
            setTimeout(() => {
                this.applyPlaceholderToCurrentLine();
            }, 10);
        });
        model.document.selection.on('change:range', () => {
            setTimeout(() => {
                this.applyPlaceholderToCurrentLine();
            }, 10);
            const modelRoot = editor.model.document.getRoot();
            if (modelRoot) {
                const modelRange = editor.model.createRangeIn(modelRoot);
                const itemsToRemove = [];
                for (const item of modelRange.getItems()) {
                    if (item.is('element', 'inline-slash') && item.isEmpty) {
                        itemsToRemove.push(item); // Collect empty items
                    }
                }
                // Remove collected empty inline-slash elements
                editor.model.change(writer => {
                    for (const item of itemsToRemove) {
                        writer.remove(item);
                    }
                });
            }
        });
        editor.editing.view.document.on('scroll', () => {
            this.hidePlaceHolder();
        });
        document.addEventListener('scroll', () => {
            this.hidePlaceHolder();
        });
    }
    /**
     * Applies the placeholder to the current line in the editor if it is empty.
     * Hides the placeholder if the line is not empty.
     */
    applyPlaceholderToCurrentLine() {
        var _a;
        const editor = this.editor;
        const model = editor.model;
        const modelSelection = model.document.selection;
        const block = (_a = modelSelection.getFirstPosition()) === null || _a === void 0 ? void 0 : _a.parent;
        if (block && block.isEmpty) {
            this.hidePlaceHolder();
            setTimeout(async () => {
                if (block.is('element')) {
                    const rect = await this.getRectDomOfGivenModelElement(block);
                    if (rect) {
                        this.showPlaceHolder(rect);
                    }
                }
            }, 100);
        }
        else {
            this.hidePlaceHolder();
        }
    }
    /**
     * Retrieves the DOM rectangle of a given model element.
     *
     * @param element - The model element for which to get the DOM rectangle.
     * @returns A promise that resolves to the DOMRect of the element, or null if not found.
     */
    async getRectDomOfGivenModelElement(element) {
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
     */
    addPlaceholder() {
        const editor = this.editor;
        const t = editor.t;
        const placeholder = document.createElement('p');
        placeholder.id = this.PLACEHOLDER_TEXT_ID;
        placeholder.onclick = () => {
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
     */
    showPlaceHolder(rect) {
        const ele = document.getElementById(this.PLACEHOLDER_TEXT_ID);
        const isReadOnlyMode = this.editor.isReadOnly;
        if (ele && rect && !isReadOnlyMode) {
            ele.classList.add('show-place-holder');
            ele.style.left = `${rect.left}px`;
            ele.style.top = `${rect.top}px`;
        }
        else if (ele) {
            ele.classList.remove('show-place-holder');
        }
    }
    /**
     * Hides the placeholder element from the document.
     */
    hidePlaceHolder() {
        const ele = document.getElementById(this.PLACEHOLDER_TEXT_ID);
        if (ele) {
            ele.classList.remove('show-place-holder');
        }
    }
    /**
     * Adds a loader element to the document body for indicating processing.
     */
    addLoader() {
        const loaderElement = document.createElement('div');
        loaderElement.id = this.GPT_RESPONSE_LOADER_ID;
        loaderElement.classList.add('gpt-loader');
        document.body.appendChild(loaderElement);
    }
    /**
     * Shows the loader at the specified position.
     *
     * @param rect - The DOMRect object defining the position to show the loader.
     */
    showLoader(rect) {
        const ele = document.getElementById(this.GPT_RESPONSE_LOADER_ID);
        if (ele && rect) {
            ele.style.left = `${rect.left + 10}px`;
            ele.style.top = `${rect.top + 10}px`;
            ele.classList.add('show-gpt-loader');
        }
        else if (ele) {
            ele.classList.remove('show-gpt-loader');
        }
    }
    /**
     * Hides the loader element from the document.
     */
    hideLoader() {
        const ele = document.getElementById(this.GPT_RESPONSE_LOADER_ID);
        if (ele) {
            ele.classList.remove('show-gpt-loader');
        }
    }
    /**
     * Adds an error tooltip element to the document body for displaying error messages.
     */
    addGptErrorToolTip() {
        const tooltipElement = document.createElement('p');
        tooltipElement.id = this.GPT_RESPONSE_ERROR_ID;
        tooltipElement.classList.add('response-error');
        document.body.appendChild(tooltipElement);
    }
    /**
     * Displays an error tooltip with the specified message.
     *
     * @param message - The error message to display in the tooltip.
     */
    showGptErrorToolTip(message) {
        var _a, _b, _c;
        console.log('Showing error message...', message);
        const editor = this.editor;
        const view = (_c = (_b = (_a = editor === null || editor === void 0 ? void 0 : editor.editing) === null || _a === void 0 ? void 0 : _a.view) === null || _b === void 0 ? void 0 : _b.domRoots) === null || _c === void 0 ? void 0 : _c.get('main');
        const tooltipElement = document.getElementById(this.GPT_RESPONSE_ERROR_ID);
        const editorRect = view === null || view === void 0 ? void 0 : view.getBoundingClientRect();
        if (tooltipElement && editorRect) {
            tooltipElement.classList.add('show-response-error');
            tooltipElement.textContent = message;
            setTimeout(() => {
                this.hideGptErrorToolTip();
            }, this.showErrorDuration);
        }
    }
    /**
     * Hides the error tooltip element from the document.
     */
    hideGptErrorToolTip() {
        const tooltipElement = document.getElementById(this.GPT_RESPONSE_ERROR_ID);
        if (tooltipElement) {
            tooltipElement.classList.remove('show-response-error');
        }
    }
}

import { Plugin } from 'ckeditor5/src/core.js';
import AiAssistCommand from './aiassistcommand.js';
import AiAssistService from './aiassistservice.js';
export default class AiAssistEditing extends Plugin {
    static get pluginName() {
        return 'AiAssistEditing';
    }
    /**
     * Initializes the AI Assist editing plugin, setting up commands and key handling.
     */
    init() {
        const editor = this.editor;
        const aiAssistService = new AiAssistService(editor);
        editor.commands.add('aiAssist', new AiAssistCommand(editor, aiAssistService));
        this.setupEnterKeyHandling();
    }
    /**
     * Sets up handling for the Enter key to trigger AI assist functionality.
     * If the content starts with a slash, it cancels the default action and executes the AI assist command.
     */
    setupEnterKeyHandling() {
        const editor = this.editor;
        const model = editor.model;
        const mapper = editor.editing.mapper;
        const view = editor.editing.view;
        editor.keystrokes.set('enter', async (_, cancel) => {
            var _a;
            const position = model.document.selection.getFirstPosition();
            if (position) {
                const paragraph = position.parent;
                const inlineSlash = Array.from(paragraph.getChildren()).find((child) => child.name === 'inline-slash');
                const equivalentView = mapper.toViewElement(paragraph);
                let content;
                if (equivalentView) {
                    content =
                        (_a = view.domConverter.mapViewToDom(equivalentView)) === null || _a === void 0 ? void 0 : _a.innerText;
                }
                if ((typeof content === 'string' && content.startsWith('/')) || inlineSlash) {
                    cancel();
                    await editor.execute('aiAssist');
                }
            }
        });
    }
}

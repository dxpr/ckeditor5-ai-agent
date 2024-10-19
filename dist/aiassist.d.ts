import { Plugin } from 'ckeditor5/src/core.js';
import AiAssistUI from './aiassistui.js';
import AiAssistEditing from './aiassistediting.js';
import type { Editor } from 'ckeditor5';
import type { AiModel } from './type-identifiers.js';
import '../theme/style.css';
export default class AiAssist extends Plugin {
    DEFAULT_GPT_MODEL: AiModel;
    DEFAULT_AI_END_POINT: string;
    constructor(editor: Editor);
    static get requires(): readonly [typeof AiAssistUI, typeof AiAssistEditing];
    static get pluginName(): "AiAssist";
    private validateConfiguration;
    init(): void;
}

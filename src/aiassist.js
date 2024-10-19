import { Plugin } from 'ckeditor5/src/core.js';
import AiAssistUI from './aiassistui.js';
import AiAssistEditing from './aiassistediting.js';
import { TOKEN_LIMITS } from './const.js';
import '../theme/style.css';
export default class AiAssist extends Plugin {
    constructor(editor) {
        super(editor);
        this.DEFAULT_GPT_MODEL = 'gpt-4o';
        this.DEFAULT_AI_END_POINT = 'https://api.openai.com/v1/chat/completions';
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
        const updatedConfig = { ...defaultConfig, ...config };
        // Set the merged config back to the editor
        editor.config.set('aiAssist', updatedConfig);
        // Validate configuration
        this.validateConfiguration(updatedConfig);
    }
    static get requires() {
        return [AiAssistUI, AiAssistEditing];
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

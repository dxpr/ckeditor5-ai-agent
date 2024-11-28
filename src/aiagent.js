import { Plugin } from 'ckeditor5/src/core.js';
import AiAgentUI from './aiagentui.js';
import AiAgentEditing from './aiagentediting.js';
import { TOKEN_LIMITS } from './const.js';
import '../theme/style.css';
export default class AiAgent extends Plugin {
    constructor(editor) {
        super(editor);
        this.DEFAULT_GPT_MODEL = 'gpt-4o';
        this.DEFAULT_AI_END_POINT = 'https://api.openai.com/v1/chat/completions';
        const config = editor.config.get('aiAgent') || {};
        // Set default values and merge with provided config
        const defaultConfig = {
            model: this.DEFAULT_GPT_MODEL,
            apiKey: '',
            endpointUrl: this.DEFAULT_AI_END_POINT,
            temperature: undefined,
            timeOutDuration: 45000,
            maxOutputTokens: TOKEN_LIMITS[this.DEFAULT_GPT_MODEL].maxOutputTokens,
            maxInputTokens: TOKEN_LIMITS[this.DEFAULT_GPT_MODEL].maxInputContextTokens,
            retryAttempts: 1,
            contextSize: TOKEN_LIMITS[this.DEFAULT_GPT_MODEL].maxInputContextTokens * 0.75,
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
        editor.config.set('aiAgent', updatedConfig);
        // Validate configuration
        this.validateConfiguration(updatedConfig);
    }
    static get requires() {
        return [AiAgentUI, AiAgentEditing];
    }
    static get pluginName() {
        return 'AiAgent';
    }
    validateConfiguration(config) {
        if (!config.apiKey) {
            throw new Error('AiAgent: apiKey is required.');
        }
        if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
            throw new Error('AiAgent: Temperature must be a number between 0 and 2.');
        }
        const limits = TOKEN_LIMITS[config.model];
        // Validate output tokens
        if (config.maxOutputTokens !== undefined) {
            if (config.maxOutputTokens < limits.minOutputTokens ||
                config.maxOutputTokens > limits.maxOutputTokens) {
                throw new Error(`AiAgent: maxOutputTokens must be between ${limits.minOutputTokens} ` +
                    `and ${limits.maxOutputTokens} for ${config.model}`);
            }
        }
        // Validate input tokens
        if (config.maxInputTokens !== undefined &&
            config.maxInputTokens > limits.maxInputContextTokens) {
            throw new Error(`AiAgent: maxInputTokens cannot exceed ${limits.maxInputContextTokens} ` +
                `for ${config.model}`);
        }
    }
    init() {
        // Any additional initialization if needed
    }
}

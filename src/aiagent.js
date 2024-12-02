import { Plugin } from 'ckeditor5/src/core.js';
import AiAgentUI from './aiagentui.js';
import AiAgentEditing from './aiagentediting.js';
import { TOKEN_LIMITS } from './const.js';
import '../theme/style.css';
/**
 * The AI Agent plugin for CKEditor 5.
 *
 * This plugin integrates AI capabilities into CKEditor 5, allowing users to generate
 * and manipulate content using AI services. It provides a UI component for interaction
 * and handles the communication with AI endpoints.
 *
 * @example
 * ```ts
 * ClassicEditor
 *   .create( document.querySelector( '#editor' ), {
 *     plugins: [ AiAgent, ... ],
 *     aiAgent: {
 *       apiKey: 'your-api-key',
 *       endpointUrl: 'https://api.example.com/v1/chat',
 *       model: 'gpt-4'
 *     }
 *   } )
 *   .then( ... )
 *   .catch( ... );
 * ```
 */
export default class AiAgent extends Plugin {
    /**
     * Required plugins for the AI Agent.
     */
    static get requires() {
        return [AiAgentUI, AiAgentEditing];
    }
    /**
     * The plugin name.
     */
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
    /**
     * Initializes the AI Agent plugin.
     *
     * Sets up the default configuration and validates required settings.
     */
    init() {
        var _a, _b, _c, _d;
        const editor = this.editor;
        const config = editor.config.get('aiAgent');
        if (config) {
            const updatedConfig = {
                ...config,
                promptSettings: {
                    overrides: (_b = (_a = config.promptSettings) === null || _a === void 0 ? void 0 : _a.overrides) !== null && _b !== void 0 ? _b : {},
                    additions: (_d = (_c = config.promptSettings) === null || _c === void 0 ? void 0 : _c.additions) !== null && _d !== void 0 ? _d : {}
                }
            };
            this.validateConfiguration(updatedConfig);
            editor.config.set('aiAgent', updatedConfig);
        }
    }
    /**
     * Destroys the plugin instance.
     */
    destroy() {
        // Clean up any resources
        super.destroy();
    }
}

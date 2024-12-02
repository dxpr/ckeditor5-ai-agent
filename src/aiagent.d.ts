import { Plugin } from 'ckeditor5/src/core.js';
import AiAgentUI from './aiagentui.js';
import AiAgentEditing from './aiagentediting.js';
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
    static get requires(): readonly [typeof AiAgentUI, typeof AiAgentEditing];
    /**
     * The plugin name.
     */
    static get pluginName(): "AiAgent";
    private validateConfiguration;
    /**
     * Initializes the AI Agent plugin.
     *
     * Sets up the default configuration and validates required settings.
     */
    init(): void;
    /**
     * Destroys the plugin instance.
     */
    destroy(): void;
}

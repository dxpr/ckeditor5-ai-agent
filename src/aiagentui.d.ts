import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import { Widget } from 'ckeditor5/src/widget.js';
export default class AiAgentUI extends Plugin {
    PLACEHOLDER_TEXT_ID: string;
    GPT_RESPONSE_LOADER_ID: string;
    GPT_RESPONSE_ERROR_ID: string;
    private showErrorDuration;
    private commandsDropdown;
    constructor(editor: Editor);
    static get pluginName(): "AiAgentUI";
    static get requires(): readonly [typeof Widget];
    /**
     * Initializes the AI Agent UI plugin, setting up UI components and event listeners.
     * This method is called when the plugin is loaded.
     */
    init(): void;
    /**
     * Initializes UI components such as placeholders, loaders, and buttons for the editor.
     */
    private initializeUIComponents;
    private addCustomTagConversions;
    /**
     * Adds the AI Agent button to the editor's UI, which includes a dropdown menu
     * for various AI commands. The button allows users to insert slash commands
     * and provides a search functionality for available commands.
     *
     * This method sets up the button's execute event, handles user input for
     * searching commands, and organizes the command menu into groups for better
     * usability.
     */
    private addAiAgentButton;
    /**
     * Updates the enabled state of items in the AI Agent command list based on the provided type and data.
     *
     * This method iterates through the list of items in the provided listView and enables or disables them
     * based on the search input or selection state. It checks if the item is a title, separator, or search input
     * and updates the isEnabled property accordingly.
     *
     * @param listView - The MenuBarMenuListView containing the items to update.
     * @param type - The type of update to perform, either 'search' to filter items based on input or 'enable'
     *               to enable/disable items based on selection state.
     * @param data - The search string for filtering items when type is 'search', or a boolean indicating
     *               whether to enable or disable items when type is 'enable'.
     */
    private aiAgentListItemUpdate;
    /**
     * Initializes the UI language settings based on the editor's locale.
     * Displays an error tooltip if the current language is unsupported.
     */
    private initializeUILanguage;
    /**
     * Attaches event listeners to the editor for handling user interactions and content changes.
     */
    private attachListener;
    /**
     * Applies the placeholder to the current line in the editor if it is empty.
     * Hides the placeholder if the line is not empty.
     */
    applyPlaceholderToCurrentLine(): void;
    /**
     * Retrieves the DOM rectangle of a given model element.
     *
     * @param element - The model element for which to get the DOM rectangle.
     * @returns A promise that resolves to the DOMRect of the element, or null if not found.
     */
    private getRectDomOfGivenModelElement;
    /**
     * Adds a placeholder element to the document body for user interaction.
     */
    private addPlaceholder;
    /**
     * Shows the placeholder at the specified position.
     *
     * @param rect - The DOMRect object defining the position to show the placeholder.
     */
    private showPlaceHolder;
    /**
     * Hides the placeholder element from the document.
     */
    private hidePlaceHolder;
    /**
     * Adds a loader element to the document body for indicating processing.
     */
    private addLoader;
    /**
     * Shows the loader at the specified position.
     *
     * @param rect - The DOMRect object defining the position to show the loader.
     */
    showLoader(rect?: DOMRect): void;
    /**
     * Hides the loader element from the document.
     */
    hideLoader(): void;
    /**
     * Adds an error tooltip element to the document body for displaying error messages.
     */
    private addGptErrorToolTip;
    /**
     * Displays an error tooltip with the specified message.
     *
     * @param message - The error message to display in the tooltip.
     */
    showGptErrorToolTip(message: string): void;
    /**
     * Hides the error tooltip element from the document.
     */
    private hideGptErrorToolTip;
}

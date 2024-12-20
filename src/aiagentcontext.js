/**
 * The AiAgentContext class provides a context for the AI Agent plugin,
 * allowing access to shared resources and state across different components.
 */
export class AiAgentContext {
    constructor() { }
    static getInstance() {
        if (!AiAgentContext.instance) {
            AiAgentContext.instance = new AiAgentContext();
        }
        return AiAgentContext.instance;
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
export const aiAgentContext = AiAgentContext.getInstance();

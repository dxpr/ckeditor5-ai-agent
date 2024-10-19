/**
 * The AiAssistContext class provides a context for the AI Assist plugin,
 * allowing access to shared resources and state across different components.
 */
export class AiAssistContext {
    constructor() { }
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
export const aiAssistContext = AiAssistContext.getInstance();

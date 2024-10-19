/**
 * The AiAssistContext class provides a context for the AI Assist plugin,
 * allowing access to shared resources and state across different components.
 */
export declare class AiAssistContext {
    private static instance;
    private _uiComponent;
    private constructor();
    static getInstance(): AiAssistContext;
    set uiComponent(component: any);
    showError(message: string): void;
    showLoader(rect: DOMRect): void;
    hideLoader(): void;
}
export declare const aiAssistContext: AiAssistContext;

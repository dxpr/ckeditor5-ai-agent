/**
 * The AiAgentContext class provides a context for the AI Agent plugin,
 * allowing access to shared resources and state across different components.
 */
export declare class AiAgentContext {
    private static instance;
    private _uiComponent;
    private constructor();
    static getInstance(): AiAgentContext;
    set uiComponent(component: any);
    showError(message: string): void;
    showLoader(rect: DOMRect): void;
    hideLoader(): void;
}
export declare const aiAgentContext: AiAgentContext;

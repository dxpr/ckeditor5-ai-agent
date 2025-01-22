/**
 * The AiAgentContext class provides a context for the AI Agent plugin,
 * allowing access to shared resources and state across different components.
 */
export class AiAgentContext {
	private static instance: AiAgentContext;
	private _uiComponent: any;

	private constructor() {}

	public static getInstance(): AiAgentContext {
		if ( !AiAgentContext.instance ) {
			AiAgentContext.instance = new AiAgentContext();
		}
		return AiAgentContext.instance;
	}

	public set uiComponent( component: any ) {
		this._uiComponent = component;
	}

	public showError( message: string ): void {
		if ( this._uiComponent ) {
			console.log( 'Showing error message...', message );
			this._uiComponent.showGptErrorToolTip( message );
		}
	}

	public showLoader( rect: DOMRect ): void {
		if ( this._uiComponent ) {
			this._uiComponent.showLoader( rect );
		}
	}

	public hideLoader(): void {
		if ( this._uiComponent ) {
			this._uiComponent.hideLoader();
		}
	}
}

export const aiAgentContext = AiAgentContext.getInstance();

/**
 * The AiAssistContext class provides a context for the AI Assist plugin,
 * allowing access to shared resources and state across different components.
 */
export class AiAssistContext {
	private static instance: AiAssistContext;
	private _uiComponent: any;

	private constructor() {}

	public static getInstance(): AiAssistContext {
		if ( !AiAssistContext.instance ) {
			AiAssistContext.instance = new AiAssistContext();
		}
		return AiAssistContext.instance;
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

export const aiAssistContext = AiAssistContext.getInstance();

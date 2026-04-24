import { Editor } from "ckeditor5";

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

	public get uiComponent(): any {
		return this._uiComponent;
	}

	public showError( message: string ): void {
		if ( this._uiComponent ) {
			this._uiComponent.showErrorTooltip( message );
		}
	}

	public showLoader( editor: Editor ): void {
		if ( this._uiComponent ) {
			this._uiComponent.showLoader( editor );
		}
	}

	public hideLoader( editor: Editor ): void {
		if ( this._uiComponent ) {
			this._uiComponent.hideLoader( editor );
		}
	}
}

export const aiAgentContext = AiAgentContext.getInstance();

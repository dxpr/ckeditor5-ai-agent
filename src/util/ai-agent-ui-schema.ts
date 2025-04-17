import type { Editor } from 'ckeditor5/src/core.js';
import { toWidget } from 'ckeditor5/src/widget.js';

export function registerInlineSlashSchema( editor: Editor ): void {
	// Register the inline-slash schema
	editor.model.schema.register( 'inline-slash', {
		inheritAllFrom: '$block',
		isInline: true,
		isObject: true,
		allowWhere: '$text',
		allowAttributes: [ 'class' ]
	} );

	// Allow the inline-slash element to have text inside it
	editor.model.schema.extend( '$text', {
		allowIn: 'inline-slash'
	} );

	// Set up upcast conversion for inline-slash
	editor.conversion.for( 'upcast' ).elementToElement( {
		view: {
			name: 'inline-slash',
			attributes: [ 'class' ]
		},
		model: ( viewElement, { writer } ) => {
			return writer.createElement( 'inline-slash', {
				class: viewElement.getAttribute( 'class' )
			} );
		},
		converterPriority: 'high'
	} );

	editor.conversion.for( 'downcast' ).elementToElement( {
		model: {
			name: 'inline-slash',
			attributes: [ 'class' ]
		},
		view: ( modelElement, { writer } ) => {
			return writer.createContainerElement( 'inline-slash', {
				class: modelElement.getAttribute( 'class' )
			} );
		}
	} );
}

export function registerAiTagSchema( editor: Editor ): void {
	editor.model.schema.register( 'ai-tag', {
		inheritAllFrom: '$block',
		isInline: true,
		isObject: true,
		allowWhere: '$block',
		allowAttributes: [ 'id' ]
	} );

	editor.model.schema.extend( '$block', { allowIn: 'ai-tag' } );
	editor.conversion.for( 'upcast' ).elementToElement( {
		view: {
			name: 'ai-tag',
			attributes: [ 'id', 'class' ]
		},
		model: ( viewElement, { writer } ) => {
			return writer.createElement( 'ai-tag', {
				id: viewElement.getAttribute( 'id' )
			} );
		}
	} );

	editor.conversion.for( 'dataDowncast' ).elementToElement( {
		model: 'ai-tag',
		view: ( modelElement, { writer } ) => {
			return writer.createContainerElement( 'ai-tag', {
				id: modelElement.getAttribute( 'id' )
			} );
		}
	} );

	editor.conversion.for( 'editingDowncast' ).elementToElement( {
		model: 'ai-tag',
		view: ( modelElement, { writer } ) => {
			const customTag = writer.createContainerElement( 'ai-tag', {
				id: modelElement.getAttribute( 'id' ),
				class: modelElement.getAttribute( 'class' )
			} );

			return toWidget( customTag, writer );
		}
	} );
}

export function registerAiAnimateStatusSchema( editor: Editor ): void {
	editor.model.schema.register( 'ai-animated-status', {
		inheritAllFrom: '$block',
		isInline: true,
		isObject: true,
		allowWhere: '$block',
		allowAttributes: [ 'class' ]
	} );

	editor.model.schema.extend( '$block', { allowIn: 'ai-animated-status' } );

	editor.conversion.for( 'upcast' ).elementToElement( {
		view: {
			name: 'ai-animated-status',
			attributes: [ 'class' ]
		},
		model: ( viewElement, { writer } ) => {
			return writer.createElement( 'ai-animated-status', {
				class: viewElement.getAttribute( 'class' )
			} );
		}
	} );

	editor.conversion.for( 'dataDowncast' ).elementToElement( {
		model: 'ai-animated-status',
		view: ( modelElement, { writer } ) => {
			return writer.createContainerElement( 'ai-animated-status', {
				class: modelElement.getAttribute( 'class' )
			} );
		}
	} );

	editor.conversion.for( 'editingDowncast' ).elementToElement( {
		model: 'ai-animated-status',
		view: ( modelElement, { writer } ) => {
			const customTag = writer.createContainerElement( 'ai-animated-status', {
				class: modelElement.getAttribute( 'class' )
			} );

			return toWidget( customTag, writer );
		}
	} );
}


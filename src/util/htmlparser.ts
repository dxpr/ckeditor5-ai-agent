import type { Editor } from 'ckeditor5/src/core.js';
import type { Element, Model, Position } from 'ckeditor5/src/engine.js';

export class HtmlParser {
	private editor: Editor;
	private model: Model;

	constructor( editor: Editor ) {
		this.editor = editor;
		this.model = editor.model;
	}

	/**
	 * Inserts simple HTML content into the editor.
	 *
	 * @param html - The HTML string to be inserted into the editor.
	 * @returns A promise that resolves when the HTML has been inserted.
	 */
	public async insertSimpleHtml( html: string ): Promise<void> {
		console.log( 'Attempting to insert simple HTML:', html );
		const viewFragment = this.editor.data.processor.toView( html );
		const modelFragment = this.editor.data.toModel( viewFragment, '$root' );

		const selection = this.model.document.selection;
		const root = this.model.document.getRoot();

		let insertionPosition = selection.getLastPosition();
		const lastInsertedChild = modelFragment.getChild( modelFragment.childCount - 1 );

		const currentChildIndex = selection.getLastPosition()?.path[ 0 ];
		const lastUpdatedElementInRoot = root?.getChild( currentChildIndex ?? 0 );

		this.model.change( writer => {
			if ( lastUpdatedElementInRoot?.is( 'element' ) ) {
				insertionPosition = lastUpdatedElementInRoot.isEmpty ?
					writer.createPositionAt( lastUpdatedElementInRoot, 'end' ) :
					writer.createPositionAfter( lastUpdatedElementInRoot );
			}

			if ( insertionPosition && root ) {
				// Insert element to current selection
				writer.setSelection( insertionPosition );
				this.model.insertContent( modelFragment, insertionPosition );

				// Check if it required to add break to current context of list etc.
				// More to will be added during testing any edge case
				const isBreakElementReq = lastInsertedChild?.getAttribute( 'listItemId' );
				if ( isBreakElementReq && lastInsertedChild ) {
					const paragraph = writer.createElement( 'paragraph' );
					writer.insert( paragraph, writer.createPositionAfter( lastInsertedChild ) );
					writer.setSelection( paragraph, 'in' );
				} else if ( lastInsertedChild ) {
					writer.setSelection( writer.createPositionAfter( lastInsertedChild ) );
				}
			}
		} );

		// Maintain a delay to simulate asynchronous behavior
		await new Promise( resolve => setTimeout( resolve, 100 ) );
	}

	/**
	 * Inserts HTML content as text into the editor.
	 *
	 * @param htmlElement - The HTML element containing the text to be inserted.
	 * @param isStreaming - Indicates whether to insert text in a streaming manner (default is false).
	 * @param shouldAddBreakAtEnd - Indicates whether to add a paragraph break at the end of the inserted content (default is false).
	 * @returns A promise that resolves when the text has been inserted.
	 */
	public async insertAsText( content: HTMLElement, stream: boolean = false, shouldAddBreakAtEnd: boolean = false ): Promise<void> {
		console.log( 'Attempting to insert simple HTML:', content, 'Meet' );
		const viewFragment = this.editor.data.processor.toView( content.outerHTML );
		const modelFragment = this.editor.data.toModel( viewFragment, '$root' );
		const childrenToInsert = Array.from( modelFragment.getChildren() );
		const root = this.model.document.getRoot();

		for ( const element of childrenToInsert ) {
			if ( element.is( 'element' ) ) {
				console.log( 'inserting element', element );
				if ( stream ) {
					await this.insertElementAsStream( element );
				} else {
					await this.batchInsertOfElement( element );
				}
			}
		}

		if ( shouldAddBreakAtEnd ) {
			this.model.change( writer => {
				const currentChildIndex = this.model.document.selection.getLastPosition()?.path[ 0 ];
				if ( root && currentChildIndex != undefined ) {
					const paragraph = writer.createElement( 'paragraph' );
					writer.insert( paragraph, root, currentChildIndex + 1 );
					writer.setSelection( paragraph, 'in' );
				}
			} );
		}
	}

	/**
	 * Inserts a given element into the editor at the specified position.
	 *
	 * @param element - The element to be inserted into the editor.
	 * @param position - The position at which to insert the element.
	 * If not provided, the element will be inserted at the current selection position.
	 * @returns A promise that resolves when the element has been inserted.
	 */
	private async batchInsertOfElement( element: Element, position?: Position ): Promise<void> {
		const selection = this.model.document.selection;
		const root = this.model.document.getRoot();

		let insertionPosition: Position | undefined = position;

		if ( !position ) {
			const currentChildIndex = selection.getFirstPosition()?.path[ 0 ];
			const lastUpdatedElementInRoot = root?.getChild( currentChildIndex ?? 0 );
			if ( lastUpdatedElementInRoot?.is( 'element' ) ) {
				insertionPosition = lastUpdatedElementInRoot.isEmpty ?
					this.model.createPositionAt( lastUpdatedElementInRoot, 'end' ) :
					this.model.createPositionAfter( lastUpdatedElementInRoot );
			}
		}

		// insert content at current identified position
		this.model.change( writer => {
			this.model.insertContent( element, insertionPosition );
			writer.setSelection( element, 'end' );
		} );
	}

	/**
	 * Inserts a given element into the editor at the specified position in a streaming manner.
	 *
	 * @param element - The element to be inserted into the editor.
	 * @param position - The position at which to insert the element.
	 * If not provided, the element will be inserted at the current selection position.
	 * @returns A promise that resolves when the element has been inserted and all text has been streamed in.
	 */
	private async insertElementAsStream( element: Element, position?: Position ): Promise<void> {
		const selection = this.model.document.selection;
		const root = this.model.document.getRoot();

		let insertionPosition: Position | undefined = position;

		if ( !position ) {
			const currentChildIndex = selection.getFirstPosition()?.path[ 0 ];
			const lastUpdatedElementInRoot = root?.getChild( currentChildIndex ?? 0 );

			if ( lastUpdatedElementInRoot?.is( 'element' ) ) {
				insertionPosition = lastUpdatedElementInRoot.isEmpty ?
					this.model.createPositionAt( lastUpdatedElementInRoot, 'end' ) :
					this.model.createPositionAfter( lastUpdatedElementInRoot );
			}
		}

		const texts = Array.from( element.getChildren() );
		let insertingElement: Element;
		this.model.change( writer => {
			insertingElement = writer.createElement( element.name );
			// Set attributes in a more concise way
			for ( const [ key, value ] of element.getAttributes() ) {
				insertingElement._setAttribute( key, value );
			}
			this.model.insertContent( insertingElement, insertionPosition );
			writer.setSelection( insertingElement, 'end' );
		} );

		for ( const text of texts ) {
			if ( text.is( '$text' ) ) {
				const attributes = Array.from( text.getAttributes() );
				const str = text._data;
				// Stream content character by character
				for ( const char of str ) {
					await new Promise( resolve => {
						this.model.change( writer => {
							writer.insertText( char, attributes, insertingElement, 'end' );
						} );
						setTimeout( resolve, 5 ); // Maintain the streaming effect
					} );
				}
			}
		}

		// Set selection
		this.model.change( writer => {
			writer.setSelection( insertingElement, 'end' );
		} );
	}

	/**
	 * Validate given string as a HTML content
	 * @param content string containing html content
	 * @returns A boolean value as result of validation
	 */
	public isCompleteHtmlChunk( html: string ): boolean {
		const openingTags = ( html.match( /<[^/][^>]*>/g ) || [] ).length;
		const closingTags = ( html.match( /<\/[^>]+>/g ) || [] ).length;

		// Check if all opening tags have corresponding closing tags
		if ( openingTags !== closingTags ) {
			return false;
		}

		// Check for incomplete tags
		if ( html.includes( '<' ) && !html.includes( '>' ) ) {
			return false;
		}

		// Check if the HTML starts with an opening tag and ends with a closing tag
		const trimmedHtml = html.trim();
		if ( !trimmedHtml.startsWith( '<' ) || !trimmedHtml.endsWith( '>' ) ) {
			return false;
		}

		return true;
	}
}

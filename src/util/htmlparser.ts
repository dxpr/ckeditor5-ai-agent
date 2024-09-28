import type { Editor } from 'ckeditor5/src/core.js';
import type { Position, Writer } from 'ckeditor5/src/engine.js';
import { uid } from 'ckeditor5/src/utils.js';

export class HtmlParser {
	private editor: Editor;
	constructor( editor: Editor ) {
		this.editor = editor;
	}

	/**
	 * Inserts simple HTML content into the editor.
	 *
	 * @param html - The HTML string to be inserted into the editor.
	 * @returns A promise that resolves when the HTML has been inserted.
	 */
	public async insertSimpleHtml( html: string ): Promise<void> {
		console.log( 'Attempting to insert simple HTML:', html );

		this.editor.model.change( ( writer: Writer ) => {
			const model = this.editor.model;
			const viewFragment = this.editor.data.processor.toView( html );
			const modelFragment = this.editor.data.toModel( viewFragment );
			const selection = model.document.selection;
			const root = model.document.getRoot();
			let insertionPosition = selection.getLastPosition();

			const currentChildIndex = selection.getFirstPosition()?.path[ 0 ];
			const lastUpdatedElementInRoot = root?.getChild( currentChildIndex ?? 0 );

			if ( lastUpdatedElementInRoot?.is( 'element' ) ) {
				insertionPosition = lastUpdatedElementInRoot.isEmpty ?
					writer.createPositionAt( lastUpdatedElementInRoot, 'end' ) :
					writer.createPositionAfter( lastUpdatedElementInRoot );
			}

			// Insert the model fragment at the determined position
			if ( insertionPosition ) {
				writer.setSelection( insertionPosition );
				writer.insert( modelFragment, insertionPosition );
				console.log( 'HTML inserted successfully' );
			} else {
				console.warn( 'No valid insertion position found' );
			}
		} );
		await new Promise( resolve => setTimeout( resolve, 100 ) );
	}

	/**
	 * Inserts HTML content as text into the editor.
	 *
	 * @param content - The HTML element containing the text to be inserted.
	 * @param textType - The type of text element to create (e.g., 'paragraph').
	 * @param stream - Indicates whether to insert text in a streaming manner (default is false).
	 * @returns A promise that resolves when the text has been inserted.
	 */
	public async insertAsText( content: HTMLElement, textType: string, stream: boolean = false ): Promise<void> {
		const model = this.editor.model;
		const selection = model.document.selection;
		const root = model.document.getRoot();
		let insertionPosition: Position;

		const currentChildIndex = selection.getFirstPosition()?.path[ 0 ];
		const lastUpdatedElementInRoot = root?.getChild( currentChildIndex ?? 0 );

		const promises: Array<() => Promise<void>> = [];
		model.change( ( writer: Writer ) => {
			// Determine insertion position based on the last updated element
			if ( lastUpdatedElementInRoot?.is( 'element' ) ) {
				insertionPosition = lastUpdatedElementInRoot.isEmpty ?
					writer.createPositionAt( lastUpdatedElementInRoot, 'end' ) :
					writer.createPositionAfter( lastUpdatedElementInRoot );
			}

			// Create a new model element of the specified text type
			const modelElement = writer.createElement( textType );

			// Iterate through child nodes of the content
			for ( const child of content.childNodes ) {
				const htmlNode = child as HTMLElement;
				const tagName = htmlNode?.tagName?.toLocaleLowerCase();

				const markedUpProperties: Record<string, any> = {};
				const textContent = htmlNode?.textContent || '';

				// Set properties based on the tag name
				if ( tagName === 'strong' ) {
					markedUpProperties.bold = true;
				} else if ( tagName === 'em' ) {
					markedUpProperties.italic = true;
				}

				// Handle text insertion either in streaming or non-streaming mode
				if ( stream ) {
					for ( const char of textContent ) {
						promises.push( async () => {
							model.enqueueChange( ( queueWrite: Writer ) => {
								queueWrite.insertText( char, { ...markedUpProperties }, modelElement, 'end' );
							} );
							await new Promise( resolve => setTimeout( resolve, 5 ) );
						} );
					}
				} else {
					writer.insertText( textContent, { ...markedUpProperties }, modelElement );
				}
			}

			// Set the selection and insert the model element at the determined position
			if ( insertionPosition ) {
				writer.setSelection( insertionPosition );
				writer.insert( modelElement, insertionPosition );
			}
		} );

		// Wait for all promises to resolve
		await promises.reduce( async ( acc, promise ) => acc.then( () => promise() ), Promise.resolve() );
	}

	/**
	 * Inserts a list into the editor from the provided HTML list element.
	 *
	 * @param listElement - The HTML element representing the list to be inserted.
	 * @param indent - The indentation level for nested lists.
	 * @param stream - Indicates whether to insert text in a streaming manner (default is false).
	 * @returns A promise that resolves when the list has been inserted.
	 */
	public async insertList( listElement: HTMLElement, indent: number, listType: string, stream: boolean = false ): Promise<void> {
		// Iterate through each child of the list element
		for ( const item of Array.from( listElement.children ) ) {
			const element = item as HTMLElement;

			// Check if the current item is a list item
			if ( item.tagName.toLowerCase() === 'li' ) {
				const model = this.editor.model;
				const selection = model.document.selection;
				const root = model.document.getRoot();
				let insertionPosition: Position;

				const currentChildIndex = selection.getFirstPosition()?.path[ 0 ];
				const lastUpdatedElementInRoot = root?.getChild( currentChildIndex ?? 0 );
				const promises: Array<() => Promise<void>> = [];
				model.change( ( writer: Writer ) => {
					// Create a new paragraph for the list item
					const listItem = writer.createElement( 'paragraph' );
					writer.setAttribute( 'listIndent', indent, listItem );
					writer.setAttribute( 'listType', listType, listItem );
					writer.setAttribute( 'listItemId', uid(), listItem );

					// Extract text content from the list item
					const itemText = Array.from( element.childNodes )
						.filter( child => child.nodeType === Node.TEXT_NODE )
						.map( node => node?.textContent?.trim() )
						.join( ' ' );

					// Handle text insertion either in streaming or non-streaming mode
					if ( stream ) {
						for ( const char of itemText ) {
							promises.push( async () => {
								model.enqueueChange( ( queueWrite: Writer ) => {
									queueWrite.insertText( char, listItem, 'end' );
								} );
								await new Promise( resolve => setTimeout( resolve, 5 ) );
							} );
						}
					} else {
						writer.insertText( itemText || '', listItem );
					}

					// Determine insertion position
					if ( lastUpdatedElementInRoot?.is( 'element' ) ) {
						insertionPosition = lastUpdatedElementInRoot.isEmpty ?
							writer.createPositionAt( lastUpdatedElementInRoot, 'end' ) :
							writer.createPositionAfter( lastUpdatedElementInRoot );
					}

					// Insert the list item
					if ( root && insertionPosition ) {
						writer.insert( listItem, root, insertionPosition.path[ 0 ] );
						const position = writer.createPositionAfter( listItem ).getShiftedBy( 1 );
						writer.setSelection( position );
					}
				} );

				// Wait for all promises to resolve
				await promises.reduce( async ( acc, promise ) => acc.then( () => promise() ), Promise.resolve() );

				// Recursively insert any nested lists
				if ( element?.children?.length ) {
					for ( const subItem of element?.children ) {
						if ( subItem.tagName.toLowerCase() === 'ul' || subItem.tagName.toLowerCase() === 'ol' ) {
							await this.insertList( subItem as HTMLElement, indent + 1, listType, stream );
						}
					}
				}
			}
		}
	}

	/**
	 * Validate given string as a HTML content
	 * @param content string containing html content
	 * @returns A boolean value as result of validation
	 */
	public isCompleteHtmlChunk( content: string ): boolean {
		const openTags = content.match( /<[^/][^>]*>/g ) || [];
		const closeTags = content.match( /<\/[^>]+>/g ) || [];
		return openTags.length === closeTags.length && content.trim().endsWith( '>' );
	}
}

import type { Editor } from 'ckeditor5/src/core.js';
import type { ModelElement as Element, ModelPosition as Position, ModelItem as Item } from 'ckeditor5/src/engine.js';

export class ProcessContentHelper {
	private editor: Editor;

	private readonly FILTERED_STRINGS = /```html|```|html\n|@@@cursor@@@/g;

	constructor( editor: Editor ) {
		this.editor = editor;
	}

	/**
	 * Updates the content of an AI-generated block in the editor.
	 *
	 * @param newHtml - The new HTML content to insert
	 * @param blockID - The unique identifier of the AI block to update
	 * @returns Promise that resolves when the update is complete
	 * @private
	 */
	public async updateContent( newHtml: string, blockID: string ): Promise<void> {
		const editor = this.editor;
		const tempParagraph: HTMLElement = document.createElement( 'div' );
		tempParagraph.innerHTML = newHtml;
		let textContent = '';

		const root = editor.model.document.getRoot();
		if ( root ) {
			const childrens = this.getViewChildrens( root, `${ blockID }-inline` );
			if ( childrens.length ) {
				if ( tempParagraph.querySelector( 'ul' ) === null && tempParagraph.querySelector( 'li' ) === null ) {
					textContent = tempParagraph.textContent ?? '';
					tempParagraph.innerHTML = '';
				}
			}
		}

		// Skip empty content
		if ( !textContent?.trim() && !tempParagraph.innerHTML?.trim() ) {
			return;
		}

		if ( textContent ) {
			// Filter out markdown code blocks and empty content
			const filteredText = textContent.replace( this.FILTERED_STRINGS, '' );
			if ( !filteredText ) {
				return;
			}

			editor.model.enqueueChange( { isUndoable: false }, writer => {
				const root = editor.model.document.getRoot();
				if ( root ) {
					const childrens = this.getViewChildrens( root, `${ blockID }-inline` );
					const targetElement = childrens.length ? childrens[ 0 ] : null;
					if ( targetElement ) {
						const range = editor.model.createRangeIn( targetElement );
						writer.remove( range );
						writer.insertText( filteredText, targetElement, 'end' );
					}
				}
			} );
		}
		if ( tempParagraph.innerHTML ) {
			// Filter out markdown code blocks from HTML content
			const filteredHtml = tempParagraph.innerHTML.replace( this.FILTERED_STRINGS, '' );
			if ( !filteredHtml ) {
				return;
			}

			editor.model.enqueueChange( { isUndoable: false }, writer => {
				const root = editor.model.document.getRoot();
				if ( root ) {
					const childrens = this.getViewChildrens( root, blockID );
					const targetElement = childrens.length ? childrens[ 0 ] : null;

					if ( targetElement ) {
						const range = editor.model.createRangeIn( targetElement );
						writer.remove( range );
						const viewFragment = editor.data.processor.toView( filteredHtml );
						const modelFragment = editor.data.toModel( viewFragment );
						writer.insert( modelFragment, targetElement, 'end' );
					}
				}
			} );
		}

		await new Promise( resolve => setTimeout( resolve ) );
	}

	/**
	 * Recursively retrieves all child elements of a given view element that match the specified block ID.
	 *
	 * @param viewElement - The parent view element from which to retrieve children.
	 * @param blockID - The unique identifier of the AI block to search for.
	 * @returns An array of matching child elements.
	 */
	private getViewChildrens( viewElement: any, blockID: string ): any {
		const results = [];
		for ( const child of viewElement.getChildren() ) {
			if ( child.is( 'element' ) ) {
				if ( child.is( 'element', 'ai-tag' ) && child.getAttribute( 'id' ) === blockID ) {
					results.push( child );
				} else {
					const nestedResults = this.getViewChildrens( child, blockID );
					results.push( ...nestedResults );
				}
			}
		}
		return results;
	}

	/**
	 * Handles cleanup after AI generation is completed or cancelled.
	 * Removes the cancel button from the UI and cleans up the temporary AI tag from editor content.
	 *
	 * @param blockID - Unique identifier for the AI generation block to be cleaned up
	 * @private
	 */
	public processCompleted( blockID: string ): void {
		const editor = this.editor;
		const toolbarElement = ( editor.ui.view as any ).toolbar.element;
		if ( toolbarElement ) {
			const cancelButton = toolbarElement.querySelector( '.ck-cancel-request-button' );
			if ( cancelButton ) {
				cancelButton.remove();
			}
		}

		const modelRoot = editor.model.document.getRoot();
		if ( modelRoot ) {
			const modelRange = editor.model.createRangeIn( modelRoot );
			for ( const item of modelRange.getItems() ) {
				if ( item.is( 'element', 'ai-animated-status' ) ) {
					editor.model.change( writer => {
						writer.remove( item );
					} );
				}
			}
		}

		const editorData = editor.getData();
		let editorContent = editorData.replace( new RegExp( `<ai-tag id="${ blockID }-inline">&nbsp;</ai-tag>`, 'g' ), '' );
		editorContent = editorContent.replace( new RegExp( `<ai-tag id="${ blockID }">&nbsp;</ai-tag>`, 'g' ), '' );
		editorContent = editorContent.replace( `</ai-tag>`, '' );
		editorContent = editorContent.replace( `<ai-tag id="${ blockID }-inline">`, '' );
		editorContent = editorContent.replace( `<ai-tag id="${ blockID }">`, '' );

		editor.model.change( writer => {
			const root = editor.model.document.getRoot();
			if ( root ) {
				writer.remove( editor.model.createRangeIn( root ) );
				
				const viewFragment = editor.data.processor.toView( editorContent );
				const modelFragment = editor.data.toModel( viewFragment );
				writer.insert( modelFragment, root, 0 );
			}
		} );
	}

	/**
	 * Handles the undo and redo commands for the editor.
	 *
	 * This function adds event listeners to the undo and redo commands.
	 * If the editor's data contains any AI tags, executing the undo or redo command
	 * will trigger the respective command, allowing for proper management of AI-generated content.
	 *
	 * @returns void
	 */
	public undoRedoHandler(): void {
		const editor = this.editor;
		const undoCommand = editor.commands.get( 'undo' );
		if ( undoCommand ) {
			undoCommand.on( 'execute', () => {
				const editorData = editor.getData();
				if ( editorData.indexOf( 'ai-tag' ) > -1 ) {
					editor.execute( 'undo' );
				}
			} );
		}

		const redoCommand = editor.commands.get( 'redo' );
		if ( redoCommand ) {
			redoCommand.on( 'execute', () => {
				const editorData = editor.getData();
				if ( editorData.indexOf( 'ai-tag' ) > -1 ) {
					editor.execute( 'redo' );
				}
			} );
		}
	}

	/**
	 * Inserts AI tags into the editor at the current selection position.
	 *
	 * This function creates two AI tags: one inline tag and one block tag.
	 * The inline tag is inserted immediately after the current selection,
	 * while the block tag is inserted after the parent element of the selection.
	 *
	 * @param blockID - The unique identifier for the AI block, used to set the ID of the tags.
	 *
	 * @returns A Promise that resolves when the tags have been successfully inserted.
	 */
	public async insertAiTag( blockID: string ): Promise<void> {
		const editor = this.editor;
		editor.model.change( writer => {
			const position = this.editor.model.document.selection.getLastPosition();
			let newPosition: Position | undefined;
			if ( position ) {
				if ( position?.parent.name === 'inline-slash' ) {
					if ( position?.parent?.parent ) {
						newPosition = writer.createPositionAt( position.parent.parent, 'after' );
					}
					if ( position?.parent ) {
						const parentJson = position?.parent?.parent?.toJSON() as any;
						if ( parentJson.children.length > 1 ) {
							const positionInline = writer.createPositionAt( position.parent, 'after' );
							const aiTagInline = writer.createElement( 'ai-tag', {
								id: `${ blockID }-inline`
							} );
							writer.insert( aiTagInline, positionInline );
						}
					}
				} else {
					const aiTagInline = writer.createElement( 'ai-tag', {
						id: `${ blockID }-inline`
					} );
					writer.insert( aiTagInline, position );
					newPosition = writer.createPositionAt( position.parent, 'after' );
				}
				if ( newPosition ) {
					const aiTag = writer.createElement( 'ai-tag', {
						id: blockID
					} );
					writer.insert( aiTag, newPosition );
				}
			}
		} );
	}

	/**
	 * Clears the content of the specified parent element in the editor.
	 *
	 * @param parent - The parent element whose content will be cleared.
	 */
	public clearParentContent( parent: Element, command: boolean ): void {
		const editor = this.editor;
		const model = editor.model;
		const root = model.document.getRoot();
		const positionFirst = model.document.selection.getFirstPosition();
		const positionLast = model.document.selection.getLastPosition();

		if ( root && positionFirst && positionLast ) {
			editor.model.change( writer => {
				if ( command ) {
					const range = model.createRange(
						model.createPositionFromPath( root, positionFirst.path ),
						model.createPositionFromPath( root, positionLast.path )
					);
					writer.remove( range );
					const positionFirstAfterRemove = model.document.selection.getFirstPosition();
					if ( positionFirstAfterRemove ) {
						const positionParentFirst = positionFirstAfterRemove.parent as Item;
						if ( positionFirstAfterRemove.parent.childCount === 0 ) {
							writer.remove( positionParentFirst );
						} else if ( positionFirstAfterRemove.parent.childCount === 1 ) {
							const tag = positionFirstAfterRemove.parent?.getChild( 0 ) as Element;
							if ( tag.name === 'ai-tag' && positionFirstAfterRemove.parent.name !== '$root' ) {
								writer.remove( positionParentFirst );
							}
						}
					}

					const positionLastAfterRemove = model.document.selection.getLastPosition();
					if ( positionLastAfterRemove ) {
						const positionParentLast = positionLastAfterRemove.parent as Item;
						if ( positionLastAfterRemove.parent.childCount === 0 ) {
							writer.remove( positionParentLast );
						} else if ( positionLastAfterRemove.parent.childCount === 1 ) {
							const tag = positionLastAfterRemove.parent?.getChild( 0 ) as Element;
							if ( tag.name === 'ai-tag' && positionLastAfterRemove.parent.name !== '$root' ) {
								writer.remove( positionParentLast );
							}
						}
					}
				} else {
					const startingPath = parent.getPath();
					const range = model.createRange(
						model.createPositionFromPath( root, startingPath ),
						model.createPositionFromPath( root, positionLast.path )
					);
					writer.remove( range );

					if ( parent.getPath() ) {
						if ( parent.name === 'inline-slash' ) {
							const position = model.document.selection.getLastPosition();
							const positionParent = position?.parent as Item;
							let lineEmpty = true;
							if ( position?.parent ) {
								if ( position?.parent?.getChildren().next().value ) {
									lineEmpty = false;
								}
							}
							if ( lineEmpty ) {
								writer.remove( positionParent );
							}
						} else {
							const positionParent = parent as Item;
							writer.remove( positionParent );
						}
					}
				}
			} );
		}
	}

	/**
	 * Creates and displays an animated status message in the editor.
	 * Replaces existing content in the target element with a loading animation and status text.
	 *
	 * @param status - The status message to display
	 * @param blockID - Unique identifier for the target block element
	 * @returns A Promise that resolves when the animation is set up
	 *
	 * @example
	 * await processContentHelper.animatedStatusMessages('Processing', 'block-123');
	 *
	 * @remarks
	 * - Looks for elements with either `${blockID}-inline` or `${blockID}` suffix
	 * - Creates an 'ai-animated-status' element with 'ck-loading-shimmer' class
	 * - Appends ellipsis to the status message
	 * - Changes are not undoable in the editor history
	 */

	public async animatedStatusMessages( status: string, blockID: string ): Promise<void> {
		const editor = this.editor;
		const root = editor.model.document.getRoot();
		let targetElement: any;
		if ( root ) {
			const inlineChildrens = this.getViewChildrens( root, `${ blockID }-inline` );
			const childrens = this.getViewChildrens( root, blockID );
			if ( inlineChildrens.length ) {
				targetElement = inlineChildrens.length ? inlineChildrens[ 0 ] : null;
			} else if ( childrens.length ) {
				targetElement = childrens.length ? childrens[ 0 ] : null;
			}

			if ( targetElement ) {
				editor.model.enqueueChange( { isUndoable: false }, writer => {
					const range = editor.model.createRangeIn( targetElement );
					writer.remove( range );

					const aiAnimatedStatus = writer.createElement( 'ai-animated-status', {
						class: 'ck-loading-shimmer'
					} );
					writer.insert( aiAnimatedStatus, targetElement );
					writer.insertText( `${ status }...`, aiAnimatedStatus, 'end' );
				} );
			}
		}
		await new Promise( resolve => setTimeout( resolve ) );
	}
}

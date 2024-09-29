import { Editor } from '@ckeditor/ckeditor5-core';
import { DocumentFragment, Element, Model, Position, Writer } from '@ckeditor/ckeditor5-engine';

export class HtmlParser {
		private editor: Editor;
		private model: Model;

		constructor(editor: Editor) {
				this.editor = editor;
				this.model = editor.model;
		}

		public isCompleteHtmlChunk(html: string): boolean {
			// This is a simple implementation. You may need to adjust it based on your specific requirements.
			const openingTags = (html.match(/<[^/][^>]*>/g) || []).length;
			const closingTags = (html.match(/<\/[^>]+>/g) || []).length;
	
			// Check if all opening tags have corresponding closing tags
			if (openingTags !== closingTags) {
					return false;
			}
	
			// Check for incomplete tags
			if (html.includes('<') && !html.includes('>')) {
					return false;
			}
	
			// Check if the HTML starts with an opening tag and ends with a closing tag
			const trimmedHtml = html.trim();
			if (!trimmedHtml.startsWith('<') || !trimmedHtml.endsWith('>')) {
					return false;
			}
	
			return true;
	}

		public async insertSimpleHtml(content: string): Promise<void> {
				// Implement the simple HTML insertion logic
				// This should be similar to your existing implementation, but using model.insertContent
				const viewFragment = this.editor.data.processor.toView(content);
				const modelFragment = this.editor.data.toModel(viewFragment);

				this.model.change(writer => {
						this.model.insertContent(modelFragment);
				});
		}

		public async insertList(element: HTMLElement, depth: number, listType: string, isFirstElement: boolean): Promise<void> {
				// Implement the list insertion logic
				// This should be similar to your existing implementation, but using model.insertContent where appropriate
		}

		public async insertAsText(content: HTMLElement, textType: string, stream: boolean = false): Promise<void> {
				const selection = this.model.document.selection;
				const root = this.model.document.getRoot();
				let insertionPosition: Position | undefined;

				const currentChildIndex = selection.getFirstPosition()?.path[0];
				const lastUpdatedElementInRoot = root?.getChild(currentChildIndex ?? 0);

				if (lastUpdatedElementInRoot?.is('element')) {
						insertionPosition = lastUpdatedElementInRoot.isEmpty ?
								this.model.createPositionAt(lastUpdatedElementInRoot, 'end') :
								this.model.createPositionAfter(lastUpdatedElementInRoot);
				}

				if (stream) {
						await this.streamInsertContent(content, textType, insertionPosition);
				} else {
						this.batchInsertContent(content, textType, insertionPosition);
				}
		}

		private batchInsertContent(content: HTMLElement, textType: string, insertionPosition?: Position): void {
				const fragment = this.prepareDocumentFragment(content, textType);

				this.model.change(() => {
						this.model.insertContent(fragment, insertionPosition);
				});
		}

		private async streamInsertContent(content: HTMLElement, textType: string, insertionPosition?: Position): Promise<void> {
			let currentElement: Element | null = null;

			this.model.change(writer => {
					currentElement = writer.createElement(textType);
					this.model.insertContent(currentElement, insertionPosition);
					writer.setSelection(currentElement, 'end');
			});

			for (const child of content.childNodes) {
					const htmlNode = child as HTMLElement;
					const textContent = htmlNode?.textContent || '';
					const tagName = htmlNode?.tagName?.toLowerCase();

					for (const char of textContent) {
							await new Promise<void>(resolve => {
									this.model.enqueueChange(writer => {
											const attributes: Record<string, boolean> = {};
											if (tagName === 'strong') attributes.bold = true;
											if (tagName === 'em') attributes.italic = true;

											writer.insertText(char, attributes, writer.createPositionAt(currentElement!, 'end'));
											resolve();
									});
							});
							await new Promise(resolve => setTimeout(resolve, 5));
					}
			}
	}

		private prepareDocumentFragment(content: HTMLElement, textType: string): DocumentFragment {
				return this.model.change(writer => {
						const fragment = writer.createDocumentFragment();
						const elementType = writer.createElement(textType);

						for (const child of content.childNodes) {
								const htmlNode = child as HTMLElement;
								const tagName = htmlNode?.tagName?.toLowerCase();
								const textContent = htmlNode?.textContent || '';

								const attributes: Record<string, boolean> = {};
								if (tagName === 'strong') attributes.bold = true;
								if (tagName === 'em') attributes.italic = true;

								const textNode = writer.createText(textContent, attributes);
								writer.append(textNode, elementType);
						}

						writer.append(elementType, fragment);
						return fragment;
				});
		}

		private createTempElement(char: string, tagName?: string): HTMLElement {
				const temp = document.createElement('div');
				if (tagName === 'strong' || tagName === 'em') {
						const element = document.createElement(tagName);
						element.textContent = char;
						temp.appendChild(element);
				} else {
						temp.textContent = char;
				}
				return temp;
		}
}
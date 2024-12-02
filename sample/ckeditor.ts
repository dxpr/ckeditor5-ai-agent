declare global {
	interface Window {
		editor: ClassicEditor;
	}
}

import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';

import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Bold, Code, Italic } from '@ckeditor/ckeditor5-basic-styles';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { CodeBlock } from '@ckeditor/ckeditor5-code-block';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Heading, HeadingButtonsUI } from '@ckeditor/ckeditor5-heading';
import { Image, ImageCaption, ImageStyle, ImageToolbar, ImageUpload } from '@ckeditor/ckeditor5-image';
import { Indent } from '@ckeditor/ckeditor5-indent';
import { Link } from '@ckeditor/ckeditor5-link';
import { List } from '@ckeditor/ckeditor5-list';
import { MediaEmbed } from '@ckeditor/ckeditor5-media-embed';
import { Paragraph, ParagraphButtonUI } from '@ckeditor/ckeditor5-paragraph';
import { Table, TableToolbar } from '@ckeditor/ckeditor5-table';
import { Base64UploadAdapter } from '@ckeditor/ckeditor5-upload';
import { SourceEditing } from '@ckeditor/ckeditor5-source-editing';

import AiAgent from '../src/aiagent.js';

ClassicEditor
	.create( document.getElementById( 'editor' )!, {
		plugins: [
			AiAgent,
			Essentials,
			Autoformat,
			BlockQuote,
			Bold,
			Heading,
			Image,
			ImageCaption,
			ImageStyle,
			ImageToolbar,
			ImageUpload,
			Indent,
			Italic,
			Link,
			List,
			MediaEmbed,
			Paragraph,
			Table,
			TableToolbar,
			CodeBlock,
			Code,
			Base64UploadAdapter,
			SourceEditing
		],
		toolbar: [
			'aiAgentButton',
			'|',
			'heading',
			'|',
			'bold',
			'italic',
			'link',
			'code',
			'bulletedList',
			'numberedList',
			'|',
			'outdent',
			'indent',
			'|',
			'uploadImage',
			'blockQuote',
			'insertTable',
			'mediaEmbed',
			'codeBlock',
			'|',
			'sourceEditing'
		],
		image: {
			toolbar: [
				'imageStyle:inline',
				'imageStyle:block',
				'imageStyle:side',
				'|',
				'imageTextAlternative'
			]
		},
		table: {
			contentToolbar: [
				'tableColumn',
				'tableRow',
				'mergeTableCells'
			]
		},
		aiAgent: {
			apiKey: 'YOUR_API_KEY',
			endpointUrl: 'https://kavya.dxpr.com/v1/chat/completions',
			temperature: 0.7,
			model: 'gpt-4o',
			debugMode: true,
			promptSettings: {
				overrides: {
					'tone': `Custom tone requirements:
1. Use a professional, academic writing style
2. Maintain formal language throughout
3. Avoid colloquialisms and casual expressions
4. Use precise terminology
5. Focus on clarity and objectivity`
				},
				additions: {
					'html-formatting': `
Additional HTML requirements:
1. Use semantic HTML5 elements when appropriate
2. Include ARIA attributes for accessibility
3. Follow BEM naming convention for any classes`
				}
			}
		},
		language: {
			content: 'en',
			ui: 'en'
		}
	} )
	.then( editor => {
		window.editor = editor;
		CKEditorInspector.attach( editor );
		window.console.log( 'CKEditor 5 is ready.', editor );
	} )
	.catch( err => {
		window.console.error( err.stack );
	} );

ClassicEditor
	.create( document.getElementById( 'editor2' )!, {
		plugins: [
			AiAgent,
			Essentials,
			Autoformat,
			BlockQuote,
			Bold,
			Heading,
			HeadingButtonsUI,
			Indent,
			Italic,
			List,
			Paragraph,
			ParagraphButtonUI,
			SourceEditing
		],
		toolbar: [
			'aiAgentButton',
			'|', 'paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6',
			'|',
			'bold',
			'italic',
			'bulletedList',
			'numberedList',
			'|',
			'blockQuote',
			'|',
			'sourceEditing'
		],
		heading: {
			options: [
				{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
				{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
				{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
				{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
				{ model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
				{ model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
				{ model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
			]
		},
		aiAgent: {
			apiKey: 'YOUR_API_KEY',
			endpointUrl: 'https://kavya.dxpr.com/v1/chat/completions',
			temperature: 0.7,
			model: 'gpt-4o',
			debugMode: true,
			promptSettings: {
				overrides: {
					'response-rules': `Custom response rules:
1. Focus on technical accuracy
2. Include relevant code examples
3. Maintain consistent terminology
4. Reference industry standards
5. Provide practical implementation details`
				},
				additions: {
					'content-structure': `
Additional structure requirements:
1. Begin with a brief overview
2. Include implementation steps
3. End with best practices
4. Add relevant warnings or notes`
				}
			}
		},
		language: {
			content: 'en',
			ui: 'en'
		}
	} )
	.then( editor => {
		window.editor = editor;
		CKEditorInspector.attach( editor );
		window.console.log( 'CKEditor 5 is ready.', editor );
	} )
	.catch( err => {
		window.console.error( err.stack );
	} );

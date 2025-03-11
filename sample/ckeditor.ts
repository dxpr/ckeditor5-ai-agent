declare global {
	interface Window {
		editors: Record<string, ClassicEditor | InlineEditor>;
	}
}

import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { InlineEditor } from '@ckeditor/ckeditor5-editor-inline';

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
import { AccessibilityHelp } from '@ckeditor/ckeditor5-ui';
import { Style } from '@ckeditor/ckeditor5-style';
import { GeneralHtmlSupport } from '@ckeditor/ckeditor5-html-support';

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
			SourceEditing,
			AccessibilityHelp,
			GeneralHtmlSupport,
			Style
		],
		toolbar: [
			'aiAgentButton',
			'aiAgentToneButton',
			'|',
			'style',
			'|',
			'undo', 'redo',
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
			'sourceEditing',
			'accessibilityHelp'
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
		style: {
			definitions: [
				{
					name: 'Button Primary',
					element: 'span',
					classes: [ 'btn', 'btn-primary' ]
				},
				{
					name: 'Button Secondary',
					element: 'span',
					classes: [ 'btn', 'btn-secondary' ]
				},
				{
					name: 'Badge Primary',
					element: 'span',
					classes: [ 'badge', 'bg-primary' ]
				},
				{
					name: 'Badge Secondary',
					element: 'span',
					classes: [ 'badge', 'bg-secondary' ]
				}
			]
		},
		aiAgent: {
			apiKey: 'YOUR_API_KEY',
			debugMode: true,
			tonesDropdown: [
				{
					title: 'Patient-Friendly',
					command: 'Write in a warm, clear, and simple way for patients to understand.'
				},
				{
					title: 'Professional',
					command: 'Use technical and formal language suitable for healthcare professionals.'
				}
			]
		},
		language: {
			content: 'en',
			ui: 'en'
		},
		htmlSupport: {
			allow: [
				{
					name: /^(span|div)$/,
					classes: true,
					attributes: true
				},
				{
					name: 'div',
					classes: [
						'btn',
						'btn-primary',
						'btn-secondary',
						'btn-link',
						'badge',
						'bg-primary',
						'bg-secondary'
					],
					attributes: {
						role: true
					}
				},
				{
					name: 'span',
					classes: [
						'btn',
						'btn-primary',
						'btn-secondary',
						'btn-link',
						'badge',
						'bg-primary',
						'bg-secondary'
					]
				}
			]
		}
	} )
	.then( editor => {
		window.editors.classic = editor;
		CKEditorInspector.attach( editor );
		window.console.log( 'CKEditor 5 classic editor is ready.', editor );
	} )
	.catch( err => {
		window.console.error( err.stack );
	} );

// Common configuration for inline editors
const inlineEditorConfig = {
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
	toolbar: {
		items: [
			'aiAgentButton',
			'|',
			'undo', 'redo',
			'|',
			'paragraph', 'heading1', 'heading2', 'heading3',
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
		shouldNotGroupWhenFull: true
	},
	aiAgent: {
		apiKey: 'YOUR_API_KEY',
		contentScope: '.page-builder-container',
		debugMode: true
	},
	language: {
		content: 'en',
		ui: 'en'
	}
} as any;

// Initialize window.editors object
window.editors = {};

// Initialize all inline editors
[ 'editor1', 'editor2', 'editor3', 'editor4' ].forEach( editorId => {
	InlineEditor
		.create( document.getElementById( editorId )!, inlineEditorConfig )
		.then( editor => {
			window.editors[ editorId ] = editor;
			CKEditorInspector.attach( editor );
			window.console.log( `CKEditor 5 inline ${ editorId } is ready.`, editor );
		} )
		.catch( err => {
			window.console.error( `Error initializing ${ editorId }:`, err.stack );
		} );
} );

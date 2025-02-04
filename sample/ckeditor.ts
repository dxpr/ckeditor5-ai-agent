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
			AccessibilityHelp
		],
		toolbar: [
			'aiAgentButton',
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
		aiAgent: {
			apiKey: 'YOUR_API_KEY',
			debugMode: true,
			commandsDropdown: [
				{
					title: 'Style & Tone',
					items: [
						{
							title: 'Make Professional',
							command: 'Improve using formal, and respectful language conveying expertise. Keep the text formatting.'
						},
						{
							title: 'Make Casual',
							command: 'Rewrite in a friendly, conversational tone while maintaining the key points and formatting'
						},
						{
							title: 'Make Technical',
							command: 'Rewrite using precise technical language and industry terminology while preserving structure'
						}
					]
				},
				{
					title: 'Enhance Content',
					items: [
						{
							title: 'Add Examples',
							command: 'Add relevant examples and use cases to illustrate the main points'
						},
						{
							title: 'Add Statistics',
							command: 'Enhance with relevant statistics and data points to support the content'
						},
						{
							title: 'Expand Details',
							command: 'Expand the current content with more detailed explanations and supporting information'
						}
					]
				}
			]
		},
		language: {
			content: 'en',
			ui: 'en'
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
};

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

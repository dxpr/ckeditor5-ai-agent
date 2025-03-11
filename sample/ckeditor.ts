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
					name: 'Alert Primary',
					element: 'div',
					classes: [ 'alert', 'alert-primary' ]
				},
				{
					name: 'Alert Success',
					element: 'div',
					classes: [ 'alert', 'alert-success' ]
				},
				{
					name: 'Alert Warning',
					element: 'div',
					classes: [ 'alert', 'alert-warning' ]
				},
				{
					name: 'Alert Danger',
					element: 'div',
					classes: [ 'alert', 'alert-danger' ]
				},
				{
					name: 'Card',
					element: 'div',
					classes: [ 'card' ]
				},
				{
					name: 'Card Header',
					element: 'div',
					classes: [ 'card-header' ]
				},
				{
					name: 'Card Body',
					element: 'div',
					classes: [ 'card-body' ]
				},
				{
					name: 'Card Footer',
					element: 'div',
					classes: [ 'card-footer' ]
				},
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
				},
				{
					name: 'List Group',
					element: 'ul',
					classes: [ 'list-group' ]
				},
				{
					name: 'List Group Item',
					element: 'li',
					classes: [ 'list-group-item' ]
				}
			]
		},
		aiAgent: {
			apiKey: 'YOUR_API_KEY',
			debugMode: true,
			commandsDropdown: [
				{
					title: 'Bootstrap 5 Styles',
					items: [
						{
							title: 'Alert',
							command: 'Add Bootstrap 5 alert class and style to the selected text. ' +
								'Use div with class="alert alert-primary" role="alert"'
						},
						{
							title: 'Card',
							command: 'Create a Bootstrap 5 card structure with class="card". ' +
								'Include card-header, card-body with card-title and card-text, ' +
								'and optionally card-footer'
						},
						{
							title: 'Button',
							command: 'Add Bootstrap 5 button classes (btn btn-primary). ' +
								'For links use class="btn btn-link"'
						},
						{
							title: 'Badge',
							command: 'Add Bootstrap 5 badge class to the text (class="badge bg-secondary")'
						},
						{
							title: 'List Group',
							command: 'Create a Bootstrap 5 list group with class="list-group" and list-group-item for each item'
						}
					]
				},
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
		},
		htmlSupport: {
			allow: [
				{
					name: /^(div|span|ul|li|button)$/,
					styles: true,
					classes: true,
					attributes: true
				},
				{
					name: 'div',
					classes: [
						'alert',
						'alert-primary',
						'alert-success',
						'alert-warning',
						'alert-danger',
						'card',
						'card-header',
						'card-body',
						'card-footer'
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
				},
				{
					name: 'ul',
					classes: [ 'list-group' ]
				},
				{
					name: 'li',
					classes: [ 'list-group-item' ]
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

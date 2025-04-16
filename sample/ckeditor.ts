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
import { Fullscreen } from '@ckeditor/ckeditor5-fullscreen';
import { Emoji } from '@ckeditor/ckeditor5-emoji';
import { Mention } from '@ckeditor/ckeditor5-mention';

import AiAgent from '../src/aiagent.js';

ClassicEditor
	.create( document.getElementById( 'editor' )!, {
		licenseKey: 'GPL',
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
			Style,
			Fullscreen,
			Emoji,
			Mention
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
			'accessibilityHelp',
			'emoji',
			'|',
			'fullscreen'
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
				},
				{
					name: 'Smurf test ',
					element: 'span',
					classes: [ 'smurf', 'smurf-test' ]
				}
			]
		},
		aiAgent: {
			apiKey: 'YOUR_API_KEY',
			debugMode: true,
			tonesDropdown: [
				{
					label: 'Patient-Friendly',
					tone: 'Write in a warm, clear, and simple way for patients to understand.'
				},
				{
					label: 'Professional',
					tone: 'Use technical and formal language suitable for healthcare professionals.'
				},
				{
					label: 'Educational',
					tone: 'Explain concepts clearly with an informative approach that helps readers understand complex topics.'
				},
				{
					label: 'Persuasive',
					tone: 'Use compelling language to convince readers and support arguments with strong reasoning.'
				},
				{
					label: 'Inspirational',
					tone: 'Use motivational language that encourages action and creates a sense of possibility.'
				}
			],
			commandsDropdown: [
				{
					title: 'Transform Content',
					items: [
						{
							title: 'Improve Tone of Voice',
							command:
								`Rewrite the content to match the TONE while preserving the key message and meaning.
								Ensure the writing style is consistent.\nYou must keep the text formatting.`
						},
						{
							title: 'Summarize',
							command: 'Summarize this text in 3-5 bullet points'
						},
						{
							title: 'Simplify Language',
							command: 'Rewrite this text using simpler language while preserving the key information'
						},
						{
							title: 'Fix Grammar & Style',
							command: 'Correct any grammar, spelling, or style issues in this text'
						},
						{
							title: 'Convert to Table',
							command: 'Convert this content into a well-structured HTML table with appropriate headers'
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
					name: /.*/,
					attributes: true,
					classes: true,
					styles: true
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
	licenseKey: 'GPL',
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

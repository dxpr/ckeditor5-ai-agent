import type { Editor } from 'ckeditor5/src/core.js';
import {
	MenuBarMenuView,
	MenuBarMenuListView,
	MenuBarMenuListItemView,
	MenuBarMenuListItemButtonView,
	createDropdown,
	IconView,
	View
} from 'ckeditor5/src/ui.js';
import aiAgentToneIcon from '../../theme/icons/ai-agent-tone.svg';
import checkIcon from '../../theme/icons/check.svg';
import { getDefaultAiAgentToneDropdownMenu } from './translations.js';
import { STORAGE_PREFIX } from '../const.js';

export function addAiAgentToneButton( editor: Editor ): void {
	const t = editor.t;
	const config = editor.config.get( 'aiAgent' );
	const defaultTones = getDefaultAiAgentToneDropdownMenu( editor );
	const configTonesDropdown = config?.tonesDropdown?.map( item => ( {
		label: item.label,
		key: item.tid ? String( item.tid ) : item.label.toLowerCase().replace( / /g, '_' ),
		tone: item.tone,
		tid: item.tid
	} ) );

	const tonesDropdown = configTonesDropdown ?
		[ defaultTones[ 0 ], ...configTonesDropdown ] :
		defaultTones;

	editor.ui.componentFactory.add( 'aiAgentToneButton', locale => {
		const dropdownView = createDropdown( locale );
		dropdownView.class = 'ck-ai-tone-list';
		const buttonView = dropdownView.buttonView;
		buttonView.set( {
			label: t( 'Tone of voice' ),
			icon: aiAgentToneIcon,
			tooltip: true
		} );

		const menuView = new MenuBarMenuView( locale );
		const listView = new MenuBarMenuListView( locale );
		const toneItems: Array<{ tone: string; checkIcon: IconView }> = [];

		// Add group title for Tone
		const titleView = new MenuBarMenuListItemView( locale, menuView );
		const titleButton = new MenuBarMenuListItemButtonView( locale );
		titleButton.set( {
			label: t( 'Tone' ),
			class: 'ck-menu-group-title ck-list-item-button',
			isEnabled: false
		} );
		titleView.children.add( titleButton );
		listView.items.add( titleView );

		for ( const item of tonesDropdown ) {
			const listItemView = new MenuBarMenuListItemView( locale, menuView );
			const buttonView = new MenuBarMenuListItemButtonView( locale );
			const checkIconView = new IconView();
			checkIconView.set( {
				content: checkIcon
			} );

			checkIconView.isVisible = false;
			toneItems.push( { tone: item.tone, checkIcon: checkIconView } );

			const spanView = new View( locale );
			spanView.setTemplate( {
				tag: 'span',
				attributes: {
					class: 'ck ck-list-item-button__check-holder ck-tone-of-voice'
				},
				children: [ checkIconView ]
			} );
			spanView.render();

			buttonView.children.add( spanView );
			buttonView.set( {
				label: item.label,
				class: 'ck-menu-item'
			} );
			buttonView.delegate( 'execute' ).to( menuView );

			listItemView.children.add( buttonView );
			listView.items.add( listItemView );
			buttonView.on( 'execute', () => {
				toneItems.forEach( toneItem => {
					toneItem.checkIcon.isVisible = false;
				} );
				checkIconView.isVisible = true;
				editor.execute( 'aiAgentTone', {
					value: item.tone
				} );
				editor.editing.view.focus();
			} );
		}

		dropdownView.panelView.children.add( listView );

		// Update checkmarks from localStorage when dropdown opens
		dropdownView.on( 'change:isOpen', () => {
			if ( dropdownView.isOpen ) {
				const storedToneKey = localStorage.getItem( `${ STORAGE_PREFIX }:tone` );
				const matchingTone = tonesDropdown.find( item => item.key === storedToneKey );
				const currentToneValue = matchingTone?.tone || '';

				toneItems.forEach( item => {
					item.checkIcon.isVisible = item.tone === currentToneValue;
				} );
			}
		} );

		return dropdownView;
	} );
}

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

export function addAiAgentToneButton( editor: Editor ): void {
	const t = editor.t;
	const config = editor.config.get( 'aiAgent' );
	const defaultTones = getDefaultAiAgentToneDropdownMenu( editor );
	const configTonesDropdown = config?.tonesDropdown?.map( item => ( {
		label: item.label,
		key: item.label.toLowerCase().replace( / /g, '_' ),
		tone: item.tone
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
		const checkIcons: Array<IconView> = [];

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

			const toneCommand = editor.commands.get( 'aiAgentTone' );
			const currentToneValue = toneCommand?.value as string || '';
			checkIconView.isVisible = item.tone === currentToneValue;
			checkIcons.push( checkIconView );

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
				checkIcons.forEach( iconView => {
					iconView.isVisible = false;
				} );
				checkIconView.isVisible = true;
				editor.execute( 'aiAgentTone', {
					value: item.tone
				} );
				editor.editing.view.focus();
			} );
		}

		dropdownView.panelView.children.add( listView );
		return dropdownView;
	} );
}

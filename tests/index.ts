import { expect } from 'chai';
import { AiAgent as AiAgentDll, icons } from '../src/index.js';
import AiAgent from '../src/aiagent.js';

import ckeditor from './../theme/icons/ckeditor.svg';

describe( 'CKEditor5 AiAgent DLL', () => {
	it( 'exports AiAgent', () => {
		expect( AiAgentDll ).to.equal( AiAgent );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );

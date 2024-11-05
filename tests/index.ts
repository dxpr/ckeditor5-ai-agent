import { expect } from 'chai';
import { AiAssist as AiAssistDll } from '../src/index.js';
import AiAssist from '../src/aiassist.js';

describe( 'CKEditor5 AiAssist DLL', () => {
	it( 'exports AiAssist', () => {
		expect( AiAssistDll ).to.equal( AiAssist );
	} );
} );

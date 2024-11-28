import { expect } from 'chai';
import { AiAgent as AiAgentDll, icons } from '../src/index.js';
import AiAgent from '../src/aiagent.js';


describe( 'CKEditor5 AiAgent DLL', () => {
	it( 'exports AiAgent', () => {
		expect( AiAgentDll ).to.equal( AiAgent );
	} );
} );

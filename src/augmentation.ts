import type { AiAssist } from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ AiAssist.pluginName ]: AiAssist;
	}
}

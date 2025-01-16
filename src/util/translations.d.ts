import type { Editor } from 'ckeditor5/src/core.js';
export declare function getErrorMessages(status: number, editor: Editor): string;
export declare function getDefaultAiAgentDropdownMenu(editor: Editor): Array<{
    title: string;
    items: Array<{
        title: string;
        command: string;
    }>;
}>;

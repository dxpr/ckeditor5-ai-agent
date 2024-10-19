import type { AiModel } from './type-identifiers.js';
export declare const TOKEN_LIMITS: Record<AiModel, {
    min: number;
    max: number;
    context: number;
}>;
export declare const SUPPORTED_LANGUAGES: string[];

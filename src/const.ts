import type { AiModel } from './type-identifiers.js';

// const
export const TOKEN_LIMITS: Record<AiModel, { min: number; max: number }> = {
	'gpt-3': { min: 1, max: 4096 },
	'gpt-3.5-turbo': { min: 1, max: 4096 },
	'gpt-4': { min: 1, max: 4096 },
	'gpt-4o': { min: 0, max: 4096 },
	'gpt-4-turbo': { min: 1, max: 4096 },
	'gpt-4o-mini': { min: 1, max: 4096 }
};

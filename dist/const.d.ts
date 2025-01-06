import type { AiModel, ModelTokenLimits } from './type-identifiers.js';
export declare const TOKEN_LIMITS: Record<AiModel, ModelTokenLimits>;
export declare const SUPPORTED_LANGUAGES: string[];
export declare const MODERATION_URL = "https://api.openai.com/v1/moderations";
export declare const ALL_MODERATION_FLAGS: readonly ["harassment", "harassment/threatening", "hate", "hate/threatening", "self-harm", "self-harm/instructions", "self-harm/intent", "sexual", "sexual/minors", "violence", "violence/graphic"];
export declare const SHOW_ERROR_DURATION = 5000;

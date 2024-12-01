/**
 * Utility functions for token management and calculations.
 */
/**
 * Counts the number of tokens in the provided content string.
 *
 * @param content - The content string to count tokens in.
 * @returns The number of tokens in the content.
 */
export declare function countTokens(content: string): number;
/**
 * Trims the LLM content by tokens while ensuring that sentences or other structures
 * are not clipped mid-way.
 *
 * @param content - The LLM-generated content string to trim
 * @param maxTokens - The maximum number of tokens allowed
 * @returns The trimmed content string
 */
export declare function trimLLMContentByTokens(content: string, maxTokens: number): string;

/**
 * Utility functions for token management and calculations.
 */
/**
 * Counts the number of tokens in the provided content string.
 *
 * @param content - The content string to count tokens in.
 * @returns The number of tokens in the content.
 */
export function countTokens(content) {
    if (!content || typeof content !== 'string') {
        return 0;
    }
    // Normalize the content by trimming and reducing multiple whitespaces
    const normalizedContent = content
        .trim()
        .replace(/\s+/g, ' ');
    // Approximate tokens by breaking words, contractions, and common punctuation marks
    const tokens = normalizedContent.match(/\b\w+('\w+)?\b|[.,!?;:"(){}[\]]/g) || [];
    // Heuristic: Long words (over 10 characters) are likely to be split into multiple tokens
    let approxTokenCount = 0;
    tokens.forEach(token => {
        // Break long words into chunks to approximate GPT subword tokenization
        if (token.length > 10) {
            approxTokenCount += Math.ceil(token.length / 4); // Approximation: 4 characters per token
        }
        else {
            approxTokenCount += 1;
        }
    });
    return approxTokenCount;
}
/**
 * Trims the LLM content by tokens while ensuring that sentences or other structures
 * are not clipped mid-way.
 *
 * @param content - The LLM-generated content string to trim
 * @param maxTokens - The maximum number of tokens allowed
 * @returns The trimmed content string
 */
export function trimLLMContentByTokens(content, maxTokens) {
    const elements = content.split('\n');
    let accumulatedTokens = 0;
    let trimmedContent = '';
    for (const element of elements) {
        const elementTokenCount = countTokens(element);
        if (accumulatedTokens + elementTokenCount > maxTokens) {
            break; // Stop if adding this element would exceed the token limit
        }
        accumulatedTokens += elementTokenCount;
        trimmedContent += element + '\n'; // Add the whole structural element
    }
    return trimmedContent;
}

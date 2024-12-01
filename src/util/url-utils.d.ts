/**
 * Fetches content from a URL and formats it as markdown.
 *
 * @param url - The URL to fetch content from
 * @returns Promise resolving to the fetched content
 * @throws Error if fetch fails or content is empty
 */
export declare function fetchUrlContent(url: string): Promise<string>;

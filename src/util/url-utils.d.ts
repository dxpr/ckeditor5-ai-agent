/**
 * Fetches the content of a given URL and returns it as a string.
 *
 * @param url - The URL to fetch content from.
 * @returns A promise that resolves to the fetched content as a string.
 * @throws Will throw an error if the URL is invalid or if the fetch fails.
 */
export declare function fetchUrlContent(url: string): Promise<string>;

export default class CustomError extends Error {
	public status: number;
	constructor( message: string, status: number ) {
		super( message );
		this.status = status;
	}
}

/**
 * Retrieves error information from a Response object.
 *
 * @param response - The Response object from which to extract error details.
 * @returns A Promise that resolves to an object containing the status code and error data.
 *
 * @throws Will throw an error if the response cannot be parsed.
 */
export async function getError( response: Response ): Promise<{
	status: number;
	error: any;
}> {
	let errorData = '';
	const contentType = response.headers.get( 'content-type' );
	if ( contentType && contentType.includes( 'application/json' ) ) {
		errorData = await response.json();
	} else if ( contentType && contentType.includes( 'text/html' ) ) {
		errorData = await response.text();
	} else if ( contentType && contentType.includes( 'text/plain' ) ) {
		errorData = await response.text();
	}

	const error = {
		status: response.status,
		error: errorData
	};
	return error;
}

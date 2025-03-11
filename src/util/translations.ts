import type { Editor } from 'ckeditor5/src/core.js';

export function getErrorMessages( status: number, editor: Editor ): string {
	const t = editor.t;

	const messages: { [key: number]: string } = {
		100: t( 'Continue: The server has received the request headers and the client should proceed to send the request body.' ),
		101: t( 'Switching Protocols: The server is switching protocols according to the Upgrade header.' ),
		102: t( 'Processing: The server has received and is processing the request, but no response is available yet.' ),
		103: t( 'Early Hints: Used to return some response headers before final HTTP message.' ),
		200: t( 'The request has succeeded.' ),
		201: t( 'The request has been fulfilled and resulted in a new resource being created.' ),
		202: t( 'The request has been accepted for processing, but the processing has not been completed.' ),
		203: t( 'The server successfully processed the request, but is returning information from another source.' ),
		204: t( 'The server successfully processed the request, but is not returning any content.' ),
		// eslint-disable-next-line max-len
		205: t( 'The server successfully processed the request, but is not returning any content. The user agent should reset the document view.' ),
		206: t( 'The server has fulfilled the partial GET request for the resource.' ),
		207: t( 'The response from the server contains multiple status codes, each with its own set of headers and body.' ),
		208: t( 'The server has encountered a previous condition and is applying it to this current request.' ),
		// eslint-disable-next-line max-len
		226: t( 'The server has fulfilled a GET request for the resource, and the response is a representation of the result of one or more instance-manipulations applied to the current instance.' ),
		300: t( 'The server has multiple options for the requested resource.' ),
		301: t( 'The requested resource has been permanently moved to a new location.' ),
		302: t( 'The requested resource has been found, but it has been temporarily moved to a different location.' ),
		// eslint-disable-next-line max-len
		303: t( 'The response to the request can be found under a different URI and should be retrieved using a GET method on that resource.' ),
		304: t( 'The requested resource has not been modified since the last request. It is still valid from the server\'s cache.' ),
		305: t( 'The requested resource must be accessed through the proxy given by the Location field.' ),
		// eslint-disable-next-line max-len
		307: t( 'The requested resource has been temporarily moved to a different location, and the client should continue to use the same method for future requests.' ),
		// eslint-disable-next-line max-len
		308: t( 'The requested resource has been permanently moved to a different location, and the client should use the new URI for all future requests.' ),
		400: t( 'The server could not understand the request due to invalid syntax.' ),
		401: t( 'The request requires user authentication.' ),
		402: t( 'Payment is required to fulfill the request.' ),
		403: t( 'Access to the requested resource is forbidden.' ),
		404: t( 'The server could not find the requested resource.' ),
		405: t( 'The request method is not allowed for the requested resource.' ),
		406: t( 'The server cannot generate content that is acceptable according to the Accept headers sent in the request.' ),
		407: t( 'Proxy authentication is required to access the requested resource.' ),
		408: t( 'The server timed out waiting for the request.' ),
		409: t( 'Conflict detected. The request could not be completed due to a conflict with the current state of the resource.' ),
		410: t( 'Gone. The requested resource is no longer available and will not be available again.' ),
		411: t( 'Length required. The server requires a Content-Length header to be included in the request.' ),
		// eslint-disable-next-line max-len
		412: t( 'Precondition failed. One or more conditions specified in the request headers evaluated to false when tested on the server.' ),
		// eslint-disable-next-line max-len
		413: t( 'Payload too large. The server refuses to process the request because the payload is larger than the server is willing or able to process.' ),
		// eslint-disable-next-line max-len
		414: t( 'URI too long. The server refuses to process the request because the URI is longer than the server is willing to interpret.' ),
		415: t( 'Unsupported media type. The server refuses to process the request because the media type is not supported.' ),
		// eslint-disable-next-line max-len
		416: t( 'Range not satisfiable. The server cannot fulfill the request because the client has asked for a portion of the file that cannot be provided.' ),
		417: t( 'Expectation failed. The server is unable to meet the requirements specified by the Expect request header field.' ),
		418: t( 'I\'m a teapot. The server refuses to brew coffee because it is, permanently and intentionally, a teapot.' ),
		421: t( 'Misdirected request. The request was directed at a server that is not able to produce a response.' ),
		// eslint-disable-next-line max-len
		422: t( 'Unprocessable entity. The server understands the content type of the request entity but cannot process the contained instructions.' ),
		423: t( 'Locked. The requested resource is locked and can only be accessed by the client that locked it.' ),
		424: t( 'Failed dependency. The request failed because it depended on another request and that request failed.' ),
		425: t( 'Too early. The server is unwilling to risk processing a request that might be replayed.' ),
		426: t( 'Upgrade required. The client should switch to a different protocol.' ),
		428: t( 'Precondition required. The origin server requires the request to be conditional.' ),
		429: t( 'Too many requests. The user has sent too many requests in a given amount of time.' ),
		// eslint-disable-next-line max-len
		431: t( 'Request header fields too large. The server is unwilling to process the request because its header fields are too large.' ),
		451: t( 'Unavailable for legal reasons. The server is denying access to the resource as a consequence of a legal demand.' ),
		500: t( 'Internal Server Error. The server encountered an unexpected condition that prevented it from fulfilling the request.' ),
		501: t( 'Not Implemented. The server does not support the functionality required to fulfill the request.' ),
		// eslint-disable-next-line max-len
		502: t( 'Bad Gateway. The server, while acting as a gateway or proxy, received an invalid response from the upstream server it accessed in attempting to fulfill the request.' ),
		// eslint-disable-next-line max-len
		503: t( 'Service Unavailable. The server is currently unable to handle the request due to temporary overloading or maintenance of the server.' ),
		// eslint-disable-next-line max-len
		504: t( 'Gateway Timeout. The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server it accessed in attempting to fulfill the request.' ),
		505: t( 'HTTP Version Not Supported. The server does not support the HTTP protocol version used in the request.' ),
		506: t( 'Variant Also Negotiates. Transparent content negotiation for the request results in a circular reference.' ),
		507: t( 'Insufficient Storage. The server is unable to store the representation needed to complete the request.' ),
		508: t( 'Loop Detected. The server detected an infinite loop while processing the request.' ),
		510: t( 'Not Extended. Further extensions to the request are required for the server to fulfill it.' ),
		511: t( 'Network Authentication Required. The client needs to authenticate to gain network access.' )
	};
	return messages[ status ] ?? '';
}

export function getDefaultAiAgentDropdownMenu(
	editor: Editor
): Array<{ title: string; items: Array<{ title: string; command: string }> }> {
	const t = editor.t;

	return [
		{
			title: t( 'Edit or review' ),
			items: [
				{
					title: t( 'Fix Mistakes' ),
					command:
						`Fix spelling mistakes, use proper grammar and apply good writing practices.
						Do not lose the original meaning.\nYou must keep the text formatting.`
				},
				{
					title: t( 'Improve Tone of Voice' ),
					command:
						`Rewrite the content to match the <TONE> while preserving the key message and meaning.
						Ensure the writing style is consistent.\nYou must keep the text formatting.`
				},
				{
					title: t( 'Make Shorter' ),
					command:
						`Remove any repetitive, redundant, or non-essential writing in this
						content without changing the meaning or losing any key information.`
				},
				{
					title: t( 'Make Longer' ),
					command:
						`Improve this content by using descriptive language and inserting
						more information and more detailed explanations.\nYou must keep the text formatting.`
				},
				{
					title: t( 'Simplify Language' ),
					command:
						`Simplify the writing style of this content and reduce the complexity,
						so that the content is easy to understand.\nYou must keep the text formatting`
				}
			]
		},
		{
			title: t( 'Generate from selection' ),
			items: [
				{
					title: t( 'Summarize' ),
					command:
						`Summarize this content into one paragraph of text. Include only the key ideas and conclusions.
						Keep it short. Do not keep original text formatting`
				},
				{
					title: t( 'Continue' ),
					command:
						`Start with the provided content and write at the end of it continuing this topic.
						Keep the added part short.\nYou must keep the text formatting`
				}
			]
		}
	];
}

export function getDefaultAiAgentToneDropdownMenu(
	editor: Editor
): Array<{
	title: string; command: string;
}> {
	const t = editor.t;
	return [
		{
			title: t( 'Default tone' ),
			command: ''
		},
		{
			title: t( 'Patient-Friendly' ),
			command: 'Write in a warm, clear, and simple way for patients to understand.'
		},
		{
			title: t( 'Professional' ),
			command: 'Use technical and formal language suitable for healthcare professionals.'
		},
		{
			title: t( 'Encouraging' ),
			command: 'Provide positive reinforcement and motivation.'
		},
		{
			title: t( 'Neutral' ),
			command: 'Maintain a balanced and neutral tone without bias.'
		},
		{
			title: t( 'Conversational' ),
			command: 'Write in a friendly and engaging manner, as if speaking directly to the reader.'
		},
		{
			title: t( 'Authoritative' ),
			command: 'Use a confident and knowledgeable voice, ideal for expert content.'
		}
	];
}

# AiAssist CKEditor Plugin

`AiAssist` is a CKEditor 5 plugin designed to integrate AI-assisted text generation within the CKEditor. The plugin allows users to interact with AI models like GPT-4 to generate, modify, or enhance content directly within the editor.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Configuration Options](#configuration-options)
- [Error Handling](#error-handling)
- [License](#license)

## Installation

To install the `AiAssist` plugin in your CKEditor 5 setup, follow these steps:

1. Install the plugin via npm:

   ```bash
   npm install ai-assist-ckeditor-plugin

## Configuration

The AiAssist plugin can be configured through the EditorConfig interface. The configuration allows you to define how the AI model should behave, including the model type, temperature, maximum tokens, and more.

follow below example to add AiAssist.

```typescript
ClassicEditor
    .create( document.querySelector( '#editor' ), {
        plugins: [ AiAssist, ... ],
        toolbar: [ 'AiAssist', ... ],
        aiAssist: {
            model: 'gpt-4o',
            temperature: 0.7,
            maxTokens: 500,
            stopSequences: [ '\n' ],
            retryAttempts: 3,
            timeOutDuration: 30000,
            endpointUrl: 'https://api.openai.com/v1/chat/completions',
            prompt: []
        }
    } )
    .catch( error => {
        console.error( error );
    } );
```
## Configuration Options

The AiAssist plugin can be configured through the EditorConfig interface. Here are the configuration options available:

| Option | Type | Description |
| :-------- | :------- | :-------------------------------- |
| `model` | `AiModel` | The AI model to use (e.g., gpt-4o). |
| `temperature` | `number` | Controls the randomness of the AI output. Must be between 0 and 2. |
| `maxTokens` | `number` | The maximum number of tokens to generate. Should be within the model's token limits. |
| `stopSequences` | `Array<string>` | An array of stop sequences that will end the generation of content when encountered. |
| `retryAttempts` | `number` | The number of times to retry fetching the AI response if the initial request fails. |
| `timeOutDuration` | `number` | The duration in milliseconds to wait before timing out the request. |
| `endpointUrl` | `string` | The URL of the AI endpoint to use for generating content. |
| `prompt` | `Array<string>` | An array of strings used to override or enhance the prompt sent to the AI model. |

## Error Handling

The AiAssist plugin includes built-in error handling for various scenarios such as unsupported languages, API request failures, and more. Error messages are displayed to the user and logged in the console for debugging purposes.


## License

AiAssist is open-source software licensed under the MIT License. Feel free to use, modify, and distribute it in your projects.
@dxpr/ckeditor5-ai-assist
=========================

# AiAssist CKEditor Plugin

`AiAssist` is a CKEditor 5 plugin designed to integrate AI-assisted text generation within the CKEditor. The plugin allows users to interact with AI models like GPT-4 and many more to generate, modify, or enhance content directly within the editor.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
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
            apiKey: 'YOUR_API_KEY // required
            temperature: 0.7,
            maxTokens: 500,
            stopSequences: [ '\n' ],
            retryAttempts: 3,
            timeOutDuration: 45000,
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
| `model` | `AiModel` | The AI model to use, default is gpt-4o. (optional)|
| `apiKey` | `string` | Your Open_AI key for authenticate. |
| `temperature` | `number` | Controls the randomness of the AI output. Must be between 0 and 2. (optional)|
| `maxTokens` | `number` | The maximum number of tokens to generate. Should be within the model's token limits. (optional)|
| `stopSequences` | `Array<string>` | An array of stop sequences that will end the generation of content when encountered. (optional)|
| `retryAttempts` | `number` | The number of times to retry fetching the AI response if the initial request fails. (optional)|
| `timeOutDuration` | `number` | The duration in milliseconds to wait before timing out the request. default is 45s (optional)|
| `contextSize` | `number` | extracts text symmetrically around the cursor position based on the contextSize, default is 75% of the selected model's total input token limit. |
| `endpointUrl` | `string` | The URL of the AI endpoint to use for generating content. |
| `promptSettings.outputFormat` | `Array<string>` | Specifies the desired format of the generated output (e.g., plain text, markdown). (optional) |
| `promptSettings.contextData` | `Array<string>` | Provides contextual data or hints to be included in the AI prompt for better response generation. (optional) |
| `promptSettings.filters` | `Array<string>` | Contains any filtering logic or constraints to refine the AI's output. (optional) |
| `debugMode` | `boolean` | Enables debug mode, which logs detailed information about prompts and API requests to the console. Default is false. (optional) |
| `streamContent` | `boolean` | Enables stream mode, which stream the response of request. Default is false (optional) |

## Usage Examples

Here are some examples of how to use the SlashCommandPlugin:

1. **Basic Command**
   ```
   /write about SuperHero
   ```

2. **Compile Command with URLs**
   ```
   /Benefits of mindfulness in 500 words: 
   https://www.mindful.org/how-to-practice-mindfulness/
   https://www.webmd.com/balance/guide/what-is-mindfulness
   ```
    ```
   /Write a blog post on top cities for digital nomads: 
   https://nomadlist.com/
   https://www.thediscoveriesof.com/best-digital-nomad-cities/
   ```
    ```
   /Find me everything on the benefits of mindfulness from these pages:
   https://www.mindful.org/how-to-practice-mindfulness/
   https://www.webmd.com/balance/guide/what-is-mindfulness. Can you summarize the key points too?
   ```
    ```
   /Please get the top 5 cities for digital nomads from these links and rank them:
   https://nomadlist.com/ https://www.thediscoveriesof.com/best-digital-nomad-cities/.
   Include cost of living?
   ```
    ```
   /Compare the pros and cons of electric cars, using this article for pros:
   https://www.tesla.com/electric-cars, and for cons, pull from here:
   https://www.carmagazine.co.uk/electric-car-disadvantages/. Also, check this for general trends:
   https://www.autotrader.com/electric.
   ```

In the first example, the command prompts the AI to write about India. In the second example, it shows the format for fetching content from specified URLs related to the task.



## Error Handling

The AiAssist plugin includes built-in error handling for various scenarios such as unsupported languages, API request failures, and more. Error messages are displayed to the user and logged in the console for debugging purposes.


This package was created by the [ckeditor5-package-generator](https://www.npmjs.com/package/ckeditor5-package-generator) package.

## Table of contents for Development

* [Developing the package](#developing-the-package)
* [Available scripts](#available-scripts)
  * [`start`](#start)
  * [`test`](#test)
  * [`lint`](#lint)
  * [`stylelint`](#stylelint)
  * [`build:dist`](#builddist)
  * [`dll:build`](#dllbuild)
  * [`dll:serve`](#dllserve)
  * [`translations:collect`](#translationscollect)
  * [`translations:download`](#translationsdownload)
  * [`translations:upload`](#translationsupload)
  * [`ts:build` and `ts:clear`](#tsbuild-and-tsclear)
* [License](#license)

## Developing the package

To read about the CKEditor 5 Framework, visit the [CKEditor 5 Framework documentation](https://ckeditor.com/docs/ckeditor5/latest/framework/index.html).

## Available scripts

NPM scripts are a convenient way to provide commands in a project. They are defined in the `package.json` file and shared with people contributing to the project. It ensures developers use the same command with the same options (flags).

All the scripts can be executed by running `yarn run <script>`. Pre and post commands with matching names will be run for those as well.

The following scripts are available in the package.

### `start`

Starts an HTTP server with the live-reload mechanism that allows previewing and testing plugins available in the package.

When the server starts, the default browser will open the developer sample. This can be disabled by passing the `--no-open` option to that command.

You can also define the language that will translate the created editor by specifying the `--language [LANG]` option. It defaults to `'en'`.

Examples:

```bash
# Starts the server and open the browser.
yarn run start

# Disable auto-opening the browser.
yarn run start --no-open

# Create the editor with the interface in German.
yarn run start --language=de
```

### `test`

Allows executing unit tests for the package, specified in the `tests/` directory. The command accepts the following modifiers:

* `--coverage` &ndash; to create the code coverage report,
* `--watch` &ndash; to observe the source files (the command does not end after executing tests),
* `--source-map` &ndash; to generate source maps of sources,
* `--verbose` &ndash; to print additional webpack logs.

Examples:

```bash
# Execute tests.
yarn run test

# Generate code coverage report after each change in the sources.
yarn run test --coverage --test
```

### `lint`

Runs ESLint, which analyzes the code (all `*.ts` files) to quickly find problems.

Examples:

```bash
# Execute eslint.
yarn run lint
```

### `stylelint`

Similar to the `lint` task, stylelint analyzes the CSS code (`*.css` files in the `theme/` directory) in the package.

Examples:

```bash
# Execute stylelint.
yarn run stylelint
```

### `build:dist`

Creates npm and browser builds of your plugin. These builds can be added to the editor by following the [Configuring CKEditor 5 features](https://ckeditor.com/docs/ckeditor5/latest/getting-started/setup/configuration.html) guide.

Examples:

```bash
# Builds the `npm` and browser files thats are ready to publish.
npm run build:dist
```

### `dll:build`

Creates a DLL-compatible package build that can be loaded into an editor using [DLL builds](https://ckeditor.com/docs/ckeditor5/latest/builds/guides/development/dll-builds.html).

Examples:

for update localization, change the language object to /sample/dll.html

```typescript
CKEditor5.editorClassic.ClassicEditor
    .create( document.querySelector( '#editor' ), {
        plugins: [ AiAssist, ... ],
        ... // other configurations
        aiAssist: {
            model: 'gpt-4o',
            apiKey: 'YOUR_API_KEY // required
        },
        language: {
			content:'es',
			ui:'hi'
		}
    } )
    .catch( error => {
        console.error( error );
    } );
```
```bash

# Build the DLL file that is ready to publish.
yarn run dll:build

# Build the DLL file and listen to changes in its sources.
yarn run dll:build --watch
```

### `dll:serve`

Creates a simple HTTP server (without the live-reload mechanism) that allows verifying whether the DLL build of the package is compatible with the CKEditor 5 [DLL builds](https://ckeditor.com/docs/ckeditor5/latest/builds/guides/development/dll-builds.html).

Examples:

```bash
# Starts the HTTP server and opens the browser.
yarn run dll:serve
```

### `translations:collect`

Collects translation messages (arguments of the `t()` function) and context files, then validates whether the provided values do not interfere with the values specified in the `@ckeditor/ckeditor5-core` package.

The task may end with an error if one of the following conditions is met:

* Found the `Unused context` error &ndash; entries specified in the `lang/contexts.json` file are not used in source files. They should be removed.
* Found the `Context is duplicated for the id` error &ndash; some of the entries are duplicated. Consider removing them from the `lang/contexts.json` file, or rewrite them.
* Found the `Context for the message id is missing` error &ndash; entries specified in source files are not described in the `lang/contexts.json` file. They should be added.

Examples:

```bash
yarn run translations:collect
```

### `translations:download`

Download translations from the Transifex server. Depending on users' activity in the project, it creates translation files used for building the editor.

The task requires passing the URL to Transifex API. Usually, it matches the following format: `https://www.transifex.com/api/2/project/[PROJECT_SLUG]`.

To avoid passing the `--transifex` option whenever you call the command, you can store it in `package.json`, next to the `ckeditor5-package-tools translations:download` command.

Examples:

```bash
yarn run translations:download --transifex [API URL]
```

### `translations:upload`

Uploads translation messages onto the Transifex server. It allows users to create translations into other languages using the Transifex platform.

The task requires passing the URL to the Transifex API. Usually, it matches the following format: `https://www.transifex.com/api/2/project/[PROJECT_SLUG]`.

To avoid passing the `--transifex` option whenever you call the command, you can store it in `package.json`, next to the `ckeditor5-package-tools translations:upload` command.

Examples:

```bash
yarn run translations:upload --transifex [API URL]
```

### `ts:build` and `ts:clear`

These scripts compile TypeScript and remove the compiled files. They are used in the aforementioned life cycle scripts, and there is no need to call them manually.

## License

The `@dxpr/ckeditor5-ai-assist` package is available under [MIT license](https://opensource.org/licenses/MIT).

However, it is the default license of packages created by the [ckeditor5-package-generator](https://www.npmjs.com/package/ckeditor5-package-generator) package and can be changed.

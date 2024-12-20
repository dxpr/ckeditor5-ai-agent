[![npm version](https://img.shields.io/npm/v/@dxpr/ckeditor5-ai-agent)](https://www.npmjs.com/package/@dxpr/ckeditor5-ai-agent)
[![license](https://img.shields.io/npm/l/@dxpr/ckeditor5-ai-agent)](https://opensource.org/licenses/MIT)
[![CKEditor 5](https://img.shields.io/badge/ckeditor-5-blue)](https://ckeditor.com/docs/ckeditor5/latest/framework/index.html)
[![typescript](https://img.shields.io/badge/code-typescript-blue)](https://www.typescriptlang.org/)

@dxpr/ckeditor5-ai-agent
=========================

# AI Agent for CKEditor 5

## 🤖 An AI-first user experience for content generation in CKEditor 5

### Overview

#### 🚀 Like ChatGPT but faster, and better at creating HTML content.

✍️ `AI Agent` is a CKEditor 5 plugin designed to integrate AI-assisted text generation within the CKEditor. The plugin allows users to interact with AI models like GPT-4o and many more to generate, modify, or enhance content directly within the editor.

🌐 `AI Agent` uses **retrieval-augmented generation (RAG)** to seamlessly integrate external web content into prompts.

![image](https://github.com/dxpr/ckeditor5-ai-agent/blob/1.x/sample/images/toolbar-switching.gif)
Video of AI Agent returning optimal HTML structure based on what is available in the toolbar, when a user prompt is "wrong". After switching the editor configuration from "Full HTML" to "Basic HTML," an unordered list is generated instead of a table, using bold and normal-weight text to simulate some table-like structure.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [How to Use](#how-to-use)
- [Features](#features)
- [Usage examples](#usage-examples)
- [Configuration options](#configuration-options)
- [Developing the package](#developing-the-package)
- [Available scripts](#available-scripts)
- [License](#license)

## Installation

To install the `AI Agent` plugin in your CKEditor 5 setup:

1. Install the plugin via npm:

   ```bash
   npm install @dxpr/ckeditor5-ai-agent
   ```

## Configuration

The `AI Agent` plugin can be configured through the EditorConfig interface. Define model behavior, including type, temperature, and tokens.

Example configuration:

```typescript
ClassicEditor
    .create( document.querySelector( '#editor' ), {
        plugins: [ AiAgent, ... ],
        toolbar: [ 'AiAgent', ... ],
        aiAgent: {
            apiKey: 'YOUR_API_KEY' // required
        }
    } )
    .catch( error => {
        console.error( error );
    } );
```

## How to Use

- **Start a prompt with a slash command:** `/write about open source software`.
- **Create multiline prompts:** Use `Shift+Enter` to break your prompt into lines.
- **Add links for reference material**: Include links in your prompt, AI fetches and integrates their content (RAG).
- **No limit on links**: Add as many links as you need; referenced content is automatically trimmed to fit the AI's context window.
- **Use mid-sentence prompts**: Insert prompts in the middle of a sentence by clicking the AI button in the toolbar.
- **Cancel response streams**: Press "Cancel" to terminate a response stream immediately, ensuring no tokens are wasted.

### Basic Usage

Here are some examples of how to use the AI Agent plugin:

1. **Basic Command**
   ```
   /write about open source software
   ```

2. **Compile Command with URLs**
   ```
	/Create a best blog posts of the week blog, summarize each article in 100 words, add one image for every post, include read-more links:
	https://example.com/post-1
	https://example.com/post-2
   ```

You use shift+enter to add new line inside a single slash command.

AI Agent understands complex prompts and can handle complex HTML, here we ask for varied content structures with 3 levels of table nesting:

![image](https://github.com/dxpr/ckeditor5-ai-agent/blob/1.x/sample/images/nested-tables.gif)
Video of AI Agent rendering complex HTML structures fast, rendering tokens in real-time as they are sent by the model.

### Advanced Features

- **RAG-enabled retrieval:** Integrates web content into prompts dynamically.
- **Context-aware prompts:** Auto-incorporates surrounding text for better response accuracy.
- **Multilingual-ready:** Supports CKEditor 5 language settings.
- **Real-time response streaming:** View generated content as it arrives.
- **Customizable responses:** Adjust formatting, HTML, tone, and content rules.
- **Dynamic context size:** Adapts based on cursor position and context limits.
- **Advanced controls:** Manage temperature, max tokens, and stop sequences.
- **Multiple AI model support:** Defaults to GPT-4o but configurable for others.
- **Moderation API support:** Adds content safety filters and moderation feedback.
- **Custom endpoints:** Use tailored AI APIs for specific needs.
- **Debug mode:** Detailed logs for troubleshooting.

## Configuration Options

The AiAgent plugin can be configured through the EditorConfig interface. Here are the configuration options available:

### General Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | - | Your Open_AI key for authenticate |
| `model` | `AiModel?` | `'gpt-4o'` | The AI model to use |
| `temperature` | `number?` | - | Controls the randomness of the AI output. Must be between 0 and 2 |
| `maxOutputTokens` | `number?` | - | Maximum number of tokens the AI can generate in its response. If not set, uses model's maximum output limit |
| `maxInputTokens` | `number?` | - | Maximum number of tokens allowed in the combined prompt and context. If not set, uses model's maximum context window limit |
| `stopSequences` | `Array<string>?` | - | An array of stop sequences that will end the generation of content when encountered |
| `retryAttempts` | `number?` | - | The number of times to retry fetching the AI response if the initial request fails |
| `promptSettings` | `object?` | - | Customize prompt components through `overrides` and `additions`. See [Prompt Components](#prompt-components) for available components |
| `promptSettings.overrides` | `Record<PromptComponentKey, string>?` | - | Replace default rules for specific components |
| `promptSettings.additions` | `Record<PromptComponentKey, string>?` | - | Add additional rules to specific components |
| `timeOutDuration` | `number?` | `45000` | The duration in milliseconds to wait before timing out the request |
| `contextSize` | `number?` | - | Maximum context window size in tokens. If not set, defaults to 75% of model's maximum input token limit |
| `editorContextRatio` | `number?` | `0.3` | Upper limit of what portion of the context size is allocated for editor content |
| `endpointUrl` | `string?` | - | The URL of the AI endpoint to use for generating content |
| `debugMode` | `boolean?` | `false` | Enables debug mode for detailed logging |
| `streamContent` | `boolean?` | `true` | Enables streaming mode for responses |
| `showErrorDuration` | `number?` | `5000` | Duration in milliseconds for error message display |
| `moderation.enable` | `boolean?` | `false` | Enables content moderation for AI responses |
| `moderation.key` | `string?` | - | API key for content moderation service |
| `moderation.disableFlags` | `Array<ModerationFlagsTypes>?` | - | Array of moderation flags to disable |
| `commandsDropdown` | `Array<{ title: string; items: Array<{ title: string; command: string; }>; }>?` | Default menu with tone adjustment, content enhancement, and fix/improve commands | Specifies the commands available in the dropdown menu |

### Prompt Components
The plugin uses various prompt components to guide AI response generation. You can customize these through the `promptSettings` configuration.

#### Component Types

Each component can be customized using either `overrides` (to replace default rules) or `additions` (to add new rules):
- `htmlFormatting`: Rules for HTML generation
- `contentStructure`: Document structure guidelines
- `tone`: Language and tone settings
- `responseRules`: Core response generation rules
- `inlineContent`: Inline content handling rules
- `imageHandling`: Image element requirements
- `referenceGuidelines`: Rules for handling referenced content
- `contextRequirements`: Rules for context-aware generation

#### Default Values

##### Response Rules
```typescript
Follow these step-by-step instructions to respond to user inputs:
Identify the specific requirements from the TASK section.
Do not include any markdown syntax in the response.
Generate a response that seamlessly integrates with the existing content.
Format the response according to the HTML and structural requirements.
Verify that the response meets all formatting and content guidelines.
If there is SELECTED_CONTENT I'll use only that content to answer
the user's request in the TASK section, ignoring any additional CONTEXT
or prior knowledge.
```

##### HTML Formatting
```typescript
HTML Formatting Requirements:
Generate valid HTML snippets only.
Use only the following allowed tags: ${getAllowedHtmlTags(editor).join(', ')}.
Ensure proper tag nesting.
Avoid empty elements.
Use semantic HTML where appropriate.
Maintain clean, readable HTML structure.
Follow block-level element rules.
Properly close all tags.
No inline styles unless specified.
No script or style tags.
The first word must be a valid HTML tag.
Block elements must not contain other block elements.
```

##### Content Structure
```typescript
Content Structure Rules:
Organize information logically.
Use appropriate paragraph breaks.
Maintain consistent formatting.
Follow document hierarchy.
Use appropriate list structures when needed.
Ensure proper content flow.
Respect existing document structure.
```

##### Tone Guidelines
```typescript
Language and Tone Guidelines:
Match the formality level of the surrounding content.
Maintain a consistent voice throughout the response.
Use appropriate technical terminology when relevant.
Ensure proper grammar and punctuation.
Avoid overly complex sentence structures.
Keep the tone engaging and reader-friendly.
Adapt style based on content type.
```

##### Inline Content
```typescript
Inline Content Specific Rules:
Determine content type (list, table, or inline).
Format according to content type.
Ensure seamless integration.
Maintain proper nesting.
```

##### Image Handling
```typescript
Image Element Requirements:
Every <img> must have src and alt attributes.
Format src URLs as: https://placehold.co/600x400?text=[alt_text].
Alt text must be descriptive and meaningful.
```

##### Reference Guidelines
```typescript
Reference Content Rules:
Use information from provided markdown to generate new text.
Do not copy content verbatim.
Ensure natural flow with existing context.
Avoid markdown formatting in response.
Consider whole markdown as single source.
Generate requested percentage of content.
```

##### Context Requirements
```typescript
Context-Specific Rules:
Replace "@@@cursor@@@" with contextually appropriate content.
Replace ONLY @@@cursor@@@ - surrounding text is READ-ONLY.
NEVER copy or paraphrase context text.
Verify zero phrase duplication.
Analyze the CONTEXT section thoroughly 
to understand the existing content and its style.
Generate a response that seamlessly integrates 
with the existing content.
Determine the appropriate tone and style based
on the context. Ensure the response flows 
naturally with the existing content.
```

#### Customization Examples

Override default rules:
```typescript
ClassicEditor.create(document.querySelector('#editor'), {
    plugins: [AiAgent],
    aiAgent: {
        promptSettings: {
            overrides: {
                'htmlFormatting': `HTML Requirements:
Use only <p> and <strong> tags
Always wrap text in paragraphs
No nested elements allowed
Keep HTML structure minimal
Validate all markup`
            }
        }
    }
});
```

Add additional rules:
```typescript
ClassicEditor.create(document.querySelector('#editor'), {
    plugins: [AiAgent],
    aiAgent: {
        promptSettings: {
            additions: {
                'contentStructure': `
Keep paragraphs under 100 words
Start each section with a topic sentence
Use descriptive headings`
            }
        }
    }
});
```

Note: When using overrides, all default rules for that component are replaced. When using additions, new rules are appended to the existing defaults.

## Development

To read about the CKEditor 5 Framework, visit the [CKEditor 5 Framework documentation](https://ckeditor.com/docs/ckeditor5/latest/framework/index.html).

### Available Scripts

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
        plugins: [ AiAgent, ... ],
        ... // other configurations
        aiAgent: {
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

The `@dxpr/ckeditor5-ai-agent` package is available under [MIT license](https://opensource.org/licenses/MIT).

However, it is the default license of packages created by the [ckeditor5-package-generator](https://www.npmjs.com/package/ckeditor5-package-generator) package and can be changed.

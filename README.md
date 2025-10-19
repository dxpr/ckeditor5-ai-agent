[![npm version](https://img.shields.io/npm/v/@dxpr/ckeditor5-ai-agent)](https://www.npmjs.com/package/@dxpr/ckeditor5-ai-agent)
[![license](https://img.shields.io/npm/l/@dxpr/ckeditor5-ai-agent)](https://opensource.org/licenses/MIT)
[![CKEditor 5](https://img.shields.io/badge/ckeditor-5-blue)](https://ckeditor.com/docs/ckeditor5/latest/framework/index.html)
[![typescript](https://img.shields.io/badge/code-typescript-blue)](https://www.typescriptlang.org/)

note: This project is not part of CKEditor premium, it is a free plugin created by DXPR

@dxpr/ckeditor5-ai-agent
=========================

# AI Agent for CKEditor 5

## 🤖 An AI-first user experience for content generation in CKEditor 5

### Overview

#### 🚀 Like ChatGPT but faster, and better at creating HTML content.

✍️ `AI Agent` is a CKEditor 5 plugin designed to integrate AI-assisted text generation within the CKEditor. The plugin allows users to interact with AI models like GPT-4o and many more to generate, modify, or enhance content directly within the editor.

🌐 `AI Agent` uses **retrieval-augmented generation (RAG)** and in-context learning to seamlessly integrate external web content into prompts.

🤖 Natively supports <!-- BEGIN_MODEL_COUNT -->487<!-- END_MODEL_COUNT --> models, with additional support for any self-hosted model via Ollama.

![image](https://github.com/dxpr/ckeditor5-ai-agent/blob/1.x/sample/images/toolbar-switching.gif)
Video of AI Agent returning optimal HTML structure based on what is available in the toolbar, when a user prompt is "incorrect". After switching the editor configuration from "Full HTML" to "Basic HTML," an unordered list is generated instead of a table, using bold and normal-weight text to simulate some table-like structure.

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
        licenseKey: 'GPL',
        plugins: [ AiAgent, ... ],
        toolbar: [ 'aiAgentButton', 'aiAgentToneButton', ... ],
        aiAgent: {
            apiKey: 'YOUR_API_KEY',
            tonesDropdown: [
                {
                    label: 'Technical',
                    tone: 'Use technical language with precise terminology and detailed explanations.'
                },
                {
                    label: 'Casual',
                    tone: 'Write in a relaxed, conversational style using everyday language.'
                },
                {
                    label: 'Academic',
                    tone: 'Use formal academic language with proper citations and structured arguments.'
                }
            ]
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
- **In-context learning:** Automatically adapts responses based on surrounding content.
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
| `engine` | `AiEngine?` | `'openai'` | AI engine to use: 'anthropic', 'cerebras', 'deepseek', 'google', 'groq', 'mistralai', 'ollama', 'openai', 'openrouter', 'xai' |
| `model` | `string?` | `'gpt-4o'` | The AI model to use |
| `apiKey` | `string` | - | Your Open_AI key for authenticate |
| `temperature` | `number?` | `0.7` | Controls the randomness of the AI output. Must be between 0 and 2 |
| `maxOutputTokens` | `number?` | Model specific default from TOKEN_LIMITS | Maximum number of tokens the AI can generate in its response |
| `maxInputTokens` | `number?` | Model specific default from TOKEN_LIMITS | Maximum number of tokens allowed in the combined prompt and context |
| `stopSequences` | `Array<string>?` | `[]` | An array of stop sequences that will end the generation of content when encountered |
| `retryAttempts` | `number?` | `1` | The number of times to retry fetching the AI response if the initial request fails |
| `promptSettings` | `object?` | `{}` | Customize prompt components through `overrides` and `additions` |
| `promptSettings.overrides` | `Record<PromptComponentKey, string>?` | - | Replace default rules for specific components |
| `promptSettings.additions` | `Record<PromptComponentKey, string>?` | - | Add additional rules to specific components |
| `timeOutDuration` | `number?` | `120000` | The duration in milliseconds to wait before timing out the request |
| `contextSize` | `number?` | `75% of model's maxInputContextTokens` | Maximum context window size in tokens |
| `editorContextRatio` | `number?` | `0.3` | Upper limit of what portion of the context size is allocated for editor content |
| `endpointUrl` | `string?` | - | The URL of the AI endpoint (only required when using custom engines or proxies) |
| `debugMode` | `boolean?` | `false` | Enables debug mode for detailed logging |
| `streamContent` | `boolean?` | `true` | Enables streaming mode for responses |
| `showErrorDuration` | `number?` | `5000` | Duration in milliseconds for error message display |
| `moderationEnable` | `boolean?` | `false` | Enables content moderation for AI responses |
| `moderationKey` | `string?` | - | API key for content moderation service |
| `moderationDisableFlags` | `Array<ModerationFlagsTypes>?` | - | Array of moderation flags to disable |
| `commandsDropdown` | `Array<{ title: string; items: Array<{ title: string; command: string; }>; }>?` | Default menu with tone adjustment, content enhancement, and fix/improve commands | Specifies the commands available in the dropdown menu |
| `tonesDropdown` | `Array<{ label: string; tone: string; }>?` | - | Specifies the available tones for content generation, allowing users to select the desired tone for the AI's responses. Each tone can be associated with a specific instruction to adjust the AI's output style. |
| `contentScope` | `string?` | - | CSS selector that extends context gathering to include content from other CKEditor 5 instances found within the first matching ancestor element |
| `writesPerSecond` | `WritesPerSecond?` | 10 | Specifies the maximum number of writes the AI Agent can perform per second. This setting helps control the rate of content generation, allowing for smoother performance and better resource management during high-load scenarios. |

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
Generate a response that addresses the <TASK>
If <SELECTED_CONTENT> exists, use only that content to answer the <TASK>, ignoring additional <CONTEXT>.
```

##### HTML Formatting
```typescript
HTML Requirements:
<ALLOWED_TAGS>Use only these tags: a, blockquote, code, em, figcaption, h1, h2, h3, img, li, ol, p, pre, strong, table, td, tr, ul.</ALLOWED_TAGS>
<ALLOWED_CLASSES>Use only these classes: alert, alert-primary, card, badge, bg-primary.</ALLOWED_CLASSES>
Ensure proper tag nesting.
Use semantic HTML.
No inline styles.
First word must be HTML tag.
Output raw HTML without markdown code blocks (no ```html or ``` wrapping).
```

The `<ALLOWED_TAGS>` section is automatically populated with the list of HTML tags allowed in the editor, based on the editor's schema and the GeneralHtmlSupport configuration.

The `<ALLOWED_CLASSES>` section is automatically populated with either:
- A list of allowed CSS classes from the GeneralHtmlSupport configuration if any are defined
- Or a message indicating that no CSS classes should be used

These XML-like tags make it easier for the AI model to clearly identify the allowed elements and apply them correctly in the generated content.

##### Content Structure
```typescript
Organize information logically.
Use paragraphs.
Maintain consistent formatting.
```

##### Tone
```typescript
Professional, Clear
```

##### Image Handling
```typescript
Image Requirements:
Every <img> needs src and alt attributes.
Place images between content blocks, not inline with text.
Format src as: https://promptahuman.com/600x400@2x?bg_color=444444&text_color=ffffff&title=[file_name.png]&prompt=[Creative Brief in plain text, emoji allowed.].
Alt text must be descriptive. Creative brief = 10-20 words. File name respects picture type, image=jpg, animation=gif, video=mp4, etc.
```

##### Reference Guidelines
```typescript
Generate new text that flows naturally with <CONTEXT>.
Ensure requested percentage of new content.
```

##### Context Requirements
```typescript
Replace @@@cursor@@@ with content for <TASK>.
Return ONLY text replacing @@@cursor@@@ - surrounding text is READ-ONLY.
Never copy context text.
Verify zero duplication.
Analyze CONTEXT thoroughly.
Ensure response flows naturally.
Never include the string `@@@cursor@@@` in your response.
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

### Configuring Tone Options

The `tonesDropdown` configuration option allows you to customize the available tones in the AI Agent tone dropdown menu. When configured, your custom tones will be added to the default "Default values" option.

Example configuration:

```typescript
ClassicEditor
    .create( document.querySelector( '#editor' ), {
        licenseKey: 'GPL',
        plugins: [ AiAgent, ... ],
        toolbar: [ 'aiAgentButton', 'aiAgentToneButton', ... ],
        aiAgent: {
            apiKey: 'YOUR_API_KEY',
            tonesDropdown: [
                {
                    label: 'Technical',
                    tone: 'Use technical language with precise terminology and detailed explanations.'
                },
                {
                    label: 'Casual',
                    tone: 'Write in a relaxed, conversational style using everyday language.'
                },
                {
                    label: 'Academic',
                    tone: 'Use formal academic language with proper citations and structured arguments.'
                }
            ]
        }
    } )
    .catch( error => {
        console.error( error );
    } );
```

### Configuring Command Dropdown

The `commandsDropdown` configuration option allows you to define preset commands for transforming selected content. These commands are primarily designed to edit, enhance, or reformat existing content rather than generating new content from scratch.

Example configuration:

```typescript
ClassicEditor
    .create( document.querySelector( '#editor' ), {
        plugins: [ AiAgent, ... ],
        toolbar: [ 'aiAgentButton', ... ],
        aiAgent: {
            apiKey: 'YOUR_API_KEY',
            commandsDropdown: [
                {
                    title: 'Transform Content',
                    items: [
                        {
                            title: 'Summarize',
                            command: 'Summarize this text in 3 bullet points'
                        },
                        {
                            title: 'Simplify',
                            command: 'Rewrite this to be more concise and easier to understand'
                        }
                    ]
                }
            ]
        }
    } )
    .catch( error => {
        console.error( error );
    } );
```

## Development

This package uses Yarn as the package manager. Here are the main commands available for development:

### Building

```bash
# Build the distribution files
yarn build:dist

# Build TypeScript files
yarn ts:build

# Build DLL files
yarn dll:build

# Clear TypeScript generated files
yarn ts:clear
```

### Development Server

```bash
# Start development server
yarn start

# Serve DLL sample
yarn dll:serve
```

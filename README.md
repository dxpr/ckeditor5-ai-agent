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

🌐 `AI Agent` uses **retrieval-augmented generation (RAG)** and in-context learning to seamlessly integrate external web content into prompts.

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
| `apiKey` | `string` | - | Your Open_AI key for authenticate |
| `model` | `AiModel?` | `'gpt-4o'` | The AI model to use |
| `temperature` | `number?` | `0.7` | Controls the randomness of the AI output. Must be between 0 and 2 |
| `maxOutputTokens` | `number?` | Model specific default from config/ai-model.json | Maximum number of tokens the AI can generate in its response |
| `maxInputTokens` | `number?` | Model specific default from config/ai-model.json | Maximum number of tokens allowed in the combined prompt and context |
| `stopSequences` | `Array<string>?` | `[]` | An array of stop sequences that will end the generation of content when encountered |
| `retryAttempts` | `number?` | `1` | The number of times to retry fetching the AI response if the initial request fails |
| `promptSettings` | `object?` | `{}` | Customize prompt components through `overrides` and `additions` |
| `promptSettings.overrides` | `Record<PromptComponentKey, string>?` | - | Replace default rules for specific components |
| `promptSettings.additions` | `Record<PromptComponentKey, string>?` | - | Add additional rules to specific components |
| `timeOutDuration` | `number?` | `45000` | The duration in milliseconds to wait before timing out the request |
| `contextSize` | `number?` | `75% of model's maxInputContextTokens` | Maximum context window size in tokens |
| `editorContextRatio` | `number?` | `0.3` | Upper limit of what portion of the context size is allocated for editor content |
| `endpointUrl` | `string?` | `'https://api.openai.com/v1/chat/completions'` | The URL of the AI endpoint to use for generating content |
| `debugMode` | `boolean?` | `false` | Enables debug mode for detailed logging |
| `streamContent` | `boolean?` | `true` | Enables streaming mode for responses |
| `showErrorDuration` | `number?` | `5000` | Duration in milliseconds for error message display |
| `moderation.enable` | `boolean?` | `false` | Enables content moderation for AI responses |
| `moderation.key` | `string?` | - | API key for content moderation service |
| `moderation.disableFlags` | `Array<ModerationFlagsTypes>?` | - | Array of moderation flags to disable |
| `commandsDropdown` | `Array<{ title: string; items: Array<{ title: string; command: string; }>; }>?` | Default menu with tone adjustment, content enhancement, and fix/improve commands | Specifies the commands available in the dropdown menu |
| `contentScope` | `string?` | - | CSS selector that extends context gathering to include content from other CKEditor 5 instances found within the first matching ancestor element |

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
Use only these tags: {{ALLOWED_HTML_TAGS}}.
Ensure proper tag nesting.
Use semantic HTML.
No inline styles.
First word must be HTML tag.
```

##### Content Structure
```typescript
Organize information logically.
Use paragraphs.
Maintain consistent formatting.
```

##### Tone
```typescript
// No default tone rules - customizable through promptSettings
```

##### Image Handling
```typescript
Image Requirements:
Every <img> needs src and alt attributes.
Format src as: https://placehold.co/600x400?text=[alt_text].
Alt text must be descriptive.
```

##### Reference Guidelines
```typescript
Generate new text that flows naturally with <CONTEXT>.
Ensure requested percentage of new content.
```

##### Context Requirements
```typescript
Replace @@@cursor@@@ with content for <TASK>.
Return ONLY @@@cursor@@@ - surrounding text is READ-ONLY.
Never copy context text.
Verify zero duplication.
Analyze CONTEXT thoroughly.
Ensure response flows naturally.
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
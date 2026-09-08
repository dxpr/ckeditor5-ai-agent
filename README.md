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

🤖 Natively supports <!-- BEGIN_MODEL_COUNT -->572<!-- END_MODEL_COUNT --> models, with additional support for any self-hosted model via Ollama.

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
| `aiOutputSecurity` | `object?` | `{}` | Security settings to mitigate prompt injection data exfiltration attacks ([CVE-2025-32711](https://nvd.nist.gov/vuln/detail/CVE-2025-32711)) |
| `aiOutputSecurity.allowedDomains` | `string[]?` | `['promptahuman.com']` | Allowed domains for external URLs. Supports wildcards (`*.example.com`). Use `[]` to block all, `['*']` to allow all |

**Note:** Only whitelisted HTML tags are allowed. Dangerous elements are always removed.

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

### AI Output Security

Protects against prompt injection attacks that exfiltrate data via malicious URLs in AI-generated content ([CVE-2025-32711](https://nvd.nist.gov/vuln/detail/CVE-2025-32711)).

**Default behavior:** Only `promptahuman.com` allowed, all other external URLs blocked.

```typescript
aiOutputSecurity: {
    allowedDomains: ['unsplash.com', '*.mycdn.com', 'mycompany.com']  // [] blocks all, ['*'] allows all
}
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

## Supported Models

<!-- BEGIN_MODEL_TABLE -->
#### DXAI

| | | | |
|---|---|---|---|
| kavya-m1 | kavya-m1-eu |  |  |

#### Google

| | | | |
|---|---|---|---|
| gemma-4-31b-it | gemma-4-26b-a4b-it | gemini-pro-latest | gemini-omni-flash-preview |
| gemini-omni-1.1-flash | gemini-flash-lite-latest | gemini-flash-latest | gemini-3.8-flash |
| gemini-3.7-flash | lyria-3.5 | lyria-3-pro-preview | lyria-3-clip-preview |
| gemini-robotics-er-2-preview | gemini-3.6-flash | gemini-3.5-transcribe | gemini-3.5-flash-lite |
| gemini-3.5-flash | gemini-3.1-pro-preview-customtools | gemini-3.1-pro-preview | gemini-3.1-flash-tts-preview |
| gemini-3.1-flash-lite-preview | gemini-3.1-flash-lite | gemini-3-flash-preview | gemini-2.5-pro |
| gemini-2.5-flash-lite | gemini-2.5-flash | deep-research-pro-preview-12-2025 | deep-research-preview-04-2026 |
| deep-research-max-preview-04-2026 | antigravity-preview-05-2026 |  |  |

#### OpenAI

| | | | |
|---|---|---|---|
| gpt-6-astra | gpt-5.6-luna | gpt-5.6-terra | gpt-5.6-sol |
| chat-latest | gpt-5.5-pro-2026-04-23 | gpt-5.5-pro | gpt-5.5-2026-04-23 |
| gpt-5.5 | gpt-5.4-mini | gpt-5.4-mini-2026-03-17 | gpt-5.4-nano |
| gpt-5.4-nano-2026-03-17 | gpt-5.4 | gpt-5.4-pro-2026-03-05 | gpt-5.4-pro |
| gpt-5.4-2026-03-05 | gpt-5.3-chat-latest | gpt-5.3-codex | gpt-5.2-codex |
| gpt-5.2-chat-latest | gpt-5.2-pro | gpt-5.2-pro-2025-12-11 | gpt-5.2 |
| gpt-5.2-2025-12-11 | gpt-5.1-codex-max | gpt-5.1-codex-mini | gpt-5.1-codex |
| gpt-5.1 | gpt-5.1-2025-11-13 | gpt-5.1-chat-latest | gpt-5-pro |
| gpt-5-pro-2025-10-06 | gpt-5-codex | gpt-5-nano | gpt-5-nano-2025-08-07 |
| gpt-5-mini | gpt-5-mini-2025-08-07 | gpt-5 | gpt-5-2025-08-07 |
| gpt-5-chat-latest | o3-pro-2025-06-10 | o3-pro | gpt-4.1-nano |
| gpt-4.1-nano-2025-04-14 | gpt-4.1-mini | gpt-4.1-mini-2025-04-14 | gpt-4.1 |
| gpt-4.1-2025-04-14 | o4-mini | o3 | o4-mini-2025-04-16 |
| o3-2025-04-16 | o1-pro | o1-pro-2025-03-19 | gpt-4o-2024-11-20 |
| o3-mini-2025-01-31 | o3-mini | o1 | o1-2024-12-17 |
| gpt-4o-2024-08-06 | gpt-4o-mini | gpt-4o-mini-2024-07-18 | gpt-4o-2024-05-13 |
| gpt-4o | gpt-4-turbo-2024-04-09 | gpt-4-turbo | gpt-3.5-turbo-0125 |
| gpt-3.5-turbo-1106 | gpt-3.5-turbo-instruct-0914 | gpt-3.5-turbo-instruct | gpt-4 |
| gpt-4-0613 | gpt-3.5-turbo-16k | gpt-3.5-turbo |  |

#### Anthropic

| | | | |
|---|---|---|---|
| claude-fable-5-1 | claude-opus-5 | claude-sonnet-5 | claude-fable-5 |
| claude-opus-4-8 | claude-opus-4-7 | claude-sonnet-4-6 | claude-opus-4-6 |
| claude-opus-4-5-20251101 | claude-haiku-4-5-20251001 | claude-sonnet-4-5-20250929 |  |

#### Mistral AI

| | | | |
|---|---|---|---|
| codestral-2508 | glm-5-2 | labs-leanstral-1-5-1 | ministral-14b-latest |
| ministral-3b-latest | ministral-8b-latest | mistral-large-latest | mistral-medium-latest |
| mistral-small-2603 | voxtral-small-latest |  |  |

#### Groq

| | | | |
|---|---|---|---|
| qwen/qwen3.8-27b | qwen/qwen3.6-27b | canopylabs/orpheus-v1-english | canopylabs/orpheus-arabic-saudi |
| groq/compound-mini | groq/compound | openai/gpt-oss-120b | openai/gpt-oss-20b |
| allam-2-7b |  |  |  |

#### xAI

| | | | |
|---|---|---|---|
| grok-4.6 | grok-4.5 | grok-4.3 | grok-build-0.1 |
| grok-4.20-0309-non-reasoning | grok-4.20-0309-reasoning | grok-4.20-multi-agent-0309 |  |

#### OpenRouter

| | | | |
|---|---|---|---|
| aion-labs/aion-2.0 | aion-labs/aion-3.0 | aion-labs/aion-3.0-mini | aion-labs/aion-rp-llama-3.1-8b |
| amazon/nova-2-lite-v1 | amazon/nova-lite-v1 | amazon/nova-micro-v1 | amazon/nova-premier-v1 |
| amazon/nova-pro-v1 | ~anthropic/claude-haiku-latest | ~anthropic/claude-sonnet-latest | anthropic/claude-3-haiku |
| anthropic/claude-fable-5 | anthropic/claude-fable-5:batch | anthropic/claude-fable-5.1 | anthropic/claude-fable-5.1:batch |
| ~anthropic/claude-fable-latest | anthropic/claude-haiku-4.5 | anthropic/claude-haiku-4.5:batch | anthropic/claude-opus-4 |
| anthropic/claude-opus-4.1 | anthropic/claude-opus-4.1:batch | anthropic/claude-opus-4.5 | anthropic/claude-opus-4.5:batch |
| anthropic/claude-opus-4.6 | anthropic/claude-opus-4.6:batch | anthropic/claude-opus-4.7 | anthropic/claude-opus-4.7:batch |
| anthropic/claude-opus-4.8 | anthropic/claude-opus-4.8:batch | ~anthropic/claude-opus-latest | anthropic/claude-sonnet-4 |
| anthropic/claude-sonnet-4.5 | anthropic/claude-sonnet-4.5:batch | anthropic/claude-sonnet-4.6 | anthropic/claude-sonnet-4.6:batch |
| anthropic/claude-sonnet-5 | anthropic/claude-sonnet-5:batch | arcee-ai/trinity-large-thinking | openrouter/auto |
| openrouter/auto-beta | baidu/ernie-4.5-vl-424b-a47b | openrouter/bodybuilder | bytedance-seed/seed-1.6 |
| bytedance-seed/seed-1.6-flash | bytedance-seed/seed-2-1-turbo | bytedance-seed/seed-2.0-code | bytedance-seed/seed-2.0-lite |
| bytedance-seed/seed-2.0-mini | bytedance/ui-tars-1.5-7b | anthropic/claude-opus-5 | anthropic/claude-opus-5:batch |
| cohere/command-a | cohere/command-r-08-2024 | cohere/command-r-plus-08-2024 | cohere/command-r7b-12-2024 |
| cohere/north-mini-code:free | ~deepseek/deepseek-v4-flash-latest | deepseek/deepseek-chat | deepseek/deepseek-chat-v3-0324 |
| deepseek/deepseek-chat-v3.1 | deepseek/deepseek-v3.1-terminus | deepseek/deepseek-v3.2 | deepseek/deepseek-v3.2-exp |
| deepseek/deepseek-v4-flash | deepseek/deepseek-v4-flash-0731 | deepseek/deepseek-v4-flash-0731:batch | deepseek/deepseek-v4-flash-vision-exp |
| deepseek/deepseek-v4-pro | deepseek/deepseek-v4-pro-0813 | deepseek/deepseek-v4-pro-0813:batch | deepseek/deepseek-r1 |
| deepseek/deepseek-r1-0528 | deepseek/deepseek-r1-distill-llama-70b | dots-studio/dots-3-note-preview:free | openrouter/free |
| ~google/gemini-flash-latest | ~google/gemini-pro-latest | google/gemini-2.5-flash | google/gemini-2.5-flash:batch |
| google/gemini-2.5-flash-lite | google/gemini-2.5-flash-lite:batch | google/gemini-2.5-pro | google/gemini-2.5-pro:batch |
| google/gemini-2.5-pro-preview-05-06 | google/gemini-2.5-pro-preview | google/gemini-3-flash-preview | google/gemini-3-flash-preview:batch |
| google/gemini-3.1-flash-lite | google/gemini-3.1-flash-lite:batch | google/gemini-3.1-flash-lite-preview | google/gemini-3.1-pro-preview |
| google/gemini-3.1-pro-preview:batch | google/gemini-3.1-pro-preview-customtools | google/gemini-3.5-flash | google/gemini-3.5-flash:batch |
| google/gemini-3.5-flash-lite | google/gemini-3.5-flash-lite:batch | google/gemini-3.6-flash | google/gemini-3.6-flash:batch |
| google/gemini-3.7-flash | google/gemini-3.7-flash:batch | google/gemini-3.8-flash | google/gemini-3.8-flash:batch |
| google/gemma-2-27b-it | google/gemma-3-12b-it | google/gemma-3-27b-it | google/gemma-3-4b-it |
| google/gemma-4-26b-a4b-it | google/gemma-4-26b-a4b-it:free | google/gemma-4-31b-it | google/gemma-4-31b-it:batch |
| google/gemma-4-31b-it:free | google/lyria-3-clip-preview | google/lyria-3-pro-preview | google/gemini-2.5-flash-image |
| google/gemini-3.1-flash-image-preview | google/gemini-3.1-flash-image | google/gemini-3.1-flash-lite-image | google/gemini-3-pro-image-preview |
| google/gemini-3-pro-image | ibm-granite/granite-4.0-h-micro | ibm-granite/granite-4.2-8b | inception/mercury-2 |
| inception/mercury-2.5-preview | inclusionai/ling-3.0-flash | inclusionai/ling-3.0-flash-fin | inclusionai/ling-3.0-flash-fin:free |
| inclusionai/ling-3.0-flash-sante:free | kwaipilot/kat-coder-pro-v2 | kwaipilot/kat-coder-pro-v2.5 | liquid/lfm-2.5-2.6b:free |
| anthracite-org/magnum-v4-72b | mancer/weaver | meituan/longcat-2.0 | meta-llama/llama-3.1-70b-instruct |
| meta-llama/llama-3.1-8b-instruct | meta-llama/llama-3.2-1b-instruct | meta-llama/llama-3.2-3b-instruct | meta-llama/llama-3.3-70b-instruct |
| meta-llama/llama-4-maverick | meta-llama/llama-4-scout | meta-llama/llama-guard-4-12b | meta/muse-glimmer-30b |
| meta/muse-glimmer-30b:batch | meta/muse-spark-1.1 | meta/muse-spark-1.2 | meta/muse-spark-1.2-contributor |
| meta/muse-spark-1.3 | meta/muse-spark-1.3-contributor | microsoft/phi-4 | minimax/minimax-m1 |
| minimax/minimax-m2 | minimax/minimax-m2-her | minimax/minimax-m2.1 | minimax/minimax-m2.5 |
| minimax/minimax-m2.7 | minimax/minimax-m3 | minimax/minimax-m3:batch | minimax/minimax-01 |
| mistralai/mistral-large | mistralai/mistral-large-2407 | mistralai/codestral-2508 | mistralai/devstral-2512 |
| mistralai/ministral-14b-2512 | mistralai/ministral-3b-2512 | mistralai/ministral-8b-2512 | mistralai/mistral-large-2512 |
| mistralai/mistral-medium-3 | mistralai/mistral-medium-3.1 | mistralai/mistral-medium-3-5 | mistralai/mistral-medium-3-5:batch |
| mistralai/mistral-nemo | mistralai/mistral-small-24b-instruct-2501 | mistralai/mistral-small-3.1-24b-instruct | mistralai/mistral-small-3.2-24b-instruct |
| mistralai/mistral-small-2603 | mistralai/mixtral-8x22b-instruct | mistralai/mistral-saba | mistralai/voxtral-small-24b-2507 |
| ~moonshotai/kimi-latest | moonshotai/kimi-k2 | moonshotai/kimi-k2-0905 | moonshotai/kimi-k2-thinking |
| moonshotai/kimi-k2.5 | moonshotai/kimi-k2.6 | moonshotai/kimi-k2.7-code | moonshotai/kimi-k3 |
| moonshotai/kimi-k3:batch | morph/morph-v3-fast | morph/morph-v3-large | gryphe/mythomax-l2-13b |
| nex-agi/nex-n2-mini | nex-agi/nex-n2-pro | nousresearch/hermes-3-llama-3.1-405b | nousresearch/hermes-3-llama-3.1-70b |
| nousresearch/hermes-4-405b | nousresearch/hermes-4-70b | nvidia/nemotron-3-nano-30b-a3b | nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free |
| nvidia/nemotron-3-super-120b-a12b | nvidia/nemotron-3-super-120b-a12b:free | nvidia/nemotron-3-ultra-550b-a55b | nvidia/nemotron-3-ultra-550b-a55b:free |
| nvidia/nemotron-3.5-content-safety | nvidia/nemotron-3.5-content-safety:free | nvidia/nemotron-3.5-lightning | nvidia/nemotron-3.5-lightning:free |
| ~openai/gpt-latest | ~openai/gpt-mini-latest | openai/gpt-audio | openai/gpt-audio-mini |
| openai/gpt-chat-latest | openai/gpt-3.5-turbo | openai/gpt-3.5-turbo:batch | openai/gpt-3.5-turbo-0613 |
| openai/gpt-3.5-turbo-16k | openai/gpt-3.5-turbo-instruct | openai/gpt-4 | openai/gpt-4-turbo |
| openai/gpt-4-turbo:batch | openai/gpt-4-turbo-preview | openai/gpt-4.1 | openai/gpt-4.1:batch |
| openai/gpt-4.1-mini | openai/gpt-4.1-mini:batch | openai/gpt-4.1-nano | openai/gpt-4.1-nano:batch |
| openai/gpt-4o | openai/gpt-4o-2024-05-13 | openai/gpt-4o-2024-08-06 | openai/gpt-4o-2024-11-20 |
| openai/gpt-4o:batch | openai/gpt-4o-mini | openai/gpt-4o-mini-2024-07-18 | openai/gpt-4o-mini:batch |
| openai/gpt-5 | openai/gpt-5:batch | openai/gpt-5-image | openai/gpt-5-image-mini |
| openai/gpt-5-mini | openai/gpt-5-mini:batch | openai/gpt-5-nano | openai/gpt-5-nano:batch |
| openai/gpt-5-pro | openai/gpt-5-pro:batch | openai/gpt-5.1 | openai/gpt-5.1:batch |
| openai/gpt-5.1-codex | openai/gpt-5.1-codex-max | openai/gpt-5.1-codex-mini | openai/gpt-5.2 |
| openai/gpt-5.2:batch | openai/gpt-5.2-chat | openai/gpt-5.2-pro | openai/gpt-5.2-pro:batch |
| openai/gpt-5.2-codex | openai/gpt-5.3-codex | openai/gpt-5.4 | openai/gpt-5.4:batch |
| openai/gpt-5.4-image-2 | openai/gpt-5.4-mini | openai/gpt-5.4-mini:batch | openai/gpt-5.4-nano |
| openai/gpt-5.4-nano:batch | openai/gpt-5.4-pro | openai/gpt-5.4-pro:batch | openai/gpt-5.5 |
| openai/gpt-5.5:batch | openai/gpt-5.5-pro | openai/gpt-5.5-pro:batch | openai/gpt-5.6-luna |
| openai/gpt-5.6-luna:batch | openai/gpt-5.6-luna-pro | openai/gpt-5.6-luna-pro:batch | openai/gpt-5.6-sol |
| openai/gpt-5.6-sol:batch | openai/gpt-5.6-sol-pro | openai/gpt-5.6-sol-pro:batch | openai/gpt-5.6-terra |
| openai/gpt-5.6-terra:batch | openai/gpt-5.6-terra-pro | openai/gpt-5.6-terra-pro:batch | openai/gpt-6-astra |
| openai/gpt-6-astra:batch | openai/gpt-6-astra-pro | openai/gpt-6-astra-pro:batch | openai/gpt-oss-120b |
| openai/gpt-oss-120b:batch | openai/gpt-oss-20b | openai/gpt-oss-20b:batch | openai/gpt-oss-safeguard-20b |
| openai/o1 | openai/o1-pro | openai/o3 | openai/o3:batch |
| openai/o3-mini | openai/o3-mini:batch | openai/o3-mini-high | openai/o3-pro |
| openai/o4-mini | openai/o4-mini:batch | openai/o4-mini-high | openrouter/fusion |
| openrouter/pareto-code | perceptron/perceptron-mk1 | perplexity/sonar | perplexity/sonar-deep-research |
| perplexity/sonar-pro | perplexity/sonar-pro-search | perplexity/sonar-reasoning-pro | poolside/laguna-s-2.1 |
| poolside/laguna-s-2.1:free | poolside/laguna-xs-2.1 | poolside/laguna-xs-2.1:free | qwen/qwen-plus-2025-07-28 |
| qwen/qwen-plus | qwen/qwen-2.5-7b-instruct | qwen/qwen2.5-vl-72b-instruct | qwen/qwen3-14b |
| qwen/qwen3-235b-a22b | qwen/qwen3-235b-a22b-2507 | qwen/qwen3-235b-a22b-thinking-2507 | qwen/qwen3-30b-a3b |
| qwen/qwen3-30b-a3b-instruct-2507 | qwen/qwen3-30b-a3b-thinking-2507 | qwen/qwen3-32b | qwen/qwen3-8b |
| qwen/qwen3-coder-30b-a3b-instruct | qwen/qwen3-coder | qwen/qwen3-coder-flash | qwen/qwen3-coder-next |
| qwen/qwen3-coder-plus | qwen/qwen3-max | qwen/qwen3-max-thinking | qwen/qwen3-next-80b-a3b-instruct |
| qwen/qwen3-next-80b-a3b-thinking | qwen/qwen3-vl-235b-a22b-instruct | qwen/qwen3-vl-235b-a22b-thinking | qwen/qwen3-vl-30b-a3b-instruct |
| qwen/qwen3-vl-30b-a3b-thinking | qwen/qwen3-vl-32b-instruct | qwen/qwen3-vl-8b-instruct | qwen/qwen3-vl-8b-thinking |
| qwen/qwen3.5-397b-a17b | qwen/qwen3.5-plus-02-15 | qwen/qwen3.5-plus-20260420 | qwen/qwen3.5-122b-a10b |
| qwen/qwen3.5-27b | qwen/qwen3.5-35b-a3b | qwen/qwen3.5-9b | qwen/qwen3.5-9b:batch |
| qwen/qwen3.5-flash-02-23 | qwen/qwen3.6-27b | qwen/qwen3.6-35b-a3b | qwen/qwen3.6-flash |
| qwen/qwen3.6-max-preview | qwen/qwen3.6-plus | qwen/qwen3.7-flash | qwen/qwen3.7-max |
| qwen/qwen3.7-plus | qwen/qwen3.8-2.4t-a95b | qwen/qwen3.8-2.4t-a95b:batch | qwen/qwen3.8-27b |
| qwen/qwen3.8-flash | qwen/qwen3.8-max-0902 | qwen/qwen-2.5-72b-instruct | qwen/qwen-2.5-coder-32b-instruct |
| rekaai/reka-edge | rekaai/reka-flash-3 | relace/relace-apply-3 | relace/relace-search |
| undi95/remm-slerp-l2-13b | sakana/fugu-ultra | sakana/sakana-namazu | sao10k/l3-lunaris-8b |
| sao10k/l3.1-euryale-70b | sao10k/l3.3-euryale-70b | x-ai/grok-4.20 | x-ai/grok-4.20-multi-agent |
| x-ai/grok-4.3 | x-ai/grok-4.3:batch | x-ai/grok-4.5 | x-ai/grok-4.6 |
| x-ai/grok-build-0.1 | stepfun/step-3.5-flash | stepfun/step-3.7-flash | tencent/hunyuan-a13b-instruct |
| tencent/hy-mt2-1.8b | tencent/hy-mt2-30b-a3b | tencent/hy-mt2-7b | tencent/hy3 |
| tencent/hy3-preview | tencent/hy4-preview | thedrummer/cydonia-24b-v4.1 | thedrummer/skyfall-36b-v2 |
| thedrummer/unslopnemo-12b | thinkingmachines/inkling | thinkingmachines/inkling:batch | thinkingmachines/inkling:free |
| thinkingmachines/inkling-small | thinkingmachines/inkling-small:batch | thinkingmachines/inkling-small:free | upstage/solar-pro-3 |
| upstage/solar-pro4 | cognitivecomputations/dolphin-mistral-24b-venice-edition | microsoft/wizardlm-2-8x22b | writer/palmyra-x5 |
| ~x-ai/grok-latest | xiaomi/mimo-v2.5 | xiaomi/mimo-v2.5-pro | z-ai/glm-4.5 |
| z-ai/glm-4.5-air | z-ai/glm-4.5v | z-ai/glm-4.6 | z-ai/glm-4.6v |
| z-ai/glm-4.7 | z-ai/glm-4.7-flash | z-ai/glm-5 | z-ai/glm-5-turbo |
| z-ai/glm-5.1 | z-ai/glm-5.2 | z-ai/glm-5.3 | z-ai/glm-5.3-flash |
| z-ai/glm-5.3-flash:batch | z-ai/glm-5v-turbo | ~z-ai/glm-flash-latest | ~z-ai/glm-latest |

<!-- END_MODEL_TABLE -->

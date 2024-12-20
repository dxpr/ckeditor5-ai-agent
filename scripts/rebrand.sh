#!/bin/bash

set -euo pipefail

rm -rf dist/browser coverage tmp

git ls-files | while read -r file; do
    if [[ -f "$file" ]]; then
        sed -i '' \
            -e 's/AI Assist/AI Agent/g' \
            -e 's/Ai assist/Ai agent/g' \
            -e 's/AiAssist/AiAgent/g' \
            -e 's/aiAssist/aiAgent/g' \
            -e 's/aiassist/aiagent/g' \
            -e 's/ai-assist/ai-agent/g' \
            -e 's/ai_assist/ai_agent/g' \
            "$file"
    fi
done

git ls-files | grep -E "(aiassist|ai-assist)" | while read -r file; do
    if [[ -f "$file" ]]; then
        newfile=$(echo "$file" | sed -e 's/aiassist/aiagent/g' -e 's/ai-assist/ai-agent/g')
        git mv "$file" "$newfile"
    fi
done

yarn install
yarn run ts:build
yarn run dll:build

# Custom Voice Command Training System

**Advanced voice recognition with user-trainable commands for hands-free coding**

## Overview

The Custom Voice Command Training System allows users to create, train, and manage personalized voice commands for Crowe Code. This system uses advanced pattern matching, fuzzy recognition, and analytics to provide a robust hands-free coding experience, particularly useful for VR/AR research scenarios.

## Features

### 🎤 Voice Training
- **Multiple Samples**: Record 3-5 voice samples per command for better recognition
- **Natural Variations**: System learns from how you naturally speak each command
- **Confidence Threshold**: Adjustable sensitivity (50-95%) to balance flexibility vs accuracy
- **Phonetic Matching**: Recognizes similar-sounding phrases using Soundex algorithm
- **Fuzzy Matching**: Levenshtein distance-based matching for typo tolerance

### ⚡ Command Types

1. **Insert Code**: Insert predefined code snippets
2. **AI Generate**: Use LLM to generate code from natural language
3. **Run Command**: Execute editor commands (save, format, run, etc.)
4. **Custom Script**: Run custom JavaScript with access to editor context

### 📊 Analytics Dashboard
- **Usage Statistics**: Track how often each command is used
- **Training Insights**: Suggestions for improving recognition accuracy
- **Pattern Analysis**: See common variations of your commands
- **Export/Import**: Back up and share voice command profiles

### 🏷️ Organization
- **Tags**: Organize commands by category (e.g., "react", "typescript", "debug")
- **Active/Inactive**: Temporarily disable commands without deleting
- **Search & Filter**: Find commands quickly

## Getting Started

### 1. Create Your First Command

```typescript
// Click "Train New Command" in the Voice Coding panel
// Fill in:
{
  name: "Create React Component",
  description: "Generate a new functional React component",
  actionType: "ai-generate",
  actionData: "Create a React functional component with props interface"
}
```

### 2. Record Voice Samples

Record yourself saying the command 3-5 different ways:

```
Sample 1: "create react component"
Sample 2: "make a new react component"  
Sample 3: "new component in react"
Sample 4: "react component please"
Sample 5: "create component"
```

**Tips for better recognition:**
- Speak clearly and naturally
- Use 2-5 words per phrase
- Include variations you'd actually say
- Avoid similar phrases for different commands

### 3. Adjust Sensitivity

Set the confidence threshold based on your needs:

- **70-80%** (Recommended): Balanced - recognizes variations but avoids false positives
- **50-60%**: Flexible - catches more variations but may trigger incorrectly
- **85-95%**: Strict - requires exact matches, fewer false positives

### 4. Test Your Command

Use the test button to verify your command works as expected before using it live.

## Advanced Usage

### AI-Generated Code Commands

Create commands that use AI to generate context-aware code:

```typescript
{
  name: "Error Handler",
  actionType: "ai-generate",
  actionData: `Create a try-catch error handler with:
  - Logging to console
  - User-friendly error message
  - Error recovery logic`
}
```

Voice samples:
- "add error handling"
- "create error handler"
- "try catch block"

### Custom Script Commands

Execute custom JavaScript with full access to the editor:

```typescript
{
  name: "Insert Timestamp Comment",
  actionType: "custom-script",
  actionData: `
    const timestamp = new Date().toISOString();
    const comment = currentLanguage === 'javascript' 
      ? \`// Generated: \${timestamp}\\n\`
      : \`# Generated: \${timestamp}\\n\`;
    onCodeInsert(comment);
  `
}
```

Available variables in custom scripts:
- `onCodeInsert(code)`: Insert code at cursor
- `currentLanguage`: Current file's programming language

### Command Chaining

Create workflow commands that combine multiple actions:

```typescript
{
  name: "Setup Test File",
  actionType: "custom-script",
  actionData: `
    onCodeInsert(\`
import { describe, it, expect } from 'vitest'

describe('Component', () => {
  it('should render', () => {
    expect(true).toBe(true)
  })
})
    \`.trim());
  `
}
```

## Pattern Matching Algorithm

The system uses a composite scoring algorithm:

```
Final Score = (String Similarity × 0.4) + 
              (Keyword Overlap × 0.4) + 
              (Phonetic Similarity × 0.2)
```

### String Similarity (Levenshtein Distance)
Measures character-level differences:
- "create component" vs "make component" = 0.65

### Keyword Overlap (Jaccard Index)
Compares significant words (filters stop words):
- "create react component" vs "new react component" = 0.67

### Phonetic Similarity (Soundex)
Matches similar-sounding words:
- "code" vs "kode" = 1.0
- "file" vs "phile" = 1.0

## Best Practices

### ✅ Do

1. **Use 3-5 training samples** per command
2. **Include natural variations** of how you'd say it
3. **Test commands** before relying on them
4. **Use descriptive names** (e.g., "Create React Component" not "CRC")
5. **Add tags** for organization
6. **Set appropriate sensitivity** based on command uniqueness
7. **Review analytics** to improve recognition

### ❌ Don't

1. **Don't use similar phrases** for different commands
2. **Don't make commands too long** (>8 words)
3. **Don't use single words** (ambiguous)
4. **Don't forget to test** new commands
5. **Don't set sensitivity too low** (50-60% causes false triggers)

## Examples

### Quick Code Snippets

```typescript
{
  name: "Console Log",
  samples: ["log it", "console log", "log this"],
  actionType: "insert-code",
  actionData: "console.log();"
}

{
  name: "Arrow Function",
  samples: ["arrow function", "make arrow function", "arrow func"],
  actionType: "insert-code",
  actionData: "const functionName = () => {\n  \n};"
}

{
  name: "Use State Hook",
  samples: ["use state", "add state hook", "state hook"],
  actionType: "insert-code",
  actionData: "const [value, setValue] = useState('');"
}
```

### AI-Powered Commands

```typescript
{
  name: "Refactor to TypeScript",
  samples: ["convert to typescript", "make this typescript", "typescript version"],
  actionType: "ai-generate",
  actionData: "Convert the following code to TypeScript with proper types"
}

{
  name: "Add Documentation",
  samples: ["document this", "add comments", "add documentation"],
  actionType: "ai-generate",
  actionData: "Add comprehensive JSDoc comments explaining the code"
}

{
  name: "Optimize Performance",
  samples: ["optimize this", "make it faster", "improve performance"],
  actionType: "ai-generate",
  actionData: "Optimize this code for better performance"
}
```

### Editor Commands

```typescript
{
  name: "Save File",
  samples: ["save", "save file", "save this"],
  actionType: "run-command",
  actionData: "save"
}

{
  name: "Format Code",
  samples: ["format", "format code", "beautify", "prettier"],
  actionType: "run-command",
  actionData: "format"
}

{
  name: "Run Tests",
  samples: ["run tests", "test this", "run test suite"],
  actionType: "run-command",
  actionData: "run"
}
```

## Analytics & Insights

### Usage Metrics

The analytics dashboard tracks:
- **Total Uses**: How many times each command has been triggered
- **Last Used**: When the command was last executed
- **Confidence**: Average recognition confidence score
- **Success Rate**: Percentage of correct recognitions

### Training Suggestions

The system provides automated suggestions:

**High Priority** (Red):
- "Add 2 more voice samples" - Commands need 3-5 samples for accuracy
- "Increase specificity" - Phrase too generic, conflicts with other commands

**Medium Priority** (Yellow):
- "Use more descriptive phrases" - Single words are ambiguous
- "Simplify voice commands" - Phrases too long (>8 words)

**Low Priority** (Blue):
- "Add varied phrasings" - All samples too similar
- "Consider adding tags" - Better organization

### Export/Import

**Export**: Download JSON file with all commands and training data
```json
{
  "version": "1.0",
  "exportDate": "2025-01-15T10:30:00Z",
  "totalCommands": 12,
  "commands": [...]
}
```

**Import**: Restore from backup or share with team members
- Merges with existing commands (doesn't overwrite)
- Validates format before importing
- Preserves all training samples

## Troubleshooting

### Command Not Triggering

1. **Check Recognition Confidence**
   - Open Analytics Dashboard
   - View recent attempts and confidence scores
   - If scores are low (< threshold), add more training samples

2. **Reduce Sensitivity**
   - Lower confidence threshold to 60-70%
   - Test with different phrasings
   - Add more variation to training samples

3. **Check for Conflicts**
   - Review similar commands
   - Make phrases more distinct
   - Use tags to identify problematic commands

### False Positives

1. **Increase Sensitivity**
   - Raise confidence threshold to 80-90%
   - Remove overly generic training samples
   - Make phrases more specific

2. **Refine Training Samples**
   - Remove ambiguous phrases
   - Use longer, more specific commands
   - Avoid common words

### Poor Recognition Accuracy

1. **Improve Training Quality**
   - Record in quiet environment
   - Speak clearly and naturally
   - Use consistent volume/pace

2. **Optimize Sample Count**
   - Add 2-3 more samples if < 3
   - Remove duplicate samples if > 5
   - Include different sentence structures

## Performance Considerations

### Memory Usage
- Each command: ~1-2 KB
- 100 commands: ~100-200 KB
- Stored in browser IndexedDB via spark.kv

### Recognition Speed
- Pattern matching: <5ms per command
- Total lookup time: <50ms for 100 commands
- No impact on editor performance

### Browser Support
- **Chrome/Edge**: Full support ✅
- **Firefox**: Partial (no continuous recognition) ⚠️
- **Safari**: No native support ❌ (use Chrome/Edge)

## API Reference

### Creating Commands Programmatically

```typescript
import { useKV } from '@github/spark/hooks'

const [commands, setCommands] = useKV('custom-voice-commands', [])

const newCommand = {
  id: `custom-${Date.now()}`,
  name: "My Command",
  description: "What it does",
  phrases: ["say this", "or this"],
  actionType: "insert-code",
  actionData: "console.log('Hello');",
  createdAt: new Date(),
  trainingSamples: ["say this", "or this"],
  isActive: true,
  confidenceThreshold: 0.7,
  useCount: 0,
  tags: ["javascript", "debug"]
}

setCommands(prev => [...prev, newCommand])
```

### Pattern Matching

```typescript
import { matchVoicePattern } from '@/lib/voice-pattern-matching'

const result = matchVoicePattern(
  "make a component",  // spoken phrase
  ["create component", "make component", "new component"],  // trained patterns
  0.7  // confidence threshold
)

if (result.matched) {
  console.log(`Matched: ${result.matchedPattern}`)
  console.log(`Confidence: ${result.confidence}`)
}
```

### Analytics

```typescript
import { analyzeCommandUsage } from '@/lib/voice-pattern-matching'

const analytics = analyzeCommandUsage(commands)
// Returns CommandAnalytics[] with usage stats
```

## Future Enhancements

- [ ] Multi-language support (non-English)
- [ ] Voice profiles for multiple users
- [ ] Cloud sync for commands across devices
- [ ] Machine learning-based pattern improvement
- [ ] Contextual command suggestions
- [ ] Integration with GitHub Copilot
- [ ] Voice command macros/sequences

## Support

For issues or feature requests related to voice commands:
1. Check Analytics Dashboard for insights
2. Review training suggestions
3. Experiment with sensitivity settings
4. Export and share problematic command for debugging

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Compatibility**: Crowe Code VR/AR Research Edition 9.0+

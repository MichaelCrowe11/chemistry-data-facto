# Voice Commands - Hands-Free Coding for VR/AR

## Overview

Crowe Code's Voice Commands feature enables completely hands-free coding, perfect for VR/AR immersive environments where keyboard input is impractical. Using advanced speech recognition and AI-powered code generation, you can dictate code, execute IDE commands, and navigate your workspace entirely by voice.

## Features

### 🎤 Voice Recognition
- **Continuous Listening**: Always-on voice recognition with automatic restart
- **High Accuracy**: Multi-alternative recognition with confidence scoring
- **Real-time Feedback**: See your speech transcribed in real-time
- **Error Handling**: Graceful degradation with clear error messages

### 🤖 AI-Powered Code Dictation
- **Natural Language to Code**: Describe what you want in plain English
- **Multi-Language Support**: Works with JavaScript, TypeScript, Python, and more
- **Context-Aware**: Generates code appropriate for your current file
- **Smart Formatting**: Automatically formatted and indented code

### 🎮 IDE Command Control
- **File Operations**: Create, save, and close files
- **Edit Commands**: Undo, redo, format, comment
- **Code Templates**: Insert functions, classes, loops, and more
- **Navigation**: Go to line, find, replace
- **Execution**: Run code with voice

## Getting Started

### Browser Compatibility

Voice commands require the Web Speech API, which is supported in:
- ✅ Google Chrome (Desktop & Android)
- ✅ Microsoft Edge
- ✅ Safari 14.1+
- ❌ Firefox (not supported)

### Enabling Voice Commands

1. Click the microphone icon in the top toolbar (pink/rose gradient)
2. Grant microphone permissions when prompted
3. Click "Start Voice Commands"
4. You'll see a "Listening" badge when active

### Microphone Permissions

If you see "Microphone access denied":
1. Click the lock icon in your browser's address bar
2. Set Microphone to "Allow"
3. Refresh the page
4. Try again

## Available Commands

### File Operations

| Command | Description | Example |
|---------|-------------|---------|
| `save` / `save file` | Save the current file | "save file" |
| `new file` / `create file` | Create a new file | "create file" |
| `close` / `close file` | Close current file/tab | "close" |

### Edit Commands

| Command | Description | Example |
|---------|-------------|---------|
| `undo` | Undo last change | "undo" |
| `redo` | Redo last change | "redo" |
| `format` / `format code` | Format/beautify code | "format code" |
| `comment` / `add comment` | Comment current line | "comment" |
| `delete line` | Delete current line | "delete line" |

### Code Templates

| Command | Description | Generated Code |
|---------|-------------|----------------|
| `insert function` | Insert function template | `function functionName() { }` |
| `insert class` | Insert class template | `class ClassName { }` |
| `insert if` | Insert if statement | `if (condition) { }` |
| `for loop` / `insert for` | Insert for loop | `for (let i = 0; i < length; i++) { }` |
| `try catch` | Insert try-catch block | `try { } catch (error) { }` |

### Code Execution

| Command | Description | Example |
|---------|-------------|---------|
| `run` / `run code` | Execute current file | "run code" |
| `execute` | Execute current file | "execute" |

### Navigation

| Command | Description | Example |
|---------|-------------|---------|
| `go to line [number]` | Jump to specific line | "go to line 42" |
| `find [text]` | Find text in file | "find useState" |
| `replace` | Find and replace | "replace" |

## Code Dictation Mode

### Starting Dictation

Say: **"start dictation"** or **"dictation mode"**

You'll see:
- "Dictation mode activated" toast
- Real-time transcript of your speech
- Dictation indicator in the panel

### Dictating Code

Describe what you want in natural language:

**Examples:**

- "Create a React component called UserCard that takes name and email props and displays them in a card"
- "Write a function that takes an array of numbers and returns the sum"
- "Make an async function to fetch user data from an API endpoint"
- "Create a class named TodoItem with a constructor that takes title and completed parameters"

### Inserting Code

When you're done dictating, say: **"stop dictation"** or **"insert code"**

The system will:
1. Process your speech using GPT-4
2. Generate properly formatted code
3. Insert it at your cursor position
4. Show success notification

### Tips for Better Dictation

✅ **DO:**
- Speak clearly and at normal pace
- Use technical terms precisely ("async function", "arrow function", "React component")
- Be specific about parameters and return types
- Mention important implementation details

❌ **DON'T:**
- Speak too fast or mumble
- Use overly vague descriptions
- Try to dictate exact syntax character-by-character
- Expect it to work in noisy environments

## VR/AR Integration

### Why Voice Commands for VR/AR?

In immersive VR/AR environments:
- Physical keyboards are impractical or invisible
- Virtual keyboards are slow and error-prone
- Hand tracking is great for navigation but poor for text input
- Voice is natural, fast, and hands-free

### VR Workspace + Voice

Perfect combination for immersive coding:

1. Enter VR Workspace (Desktop icon)
2. Enable Voice Commands (Microphone icon)
3. Navigate files by looking and pointing
4. Dictate code entirely hands-free
5. Say "run code" to execute
6. Review output in 3D space

### AR Code Overlay + Voice

Code in your physical space:

1. Open a file in the editor
2. Click AR Code Overlay (MapPin icon)
3. Enable Voice Commands
4. See code floating in your room
5. Dictate changes hands-free
6. Walk around your code while editing

## Advanced Usage

### Chaining Commands

You can execute multiple operations:

1. "new file" → Creates file
2. "start dictation" → Enters dictation mode
3. [Dictate your code]
4. "stop dictation" → Generates and inserts code
5. "save file" → Saves the file
6. "run code" → Executes it

### Custom Workflows

Create voice-driven workflows:

**Example: Quick Function Creation**
1. "insert function"
2. Edit function name
3. "start dictation"
4. "This function validates email addresses using regex"
5. "stop dictation"
6. "format code"
7. "save"

### Confidence Thresholds

The system shows confidence scores for recognized commands:
- **90-100%**: Excellent recognition
- **70-89%**: Good recognition
- **Below 70%**: May not execute (threshold for unrecognized warnings)

## Troubleshooting

### "Voice recognition not supported"

**Solution**: Use Chrome, Edge, or Safari 14.1+. Firefox is not supported.

### "Microphone access denied"

**Solution**:
1. Check browser permissions (lock icon in address bar)
2. Ensure your OS hasn't blocked microphone access
3. Try a different browser
4. Refresh the page after granting permissions

### "No speech detected"

**Solutions**:
- Check microphone is plugged in and working
- Increase microphone volume in OS settings
- Move closer to microphone
- Reduce background noise
- Check browser isn't using wrong microphone (in browser settings)

### Commands Not Recognized

**Solutions**:
- Speak more clearly and slowly
- Use exact command phrases (see tables above)
- Check if in noisy environment
- Wait for "Listening" badge before speaking
- Try restarting voice commands

### Dictation Produces Wrong Code

**Solutions**:
- Be more specific in your description
- Mention the programming language explicitly
- Include key details like function names, parameters
- Try breaking complex requests into smaller pieces
- Review and edit the generated code

### Speech Keeps Cutting Out

**Solutions**:
- Check internet connection (uses Google's servers)
- Reduce CPU usage (close other tabs)
- Check microphone cable isn't loose
- Try refreshing the page
- Update browser to latest version

## Privacy & Security

### What Data is Processed?

**Local:**
- Speech-to-text conversion (Google Web Speech API)
- Command pattern matching
- UI updates

**Server (OpenAI):**
- Code dictation text (only when you say "stop dictation")
- Used to generate code via GPT-4
- Not stored or logged by Crowe Code

### Microphone Access

- Only active when you click "Start Voice Commands"
- Red browser indicator shows when mic is active
- Stop listening anytime with "Stop Listening" button
- Permissions can be revoked in browser settings

### Best Practices

1. **Don't dictate sensitive data**: Passwords, API keys, secrets
2. **Review generated code**: Always verify AI-generated code
3. **Use in private spaces**: Others can hear your dictation
4. **Revoke when done**: Stop listening when not actively using

## Performance Tips

### For Best Results

1. **Quiet Environment**: Minimize background noise
2. **Quality Microphone**: Headset mic works better than laptop mic
3. **Stable Internet**: Speech recognition requires connectivity
4. **Modern Hardware**: Better CPU = smoother experience
5. **One Speaker**: Works best with single speaker

### Optimizing for Speed

- Use short commands instead of long dictation when possible
- Keep code dictation sessions under 30 seconds
- Let the system finish processing before next command
- Close unnecessary browser tabs to free resources

## Keyboard Shortcuts

Even with voice enabled, keyboard shortcuts still work:

- `Ctrl/Cmd + S` - Save (or say "save")
- `Ctrl/Cmd + N` - New file (or say "new file")
- `Ctrl/Cmd + W` - Close tab (or say "close")
- `Ctrl/Cmd + K` - Toggle AI chat

## Future Enhancements

Planned features for voice commands:

- [ ] Custom voice commands (user-defined)
- [ ] Multi-language speech recognition (non-English)
- [ ] Voice-controlled debugging ("set breakpoint", "step over")
- [ ] Collaborative voice sessions (multiple speakers)
- [ ] Voice macros (record series of commands)
- [ ] Offline speech recognition (no internet required)
- [ ] Voice-controlled git operations
- [ ] Natural language refactoring ("extract this into a function")

## Examples

### Complete Workflow Example

**Creating a React Component Hands-Free:**

1. Click microphone icon → "Start Voice Commands"
2. Say: "new file"
3. Type filename: `UserCard.jsx`
4. Say: "start dictation"
5. Say: "Create a React functional component called UserCard that accepts name, email, and avatar props. Display the avatar image, the name as a heading, and the email below it. Use Tailwind classes for styling with a card layout."
6. Say: "stop dictation"
7. Review generated code
8. Say: "format code"
9. Say: "save file"

**Generated Result:**
```jsx
function UserCard({ name, email, avatar }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <img src={avatar} alt={name} className="w-16 h-16 rounded-full mb-4" />
      <h3 className="text-xl font-semibold mb-2">{name}</h3>
      <p className="text-gray-600">{email}</p>
    </div>
  )
}

export default UserCard
```

### Quick Code Snippet Example

**Adding Error Handling:**

1. Say: "go to line 15"
2. Say: "try catch"
3. Edit the try-catch block
4. Say: "format"
5. Say: "save"

## Support

### Getting Help

- Check browser console for error messages
- Verify microphone permissions
- Test microphone in other apps
- Try different browser
- Check internet connection

### Reporting Issues

If voice commands aren't working:

1. Note your browser and version
2. Check browser console for errors
3. Test with simple command like "save"
4. Report the issue with details

## Conclusion

Voice commands transform Crowe Code into a truly hands-free development environment, perfect for VR/AR immersive coding, accessibility needs, or just trying a new way to code. Combined with AI-powered code generation, you can go from idea to implementation using nothing but your voice.

**Start hands-free coding today**: Click the microphone icon and say "start dictation"! 🎤✨

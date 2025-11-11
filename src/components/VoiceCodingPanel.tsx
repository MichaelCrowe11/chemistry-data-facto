import { useState, useEffect, useCallback } from 'react'
import { useVoiceCommands, VoiceCommand } from '@/hooks/use-voice'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Microphone, MicrophoneSlash, Waveform, SpeakerHigh, Code, Cursor } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface VoiceCodingPanelProps {
  onCodeInsert: (code: string) => void
  onCommand: (command: string, args?: any) => void
  language?: string
}

export function VoiceCodingPanel({ onCodeInsert, onCommand, language = 'javascript' }: VoiceCodingPanelProps) {
  const [isDictationMode, setIsDictationMode] = useState(false)
  const [dictatedText, setDictatedText] = useState('')
  const [recentCommands, setRecentCommands] = useState<Array<{ command: string; time: Date }>>([])

  const handleCommandMatch = useCallback((command: VoiceCommand, confidence: number) => {
    toast.success(
      <div>
        <div className="font-semibold">Voice Command Recognized</div>
        <div className="text-xs mt-1">{command.description}</div>
        <div className="text-xs text-muted-foreground">Confidence: {Math.round(confidence * 100)}%</div>
      </div>,
      { duration: 2000 }
    )
  }, [])

  const commands: VoiceCommand[] = [
    {
      command: 'save file',
      description: 'Save the current file',
      patterns: [/^(save|save file|save this)$/],
      action: () => onCommand('save'),
    },
    {
      command: 'new file',
      description: 'Create a new file',
      patterns: [/^(new file|create file|create new file)$/],
      action: () => onCommand('newFile'),
    },
    {
      command: 'close file',
      description: 'Close the current file',
      patterns: [/^(close|close file|close tab)$/],
      action: () => onCommand('closeFile'),
    },
    {
      command: 'undo',
      description: 'Undo last change',
      patterns: [/^(undo|undo that)$/],
      action: () => onCommand('undo'),
    },
    {
      command: 'redo',
      description: 'Redo last change',
      patterns: [/^(redo|redo that)$/],
      action: () => onCommand('redo'),
    },
    {
      command: 'format code',
      description: 'Format the code',
      patterns: [/^(format|format code|format document|beautify)$/],
      action: () => onCommand('format'),
    },
    {
      command: 'run code',
      description: 'Execute the code',
      patterns: [/^(run|run code|execute|execute code)$/],
      action: () => onCommand('run'),
    },
    {
      command: 'start dictation',
      description: 'Start code dictation mode',
      patterns: [/^(start dictation|dictation mode|start coding|code mode)$/],
      action: () => {
        setIsDictationMode(true)
        toast.success('Dictation mode activated. Speak your code.')
      },
    },
    {
      command: 'stop dictation',
      description: 'Stop code dictation mode',
      patterns: [/^(stop dictation|end dictation|stop coding|insert code)$/],
      action: () => {
        if (dictatedText) {
          processDictatedCode(dictatedText)
        }
        setIsDictationMode(false)
        setDictatedText('')
      },
    },
    {
      command: 'insert function',
      description: 'Insert a function template',
      patterns: [/^(function|create function|new function|insert function)\s+(.+)$/],
      action: () => {
        const functionTemplate = `function functionName() {\n  \n}\n`
        onCodeInsert(functionTemplate)
      },
    },
    {
      command: 'insert class',
      description: 'Insert a class template',
      patterns: [/^(class|create class|new class|insert class)\s+(.+)$/],
      action: () => {
        const classTemplate = `class ClassName {\n  constructor() {\n    \n  }\n}\n`
        onCodeInsert(classTemplate)
      },
    },
    {
      command: 'insert if',
      description: 'Insert an if statement',
      patterns: [/^(if|if statement|insert if)$/],
      action: () => {
        const ifTemplate = `if (condition) {\n  \n}\n`
        onCodeInsert(ifTemplate)
      },
    },
    {
      command: 'insert for loop',
      description: 'Insert a for loop',
      patterns: [/^(for|for loop|insert for|loop)$/],
      action: () => {
        const forTemplate = `for (let i = 0; i < length; i++) {\n  \n}\n`
        onCodeInsert(forTemplate)
      },
    },
    {
      command: 'insert try catch',
      description: 'Insert a try-catch block',
      patterns: [/^(try catch|try|insert try catch|error handling)$/],
      action: () => {
        const tryCatchTemplate = `try {\n  \n} catch (error) {\n  console.error(error)\n}\n`
        onCodeInsert(tryCatchTemplate)
      },
    },
    {
      command: 'comment line',
      description: 'Insert a comment',
      patterns: [/^(comment|add comment|comment this)$/],
      action: () => onCommand('comment'),
    },
    {
      command: 'delete line',
      description: 'Delete current line',
      patterns: [/^(delete|delete line|remove line)$/],
      action: () => onCommand('deleteLine'),
    },
    {
      command: 'go to line',
      description: 'Go to specific line',
      patterns: [/^(go to line|line|jump to line)\s+(\d+)$/],
      action: () => onCommand('goToLine'),
    },
    {
      command: 'find',
      description: 'Find text in file',
      patterns: [/^(find|search|search for)\s+(.+)$/],
      action: () => onCommand('find'),
    },
    {
      command: 'replace',
      description: 'Find and replace',
      patterns: [/^(replace|find and replace)$/],
      action: () => onCommand('replace'),
    },
  ]

  const voiceState = useVoiceCommands(commands, handleCommandMatch)

  useEffect(() => {
    if (voiceState.error) {
      if (voiceState.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable microphone permissions.')
      } else if (voiceState.error === 'no-speech') {
        toast.warning('No speech detected. Try speaking again.')
      } else if (voiceState.error === 'not-supported') {
        toast.error('Voice recognition is not supported in this browser')
      }
    }
  }, [voiceState.error])

  useEffect(() => {
    if (isDictationMode && voiceState.interimTranscript) {
      setDictatedText(voiceState.interimTranscript)
    }
    if (isDictationMode && voiceState.transcript && !commands.some(cmd => 
      cmd.patterns.some(p => p.test(voiceState.transcript.toLowerCase()))
    )) {
      setDictatedText((prev) => prev + ' ' + voiceState.transcript)
    }
  }, [voiceState.interimTranscript, voiceState.transcript, isDictationMode, commands])

  const processDictatedCode = useCallback(async (text: string) => {
    try {
      const prompt = spark.llmPrompt`Convert the following spoken code description into actual ${language} code. 
Only return the code, no explanations:

Spoken description: ${text}

Generate clean, well-formatted code based on this description.`

      toast.loading('Converting speech to code...')
      const code = await spark.llm(prompt, 'gpt-4o')
      
      const cleanedCode = code.replace(/```[\w]*\n?/g, '').trim()
      
      onCodeInsert(cleanedCode)
      toast.success('Code inserted from dictation')
      
      setRecentCommands((prev) => [
        { command: `Dictated: "${text.substring(0, 50)}..."`, time: new Date() },
        ...prev.slice(0, 9),
      ])
    } catch (error) {
      toast.error('Failed to convert speech to code')
      console.error(error)
    }
  }, [language, onCodeInsert])

  const trackCommand = useCallback((commandName: string) => {
    setRecentCommands((prev) => [
      { command: commandName, time: new Date() },
      ...prev.slice(0, 9),
    ])
  }, [])

  useEffect(() => {
    if (voiceState.transcript) {
      const matchedCommand = commands.find(cmd =>
        cmd.patterns.some(p => p.test(voiceState.transcript.toLowerCase()))
      )
      if (matchedCommand) {
        trackCommand(matchedCommand.description)
      }
    }
  }, [voiceState.transcript, commands, trackCommand])

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Microphone className="h-5 w-5 text-primary" weight="duotone" />
            <h3 className="font-semibold text-sm">Voice Coding</h3>
          </div>
          <Badge variant={voiceState.isListening ? 'default' : 'secondary'} className="text-xs">
            {voiceState.isListening ? 'Listening' : 'Inactive'}
          </Badge>
        </div>

        {!voiceState.isSupported ? (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-3">
            Voice recognition not supported in this browser. Try Chrome or Edge.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              onClick={voiceState.toggleListening}
              variant={voiceState.isListening ? 'destructive' : 'default'}
              className="w-full"
              size="sm"
            >
              {voiceState.isListening ? (
                <>
                  <MicrophoneSlash className="h-4 w-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Microphone className="h-4 w-4 mr-2" />
                  Start Voice Commands
                </>
              )}
            </Button>

            {isDictationMode && (
              <Button
                onClick={() => {
                  if (dictatedText) {
                    processDictatedCode(dictatedText)
                  }
                  setIsDictationMode(false)
                  setDictatedText('')
                }}
                variant="secondary"
                className="w-full"
                size="sm"
              >
                <Code className="h-4 w-4 mr-2" />
                Insert Dictated Code
              </Button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {voiceState.isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-3 bg-primary/10 border-b border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Waveform className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-medium">
                {isDictationMode ? 'Dictating Code...' : 'Listening for commands...'}
              </span>
            </div>
            
            {(voiceState.interimTranscript || voiceState.transcript || dictatedText) && (
              <div className="text-xs text-muted-foreground bg-background/50 rounded p-2 font-mono">
                {isDictationMode ? dictatedText : (voiceState.interimTranscript || voiceState.transcript)}
                <Cursor className="inline h-3 w-3 animate-pulse ml-1" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {recentCommands.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
                <SpeakerHigh className="h-3 w-3" />
                Recent Commands
              </h4>
              <div className="space-y-1">
                {recentCommands.map((cmd, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs p-2 bg-muted/50 rounded flex items-start justify-between gap-2"
                  >
                    <span className="flex-1">{cmd.command}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {cmd.time.toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h4 className="text-xs font-semibold mb-2">Available Commands</h4>
            <div className="space-y-2">
              {commands.slice(0, 15).map((cmd, i) => (
                <Card key={i} className="p-2 bg-muted/30">
                  <div className="text-xs font-medium mb-1">"{cmd.command}"</div>
                  <div className="text-[10px] text-muted-foreground">{cmd.description}</div>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 rounded p-3">
            <p className="font-semibold">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Speak clearly and naturally</li>
              <li>Use "start dictation" to dictate code</li>
              <li>Say "stop dictation" to convert speech to code</li>
              <li>Commands work best in quiet environments</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

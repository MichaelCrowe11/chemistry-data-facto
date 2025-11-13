import { useEffect, useState, useCallback } from 'react'
import { useVoiceCommands, VoiceCommand } from '@/hooks/use-voice'
import { Badge } from '@/components/ui/badge'
import { Microphone, MicrophoneSlash, Waveform } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface VRVoiceControlProps {
  onCodeInsert?: (code: string) => void
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right' | 'forward' | 'back') => void
  onZoom?: (direction: 'in' | 'out') => void
  onRotate?: (direction: 'left' | 'right') => void
  onSelect?: () => void
  onBack?: () => void
  language?: string
}

export function VRVoiceControl({
  onCodeInsert,
  onNavigate,
  onZoom,
  onRotate,
  onSelect,
  onBack,
  language = 'javascript',
}: VRVoiceControlProps) {
  const [isDictationMode, setIsDictationMode] = useState(false)
  const [dictatedText, setDictatedText] = useState('')
  const [isActive, setIsActive] = useState(false)

  const handleCommandMatch = useCallback((command: VoiceCommand, confidence: number) => {
    toast.success(command.description, { duration: 1500 })
  }, [])

  const commands: VoiceCommand[] = [
    {
      command: 'navigate up',
      description: 'Move view up',
      patterns: [/^(up|move up|navigate up|look up)$/],
      action: () => onNavigate?.('up'),
    },
    {
      command: 'navigate down',
      description: 'Move view down',
      patterns: [/^(down|move down|navigate down|look down)$/],
      action: () => onNavigate?.('down'),
    },
    {
      command: 'navigate left',
      description: 'Move view left',
      patterns: [/^(left|move left|navigate left|look left)$/],
      action: () => onNavigate?.('left'),
    },
    {
      command: 'navigate right',
      description: 'Move view right',
      patterns: [/^(right|move right|navigate right|look right)$/],
      action: () => onNavigate?.('right'),
    },
    {
      command: 'move forward',
      description: 'Move forward',
      patterns: [/^(forward|move forward|go forward|closer)$/],
      action: () => onNavigate?.('forward'),
    },
    {
      command: 'move back',
      description: 'Move backward',
      patterns: [/^(back|move back|go back|farther|further)$/],
      action: () => onNavigate?.('back'),
    },
    {
      command: 'zoom in',
      description: 'Zoom in',
      patterns: [/^(zoom in|enlarge|bigger)$/],
      action: () => onZoom?.('in'),
    },
    {
      command: 'zoom out',
      description: 'Zoom out',
      patterns: [/^(zoom out|shrink|smaller)$/],
      action: () => onZoom?.('out'),
    },
    {
      command: 'rotate left',
      description: 'Rotate left',
      patterns: [/^(rotate left|turn left|spin left)$/],
      action: () => onRotate?.('left'),
    },
    {
      command: 'rotate right',
      description: 'Rotate right',
      patterns: [/^(rotate right|turn right|spin right)$/],
      action: () => onRotate?.('right'),
    },
    {
      command: 'select',
      description: 'Select current item',
      patterns: [/^(select|choose|pick|click)$/],
      action: () => onSelect?.(),
    },
    {
      command: 'exit',
      description: 'Exit VR mode',
      patterns: [/^(exit|close|quit|leave|go back|return)$/],
      action: () => onBack?.(),
    },
    {
      command: 'start dictation',
      description: 'Start code dictation',
      patterns: [/^(start dictation|dictation mode|code mode)$/],
      action: () => {
        setIsDictationMode(true)
        toast.success('Dictation mode activated')
      },
    },
    {
      command: 'stop dictation',
      description: 'Stop dictation and insert code',
      patterns: [/^(stop dictation|end dictation|insert code|done)$/],
      action: async () => {
        if (dictatedText && onCodeInsert) {
          try {
            const prompt = spark.llmPrompt`Convert the following spoken code description into actual ${language} code. 
Only return the code, no explanations:

Spoken description: ${dictatedText}

Generate clean, well-formatted code.`

            const code = await spark.llm(prompt, 'gpt-4o')
            const cleanedCode = code.replace(/```[\w]*\n?/g, '').trim()
            
            onCodeInsert(cleanedCode)
            toast.success('Code inserted from dictation')
          } catch (error) {
            toast.error('Failed to convert speech to code')
          }
        }
        setIsDictationMode(false)
        setDictatedText('')
      },
    },
    {
      command: 'activate voice',
      description: 'Activate voice commands',
      patterns: [/^(activate|activate voice|start listening|voice on)$/],
      action: () => {
        setIsActive(true)
      },
    },
    {
      command: 'deactivate voice',
      description: 'Deactivate voice commands',
      patterns: [/^(deactivate|deactivate voice|stop listening|voice off)$/],
      action: () => {
        setIsActive(false)
      },
    },
  ]

  const voiceState = useVoiceCommands(commands, handleCommandMatch)

  useEffect(() => {
    if (voiceState.error) {
      if (voiceState.error === 'not-allowed') {
        toast.error('Microphone access denied')
      } else if (voiceState.error === 'not-supported') {
        toast.error('Voice not supported in this browser')
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

  useEffect(() => {
    if (isActive && !voiceState.isListening) {
      voiceState.startListening()
    } else if (!isActive && voiceState.isListening) {
      voiceState.stopListening()
    }
  }, [isActive, voiceState])

  return (
    <div className="fixed top-4 left-4 z-50 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background/90 backdrop-blur-xl rounded-2xl border border-border shadow-2xl p-4 max-w-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Microphone className="h-5 w-5 text-primary" weight="duotone" />
            <h3 className="font-semibold text-sm">VR Voice Control</h3>
          </div>
          <Badge variant={voiceState.isListening ? 'default' : 'secondary'} className="text-xs">
            {voiceState.isListening ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {!voiceState.isSupported ? (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-3">
            Voice not supported. Use Chrome or Edge.
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isActive ? (
                <>
                  <MicrophoneSlash className="inline h-4 w-4 mr-2" />
                  Deactivate Voice
                </>
              ) : (
                <>
                  <Microphone className="inline h-4 w-4 mr-2" />
                  Activate Voice
                </>
              )}
            </button>

            <AnimatePresence>
              {voiceState.isListening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-primary/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Waveform className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-xs font-medium">
                        {isDictationMode ? 'Dictating...' : 'Listening...'}
                      </span>
                    </div>
                    
                    {(voiceState.interimTranscript || voiceState.transcript || dictatedText) && (
                      <div className="text-xs text-muted-foreground bg-background/50 rounded p-2 font-mono min-h-[40px]">
                        {isDictationMode ? dictatedText : (voiceState.interimTranscript || voiceState.transcript)}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/30 rounded p-2">
              <p className="font-semibold">Commands:</p>
              <div className="grid grid-cols-2 gap-1">
                <span>• "up/down/left/right"</span>
                <span>• "zoom in/out"</span>
                <span>• "rotate left/right"</span>
                <span>• "select"</span>
                <span>• "start dictation"</span>
                <span>• "exit"</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

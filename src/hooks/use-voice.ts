import { useState, useEffect, useCallback, useRef } from 'react'
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '@/types/speech'

export interface VoiceCommand {
  command: string
  action: () => void
  description: string
  patterns: RegExp[]
}

export interface VoiceRecognitionState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  confidence: number
  interimTranscript: string
  error: string | null
}

export function useVoiceCommands(commands: VoiceCommand[], onCommandMatch?: (command: VoiceCommand, confidence: number) => void) {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    confidence: 0,
    interimTranscript: '',
    error: null,
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const commandHistoryRef = useRef<string[]>([])

  useEffect(() => {
    const SpeechRecognitionClass = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      setState((prev) => ({ ...prev, isSupported: false }))
      return
    }

    setState((prev) => ({ ...prev, isSupported: true }))

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 3

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcript
          maxConfidence = result[0].confidence
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        setState((prev) => ({
          ...prev,
          transcript: finalTranscript,
          confidence: maxConfidence,
          interimTranscript: '',
          error: null,
        }))

        processCommand(finalTranscript, maxConfidence)
      } else {
        setState((prev) => ({
          ...prev,
          interimTranscript,
        }))
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      
      setState((prev) => ({ 
        ...prev, 
        isListening: false,
        error: event.error,
      }))
    }

    recognition.onend = () => {
      setState((prev) => {
        if (prev.isListening) {
          try {
            recognition.start()
          } catch (e) {
            return { ...prev, isListening: false }
          }
        }
        return prev
      })
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const processCommand = useCallback((transcript: string, confidence: number) => {
    const normalizedTranscript = transcript.toLowerCase().trim()
    
    commandHistoryRef.current.push(normalizedTranscript)
    if (commandHistoryRef.current.length > 50) {
      commandHistoryRef.current.shift()
    }

    for (const command of commands) {
      for (const pattern of command.patterns) {
        const match = normalizedTranscript.match(pattern)
        if (match) {
          if (onCommandMatch) {
            onCommandMatch(command, confidence)
          }
          command.action()
          return true
        }
      }
    }

    return false
  }, [commands, onCommandMatch])

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: 'not-supported' }))
      return
    }

    try {
      recognitionRef.current?.start()
      setState((prev) => ({ ...prev, isListening: true, error: null }))
    } catch (error) {
      console.error('Failed to start recognition:', error)
      setState((prev) => ({ ...prev, error: 'failed-to-start' }))
    }
  }, [state.isSupported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setState((prev) => ({ ...prev, isListening: false, interimTranscript: '', error: null }))
  }, [])

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    commandHistory: commandHistoryRef.current,
  }
}

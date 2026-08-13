import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  abort: () => void
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && getSpeechRecognition() !== null
}

export function useSpeechRecognition(options: { active: boolean; muted: boolean }) {
  const [supported] = useState(() => isSpeechRecognitionSupported())
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const stop = useCallback(() => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setListening(false)
  }, [])

  useEffect(() => {
    if (!options.active) {
      stop()
      setTranscript('')
      return
    }

    if (options.muted || !supported) {
      stop()
      return
    }

    const Recognition = getSpeechRecognition()
    if (!Recognition) return

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      let combined = ''
      for (let i = 0; i < event.results.length; i += 1) {
        combined += event.results[i][0].transcript
      }
      setTranscript(combined.trim())
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    try {
      recognition.start()
      setListening(true)
    } catch {
      setListening(false)
    }

    return () => {
      recognition.abort()
    }
  }, [options.active, options.muted, stop, supported])

  return { supported, listening, transcript, stop }
}

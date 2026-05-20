'use client'
import { useEffect, useRef } from 'react'
import { useMascotChannels } from './use-mascot-channels'

interface KbState {
  capsLockOn: boolean
  composerFocused: boolean
  keyTimestamps: number[]
}
const useKeyboardChannel = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const bump = useMascotChannels(s => s.bump)
  const setCh = useMascotChannels(s => s.set)
  const stateRef = useRef<KbState>({
    capsLockOn: false,
    composerFocused: false,
    keyTimestamps: []
  })
  useEffect(() => {
    if (!enabled) return
    const st = stateRef.current
    const onKey = (e: KeyboardEvent) => {
      const now = e.timeStamp
      st.keyTimestamps.push(now)
      while (st.keyTimestamps[0] !== undefined && now - st.keyTimestamps[0] > 5000) st.keyTimestamps.shift()
      const wpm = (st.keyTimestamps.length / 5) * 12
      setCh('energy', Math.min(1, 0.4 + wpm / 200))
      bump('attention', 0.04, 1)
      if (e.key === 'Enter') {
        bump('cheer', 0.5, 1)
        bump('joy', 0.3, 1)
      } else if (e.key === '!') bump('excitement', 0.25, 1)
      else if (e.key === '?') bump('curiosity', 0.2, 1)
      const capsOn = e.getModifierState('CapsLock')
      if (capsOn !== st.capsLockOn) {
        st.capsLockOn = capsOn
        if (capsOn) bump('annoyance', 0.15, 1)
      }
    }
    const onFocus = (e: FocusEvent) => {
      const t = e.target
      const focused = t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement
      st.composerFocused = focused
      if (focused) bump('attention', 0.3, 1)
    }
    globalThis.addEventListener('keydown', onKey)
    globalThis.addEventListener('focusin', onFocus)
    globalThis.addEventListener('focusout', onFocus)
    return () => {
      globalThis.removeEventListener('keydown', onKey)
      globalThis.removeEventListener('focusin', onFocus)
      globalThis.removeEventListener('focusout', onFocus)
    }
  }, [bump, enabled, setCh])
}
export { useKeyboardChannel }

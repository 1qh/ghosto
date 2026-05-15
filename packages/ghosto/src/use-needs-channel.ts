'use client'
import { useEffect, useRef } from 'react'
import { useMascotChannels } from './use-mascot-channels'
const useNeedsChannel = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const set = useMascotChannels(s => s.set)
  const bump = useMascotChannels(s => s.bump)
  const lastInputAtRef = useRef<number>(0)
  useEffect(() => {
    lastInputAtRef.current = Date.now()
  }, [])
  useEffect(() => {
    if (!enabled) return
    const onInput = () => {
      lastInputAtRef.current = Date.now()
    }
    globalThis.addEventListener('pointerdown', onInput)
    globalThis.addEventListener('pointermove', onInput, { passive: true })
    globalThis.addEventListener('keydown', onInput)
    const id = globalThis.setInterval(() => {
      const now = Date.now()
      const idleS = (now - lastInputAtRef.current) / 1000
      const h = new Date().getHours()
      const energyCurve = 0.4 + 0.5 * Math.sin(((h - 7) / 24) * Math.PI * 2)
      set('energy', Math.max(0, Math.min(1, energyCurve)))
      if (idleS > 60) bump('boredom', 0.02, 1)
      if (idleS > 10) bump('loneliness', 0.01, 1)
      if (h < 5 || h > 23) bump('fatigue', 0.02, 1)
    }, 5000)
    return () => {
      globalThis.removeEventListener('pointerdown', onInput)
      globalThis.removeEventListener('pointermove', onInput)
      globalThis.removeEventListener('keydown', onInput)
      globalThis.clearInterval(id)
    }
  }, [bump, enabled, set])
}
export { useNeedsChannel }

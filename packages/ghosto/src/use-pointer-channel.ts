'use client'
import { useCallback, useEffect, useRef } from 'react'
import {
  DRAG_THRESHOLD_PX,
  MULTI_TAP_WINDOW_MS,
  POINTER_DIST_FAR_PX,
  POINTER_DIST_NEAR_PX,
  POINTER_SPEED_ERRATIC,
  POINTER_SPEED_HIGH,
  POINTER_SPEED_LOW,
  POINTER_STALK_SPEED_HIGH,
  POINTER_STALK_SPEED_LOW
} from './constants'
import { useMascotChannels } from './use-mascot-channels'

interface PointerState {
  insideCanvas: boolean
  lastClickT: number
  lastMoveT: number
  lastT: number
  lastX: number
  lastY: number
  mascotCenterPx: { x: number; y: number }
  movePx: number
  pressActive: boolean
  pressStart: null | { t: number; x: number; y: number }
}
const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const usePointerChannel = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const bump = useMascotChannels(s => s.bump)
  const setCh = useMascotChannels(s => s.set)
  const stateRef = useRef<PointerState>({
    insideCanvas: false,
    lastClickT: 0,
    lastMoveT: 0,
    lastT: 0,
    lastX: 0,
    lastY: 0,
    mascotCenterPx: { x: 0, y: 0 },
    movePx: 0,
    pressActive: false,
    pressStart: null
  })
  useEffect(() => {
    if (!enabled) return
    const st = stateRef.current
    const onEnter = () => {
      st.insideCanvas = true
      bump('curiosity', 0.3, 1)
      bump('attention', 0.4, 1)
      bump('affection', 0.04, 1)
      bump('joy', 0.1, 1)
    }
    const onLeave = () => {
      st.insideCanvas = false
      setCh('magnetism', 0)
      bump('loneliness', 0.25, 1)
    }
    const onMove = (e: PointerEvent) => {
      const t = e.timeStamp
      const dx = e.clientX - st.lastX
      const dy = e.clientY - st.lastY
      const dt = Math.max(0.001, (t - st.lastT) / 1000)
      const speed = Math.hypot(dx, dy) / dt
      const jumpPx = Math.hypot(dx, dy)
      st.lastX = e.clientX
      st.lastY = e.clientY
      st.lastT = t
      st.lastMoveT = t
      const dist = Math.hypot(e.clientX - st.mascotCenterPx.x, e.clientY - st.mascotCenterPx.y)
      const closeness = 1 - smoothstep(POINTER_DIST_NEAR_PX, POINTER_DIST_FAR_PX, dist)
      setCh('magnetism', closeness)
      if (jumpPx >= 600 && st.lastMoveT - st.lastT < 100) {
        bump('attention', 0.6, 1)
        bump('curiosity', 0.3, 1)
        bump('worry', 0.1, 1)
        bump('dizzy', 0.05, 1)
      }
      if (st.pressActive) {
        bump('joy', 0.05, 1)
        bump('cheer', 0.04, 1)
        bump('affection', 0.02, 1)
        bump('attention', 0.12, 1)
        bump('magnetism', 0.06, 1)
      } else if (speed >= POINTER_SPEED_ERRATIC) {
        bump('worry', 0.08, 1)
        bump('dizzy', 0.05, 1)
        bump('attention', 0.1, 1)
      } else if (speed >= POINTER_SPEED_HIGH) {
        bump('excitement', 0.05, 1)
        bump('attention', 0.06, 1)
      } else if (speed >= POINTER_STALK_SPEED_LOW && speed <= POINTER_STALK_SPEED_HIGH && closeness > 0.5) {
        bump('attention', 0.06, 1)
        bump('magnetism', 0.04, 1)
        bump('joy', 0.02, 1)
      } else if (speed <= POINTER_SPEED_LOW && closeness > 0.4) {
        bump('joy', 0.03, 1)
        bump('cheer', 0.02, 1)
        bump('affection', 0.01, 1)
      } else if (closeness > 0.15) bump('curiosity', 0.02, 1)
      if (st.pressActive && st.pressStart) st.movePx += jumpPx
    }
    const onDown = (e: PointerEvent) => {
      st.pressActive = true
      st.movePx = 0
      st.pressStart = { t: e.timeStamp, x: e.clientX, y: e.clientY }
    }
    const onUp = (e: PointerEvent) => {
      if (!(st.pressActive && st.pressStart)) {
        st.pressActive = false
        return
      }
      const wasDrag = st.movePx > DRAG_THRESHOLD_PX
      if (wasDrag) {
        bump('cheer', 0.4, 1)
        bump('joy', 0.3, 1)
        bump('affection', 0.06, 1)
      } else {
        const streakDt = e.timeStamp - st.lastClickT
        const inStreak = streakDt < 1000
        const streakMult = inStreak ? Math.min(1.6, 1 + 0.2 * Math.max(0, 5 - streakDt / 200)) : 1
        const dbl = streakDt < MULTI_TAP_WINDOW_MS
        bump('joy', (dbl ? 0.9 : 0.7) * streakMult, 1)
        bump('cheer', (dbl ? 0.7 : 0.5) * streakMult, 1)
        bump('excitement', (dbl ? 0.6 : 0.4) * streakMult, 1)
        bump('heat', 0.3, 1)
        bump('affection', 0.05, 1)
      }
      st.lastClickT = e.timeStamp
      st.pressActive = false
      st.pressStart = null
    }
    globalThis.addEventListener('pointerenter', onEnter)
    globalThis.addEventListener('pointerleave', onLeave)
    globalThis.addEventListener('pointermove', onMove, { passive: true })
    globalThis.addEventListener('pointerdown', onDown)
    globalThis.addEventListener('pointerup', onUp)
    globalThis.addEventListener('pointercancel', onUp)
    return () => {
      globalThis.removeEventListener('pointerenter', onEnter)
      globalThis.removeEventListener('pointerleave', onLeave)
      globalThis.removeEventListener('pointermove', onMove)
      globalThis.removeEventListener('pointerdown', onDown)
      globalThis.removeEventListener('pointerup', onUp)
      globalThis.removeEventListener('pointercancel', onUp)
    }
  }, [bump, enabled, setCh])
  const setMascotCenter = useCallback((x: number, y: number) => {
    stateRef.current.mascotCenterPx = { x, y }
  }, [])
  const isInside = useCallback((): boolean => stateRef.current.insideCanvas, [])
  return { isInside, setMascotCenter }
}
export { usePointerChannel }

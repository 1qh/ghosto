/* oxlint-disable promise/prefer-await-to-callbacks */
'use client'
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'
const subscribe = (cb: () => void): (() => void) => {
  if (typeof globalThis.matchMedia !== 'function') return () => undefined
  const mql = globalThis.matchMedia(QUERY)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}
const getSnapshot = (): boolean => {
  if (typeof globalThis.matchMedia !== 'function') return false
  return globalThis.matchMedia(QUERY).matches
}
const getServerSnapshot = (): boolean => false
const useReducedMotion = (): boolean => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
export { useReducedMotion }

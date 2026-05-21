'use client'
import { get, set } from 'idb-keyval'
import { useCallback, useEffect, useRef } from 'react'
import type { AffinityTier } from './config'
import { defaultConfig, useGhostoConfig } from './config'
import { useMascotChannels } from './use-mascot-channels'

interface AffinityRecord {
  cumulativeMs: number
  interactions: number
  lastSeenAt: number
}
const KEY = 'va.mascot.v1.affinity.self'
const FALLBACK_TIER: AffinityTier = { interactions: 0, label: 'shy' }
const tierFor = (
  interactions: number,
  tiers: readonly AffinityTier[] = defaultConfig.channels.affinityTiers
): AffinityTier => {
  let chosen: AffinityTier = tiers[0] ?? FALLBACK_TIER
  for (const t of tiers) if (interactions >= t.interactions) chosen = t
  return chosen
}
const useHistoryChannel = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { channels } = useGhostoConfig()
  const setCh = useMascotChannels(s => s.set)
  const recordRef = useRef<AffinityRecord | null>(null)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const init = async () => {
      const existing = await get<AffinityRecord>(KEY)
      recordRef.current = existing ?? { cumulativeMs: 0, interactions: 0, lastSeenAt: Date.now() }
      if (!cancelled) setCh('affinity', Math.min(1, recordRef.current.interactions / 1000))
    }
    /* oxlint-disable-next-line promise/prefer-await-to-then */
    init().catch(() => undefined)
    const bumpInteraction = () => {
      const r = recordRef.current
      if (!r) return
      r.interactions += 1
      r.lastSeenAt = Date.now()
      setCh('affinity', Math.min(1, r.interactions / 1000))
    }
    const flush = () => {
      const r = recordRef.current
      if (!r) return
      /* oxlint-disable-next-line promise/prefer-await-to-then */
      set(KEY, r).catch(() => undefined)
    }
    globalThis.addEventListener('pointerdown', bumpInteraction)
    globalThis.addEventListener('keydown', bumpInteraction)
    const id = globalThis.setInterval(flush, 5000)
    globalThis.addEventListener('beforeunload', flush)
    return () => {
      cancelled = true
      globalThis.removeEventListener('pointerdown', bumpInteraction)
      globalThis.removeEventListener('keydown', bumpInteraction)
      globalThis.removeEventListener('beforeunload', flush)
      globalThis.clearInterval(id)
      flush()
    }
  }, [enabled, setCh])
  const boundTierFor = useCallback(
    (interactions: number): AffinityTier => tierFor(interactions, channels.affinityTiers),
    [channels.affinityTiers]
  )
  return { recordRef, tierFor: boundTierFor }
}
export type { AffinityRecord }
export { tierFor, useHistoryChannel }

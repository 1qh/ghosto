/* oxlint-disable unicorn/number-literal-case */
/** biome-ignore-all lint/suspicious/noAssignInExpressions: mulberry32 PRNG step */
/** biome-ignore-all lint/style/noParameterAssign: mulberry32 advances local copy */
/** biome-ignore-all lint/suspicious/noBitwiseOperators: mulberry32 requires xor/shift */
/* eslint-disable no-bitwise, no-param-reassign */
'use client'
import { useEffect, useState } from 'react'
import { get, set } from './idb'

interface DnaParams {
  baseHue: number
  bodyAspectRatio: number
  driftPersonality: number
  eyeSize: number
  eyeSpacing: number
  pulseCadence: number
  voiceFormantOffset: number
}
interface DnaRecord {
  createdAt: number
  params: DnaParams
  seed: number
}
const mulberry32 = (a: number) => () => {
  let t = Math.trunc((a += 0x6d_2b_79_f5))
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return Math.trunc(t ^ (t >>> 14)) / 4_294_967_296
}
const generateSeed = (): number => {
  const buf = new Uint32Array(1)
  globalThis.crypto.getRandomValues(buf)
  return buf[0] ?? Date.now()
}
const paramsFromSeed = (seed: number): DnaParams => {
  const rng = mulberry32(seed)
  return {
    baseHue: 240 + (rng() * 60 - 30),
    bodyAspectRatio: 1 + (rng() * 0.2 - 0.1),
    driftPersonality: rng(),
    eyeSize: 1 + (rng() * 0.3 - 0.15),
    eyeSpacing: 0.22 * (0.9 + rng() * 0.2),
    pulseCadence: 0.9 + rng() * 0.3,
    voiceFormantOffset: rng() * 200 - 100
  }
}
const KEY = 'va.mascot.v1.dna.self'
const useMascotDna = () => {
  const [dna, setDna] = useState<DnaRecord | null>(null)
  useEffect(() => {
    let cancelled = false
    const loadOrCreate = async () => {
      const url = new URL(globalThis.location.href)
      const seedOverride = url.searchParams.get('seed')
      if (seedOverride !== null) {
        const seed = Number.parseInt(seedOverride, 10)
        if (!cancelled) setDna({ createdAt: Date.now(), params: paramsFromSeed(seed), seed })
        return
      }
      const existing = await get<DnaRecord>(KEY)
      if (existing) {
        if (!cancelled) setDna(existing)
        return
      }
      const seed = generateSeed()
      const rec: DnaRecord = { createdAt: Date.now(), params: paramsFromSeed(seed), seed }
      await set(KEY, rec)
      if (!cancelled) setDna(rec)
    }
    /* oxlint-disable-next-line promise/prefer-await-to-then */
    loadOrCreate().catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  return dna
}
export type { DnaParams, DnaRecord }
export { generateSeed, paramsFromSeed, useMascotDna }

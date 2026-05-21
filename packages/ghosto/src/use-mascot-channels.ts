'use client'
import { create } from 'zustand'
import type { ChannelName } from './config'
import { getActiveConfig } from './config'

type Channels = Record<ChannelName, number>
interface MascotState {
  bump: (name: ChannelName, delta: number, cap?: number) => void
  channels: Channels
  decay: (dt: number) => void
  set: (name: ChannelName, value: number) => void
  setSmoothK: (k: number) => void
  smoothed: () => Channels
  snapshot: () => Channels
  tick: (dt: number) => void
}
const ZERO: Channels = {
  affection: 0,
  affinity: 0,
  annoyance: 0,
  attention: 0,
  boredom: 0,
  cheer: 0,
  curiosity: 0,
  dizzy: 0,
  energy: 0.5,
  excitement: 0,
  fatigue: 0,
  heat: 0,
  hunger: 0,
  joy: 0,
  loneliness: 0,
  magnetism: 0,
  worry: 0
}
const smoothedState: Channels = { ...ZERO }
let smoothK = getActiveConfig().smoothing.k
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x))
const useMascotChannels = create<MascotState>((setState, getState) => ({
  bump: (name, delta, cap = 1) => {
    setState(s => ({ channels: { ...s.channels, [name]: clamp01(Math.min(cap, s.channels[name] + delta)) } }))
  },
  channels: { ...ZERO },
  decay: dt => {
    const { decayS } = getActiveConfig().channels
    const next: Channels = { ...getState().channels }
    for (const key of Object.keys(next) as ChannelName[]) {
      const tau = decayS[key]
      if (Number.isFinite(tau) && tau >= 0.01) next[key] *= Math.exp(-dt / tau)
    }
    setState({ channels: next })
  },
  set: (name, value) => {
    setState(s => ({ channels: { ...s.channels, [name]: clamp01(value) } }))
  },
  setSmoothK: k => {
    smoothK = k
  },
  smoothed: () => ({ ...smoothedState }),
  snapshot: () => ({ ...getState().channels }),
  tick: dt => {
    const current = getState().channels
    const alpha = 1 - Math.exp(-smoothK * dt)
    for (const key of Object.keys(current) as ChannelName[])
      smoothedState[key] += (current[key] - smoothedState[key]) * alpha
  }
}))
export type { Channels }
export { useMascotChannels }

/** biome-ignore-all lint/nursery/noUnsafeTypeAssertion: the generic recursive merge erases T to an indexable record at each boundary — every assertion re-narrows a value already proven an object by isObject back to the generic config shape */
'use client'
import { createContext, use } from 'react'

interface AffinityTier {
  interactions: number
  label: string
}
type ChannelName = keyof GhostoConfig['channels']['decayS']
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K]
}
interface GhostoConfig {
  blink: {
    durationS: number
    intervalMaxS: number
    intervalMinS: number
  }
  body: {
    baseScale: number
    breatheHz: number
    homePos: readonly [number, number, number]
    radius: number
  }
  brow: {
    color: string
  }
  camera: {
    far: number
    fovDeg: number
    near: number
    zDefault: number
  }
  channels: {
    affinityTiers: readonly AffinityTier[]
    decayS: {
      affection: number
      affinity: number
      annoyance: number
      attention: number
      boredom: number
      cheer: number
      curiosity: number
      dizzy: number
      energy: number
      excitement: number
      fatigue: number
      heat: number
      hunger: number
      joy: number
      loneliness: number
      magnetism: number
      worry: number
    }
  }
  colors: {
    body: string
    heat: string
    iris: string
    joyGlow: string
    mouth: string
    pupil: string
    sclera: string
  }
  drag: {
    thresholdPx: number
  }
  drift: {
    activityFloor: number
    radius: number
  }
  eyes: {
    followK: number
    followKReduced: number
    frontOffset: number
    halfSpacing: number
    height: number
    planeWidth: number
    verticalOffset: number
  }
  idle: {
    boredomAfterS: number
    leaveLonelyRampPerS: number
    lonelyAfterS: number
  }
  mouth: {
    frontOffset: number
    planeHeight: number
    planeWidth: number
    verticalOffset: number
  }
  name: string
  pointer: {
    distFarPx: number
    distNearPx: number
    speedErratic: number
    speedHigh: number
    speedLow: number
    stalkSpeedHigh: number
    stalkSpeedLow: number
  }
  pupils: {
    baseRadius: number
    trackReach: number
  }
  saccade: {
    amplitude: number
    intervalMaxS: number
    intervalMinS: number
  }
  smoothing: {
    k: number
    kReduced: number
    pointerK: number
  }
  tap: {
    multiTapWindowMs: number
  }
}
const defaultConfig: GhostoConfig = {
  blink: {
    durationS: 0.12,
    intervalMaxS: 7,
    intervalMinS: 3
  },
  body: {
    baseScale: 0.55,
    breatheHz: 0.42,
    homePos: [0, 0.1, 0],
    radius: 1
  },
  brow: {
    color: 'oklch(0.0 0 0)'
  },
  camera: {
    far: 20,
    fovDeg: 28,
    near: 0.1,
    zDefault: 12
  },
  channels: {
    affinityTiers: [
      { interactions: 0, label: 'shy' },
      { interactions: 10, label: 'curious' },
      { interactions: 50, label: 'bold' },
      { interactions: 200, label: 'bestFriend' },
      { interactions: 1000, label: 'lifelong' }
    ],
    decayS: {
      affection: 30,
      affinity: Number.POSITIVE_INFINITY,
      annoyance: 3,
      attention: 4,
      boredom: 600,
      cheer: 0.6,
      curiosity: 0.8,
      dizzy: 0.5,
      energy: 1800,
      excitement: 0.5,
      fatigue: 3600,
      heat: 0.6,
      hunger: 1800,
      joy: 0.6,
      loneliness: 40,
      magnetism: 1.5,
      worry: 4
    }
  },
  colors: {
    body: 'oklch(0.99 0.003 250)',
    heat: 'oklch(0.78 0.20 50)',
    iris: 'oklch(0.0 0 0)',
    joyGlow: 'oklch(0.90 0.18 100)',
    mouth: 'oklch(0.32 0.10 25)',
    pupil: 'oklch(0.0 0 0)',
    sclera: 'oklch(0.99 0.003 90)'
  },
  drag: {
    thresholdPx: 4
  },
  drift: {
    activityFloor: 0.05,
    radius: 0.85
  },
  eyes: {
    followK: 6,
    followKReduced: 3,
    frontOffset: 0.5,
    halfSpacing: 0.18,
    height: 0.34,
    planeWidth: 0.26,
    verticalOffset: 0.16
  },
  idle: {
    boredomAfterS: 30,
    leaveLonelyRampPerS: 0.15,
    lonelyAfterS: 10
  },
  mouth: {
    frontOffset: 1.05,
    planeHeight: 0.22,
    planeWidth: 0.5,
    verticalOffset: -0.32
  },
  name: 'pet',
  pointer: {
    distFarPx: 900,
    distNearPx: 220,
    speedErratic: 1500,
    speedHigh: 800,
    speedLow: 50,
    stalkSpeedHigh: 180,
    stalkSpeedLow: 30
  },
  pupils: {
    baseRadius: 0.28,
    trackReach: 0.32
  },
  saccade: {
    amplitude: 0.04,
    intervalMaxS: 1.2,
    intervalMinS: 0.4
  },
  smoothing: {
    k: 7,
    kReduced: 3,
    pointerK: 12
  },
  tap: {
    multiTapWindowMs: 350
  }
}
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const mergeInto = <T>(base: T, override: DeepPartial<T> | undefined): T => {
  if (override === undefined) return base
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const key of Object.keys(override) as (keyof T)[]) {
    const ov = (override as Record<string, unknown>)[key as string]
    const bv = (base as Record<string, unknown>)[key as string]
    if (ov !== undefined)
      out[key as string] = isObject(ov) && isObject(bv) ? mergeInto(bv, ov as DeepPartial<typeof bv>) : ov
  }
  return out as T
}
const mergeConfig = (base: GhostoConfig, override?: DeepPartial<GhostoConfig>): GhostoConfig => mergeInto(base, override)
const GhostoConfigContext = createContext<GhostoConfig>(defaultConfig)
GhostoConfigContext.displayName = 'GhostoConfigContext'
const useGhostoConfig = (): GhostoConfig => use(GhostoConfigContext)
let activeConfig: GhostoConfig = defaultConfig
const getActiveConfig = (): GhostoConfig => activeConfig
const setActiveConfig = (config: GhostoConfig): void => {
  activeConfig = config
}
export type { AffinityTier, ChannelName, DeepPartial, GhostoConfig }
export { defaultConfig, getActiveConfig, GhostoConfigContext, mergeConfig, setActiveConfig, useGhostoConfig }

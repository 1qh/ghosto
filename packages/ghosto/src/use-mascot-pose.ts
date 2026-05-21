'use client'
import { create } from 'zustand'
import { getActiveConfig } from './config'

interface MascotPose {
  bodyScreenPx: { x: number; y: number }
  homeWorld: { x: number; y: number; z: number }
  setBodyScreenPx: (x: number, y: number) => void
  setHomeWorld: (x: number, y: number, z: number) => void
}
const useMascotPose = create<MascotPose>(setState => ({
  bodyScreenPx: { x: 0, y: 0 },
  homeWorld: {
    x: getActiveConfig().body.homePos[0],
    y: getActiveConfig().body.homePos[1],
    z: getActiveConfig().body.homePos[2]
  },
  setBodyScreenPx: (x, y) => {
    setState(s => (s.bodyScreenPx.x === x && s.bodyScreenPx.y === y ? s : { bodyScreenPx: { x, y } }))
  },
  setHomeWorld: (x, y, z) => {
    setState(s => (s.homeWorld.x === x && s.homeWorld.y === y && s.homeWorld.z === z ? s : { homeWorld: { x, y, z } }))
  }
}))
export { useMascotPose }

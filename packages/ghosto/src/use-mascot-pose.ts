'use client'
import { create } from 'zustand'

interface MascotPose {
  bodyScreenPx: { x: number; y: number }
  homeWorld: { x: number; y: number; z: number }
  setBodyScreenPx: (x: number, y: number) => void
  setHomeWorld: (x: number, y: number, z: number) => void
}
const useMascotPose = create<MascotPose>(setState => ({
  bodyScreenPx: { x: 0, y: 0 },
  homeWorld: { x: 0, y: 0.1, z: 0 },
  setBodyScreenPx: (x, y) => {
    setState(s => (s.bodyScreenPx.x === x && s.bodyScreenPx.y === y ? s : { bodyScreenPx: { x, y } }))
  },
  setHomeWorld: (x, y, z) => {
    setState(s => (s.homeWorld.x === x && s.homeWorld.y === y && s.homeWorld.z === z ? s : { homeWorld: { x, y, z } }))
  }
}))
export { useMascotPose }

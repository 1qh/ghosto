/** biome-ignore-all lint/performance/noNamespaceImport: three.js is consumed as a namespace (THREE.*) by convention */
/* oxlint-disable import/no-namespace */
/* eslint-disable react/no-unknown-property, @eslint-react/dom-no-unknown-property, react-hooks/immutability, @eslint-react/immutability */
'use client'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGhostoConfig } from './config'
import { bodyFrag } from './shader/body.frag'
import { bodyVert } from './shader/body.vert'
import { useMascotChannels } from './use-mascot-channels'
import { useMascotPose } from './use-mascot-pose'

const MAX_IMPULSES = 8
const DRAG_SPRING_K = 18
const RELEASE_SPRING_K = 6
const SQUASH_GAIN = 0.06
const SQUASH_MAX = 0.45
interface BodyProps {
  baseHue?: number
  onCenter?: (worldPos: THREE.Vector3) => void
  pointer3D: THREE.Vector3
}
const MascotBody = ({ baseHue = 0, onCenter, pointer3D }: BodyProps) => {
  const { body, colors } = useGhostoConfig()
  const meshRef = useRef<THREE.Mesh>(null)
  const getSmoothed = useMascotChannels(s => s.smoothed)
  const sphereArgs = useMemo((): [number, number, number] => [body.radius, 64, 48], [body.radius])
  const uniforms = useMemo(
    () => ({
      uBaseColor: { value: new THREE.Color(colors.body) },
      uBreathePhase: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
      uCoreColor: { value: new THREE.Color(colors.heat) },
      uDiscoveryAura: { value: 0 },
      uExcitement: { value: 0 },
      uHeat: { value: 0 },
      uImpulseStrength: { value: new Float32Array(MAX_IMPULSES) },
      uImpulses: { value: Array.from({ length: MAX_IMPULSES }, () => new THREE.Vector3()) },
      uJoy: { value: 0 },
      uPointer3D: { value: new THREE.Vector3() },
      uTime: { value: 0 }
    }),
    [colors.body, colors.heat]
  )
  const tmpVecRef = useRef(new THREE.Vector3())
  const bounceRef = useRef({ end: 0, lastExc: 0 })
  const dragRef = useRef({ active: false })
  const velRef = useRef({ x: 0, y: 0 })
  const lastPosRef = useRef({ x: 0, y: 0 })
  const getHome = useMascotPose(s => s.homeWorld)
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const b = useMascotPose.getState().bodyScreenPx
      const dist = Math.hypot(e.clientX - b.x, e.clientY - b.y)
      if (dist < 75) dragRef.current.active = true
    }
    const onUp = () => {
      dragRef.current.active = false
    }
    globalThis.addEventListener('pointerdown', onDown)
    globalThis.addEventListener('pointerup', onUp)
    globalThis.addEventListener('pointercancel', onUp)
    return () => {
      globalThis.removeEventListener('pointerdown', onDown)
      globalThis.removeEventListener('pointerup', onUp)
      globalThis.removeEventListener('pointercancel', onUp)
    }
  }, [])
  useFrame((state, dt) => {
    const c = getSmoothed()
    const t = state.clock.elapsedTime
    uniforms.uTime.value = t
    uniforms.uExcitement.value = c.excitement
    uniforms.uHeat.value = c.heat
    uniforms.uJoy.value = c.joy
    uniforms.uBreathePhase.value = t * body.breatheHz * Math.PI * 2
    uniforms.uPointer3D.value.copy(pointer3D)
    state.camera.getWorldPosition(uniforms.uCameraPos.value)
    if (baseHue !== 0) {
      const baseCol = new THREE.Color(colors.body)
      baseCol.offsetHSL(baseHue / 360, 0, 0)
      uniforms.uBaseColor.value.copy(baseCol)
    }
    if (!meshRef.current) return
    const mesh = meshRef.current
    const isDrag = dragRef.current.active
    const leanGain = Math.min(1, c.magnetism * 1.2)
    const idleSwayX = (Math.sin(t * 0.7) * 0.6 + Math.sin(t * 0.31) * 0.4) * 0.01
    const idleSwayY = (Math.cos(t * 0.55) * 0.5 + Math.sin(t * 0.23) * 0.3) * 0.006
    const targetX = isDrag ? pointer3D.x : getHome.x + pointer3D.x * 0.32 * leanGain + idleSwayX
    const targetY = isDrag ? pointer3D.y : getHome.y + pointer3D.y * 0.22 * leanGain + idleSwayY
    const k = isDrag ? DRAG_SPRING_K : RELEASE_SPRING_K
    const alpha = 1 - Math.exp(-k * dt)
    const cur = mesh.position
    const prevX = cur.x
    const prevY = cur.y
    cur.x += (targetX - cur.x) * alpha
    cur.y += (targetY - cur.y) * alpha
    cur.z = getHome.z
    const dxv = (cur.x - prevX) / Math.max(dt, 0.001)
    const dyv = (cur.y - prevY) / Math.max(dt, 0.001)
    const velAlpha = 1 - Math.exp(-12 * dt)
    velRef.current.x += (dxv - velRef.current.x) * velAlpha
    velRef.current.y += (dyv - velRef.current.y) * velAlpha
    lastPosRef.current.x = cur.x
    lastPosRef.current.y = cur.y
    const speed = Math.hypot(velRef.current.x, velRef.current.y)
    const squash = Math.min(SQUASH_MAX, speed * SQUASH_GAIN)
    const angle = Math.atan2(velRef.current.y, velRef.current.x)
    mesh.rotation.set(0, 0, angle)
    const breathe = Math.sin(t * body.breatheHz * Math.PI * 2) * 0.006
    const bounce = bounceRef.current
    if (c.excitement - bounce.lastExc > 0.2) bounce.end = t + 0.22
    bounce.lastExc = c.excitement
    let bounceAmp = 0
    if (t < bounce.end) {
      const phase = (bounce.end - t) / 0.22
      bounceAmp = Math.sin((1 - phase) * Math.PI) * 0.12
    }
    const baseScale = body.baseScale + c.joy * 0.04 - c.fatigue * 0.02 + breathe + bounceAmp
    const sxStretch = 1 + squash
    const syStretch = 1 - squash * 0.6
    mesh.scale.set(baseScale * sxStretch, baseScale * syStretch, baseScale * (1 - squash * 0.3))
    mesh.getWorldPosition(tmpVecRef.current)
    onCenter?.(tmpVecRef.current)
  })
  return (
    <mesh ref={meshRef}>
      {/* biome-ignore lint/suspicious/noUnknownAttribute: react-three-fiber three.js geometry props */}
      <sphereGeometry args={sphereArgs} />
      {/* biome-ignore lint/suspicious/noUnknownAttribute: react-three-fiber three.js material props */}
      <shaderMaterial fragmentShader={bodyFrag} uniforms={uniforms} vertexShader={bodyVert} />
    </mesh>
  )
}
export { MascotBody }

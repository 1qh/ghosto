/** biome-ignore-all lint/performance/noNamespaceImport: three convention */
/* oxlint-disable import/no-namespace */
/* eslint-disable react/no-unknown-property, @eslint-react/dom/no-unknown-property */
'use client'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGhostoConfig } from './config'
import { eyeFrag, eyeVert } from './shader/eye.frag'
import { useMascotChannels } from './use-mascot-channels'
import { useReducedMotion } from './use-reduced-motion'

const EYE_RADIUS = 0.1
const EYE_FRONT_Z = 0.55
const SPHERE_ARGS: [number, number, number] = [EYE_RADIUS, 32, 24]
const TRACK_OFFSET_GAIN = 0.07
const PURSUIT_GAIN = 1
const IDLE_AMP_X = 0.6
const IDLE_AMP_Y = 0.4
const SACCADE_AMP = 0.08
const EYE_COLOR = new THREE.Color('#020202')
const LIGHT_DIR = new THREE.Vector3(0.4, 0.85, 0.5).normalize()
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))
const idleWalk = (t: number, s: [number, number, number]): number =>
  0.55 * Math.sin(t * 0.27 + s[0]) + 0.3 * Math.sin(t * 0.61 + s[1]) + 0.18 * Math.sin(t * 1.13 + s[2])
const SingleEye = ({
  bodyCenter,
  pointer3D,
  side
}: {
  bodyCenter: THREE.Vector3
  pointer3D: THREE.Vector3
  side: -1 | 1
}) => {
  const { blink: blinkCfg, eyes } = useGhostoConfig()
  const meshRef = useRef<THREE.Mesh>(null)
  const getSmoothed = useMascotChannels(s => s.smoothed)
  const reducedMotion = useReducedMotion()
  const followK = reducedMotion ? eyes.followKReduced : eyes.followK
  const uniforms = useMemo(
    () => ({
      uBlink: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
      uClosed: { value: 0 },
      uColor: { value: EYE_COLOR },
      uHighlight: { value: 0 },
      uLightDir: { value: LIGHT_DIR },
      uSad: { value: 0 }
    }),
    []
  )
  const trackRef = useRef({ x: 0, y: 0 })
  const blinkRef = useRef({ delay: side === -1 ? 0.04 : 0, end: 0, nextAt: 0, spring: 0, springV: 0 })
  const sideSeedsRef = useRef({
    sa: side * 7.13 + 1.9,
    sa2: side * 9.41 + 0.3,
    sx: [side * 4.13 + 0.7, side * 2.91 + 1.4, side * 5.32 + 0.2] as [number, number, number],
    sy: [side * 3.27 + 2.1, side * 1.85 + 3.6, side * 6.04 + 0.5] as [number, number, number]
  })
  useFrame((state, dt) => {
    const mesh = meshRef.current
    if (!mesh) return
    let probeSearch: string
    try {
      ;({ search: probeSearch } = globalThis.location)
    } catch {
      probeSearch = ''
    }
    if (probeSearch.includes('test=1')) {
      const probe = globalThis as unknown as { __mascotEyes?: THREE.Mesh[] }
      probe.__mascotEyes ??= []
      if (!probe.__mascotEyes.includes(mesh)) probe.__mascotEyes.push(mesh)
    }
    interface EyeUniforms {
      uBlink: { value: number }
      uCameraPos: { value: THREE.Vector3 }
      uClosed: { value: number }
      uHighlight: { value: number }
      uSad: { value: number }
    }
    const matUniforms = (mesh.material as THREE.ShaderMaterial).uniforms as unknown as EyeUniforms
    state.camera.getWorldPosition(matUniforms.uCameraPos.value)
    const anchorX = bodyCenter.x + side * eyes.halfSpacing
    const anchorY = bodyCenter.y + eyes.verticalOffset
    const anchorZ = bodyCenter.z + EYE_FRONT_Z
    const c = getSmoothed()
    const now = state.clock.elapsedTime
    const seeds = sideSeedsRef.current
    const idleX = idleWalk(now, seeds.sx) * IDLE_AMP_X
    const idleY = idleWalk(now, seeds.sy) * IDLE_AMP_Y
    const dx = pointer3D.x - anchorX
    const dy = pointer3D.y - anchorY
    const pointerTargetX = clamp(dx / 2.5, -1, 1) * PURSUIT_GAIN
    const pointerTargetY = clamp(dy / 2.5, -1, 1) * PURSUIT_GAIN
    const attentionMag = clamp(c.attention + c.curiosity * 0.8 + c.magnetism * 0.6, 0, 1)
    const idleWeight = 1 - 0.6 * attentionMag
    const focusWeight = 0.4 + 0.6 * attentionMag
    const targetX = pointerTargetX * focusWeight + idleX * idleWeight
    const targetY = pointerTargetY * focusWeight + idleY * idleWeight
    const alpha = 1 - Math.exp(-followK * dt)
    trackRef.current.x += (targetX - trackRef.current.x) * alpha
    trackRef.current.y += (targetY - trackRef.current.y) * alpha
    const exDiz = 0.6 + c.excitement + c.dizzy
    const saccadeX = Math.sin(now * 11.3 + seeds.sa) * Math.sin(now * 2.7 + seeds.sa2) * SACCADE_AMP * exDiz
    const saccadeY = Math.cos(now * 9.1 + seeds.sa2) * Math.sin(now * 3.1 + seeds.sa) * SACCADE_AMP * 0.7 * exDiz
    const closed = clamp(0.95 * c.joy + 0.7 * c.cheer + 0.15 * c.affection, 0, 1)
    const sad = clamp(c.loneliness * 0.8 + c.worry * 0.4 - c.joy, 0, 1)
    const blink = blinkRef.current
    if (blink.nextAt === 0)
      blink.nextAt = now + blinkCfg.intervalMinS + Math.random() * (blinkCfg.intervalMaxS - blinkCfg.intervalMinS)
    if (now > blink.nextAt && now > blink.end + blink.delay) {
      blink.end = now + blinkCfg.durationS + blink.delay
      blink.nextAt = now + blinkCfg.intervalMinS + Math.random() * (blinkCfg.intervalMaxS - blinkCfg.intervalMinS)
    }
    const blinkActive = now > blink.delay && now < blink.end
    const targetBlink = blinkActive ? Math.sin(((blink.end - now) / blinkCfg.durationS) * Math.PI) : 0
    const ks = 90
    const ds = 14
    const force = ks * (targetBlink - blink.spring) - ds * blink.springV
    blink.springV += force * dt
    blink.spring += blink.springV * dt
    const blinkOut = clamp(blink.spring, 0, 1)
    matUniforms.uClosed.value = closed
    matUniforms.uSad.value = sad
    matUniforms.uBlink.value = blinkOut
    matUniforms.uHighlight.value = clamp(c.joy + c.attention * 0.7 + 0.08 * Math.sin(now * 1.9), 0, 1)
    const tx = (trackRef.current.x + saccadeX) * TRACK_OFFSET_GAIN
    const ty = (trackRef.current.y + saccadeY) * TRACK_OFFSET_GAIN
    mesh.position.set(anchorX + tx, anchorY + ty - sad * 0.04, anchorZ)
  })
  return (
    <mesh ref={meshRef}>
      {/* biome-ignore lint/suspicious/noUnknownAttribute: react-three-fiber three.js geometry props */}
      <sphereGeometry args={SPHERE_ARGS} />
      {/* biome-ignore lint/suspicious/noUnknownAttribute: react-three-fiber three.js material props */}
      <shaderMaterial depthTest={false} fragmentShader={eyeFrag} uniforms={uniforms} vertexShader={eyeVert} />
    </mesh>
  )
}
const MascotEyes = ({ bodyCenter, pointer3D }: { bodyCenter: THREE.Vector3; pointer3D: THREE.Vector3 }) => (
  <>
    <SingleEye bodyCenter={bodyCenter} pointer3D={pointer3D} side={-1} />
    <SingleEye bodyCenter={bodyCenter} pointer3D={pointer3D} side={1} />
  </>
)
export { MascotEyes }

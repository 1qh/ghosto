/** biome-ignore-all lint/performance/noNamespaceImport: three.js is consumed as a namespace (THREE.*) by convention */
/* oxlint-disable import/no-namespace */
/* eslint-disable react/no-unknown-property, @eslint-react/dom-no-unknown-property, react-hooks/refs, react-hooks/immutability, @eslint-react/immutability, @eslint-react/refs */
'use client'
import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useGhostoConfig } from './config'
import { MascotBody } from './mascot-body'
import { MascotEyes } from './mascot-eyes'
import { SvgFallback } from './svg-fallback'
import { useHistoryChannel } from './use-history-channel'
import { useKeyboardChannel } from './use-keyboard-channel'
import { useMascotChannels } from './use-mascot-channels'
import { useMascotDna } from './use-mascot-dna'
import { useMascotPose } from './use-mascot-pose'
import { useNeedsChannel } from './use-needs-channel'
import { usePointerChannel } from './use-pointer-channel'
import { useReducedMotion } from './use-reduced-motion'
import { useWebglContextLoss } from './use-webgl-context-loss'

const DPR_RANGE: [number, number] = [1, 2]
const GL_PROPS = { alpha: true, antialias: true, powerPreference: 'high-performance' as const }
const LIGHT_POS: [number, number, number] = [1, 2, 1]
const POINT_LIGHT_POS: [number, number, number] = [2, 3, 4]
interface SceneProps {
  bodyCenterRef: React.RefObject<THREE.Vector3>
  pointer3dRef: React.RefObject<THREE.Vector3>
  setMascotCenterPx: (x: number, y: number) => void
}
const Scene = ({ bodyCenterRef, pointer3dRef, setMascotCenterPx }: SceneProps) => {
  const config = useGhostoConfig()
  const decay = useMascotChannels(s => s.decay)
  const tick = useMascotChannels(s => s.tick)
  const setBodyScreenPx = useMascotPose(s => s.setBodyScreenPx)
  const { camera, gl, size } = useThree()
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    camera.fov = config.camera.fovDeg
    camera.near = config.camera.near
    camera.far = config.camera.far
    camera.position.set(0, 0, config.camera.zDefault)
    camera.updateProjectionMatrix()
  }, [camera, config.camera.far, config.camera.fovDeg, config.camera.near, config.camera.zDefault])
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.outputColorSpace = THREE.SRGBColorSpace
  }, [gl])
  const raycasterRef = useRef(new THREE.Raycaster())
  const ndcRef = useRef(new THREE.Vector2())
  const pointer3dTargetRef = useRef(new THREE.Vector3())
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      ndcRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      ndcRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycasterRef.current.setFromCamera(ndcRef.current, camera)
      const dir = raycasterRef.current.ray.direction
      const denom = dir.z === 0 ? 0.0001 : dir.z
      const t = -raycasterRef.current.ray.origin.z / denom
      pointer3dTargetRef.current.copy(raycasterRef.current.ray.origin).addScaledVector(dir, t)
    }
    globalThis.addEventListener('pointermove', onMove)
    return () => globalThis.removeEventListener('pointermove', onMove)
  }, [camera, gl])
  const domEl = gl.domElement
  useEffect(() => {
    const update = () => {
      const rect = domEl.getBoundingClientRect()
      setMascotCenterPx(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(domEl)
    globalThis.addEventListener('scroll', update, { passive: true })
    return () => {
      ro.disconnect()
      globalThis.removeEventListener('scroll', update)
    }
  }, [domEl, setMascotCenterPx])
  const projTmpRef = useRef(new THREE.Vector3())
  const onCenter = useCallback(
    (v: THREE.Vector3) => {
      bodyCenterRef.current.copy(v)
      const tmp = projTmpRef.current
      tmp.copy(v).project(camera)
      const px = (tmp.x * 0.5 + 0.5) * size.width
      const py = (-tmp.y * 0.5 + 0.5) * size.height
      setBodyScreenPx(px, py)
    },
    [bodyCenterRef, camera, setBodyScreenPx, size.height, size.width]
  )
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = () => {
      const now = performance.now()
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      decay(dt)
      tick(dt)
      const target = pointer3dTargetRef.current
      const { current } = pointer3dRef
      const alpha = 1 - Math.exp(-config.smoothing.pointerK * dt)
      current.x += (target.x - current.x) * alpha
      current.y += (target.y - current.y) * alpha
      current.z += (target.z - current.z) * alpha
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [config.smoothing.pointerK, decay, tick, pointer3dRef])
  return (
    <>
      {/* biome-ignore lint/suspicious/noUnknownAttribute: react-three-fiber three.js light props */}
      <ambientLight color='#ffffff' intensity={0.85} />
      {/* biome-ignore lint/suspicious/noUnknownAttribute: react-three-fiber three.js light props */}
      <directionalLight color='#ffffff' intensity={1.2} position={LIGHT_POS} />
      {/* biome-ignore lint/suspicious/noUnknownAttribute: react-three-fiber three.js light props */}
      <pointLight color='#ffffff' intensity={0.6} position={POINT_LIGHT_POS} />
      <MascotBody onCenter={onCenter} pointer3D={pointer3dRef.current} />
      <MascotEyes bodyCenter={bodyCenterRef.current} pointer3D={pointer3dRef.current} />
    </>
  )
}
const MascotCanvas = () => {
  const config = useGhostoConfig()
  useMascotDna()
  const pointer3dRef = useRef(new THREE.Vector3())
  const bodyCenterRef = useRef(new THREE.Vector3())
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reducedMotion = useReducedMotion()
  const setSmoothK = useMascotChannels(s => s.setSmoothK)
  const cameraProps = useMemo(
    () => ({
      fov: config.camera.fovDeg,
      near: config.camera.near,
      // biome-ignore lint/nursery/noUnsafeTypeAssertion: a fixed 3-element literal narrowed to the [x,y,z] tuple three.js expects
      position: [0, 0, config.camera.zDefault] as [number, number, number]
    }),
    [config.camera.fovDeg, config.camera.near, config.camera.zDefault]
  )
  useEffect(() => {
    setSmoothK(reducedMotion ? config.smoothing.kReduced : config.smoothing.k)
  }, [config.smoothing.k, config.smoothing.kReduced, reducedMotion, setSmoothK])
  const { setMascotCenter } = usePointerChannel({ enabled: !reducedMotion })
  useKeyboardChannel({ enabled: true })
  useNeedsChannel({ enabled: true })
  useHistoryChannel({ enabled: true })
  const { lost } = useWebglContextLoss({ canvasRef })
  const [glReady, setGlReady] = useState(false)
  useEffect(() => {
    let search: string
    try {
      ;({ search } = globalThis.location)
    } catch {
      return
    }
    if (!search.includes('test=1')) return
    // biome-ignore lint/nursery/noUnsafeTypeAssertion: test-only debug probe attaching a handle to globalThis under ?test=1
    const probe = globalThis as { __mascot?: unknown }
    probe.__mascot = {
      body: bodyCenterRef.current,
      channels: useMascotChannels.getState,
      lost,
      pointer3D: pointer3dRef.current
    }
  }, [lost])
  return (
    <div className='pointer-events-none relative size-full [&_canvas]:pointer-events-none [&>div]:pointer-events-none'>
      <Canvas
        camera={cameraProps}
        dpr={DPR_RANGE}
        gl={GL_PROPS}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement
          gl.domElement.style.pointerEvents = 'none'
          setGlReady(true)
        }}>
        {glReady ? (
          <Scene bodyCenterRef={bodyCenterRef} pointer3dRef={pointer3dRef} setMascotCenterPx={setMascotCenter} />
        ) : null}
      </Canvas>
      {lost ? <SvgFallback /> : null}
    </div>
  )
}
export { MascotCanvas }

'use client'
import type { ReactNode } from 'react'
import { lazy, Suspense, useEffect, useMemo, useRef } from 'react'
import { useMascotPose } from './use-mascot-pose'
const MascotCanvas = lazy(async () => {
  const m = await import('./mascot-canvas')
  return { default: m.MascotCanvas }
})
const MascotBubbleFollower = ({ children, offsetY = -110 }: { children: ReactNode; offsetY?: number }) => {
  const px = useMascotPose(s => s.bodyScreenPx)
  const style = useMemo(
    () => ({ left: 0, top: 0, transform: `translate3d(${px.x}px, ${px.y + offsetY}px, 0) translate(-50%, -100%)` }),
    [px.x, px.y, offsetY]
  )
  return (
    <div className='pointer-events-none fixed z-20 hidden md:block' style={style}>
      <div className='pointer-events-auto'>{children}</div>
    </div>
  )
}
const MascotOverlay = ({ anchorRef }: { anchorRef: React.RefObject<HTMLDivElement | null> }) => {
  const setHomeWorld = useMascotPose(s => s.setHomeWorld)
  const overlayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = overlayRef.current
    if (!root) return
    const apply = () => {
      const all = root.querySelectorAll('*')
      for (const el of all) (el as HTMLElement).style.pointerEvents = 'none'
    }
    apply()
    const mo = new MutationObserver(apply)
    mo.observe(root, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])
  useEffect(() => {
    const update = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const vw = globalThis.innerWidth
      const vh = globalThis.innerHeight
      const fov = (28 * Math.PI) / 180
      const pxToWorld = (2 * 12 * Math.tan(fov / 2)) / vh
      const worldX = (cx - vw / 2) * pxToWorld
      const worldY = -(cy - vh / 2) * pxToWorld
      setHomeWorld(worldX, worldY, 0)
    }
    update()
    const ro = new ResizeObserver(update)
    const el = anchorRef.current
    if (el) ro.observe(el)
    globalThis.addEventListener('scroll', update, { passive: true })
    globalThis.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      globalThis.removeEventListener('scroll', update)
      globalThis.removeEventListener('resize', update)
    }
  }, [anchorRef, setHomeWorld])
  return (
    <div className='pointer-events-none fixed inset-0 z-10' ref={overlayRef}>
      <Suspense fallback={null}>
        <MascotCanvas />
      </Suspense>
    </div>
  )
}
const Mascot = ({ bubble, size = 240 }: { bubble?: ReactNode; size?: number }) => {
  const anchorRef = useRef<HTMLDivElement>(null)
  const style = useMemo(() => ({ height: size, width: size }), [size])
  return (
    <>
      <div ref={anchorRef} style={style} />
      <MascotOverlay anchorRef={anchorRef} />
      {bubble === undefined ? null : <MascotBubbleFollower>{bubble}</MascotBubbleFollower>}
    </>
  )
}
export { Mascot, MascotBubbleFollower }

'use client'
import { useEffect, useState } from 'react'
const useWebglContextLoss = ({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) => {
  const [lost, setLost] = useState(false)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const onLost = (e: Event) => {
      e.preventDefault()
      setLost(true)
    }
    const onRestored = () => setLost(false)
    c.addEventListener('webglcontextlost', onLost)
    c.addEventListener('webglcontextrestored', onRestored)
    return () => {
      c.removeEventListener('webglcontextlost', onLost)
      c.removeEventListener('webglcontextrestored', onRestored)
    }
  }, [canvasRef])
  return { lost }
}
export { useWebglContextLoss }

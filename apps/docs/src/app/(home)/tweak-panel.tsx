'use client'
import type { DeepPartial, GhostoConfig } from 'ghosto'
import { defaultConfig } from 'ghosto'
import { useEffect, useRef } from 'react'
import { Pane } from 'tweakpane'

interface TweakPanelProps {
  onChange: (config: DeepPartial<GhostoConfig>) => void
}
const TweakPanel = ({ onChange }: TweakPanelProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  useEffect(() => {
    const host = ref.current
    if (!host) return
    const state = {
      blinkDurationS: defaultConfig.blink.durationS,
      bodyBaseScale: defaultConfig.body.baseScale,
      bodyBreatheHz: defaultConfig.body.breatheHz,
      bodyColor: defaultConfig.colors.body,
      bodyRadius: defaultConfig.body.radius,
      cameraZ: defaultConfig.camera.zDefault,
      driftRadius: defaultConfig.drift.radius,
      eyeFollowK: defaultConfig.eyes.followK,
      eyeHalfSpacing: defaultConfig.eyes.halfSpacing,
      eyeHeight: defaultConfig.eyes.height,
      eyePlaneWidth: defaultConfig.eyes.planeWidth,
      heatColor: defaultConfig.colors.heat,
      mouthColor: defaultConfig.colors.mouth,
      mouthWidth: defaultConfig.mouth.planeWidth,
      pupilBaseRadius: defaultConfig.pupils.baseRadius,
      pupilTrackReach: defaultConfig.pupils.trackReach,
      saccadeAmplitude: defaultConfig.saccade.amplitude,
      scleraColor: defaultConfig.colors.sclera,
      smoothK: defaultConfig.smoothing.k
    }
    const pane = new Pane({ container: host, title: 'Mascot config' })
    const body = pane.addFolder({ title: 'Body' })
    body.addBinding(state, 'bodyRadius', { label: 'radius', max: 2, min: 0.4, step: 0.01 })
    body.addBinding(state, 'bodyBaseScale', { label: 'scale', max: 1, min: 0.2, step: 0.01 })
    body.addBinding(state, 'bodyBreatheHz', { label: 'breathe Hz', max: 2, min: 0, step: 0.01 })
    body.addBinding(state, 'cameraZ', { label: 'camera z', max: 24, min: 6, step: 0.5 })
    body.addBinding(state, 'driftRadius', { label: 'drift', max: 2, min: 0, step: 0.01 })
    const eyes = pane.addFolder({ title: 'Eyes' })
    eyes.addBinding(state, 'eyeHalfSpacing', { label: 'spacing', max: 0.5, min: 0, step: 0.01 })
    eyes.addBinding(state, 'eyeHeight', { label: 'height', max: 0.8, min: 0.1, step: 0.01 })
    eyes.addBinding(state, 'eyePlaneWidth', { label: 'width', max: 0.6, min: 0.1, step: 0.01 })
    eyes.addBinding(state, 'eyeFollowK', { label: 'follow', max: 12, min: 1, step: 0.5 })
    eyes.addBinding(state, 'pupilBaseRadius', { label: 'pupil', max: 0.5, min: 0.05, step: 0.01 })
    eyes.addBinding(state, 'pupilTrackReach', { label: 'track', max: 0.6, min: 0, step: 0.01 })
    eyes.addBinding(state, 'blinkDurationS', { label: 'blink s', max: 0.4, min: 0.04, step: 0.01 })
    eyes.addBinding(state, 'saccadeAmplitude', { label: 'saccade', max: 0.2, min: 0, step: 0.005 })
    const mouth = pane.addFolder({ title: 'Mouth' })
    mouth.addBinding(state, 'mouthWidth', { label: 'width', max: 1, min: 0.1, step: 0.01 })
    const motion = pane.addFolder({ title: 'Motion' })
    motion.addBinding(state, 'smoothK', { label: 'smooth', max: 16, min: 1, step: 0.5 })
    const colors = pane.addFolder({ title: 'Colors' })
    colors.addBinding(state, 'bodyColor', { label: 'body' })
    colors.addBinding(state, 'scleraColor', { label: 'sclera' })
    colors.addBinding(state, 'mouthColor', { label: 'mouth' })
    colors.addBinding(state, 'heatColor', { label: 'heat' })
    pane.on('change', () => {
      onChangeRef.current({
        blink: { durationS: state.blinkDurationS },
        body: { baseScale: state.bodyBaseScale, breatheHz: state.bodyBreatheHz, radius: state.bodyRadius },
        camera: { zDefault: state.cameraZ },
        colors: {
          body: state.bodyColor,
          heat: state.heatColor,
          mouth: state.mouthColor,
          sclera: state.scleraColor
        },
        drift: { radius: state.driftRadius },
        eyes: {
          followK: state.eyeFollowK,
          halfSpacing: state.eyeHalfSpacing,
          height: state.eyeHeight,
          planeWidth: state.eyePlaneWidth
        },
        mouth: { planeWidth: state.mouthWidth },
        pupils: { baseRadius: state.pupilBaseRadius, trackReach: state.pupilTrackReach },
        saccade: { amplitude: state.saccadeAmplitude },
        smoothing: { k: state.smoothK }
      })
    })
    return () => pane.dispose()
  }, [])
  return <div className='[&_.tp-dfwv]:!w-full' ref={ref} />
}
export default TweakPanel

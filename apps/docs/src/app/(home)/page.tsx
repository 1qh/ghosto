/* oxlint-disable react-perf/jsx-no-jsx-as-prop */
'use client'
import type { DeepPartial, GhostoConfig } from 'ghosto'
import { Mascot } from 'ghosto'
import { Bubble } from 'levitato'
import { SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import TweakPanel from './tweak-panel'

const Page = () => {
  const [config, setConfig] = useState<DeepPartial<GhostoConfig>>({})
  return (
    <div className='relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-4'>
      <Mascot config={config} size={300} />
      <h1 className='text-6xl font-extrabold tracking-tighter'>ghosto</h1>
      <p className='text-2xl text-fd-muted-foreground'>Procedural 3D mascot for React</p>
      <code className='rounded-lg bg-fd-muted px-4 py-2 text-sm'>bun add ghosto</code>
      <Link
        className='rounded-full bg-fd-primary px-8 py-3 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90'
        href='/docs'>
        Get Started
      </Link>
      <Bubble icon={<SlidersHorizontal className='size-4' />}>
        <TweakPanel onChange={setConfig} />
      </Bubble>
    </div>
  )
}
export default Page

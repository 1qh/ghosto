'use client'
import { Mascot } from 'ghosto'
import Link from 'next/link'

const Page = () => (
  <div className='relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-4'>
    <Mascot size={300} />
    <h1 className='text-6xl font-extrabold tracking-tighter'>ghosto</h1>
    <p className='text-2xl text-fd-muted-foreground'>Procedural 3D mascot for React</p>
    <code className='rounded-lg bg-fd-muted px-4 py-2 text-sm'>bun add ghosto</code>
    <Link
      className='rounded-full bg-fd-primary px-8 py-3 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90'
      href='/docs'>
      Get Started
    </Link>
  </div>
)
export default Page

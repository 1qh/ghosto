'use client'
const SvgFallback = () => (
  <div className='flex size-full items-center justify-center'>
    <svg
      className='size-40 animate-pulse text-foreground/80'
      fill='currentColor'
      viewBox='0 0 100 100'
      xmlns='http://www.w3.org/2000/svg'>
      <title>Mascot fallback</title>
      <circle cx='50' cy='50' fill='currentColor' opacity='0.92' r='38' />
      <ellipse cx='42' cy='46' fill='#0a0a14' rx='3' ry='6' />
      <ellipse cx='58' cy='46' fill='#0a0a14' rx='3' ry='6' />
    </svg>
  </div>
)
export { SvgFallback }

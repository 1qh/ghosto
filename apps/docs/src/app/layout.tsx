/** biome-ignore-all lint/nursery/noUndeclaredClasses: next/font injects generated CSS-variable class names the analyzer cannot resolve against the tailwind source */
import type { Metadata } from 'next'
import { cn } from '@a/ui'
import { mono, sans } from './fonts'
import './global.css'
import './extras.css'
import { Providers } from './providers'

const metadata: Metadata = {
  title: 'ghosto'
}
const Layout = ({ children }: LayoutProps<'/'>) => (
  <html className={cn('font-sans tracking-[-0.02em]', sans.variable, mono.variable)} lang='en' suppressHydrationWarning>
    <body className='flex flex-col min-h-screen antialiased'>
      <Providers>{children}</Providers>
    </body>
  </html>
)
export { metadata }
export default Layout

'use client'

import './globals.css'
import { useEffect } from 'react'
import { api } from '@/lib/api'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initial ping to wake up Render backend
    api.ping()

    // Keep Render warm with pings every 8 minutes
    const interval = setInterval(() => {
      api.ping()
    }, 8 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <html lang="en">
      <head>
        <title>ADR-Archeologist | Architecture Intelligence</title>
        <meta name="description" content="Turn codebases into architecture decisions with repository-aware analysis." />
      </head>
      <body>{children}</body>
    </html>
  )
}


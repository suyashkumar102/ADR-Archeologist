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
        <title>ADR Archaeologist</title>
        <meta name="description" content="Recovers the architectural decisions your team never wrote down." />
      </head>
      <body>{children}</body>
    </html>
  )
}

// Made with Bob

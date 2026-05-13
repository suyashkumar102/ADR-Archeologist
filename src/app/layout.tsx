import type { Metadata } from "next"
import React from "react"
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ADR Archaeologist — Reconstruct Architecture Decisions from Code",
  description:
    "Feed IBM Bob your entire codebase and recover every architectural decision your team made but never wrote down.",
  openGraph: {
    title: "ADR Archaeologist",
    description: "Reconstruct Architecture Decision Records from any GitHub repository.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-page text-ink font-sans antialiased min-h-screen">
        {/* Sticky nav */}
        <nav className="sticky top-0 z-50 bg-page/95 backdrop-blur border-b border-border h-[54px] flex items-center justify-between px-10">
          <div className="font-mono text-[13px] font-medium text-green-DEFAULT flex items-center gap-2">
            adr archaeologist
            <span className="text-ink3 font-normal">/</span>
            <span className="text-ink3 font-normal">ibm bob hackathon</span>
          </div>
          <div className="font-mono text-[10px] font-medium px-3 py-1 rounded-full bg-green-light text-green-DEFAULT border border-green-mid tracking-wide">
            Zone 4 — True Blindspot
          </div>
        </nav>

        <main>{children}</main>

        <footer className="border-t border-border py-8 text-center font-mono text-[10px] text-ink3 tracking-widest">
          ADR ARCHAEOLOGIST · IBM BOB HACKATHON · MAY 2026
        </footer>
      </body>
    </html>
  )
}

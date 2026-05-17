import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'green' | 'amber'
}

export default function Card({ children, className = '', variant = 'default' }: CardProps) {
  const borderColors = {
    default: 'border-white/10',
    green: 'border-emerald-300/25',
    amber: 'border-amber-300/25',
  }

  return (
    <div
      className={`glass-panel rounded-xl border p-5 ${borderColors[variant]} ${className}`}
    >
      {children}
    </div>
  )
}


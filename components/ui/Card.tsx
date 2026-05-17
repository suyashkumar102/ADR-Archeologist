import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'green' | 'amber'
}

export default function Card({ children, className = '', variant = 'default' }: CardProps) {
  const borderColors = {
    default: 'border-[var(--color-border)]',
    green: 'border-[var(--color-green-dim)]',
    amber: 'border-[var(--color-amber-dim)]',
  }

  return (
    <div
      className={`bg-[var(--color-surface)] border ${borderColors[variant]} rounded-[10px] p-4 px-5 ${className}`}
    >
      {children}
    </div>
  )
}

// Made with Bob

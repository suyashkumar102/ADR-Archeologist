import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  loading?: boolean
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const baseStyles = 'inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/15'

  const variantStyles = {
    primary: 'border border-cyan-300/50 bg-gradient-to-r from-[#0f62fe] to-[#33b1ff] text-white shadow-lg shadow-blue-950/40 hover:-translate-y-0.5 hover:brightness-110',
    secondary: 'border border-white/15 bg-white/[0.04] text-white hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-300/10',
    ghost: 'border border-transparent bg-transparent text-[var(--color-text2)] hover:text-[var(--color-text)]',
  }

  const disabledStyles = (disabled || loading) ? 'cursor-not-allowed opacity-45 hover:translate-y-0 hover:brightness-100' : 'cursor-pointer'

  const handleClick = () => {
    if (!disabled && !loading) {
      onClick()
    }
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${disabledStyles}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-transparent border-t-current" />
        )}
        {children}
      </span>
    </button>
  )
}


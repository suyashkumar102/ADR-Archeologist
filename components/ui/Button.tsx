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
  const baseStyles = 'rounded-lg px-5 py-[10px] text-sm font-medium transition-all duration-200'

  const variantStyles = {
    primary: 'bg-[var(--color-green)] text-black font-semibold hover:brightness-90',
    secondary: 'bg-transparent border border-[var(--color-green)] text-[var(--color-green)] hover:bg-[var(--color-green)]/10',
    ghost: 'bg-transparent border-none text-[var(--color-text2)] hover:text-[var(--color-text)]',
  }

  const disabledStyles = (disabled || loading) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'

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
      <span className="flex items-center gap-2 justify-center">
        {loading && (
          <span className="inline-block w-3 h-3 border-2 border-transparent border-t-current rounded-full animate-spin" />
        )}
        {children}
      </span>
    </button>
  )
}

// Made with Bob

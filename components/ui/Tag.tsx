interface TagProps {
  label: string
  variant?: 'green' | 'amber' | 'purple' | 'red' | 'default'
}

export default function Tag({ label, variant = 'default' }: TagProps) {
  const styles: Record<string, string> = {
    green: 'bg-[var(--color-green-bg)] text-[var(--color-green)]',
    amber: 'bg-[var(--color-amber-dim)] text-[var(--color-amber)]',
    purple: 'bg-[var(--color-purple-bg)] text-[var(--color-purple)]',
    red: 'bg-[var(--color-red-bg)] text-[var(--color-red)]',
    default: 'bg-[#1A1A1A] text-[var(--color-text2)]',
  }

  return (
    <span
      className={`inline-block px-2 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider ${styles[variant]}`}
    >
      {label}
    </span>
  )
}

// Made with Bob

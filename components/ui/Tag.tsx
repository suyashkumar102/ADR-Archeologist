interface TagProps {
  label: string
  variant?: 'green' | 'amber' | 'purple' | 'red' | 'default'
}

export default function Tag({ label, variant = 'default' }: TagProps) {
  const styles: Record<string, string> = {
    green: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
    amber: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
    purple: 'border-indigo-300/25 bg-indigo-300/10 text-indigo-100',
    red: 'border-red-300/25 bg-red-300/10 text-red-200',
    default: 'border-white/10 bg-white/[0.05] text-[var(--color-text2)]',
  }

  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${styles[variant]}`}
    >
      {label}
    </span>
  )
}

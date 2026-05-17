interface BadgeProps {
  status: 'accepted' | 'deprecated' | 'superseded'
}

export default function Badge({ status }: BadgeProps) {
  const config = {
    accepted: {
      icon: '✅',
      className: 'bg-[var(--color-green-bg)] text-[var(--color-green)]',
    },
    deprecated: {
      icon: '🚫',
      className: 'bg-[var(--color-red-bg)] text-[var(--color-red)]',
    },
    superseded: {
      icon: '↩️',
      className: 'bg-[var(--color-amber-dim)] text-[var(--color-amber)]',
    },
  }

  const { icon, className } = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1 px-[10px] py-[2px] rounded-[20px] text-[11px] font-medium ${className}`}
    >
      <span>{icon}</span>
      <span className="capitalize">{status}</span>
    </span>
  )
}

// Made with Bob

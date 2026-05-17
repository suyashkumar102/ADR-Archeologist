interface BadgeProps {
  status: 'accepted' | 'deprecated' | 'superseded'
}

export default function Badge({ status }: BadgeProps) {
  const config = {
    accepted: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
    deprecated: 'border-red-300/25 bg-red-300/10 text-red-200',
    superseded: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${config[status]}`}
    >
      {status}
    </span>
  )
}

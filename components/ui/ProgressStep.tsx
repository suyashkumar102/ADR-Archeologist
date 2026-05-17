interface ProgressStepProps {
  stage: 1 | 2 | 3 | 4
  name: string
  status: 'waiting' | 'running' | 'complete' | 'error'
  durationMs?: number
  count?: number
}

export default function ProgressStep({ stage, name, status, durationMs, count }: ProgressStepProps) {
  const renderIcon = () => {
    switch (status) {
      case 'waiting':
        return <div className="h-2 w-2 rounded-full bg-slate-600" />
      case 'running':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-cyan-200" />
      case 'complete':
        return <span className="text-sm font-bold text-emerald-300">OK</span>
      case 'error':
        return <span className="text-sm font-bold text-red-300">!</span>
    }
  }

  const getTextColor = () => {
    switch (status) {
      case 'waiting':
        return 'text-[var(--color-text3)]'
      case 'running':
        return 'text-white'
      case 'complete':
        return 'text-emerald-200'
      case 'error':
        return 'text-red-200'
    }
  }

  const renderDetails = () => {
    if (status === 'complete' && (count !== undefined || durationMs !== undefined)) {
      const parts = []
      if (count !== undefined) parts.push(`${count} found`)
      if (durationMs !== undefined) parts.push(`${durationMs}ms`)
      return <span className="text-sm text-[var(--color-text3)]">({parts.join(' / ')})</span>
    }
    if (status === 'running') {
      return <span className="text-[var(--color-text3)]">...</span>
    }
    return null
  }

  return (
    <div className="flex items-center gap-3 border-b border-white/5 py-3 last:border-b-0">
      <span className="font-mono text-xs text-[var(--color-text3)]">0{stage}</span>
      <span className="flex h-5 w-5 items-center justify-center">{renderIcon()}</span>
      <span className={`text-sm ${getTextColor()}`}>{name}</span>
      {renderDetails()}
    </div>
  )
}

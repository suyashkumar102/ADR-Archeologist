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
        return <div className="w-[6px] h-[6px] rounded-full bg-[#505050]" />
      case 'running':
        return (
          <div className="w-4 h-4 border-2 border-transparent border-t-[var(--color-green)] rounded-full animate-spin" />
        )
      case 'complete':
        return <span className="text-[var(--color-green)] text-sm font-bold">✓</span>
      case 'error':
        return <span className="text-[var(--color-red)] text-sm font-bold">×</span>
    }
  }

  const getTextColor = () => {
    switch (status) {
      case 'waiting':
        return 'text-[var(--color-text3)]'
      case 'running':
        return 'text-white'
      case 'complete':
        return 'text-[var(--color-green)]'
      case 'error':
        return 'text-[var(--color-red)]'
    }
  }

  const renderDetails = () => {
    if (status === 'complete' && (count !== undefined || durationMs !== undefined)) {
      const parts = []
      if (count !== undefined) parts.push(`${count} found`)
      if (durationMs !== undefined) parts.push(`${durationMs}ms`)
      return <span className="text-[var(--color-text3)] text-sm">({parts.join(' · ')})</span>
    }
    if (status === 'running') {
      return <span className="text-[var(--color-text3)]">...</span>
    }
    return null
  }

  return (
    <div className="flex items-center gap-3 py-[10px]">
      {renderIcon()}
      <span className={`text-sm ${getTextColor()}`}>
        {name}
      </span>
      {renderDetails()}
    </div>
  )
}

// Made with Bob

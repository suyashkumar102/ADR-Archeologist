// Logo for ADR Archaeologist.
// Concept: four horizontal "strata" of varying length, stacked. The bars get
// shorter and lighter from top to bottom, like sedimentary layers narrowing
// as you dig. Reads as both archaeological strata and the 4-stage pipeline.

interface StrataMarkProps {
  size?: number
  animate?: boolean
}

function StrataMark({ size = 32, animate = false }: StrataMarkProps) {
  const layers = [
    { w: 100, h: 5, op: 1.0 },
    { w: 80,  h: 4, op: 0.8 },
    { w: 64,  h: 3, op: 0.55 },
    { w: 44,  h: 2, op: 0.35 },
  ]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {layers.map((l, i) => {
        const y = 20 + i * 16
        return (
          <rect
            key={i}
            x={0}
            y={y}
            width={l.w}
            height={l.h}
            fill="currentColor"
            opacity={l.op}
            style={animate ? {
              transformOrigin: 'left center',
              animation: `strataReveal 1.2s ${i * 0.18}s cubic-bezier(.2,.7,.2,1) both`,
            } : undefined}
          />
        )
      })}
      <style>{`
        @keyframes strataReveal {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </svg>
  )
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  className?: string
}

export default function Logo({ size = 'md', animate = false, className }: LogoProps) {
  const dims = size === 'lg' ? { mark: 44, eyebrow: 18, name: 32 }
             : size === 'sm' ? { mark: 28, eyebrow: 14, name: 20 }
             : { mark: 36, eyebrow: 16, name: 26 }

  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: 'white' }}>
      <div className="text-cyan-200">
        <StrataMark size={dims.mark} animate={animate} />
      </div>
      <div style={{ lineHeight: 1 }}>
        <span style={{ fontSize: dims.name, letterSpacing: '-0.01em', fontWeight: 700, color: 'white' }}>
          ADR Archaeologist
        </span>
      </div>
    </div>
  )
}

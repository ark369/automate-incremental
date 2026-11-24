import type { ActId } from '../content/types'

interface IconProps {
  size?: number
  className?: string
}

export function TaskIcon({
  taskId,
  size = 15,
  className,
}: { taskId: string } & IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.65,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true as const,
  }

  switch (taskId) {
    case 'inbox':
      return (
        <svg {...common}>
          <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
          <path d="M3.2 5.5L10 10.7l6.8-5.2" />
        </svg>
      )
    case 'tps':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <path d="M3 7.5h14M8.5 7.5V17M3 12h14" />
        </svg>
      )
    case 'standup':
      return (
        <svg {...common}>
          <path d="M4.5 10.5v-1a5.5 5.5 0 0 1 11 0v1" />
          <rect x="3" y="10" width="3" height="5" rx="1.2" />
          <rect x="14" y="10" width="3" height="5" rx="1.2" />
          <path d="M15.5 15v.5a2 2 0 0 1-2 2H11" />
        </svg>
      )
    case 'decks':
      return (
        <svg {...common}>
          <rect x="2.5" y="3.5" width="15" height="10.5" rx="1.8" />
          <path d="M6.5 11V9M10 11V7M13.5 11V8M10 14v3M7 17h6" />
        </svg>
      )
    case 'morning_routine':
      return (
        <svg {...common}>
          <path d="M4 8.5h9.5v4.2a4.3 4.3 0 0 1-4.3 4.3H8.3A4.3 4.3 0 0 1 4 12.7V8.5Z" />
          <path d="M13.5 9.5h1.6a2.1 2.1 0 0 1 0 4.2h-1.6" />
          <path d="M6.8 5.8c0-1 .8-1.4.8-2.3M10.2 5.8c0-1 .8-1.4.8-2.3" />
        </svg>
      )
    case 'cook_dinner':
      return (
        <svg {...common}>
          <path d="M3.5 10.5h13a6.5 6.5 0 0 1-13 0Z" />
          <path d="M6.5 17h7M7 7.5c0-1 .9-1.5.9-2.5M10.5 7.5c0-1 .9-1.5.9-2.5M14 7.5c0-1 .9-1.5.9-2.5" />
        </svg>
      )
    case 'hobbies':
      return (
        <svg {...common}>
          <path d="M8 15V5.5l8-1.8V13" />
          <circle cx="5.8" cy="15.2" r="2.2" />
          <circle cx="13.8" cy="13.4" r="2.2" />
        </svg>
      )
    case 'call_mom':
      return (
        <svg {...common}>
          <path d="M5.4 3.5h2.5l1.2 3.1-1.6 1.3a9.2 9.2 0 0 0 4.6 4.6l1.3-1.6 3.1 1.2v2.5a1.6 1.6 0 0 1-1.7 1.6C8.8 16.2 3.8 11.2 3.8 5.2A1.6 1.6 0 0 1 5.4 3.5Z" />
          <path d="M13.4 5.2c.6-.7 1.7-.7 2.2 0 .5.6.4 1.5-.2 2.1L13.4 9l-2-1.7c-.6-.6-.7-1.5-.2-2.1.5-.7 1.6-.7 2.2 0Z" />
        </svg>
      )
    case 'sleep_rest':
      return (
        <svg {...common}>
          <path d="M15.8 12.2A6.2 6.2 0 0 1 7.8 4.2a6.4 6.4 0 1 0 8 8Z" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="6" />
        </svg>
      )
  }
}

export function CheckIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.2 8.4l3.1 3.1 6.5-6.8" />
    </svg>
  )
}

export function SoundIcon({
  muted,
  size = 14,
}: { muted: boolean } & IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 8h3.2l4.3-3.5v11L6.7 12H3.5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      {muted ? (
        <path d="M14 7.5l4 5M18 7.5l-4 5" />
      ) : (
        <>
          <path d="M14 7.4a4 4 0 0 1 0 5.2" />
          <path d="M16.4 5.2a7 7 0 0 1 0 9.6" />
        </>
      )}
    </svg>
  )
}

export function BoltIcon({ size = 13, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.2 1.8L3.8 9h4l-1 5.2L12.2 7h-4l1-5.2Z" />
    </svg>
  )
}

/**
 * Evolving geometric Digital Twin / Cadence emblem.
 * Progresses from fragmented dashed arcs (0%) -> near-closed ring (99.9%) -> unbroken serene halo (100%).
 */
export function TwinEmblem({
  fidelity,
  act,
  size = 28,
  large = false,
}: {
  fidelity: number
  act: ActId
  size?: number
  large?: boolean
}) {
  const clamped = Math.max(0, Math.min(100, fidelity))
  const r = 18
  const circumference = 2 * Math.PI * r
  // Leave a subtle visible hair-gap at 99.9% until 100.0% handover closes the loop
  const visualFraction =
    clamped >= 100 ? 1 : clamped >= 99 ? 0.965 : Math.max(0.06, clamped / 100)
  const dashOffset = circumference * (1 - visualFraction)
  const isComplete = clamped >= 100

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      className={`twin-emblem ${large ? 'large' : ''} ${
        isComplete ? 'complete' : ''
      } act-${act}`}
      aria-hidden="true"
    >
      {/* Subtle ambient halo in late acts */}
      {act >= 3 && (
        <circle
          cx="22"
          cy="22"
          r="20.5"
          className="twin-emblem-halo"
          strokeWidth="1"
        />
      )}

      {/* Background calibration track */}
      <circle
        cx="22"
        cy="22"
        r={r}
        className="twin-emblem-track"
        strokeWidth={large ? 1.6 : 2.3}
        strokeDasharray={act <= 2 ? '3 3' : undefined}
      />

      {/* Active Fidelity arc */}
      <circle
        cx="22"
        cy="22"
        r={r}
        className="twin-emblem-progress"
        strokeWidth={large ? 2.1 : 2.8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 22 22)"
      />

      {/* Inner core geometry evolving with act */}
      <circle
        cx="22"
        cy="22"
        r={isComplete ? 7.5 : 4.5 + (clamped / 100) * 3}
        className="twin-emblem-core"
      />
      {!isComplete && (
        <circle
          cx="22"
          cy="22"
          r="2.1"
          className="twin-emblem-dot"
        />
      )}
    </svg>
  )
}

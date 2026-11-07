import Chip from './ui/Chip'

export const GOAL_TARGETS = [5, 10, 15, 20, 25, 30, 40, 50]

export default function GoalPicker({ target, onChange, busy = false, className = '' }) {
  return (
    <div role="group" aria-label="Daily goal target" className={className}>
      {GOAL_TARGETS.map((value) => (
        <Chip
          key={value}
          pressed={target === value}
          disabled={busy}
          aria-label={`Set daily goal to ${value} reviews`}
          onClick={() => onChange(value)}
          className="justify-center rounded-md px-2 font-mono tabular-nums"
        >
          {value}
        </Chip>
      ))}
    </div>
  )
}

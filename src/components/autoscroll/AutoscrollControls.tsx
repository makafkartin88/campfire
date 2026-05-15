import { Play, Pause } from 'lucide-react'
import { useAutoscroll } from '../../hooks/useAutoscroll'

interface Props {
  autoscroll: ReturnType<typeof useAutoscroll>
}

export function AutoscrollControls({ autoscroll }: Props) {
  const { active, setActive, speed, setSpeed } = autoscroll

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setActive(!active)}
        className={`p-1.5 rounded transition-colors ${
          active
            ? 'bg-fire-600 text-white hover:bg-fire-700'
            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
        }`}
        title={active ? 'Zastavit scroll' : 'Spustit autoscroll'}
      >
        {active ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <input
        type="range"
        min="0.2"
        max="3"
        step="0.1"
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="w-20 accent-orange-500"
        title={`Rychlost: ${speed.toFixed(1)}×`}
      />
      <span className="text-xs text-stone-500 w-7">{speed.toFixed(1)}×</span>
    </div>
  )
}

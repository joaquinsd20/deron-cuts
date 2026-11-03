import { useState } from 'react'

export default function BeforeAfter({ before, after, beforeLabel = 'Antes', afterLabel = 'Después' }) {
  const [position, setPosition] = useState(58)

  return (
    <div className="ba">
      <img className="ba__img" src={after} alt={afterLabel} draggable={false} loading="lazy" />
      <div className="ba__before" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img className="ba__img" src={before} alt={beforeLabel} draggable={false} loading="lazy" />
      </div>

      <span className="ba__tag ba__tag--before">{beforeLabel}</span>
      <span className="ba__tag ba__tag--after">{afterLabel}</span>

      <div className="ba__handle" style={{ left: `${position}%` }} aria-hidden="true">
        <span className="ba__grip">↔</span>
      </div>

      <input
        className="ba__range"
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label="Desliza para comparar antes y después"
      />
    </div>
  )
}

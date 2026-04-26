import { useState } from 'react'
import Design1 from './designs/Design1'
import Design2 from './designs/Design2'
import Design3 from './designs/Design3'
import Design4 from './designs/Design4'
import Design5 from './designs/Design5'

const designs = [
  { id: 1, label: 'Дизайн 1', component: Design1 },
  { id: 2, label: 'Дизайн 2', component: Design2 },
  { id: 3, label: 'Дизайн 3', component: Design3 },
  { id: 4, label: 'Дизайн 4', component: Design4 },
  { id: 5, label: 'Дизайн 5', component: Design5 },
]

export default function App() {
  const [activeDesign, setActiveDesign] = useState(1)
  const ActiveComponent = designs.find((d) => d.id === activeDesign)!.component

  return (
    <div className="h-full flex flex-col bg-[#0a0812]">
      {/* Design switcher tabs */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#110d1d] border-b border-purple-900/30 shrink-0">
        <span className="text-purple-300/60 text-xs font-medium mr-2">Выберите дизайн:</span>
        {designs.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDesign(d.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeDesign === d.id
                ? 'bg-purple-500/30 text-purple-200 ring-1 ring-purple-500/40'
                : 'text-purple-400/50 hover:bg-purple-500/10 hover:text-purple-300'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Active design */}
      <div className="flex-1 min-h-0">
        <ActiveComponent />
      </div>
    </div>
  )
}

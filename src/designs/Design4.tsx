import {
  ArrowLeft,
  ChevronDown,
  Hash,
  Headphones,
  Mic,
  Plus,
  Settings,
  Smile,
  Volume2,
  SlidersHorizontal,
} from 'lucide-react'

const textChannels = [
  { name: 'общий', active: true },
  { name: 'правила', active: false },
  { name: 'новости', active: false },
  { name: 'идеи', active: false },
]

const voiceChannels = [
  { name: 'Общий', active: false },
  { name: 'Музыка', active: false },
  { name: 'Игры', active: false },
]

const messages = [
  { author: 'Doric', time: 'Сегодня, 9:41', text: 'Добро пожаловать на сервер Doricord! 🎉', color: 'from-violet-500 to-purple-600' },
  { author: 'Lumi', time: 'Сегодня, 9:41', text: 'Спасибо! Рад быть здесь', color: 'from-cyan-400 to-blue-500' },
  { author: 'Nova', time: 'Сегодня, 9:41', text: 'Привет всем!', color: 'from-pink-400 to-rose-500' },
  { author: 'Zero', time: 'Сегодня, 9:41', text: '', color: 'from-emerald-400 to-teal-500' },
  { author: 'Doric', time: 'Сегодня, 9:41', text: 'Не забывайте читать правила\nи хорошо проводить время!', color: 'from-violet-500 to-purple-600' },
]

const onlineMembers = [
  { name: 'Doric', status: 'Играет в Doricord 🔥', color: 'from-violet-500 to-purple-600', online: true },
  { name: 'Lumi', status: 'В сети', color: 'from-cyan-400 to-blue-500', online: true },
  { name: 'Nova', status: 'В сети', color: 'from-pink-400 to-rose-500', online: true },
  { name: 'Zero', status: 'Играет в Fortnite', color: 'from-emerald-400 to-teal-500', online: true },
  { name: 'Mika', status: 'Отсутствует', color: 'from-amber-400 to-orange-500', online: false },
]

function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold shrink-0 shadow-lg`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.charAt(0)}
    </div>
  )
}

export default function Design4() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Warm purple/pink gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#c9b8f0] via-[#b8a8e8] to-[#9888d8]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(180,140,255,0.5),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(140,120,220,0.4),transparent_50%)]" />
      {/* Soft orbs */}
      <div className="absolute top-[30%] left-[20%] w-72 h-72 bg-violet-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[15%] right-[15%] w-56 h-56 bg-purple-300/15 rounded-full blur-3xl" />
      <div className="absolute top-[10%] right-[40%] w-40 h-40 bg-pink-300/10 rounded-full blur-3xl" />

      <div className="relative flex h-full gap-[3px] p-1">
        {/* Server Rail */}
        <div className="w-[72px] glass-white glass-shimmer relative flex flex-col items-center py-3 gap-2 rounded-2xl">
          <div className="flex items-center gap-1 mb-1">
            <ArrowLeft size={14} className="text-purple-800/50" />
            <span className="text-[10px] text-purple-800/60 font-semibold">Doricord</span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30 liquid-pulse">
            D
          </div>
          <div className="w-8 h-0.5 bg-white/30 my-1 rounded-full" />

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 shadow-lg shadow-rose-400/15" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-400/15" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg shadow-blue-400/15" />

          <div className="flex-1" />
          <div className="w-12 h-12 rounded-2xl glass-white-light flex items-center justify-center text-purple-500/50 hover:text-purple-700 cursor-pointer transition">
            <Plus size={22} />
          </div>
        </div>

        {/* Channel Sidebar */}
        <div className="w-[240px] glass-white glass-refract relative flex flex-col rounded-2xl">
          <div className="h-12 px-4 flex items-center justify-between border-b border-white/30">
            <div className="flex items-center gap-1.5">
              <ArrowLeft size={16} className="text-purple-800/50" />
              <span className="text-purple-900/90 font-semibold text-sm">Doricord</span>
            </div>
            <SlidersHorizontal size={16} className="text-purple-700/30" />
          </div>

          <div className="flex-1 overflow-y-auto scroll-thin px-2 py-3">
            <div className="text-[11px] uppercase text-purple-800/30 font-semibold tracking-wider px-2 mb-2">
              Текстовые каналы
            </div>
            {textChannels.map((ch) => (
              <div
                key={ch.name}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl mb-1 cursor-pointer transition-all ${
                  ch.active
                    ? 'glass-white-light text-purple-900/90 shadow-sm'
                    : 'text-purple-700/45 hover:bg-white/30 hover:text-purple-800'
                }`}
              >
                <Hash size={16} className="shrink-0 opacity-50" />
                <span className="text-sm font-medium">{ch.name}</span>
                {ch.active && <ChevronDown size={14} className="ml-auto opacity-30" />}
              </div>
            ))}

            <div className="text-[11px] uppercase text-purple-800/30 font-semibold tracking-wider px-2 mt-4 mb-2">
              Голосовые каналы
            </div>
            {voiceChannels.map((ch) => (
              <div
                key={ch.name}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl mb-1 cursor-pointer text-purple-700/45 hover:bg-white/30 hover:text-purple-800 transition"
              >
                <Volume2 size={16} className="shrink-0 opacity-50" />
                <span className="text-sm font-medium">{ch.name}</span>
              </div>
            ))}
          </div>

          <div className="h-[56px] glass-white-light rounded-b-2xl px-3 flex items-center gap-2">
            <Avatar name="Doric" color="from-violet-500 to-purple-600" size={34} />
            <div className="flex-1 min-w-0">
              <div className="text-purple-900/90 text-xs font-semibold truncate">Doric</div>
              <div className="text-purple-600/30 text-[10px]">#0001</div>
            </div>
            <button className="text-purple-600/30 hover:text-purple-800 p-1 transition"><Mic size={16} /></button>
            <button className="text-purple-600/30 hover:text-purple-800 p-1 transition"><Headphones size={16} /></button>
            <button className="text-purple-600/30 hover:text-purple-800 p-1 transition"><Settings size={16} /></button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 glass-white glass-shine relative flex flex-col rounded-2xl">
          <div className="h-12 px-4 flex items-center gap-2 border-b border-white/30">
            <Hash size={20} className="text-purple-700/30" />
            <span className="text-purple-900/90 font-semibold">общий</span>
          </div>

          <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar name={msg.author} color={msg.color} size={42} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-purple-900/90 font-semibold text-sm">{msg.author}</span>
                    <span className="text-purple-600/25 text-xs">{msg.time}</span>
                  </div>
                  {msg.text && (
                    <p className="text-purple-800/50 text-sm mt-0.5 whitespace-pre-line">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-4">
            <div className="glass-white-light flex items-center gap-2 rounded-2xl px-4 py-3 shadow-sm">
              <Plus size={20} className="text-purple-500/30 shrink-0 cursor-pointer hover:text-purple-600 transition" />
              <span className="flex-1 text-purple-600/25 text-sm">Написать в #общий</span>
              <Smile size={20} className="text-purple-500/30 shrink-0 cursor-pointer hover:text-purple-600 transition" />
              <Mic size={20} className="text-purple-500/30 shrink-0 cursor-pointer hover:text-purple-600 transition" />
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="w-[200px] glass-white glass-refract relative flex flex-col rounded-2xl">
          <div className="px-3 py-3">
            <div className="text-[11px] uppercase text-purple-800/30 font-semibold tracking-wider mb-3">
              В сети — 5
            </div>
            <div className="space-y-3">
              {onlineMembers.map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar name={m.name} color={m.color} size={34} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#c0b0e0]/80 ${
                        m.online ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-purple-900/80 text-xs font-medium truncate">{m.name}</div>
                    <div className="text-purple-600/30 text-[10px] truncate">{m.status}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] uppercase text-purple-800/30 font-semibold tracking-wider mt-5">
              Не в сети — 12
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-3 left-3 glass-white text-purple-700 text-xs px-2.5 py-1 rounded-full z-50">
        4
      </div>
    </div>
  )
}

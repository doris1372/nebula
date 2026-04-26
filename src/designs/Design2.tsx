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
      className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.charAt(0)}
    </div>
  )
}

export default function Design2() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Light gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e8e0f8] via-[#d8d0f0] to-[#c8c0e8]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(180,160,255,0.3),transparent_60%)]" />

      <div className="relative flex h-full">
        {/* Server Rail */}
        <div className="w-[72px] bg-white/40 backdrop-blur-xl flex flex-col items-center py-3 gap-2 border-r border-white/60">
          {/* Doricord header */}
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] text-purple-600/60 font-medium">Doricord</span>
            <ChevronDown size={10} className="text-purple-600/40" />
          </div>

          {/* Doricord server icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
            D
          </div>
          <div className="w-8 h-0.5 bg-purple-300/40 my-1 rounded-full" />

          {/* Other servers */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 shadow-lg" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg" />

          <div className="flex-1" />

          <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center text-purple-400 hover:bg-white/70 cursor-pointer transition border border-purple-200/30">
            <Plus size={22} />
          </div>
        </div>

        {/* Channel Sidebar */}
        <div className="w-[220px] bg-white/30 backdrop-blur-xl border-r border-white/50 flex flex-col">
          {/* Server header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-white/40">
            <div className="flex items-center gap-2">
              <ArrowLeft size={18} className="text-purple-700/70" />
              <span className="text-purple-900 font-semibold text-sm">Doricord</span>
              <ChevronDown size={14} className="text-purple-700/40" />
            </div>
            <SlidersHorizontal size={16} className="text-purple-700/40" />
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto scroll-thin px-2 py-3">
            <div className="text-[11px] uppercase text-purple-700/40 font-semibold tracking-wider px-2 mb-2">
              Текстовые каналы
            </div>
            {textChannels.map((ch) => (
              <div
                key={ch.name}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 cursor-pointer transition ${
                  ch.active
                    ? 'bg-white/60 text-purple-900 shadow-sm'
                    : 'text-purple-700/60 hover:bg-white/40 hover:text-purple-800'
                }`}
              >
                <Hash size={16} className="shrink-0 opacity-60" />
                <span className="text-sm">{ch.name}</span>
              </div>
            ))}

            <div className="text-[11px] uppercase text-purple-700/40 font-semibold tracking-wider px-2 mt-4 mb-2">
              Голосовые каналы
            </div>
            {voiceChannels.map((ch) => (
              <div
                key={ch.name}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 cursor-pointer text-purple-700/60 hover:bg-white/40 hover:text-purple-800 transition"
              >
                <Volume2 size={16} className="shrink-0 opacity-60" />
                <span className="text-sm">{ch.name}</span>
              </div>
            ))}
          </div>

          {/* User Bar */}
          <div className="h-[52px] bg-white/40 backdrop-blur-xl px-2 flex items-center gap-2 border-t border-white/40">
            <Avatar name="Doric" color="from-violet-500 to-purple-600" size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-purple-900 text-xs font-semibold truncate">Doric</div>
              <div className="text-purple-600/40 text-[10px]">#0001</div>
            </div>
            <button className="text-purple-600/40 hover:text-purple-800 p-1"><Mic size={16} /></button>
            <button className="text-purple-600/40 hover:text-purple-800 p-1"><Headphones size={16} /></button>
            <button className="text-purple-600/40 hover:text-purple-800 p-1"><Settings size={16} /></button>
          </div>
        </div>

        {/* Main Chat */}
        <div className="flex-1 flex flex-col bg-white/20 backdrop-blur-xl">
          {/* Chat Header */}
          <div className="h-12 px-4 flex items-center gap-2 border-b border-white/30">
            <ArrowLeft size={18} className="text-purple-700/60" />
            <span className="text-purple-900 font-semibold"># общий</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar name={msg.author} color={msg.color} size={40} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-purple-900 font-semibold text-sm">{msg.author}</span>
                    <span className="text-purple-600/30 text-xs">{msg.time}</span>
                  </div>
                  {msg.text && (
                    <p className="text-purple-800/70 text-sm mt-0.5 whitespace-pre-line">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-xl rounded-xl px-3 py-2.5 border border-white/60 shadow-sm">
              <Plus size={20} className="text-purple-500/40 shrink-0 cursor-pointer" />
              <span className="flex-1 text-purple-600/30 text-sm">Написать в #общий</span>
              <Smile size={20} className="text-purple-500/40 shrink-0 cursor-pointer" />
              <Mic size={20} className="text-purple-500/40 shrink-0 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="w-[200px] bg-white/20 backdrop-blur-xl border-l border-white/40 flex flex-col">
          <div className="px-3 py-3">
            <div className="text-[11px] uppercase text-purple-700/40 font-semibold tracking-wider mb-3">
              В сети — 5
            </div>
            <div className="space-y-3">
              {onlineMembers.map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar name={m.name} color={m.color} size={32} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#e0d8f0] ${
                        m.online ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-purple-900 text-xs font-medium truncate">{m.name}</div>
                    <div className="text-purple-600/40 text-[10px] truncate">{m.status}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] uppercase text-purple-700/40 font-semibold tracking-wider mt-5">
              Не в сети — 12
            </div>
          </div>
        </div>
      </div>

      {/* Design Label */}
      <div className="absolute top-2 left-2 bg-black/30 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-50">
        2
      </div>
    </div>
  )
}

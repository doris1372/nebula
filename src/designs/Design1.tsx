import {
  ChevronDown,
  Hash,
  Headphones,
  Mic,
  Plus,
  Settings,
  Smile,
  Volume2,
  Users,
  Wifi,
  Signal,
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

export default function Design1() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Cosmic gradient background with orbs */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a3e] via-[#2d1b69] to-[#0f1b4a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(120,60,220,0.4),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(60,100,220,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_80%,rgba(200,100,255,0.15),transparent_40%)]" />
      {/* Floating light orbs */}
      <div className="absolute top-[20%] left-[15%] w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[10%] right-[20%] w-48 h-48 bg-blue-500/15 rounded-full blur-3xl" />
      <div className="absolute top-[60%] left-[50%] w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />

      <div className="relative flex h-full gap-[2px]">
        {/* Server Rail */}
        <div className="w-[72px] glass-dark glass-shimmer relative flex flex-col items-center py-3 gap-2 rounded-r-2xl">
          <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Серверы</div>

          {/* Doricord server icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/40 ring-2 ring-white/20 liquid-pulse">
            D
          </div>
          <div className="w-8 h-0.5 bg-white/15 my-1 rounded-full" />

          {/* Other server icons */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20 glass-icon" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20 glass-icon" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg shadow-blue-500/20 glass-icon" />

          <div className="flex-1" />

          <div className="w-12 h-12 rounded-2xl glass-icon flex items-center justify-center text-white/60 hover:text-white/90 cursor-pointer transition">
            <Plus size={22} />
          </div>
        </div>

        {/* Channel Sidebar */}
        <div className="w-[220px] glass glass-refract relative flex flex-col rounded-2xl my-1">
          {/* Server header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-semibold text-sm">Doricord</span>
              <ChevronDown size={14} className="text-white/60" />
            </div>
            <div className="flex items-center gap-2">
              <Signal size={14} className="text-white/40" />
              <Wifi size={14} className="text-white/40" />
              <Users size={14} className="text-white/40" />
            </div>
          </div>

          {/* Text Channels */}
          <div className="flex-1 overflow-y-auto scroll-thin px-2 py-3">
            <div className="text-[11px] uppercase text-white/35 font-semibold tracking-wider px-2 mb-2">
              Текстовые каналы
            </div>
            {textChannels.map((ch) => (
              <div
                key={ch.name}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-xl mb-0.5 cursor-pointer transition-all ${
                  ch.active
                    ? 'glass-pill text-white'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Hash size={16} className="shrink-0 opacity-60" />
                <span className="text-sm">{ch.name}</span>
                {ch.active && <ChevronDown size={14} className="ml-auto opacity-40" />}
              </div>
            ))}

            <div className="text-[11px] uppercase text-white/35 font-semibold tracking-wider px-2 mt-4 mb-2">
              Голосовые каналы
            </div>
            {voiceChannels.map((ch) => (
              <div
                key={ch.name}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl mb-0.5 cursor-pointer text-white/45 hover:bg-white/5 hover:text-white/80 transition"
              >
                <Volume2 size={16} className="shrink-0 opacity-60" />
                <span className="text-sm">{ch.name}</span>
              </div>
            ))}
          </div>

          {/* User Bar */}
          <div className="h-[52px] glass-dark rounded-b-2xl px-2 flex items-center gap-2">
            <Avatar name="Doric" color="from-violet-500 to-purple-600" size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">Doric</div>
              <div className="text-white/35 text-[10px]">#0001</div>
            </div>
            <button className="text-white/35 hover:text-white/80 p-1 transition"><Mic size={16} /></button>
            <button className="text-white/35 hover:text-white/80 p-1 transition"><Headphones size={16} /></button>
            <button className="text-white/35 hover:text-white/80 p-1 transition"><Settings size={16} /></button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 glass-light glass-shine relative flex flex-col rounded-2xl my-1">
          {/* Chat Header */}
          <div className="h-12 px-4 flex items-center gap-2 border-b border-white/10">
            <Hash size={20} className="text-white/35" />
            <span className="text-white font-semibold">общий</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <Avatar name={msg.author} color={msg.color} size={40} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white font-semibold text-sm">{msg.author}</span>
                    <span className="text-white/25 text-xs">{msg.time}</span>
                  </div>
                  {msg.text && (
                    <p className="text-white/75 text-sm mt-0.5 whitespace-pre-line">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="px-4 pb-4">
            <div className="glass-input flex items-center gap-2 rounded-2xl px-4 py-3">
              <Plus size={20} className="text-white/35 shrink-0 cursor-pointer hover:text-white/60 transition" />
              <span className="flex-1 text-white/25 text-sm">Написать в #общий</span>
              <Smile size={20} className="text-white/35 shrink-0 cursor-pointer hover:text-white/60 transition" />
              <Mic size={20} className="text-white/35 shrink-0 cursor-pointer hover:text-white/60 transition" />
            </div>
          </div>
        </div>

        {/* Members Sidebar */}
        <div className="w-[200px] glass glass-refract relative flex flex-col rounded-2xl my-1">
          <div className="px-3 py-3">
            <div className="text-[11px] uppercase text-white/35 font-semibold tracking-wider mb-3">
              В сети — 5
            </div>
            <div className="space-y-3">
              {onlineMembers.map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar name={m.name} color={m.color} size={32} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a0a3e]/80 ${
                        m.online ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-medium truncate">{m.name}</div>
                    <div className="text-white/25 text-[10px] truncate">{m.status}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] uppercase text-white/35 font-semibold tracking-wider mt-5">
              Не в сети — 12
            </div>
          </div>
        </div>
      </div>

      {/* Design Label */}
      <div className="absolute top-3 left-3 glass-dark text-white text-xs px-2.5 py-1 rounded-full z-50">
        1
      </div>
    </div>
  )
}

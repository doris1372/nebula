import {
  ChevronDown,
  Hash,
  Headphones,
  Mic,
  Plus,
  Search,
  Settings,
  Smile,
  Users,
  Volume2,
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

export default function Design3() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Deep dark purple background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0a1a] via-[#1a1030] to-[#0d0820]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(100,50,200,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(80,40,180,0.15),transparent_50%)]" />
      {/* Subtle glow orbs */}
      <div className="absolute top-[5%] left-[40%] w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-indigo-500/8 rounded-full blur-3xl" />

      <div className="relative flex h-full gap-[2px]">
        {/* Server Rail */}
        <div className="w-[72px] glass-dark glass-shimmer relative flex flex-col items-center py-3 gap-2 rounded-r-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30 liquid-pulse">
            D
          </div>
          <div className="w-8 h-0.5 bg-purple-500/15 my-1 rounded-full" />

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/15 glass-icon" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-400/15 glass-icon" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg shadow-blue-400/15 glass-icon" />

          <div className="flex-1" />
          <div className="w-12 h-12 rounded-2xl glass-icon flex items-center justify-center text-purple-400/50 hover:text-purple-300 cursor-pointer transition">
            <Plus size={22} />
          </div>
        </div>

        {/* Channel Sidebar */}
        <div className="w-[220px] glass-dark glass-refract relative flex flex-col rounded-2xl my-1">
          <div className="h-12 px-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="text-purple-100/90 font-semibold text-sm">Doricord</span>
              <ChevronDown size={14} className="text-purple-300/40" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-thin px-2 py-3">
            <div className="text-[11px] uppercase text-purple-300/30 font-semibold tracking-wider px-2 mb-2">
              Текстовые каналы
            </div>
            {textChannels.map((ch) => (
              <div
                key={ch.name}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-xl mb-0.5 cursor-pointer transition-all ${
                  ch.active
                    ? 'glass-pill text-purple-100/90'
                    : 'text-purple-300/35 hover:bg-white/5 hover:text-purple-200/60'
                }`}
              >
                <Hash size={16} className="shrink-0 opacity-50" />
                <span className="text-sm">{ch.name}</span>
                {ch.active && <ChevronDown size={14} className="ml-auto opacity-30" />}
              </div>
            ))}

            <div className="text-[11px] uppercase text-purple-300/30 font-semibold tracking-wider px-2 mt-4 mb-2">
              Голосовые каналы
            </div>
            {voiceChannels.map((ch) => (
              <div
                key={ch.name}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl mb-0.5 cursor-pointer text-purple-300/35 hover:bg-white/5 hover:text-purple-200/60 transition"
              >
                <Volume2 size={16} className="shrink-0 opacity-50" />
                <span className="text-sm">{ch.name}</span>
              </div>
            ))}
          </div>

          <div className="h-[52px] glass-dark rounded-b-2xl px-2 flex items-center gap-2">
            <Avatar name="Doric" color="from-violet-500 to-purple-600" size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-purple-100/90 text-xs font-semibold truncate">Doric</div>
              <div className="text-purple-300/30 text-[10px]">#0001</div>
            </div>
            <button className="text-purple-300/30 hover:text-purple-200 p-1 transition"><Mic size={16} /></button>
            <button className="text-purple-300/30 hover:text-purple-200 p-1 transition"><Headphones size={16} /></button>
            <button className="text-purple-300/30 hover:text-purple-200 p-1 transition"><Settings size={16} /></button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass glass-shine relative flex flex-col rounded-2xl my-1">
          <div className="h-12 px-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <Hash size={20} className="text-purple-300/30" />
              <span className="text-purple-100/90 font-semibold">общий</span>
            </div>
            <div className="flex items-center gap-3">
              <Search size={18} className="text-purple-300/30 cursor-pointer hover:text-purple-200 transition" />
              <Users size={18} className="text-purple-300/30 cursor-pointer hover:text-purple-200 transition" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar name={msg.author} color={msg.color} size={40} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-purple-100/90 font-semibold text-sm">{msg.author}</span>
                    <span className="text-purple-300/25 text-xs">{msg.time}</span>
                  </div>
                  {msg.text && (
                    <p className="text-purple-200/50 text-sm mt-0.5 whitespace-pre-line">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-4">
            <div className="glass-input flex items-center gap-2 rounded-2xl px-4 py-3">
              <Plus size={20} className="text-purple-300/30 shrink-0 cursor-pointer hover:text-purple-200 transition" />
              <span className="flex-1 text-purple-300/25 text-sm">Написать в #общий</span>
              <Smile size={20} className="text-purple-300/30 shrink-0 cursor-pointer hover:text-purple-200 transition" />
              <Mic size={20} className="text-purple-300/30 shrink-0 cursor-pointer hover:text-purple-200 transition" />
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="w-[200px] glass-dark glass-refract relative flex flex-col rounded-2xl my-1">
          <div className="px-3 py-3">
            <div className="text-[11px] uppercase text-purple-300/30 font-semibold tracking-wider mb-3">
              В сети — 5
            </div>
            <div className="space-y-3">
              {onlineMembers.map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar name={m.name} color={m.color} size={32} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#110d1d] ${
                        m.online ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-purple-100/85 text-xs font-medium truncate">{m.name}</div>
                    <div className="text-purple-300/25 text-[10px] truncate">{m.status}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] uppercase text-purple-300/30 font-semibold tracking-wider mt-5">
              Не в сети — 12
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-3 left-3 glass-dark text-white text-xs px-2.5 py-1 rounded-full z-50">
        3
      </div>
    </div>
  )
}

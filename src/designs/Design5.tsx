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
      className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.charAt(0)}
    </div>
  )
}

export default function Design5() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Mixed dark/purple gradient with frosted feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1035] via-[#251848] to-[#0e0a20]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(130,80,220,0.25),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(100,60,200,0.15),transparent_50%)]" />

      <div className="relative flex h-full">
        {/* Server Rail */}
        <div className="w-[72px] bg-[#0c0818]/80 backdrop-blur-xl flex flex-col items-center py-3 gap-2 border-r border-purple-500/10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
            D
          </div>
          <div className="w-8 h-0.5 bg-purple-500/20 my-1 rounded-full" />

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg" />

          <div className="flex-1" />
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400/60 hover:bg-purple-500/20 cursor-pointer transition">
            <Plus size={22} />
          </div>
        </div>

        {/* Channel Sidebar */}
        <div className="w-[230px] bg-white/[0.04] backdrop-blur-2xl border-r border-purple-500/10 flex flex-col">
          {/* Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-purple-500/10">
            <div className="flex items-center gap-1.5">
              <span className="text-white/90 font-semibold text-sm">Doricord</span>
              <ChevronDown size={14} className="text-white/40" />
            </div>
            <div className="flex items-center gap-2">
              <Settings size={15} className="text-white/30 cursor-pointer" />
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 border border-purple-500/10">
              <Search size={14} className="text-white/30" />
              <span className="text-white/20 text-xs">Поиск</span>
            </div>
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto scroll-thin px-2 py-2">
            <div className="text-[11px] uppercase text-white/25 font-semibold tracking-wider px-2 mb-2">
              Текстовые каналы
            </div>
            {textChannels.map((ch) => (
              <div
                key={ch.name}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-0.5 cursor-pointer transition ${
                  ch.active
                    ? 'bg-purple-500/15 text-white/90 border border-purple-500/20'
                    : 'text-white/35 hover:bg-white/5 hover:text-white/60'
                }`}
              >
                <Hash size={16} className="shrink-0 opacity-60" />
                <span className="text-sm">{ch.name}</span>
                {ch.active && <ChevronDown size={14} className="ml-auto opacity-40" />}
              </div>
            ))}

            <div className="text-[11px] uppercase text-white/25 font-semibold tracking-wider px-2 mt-4 mb-2">
              Голосовые каналы
            </div>
            {voiceChannels.map((ch) => (
              <div
                key={ch.name}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-0.5 cursor-pointer text-white/35 hover:bg-white/5 hover:text-white/60 transition"
              >
                <Volume2 size={16} className="shrink-0 opacity-60" />
                <span className="text-sm">{ch.name}</span>
              </div>
            ))}
          </div>

          {/* User Bar */}
          <div className="h-[52px] bg-black/30 backdrop-blur-xl px-2 flex items-center gap-2 border-t border-purple-500/10">
            <Avatar name="Doric" color="from-violet-500 to-purple-600" size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-white/90 text-xs font-semibold truncate">Doric</div>
              <div className="text-white/30 text-[10px]">#0001</div>
            </div>
            <button className="text-white/30 hover:text-white/70 p-1"><Mic size={16} /></button>
            <button className="text-white/30 hover:text-white/70 p-1"><Headphones size={16} /></button>
            <button className="text-white/30 hover:text-white/70 p-1"><Settings size={16} /></button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white/[0.02] backdrop-blur-xl">
          {/* Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-purple-500/10">
            <div className="flex items-center gap-2">
              <Hash size={20} className="text-white/30" />
              <span className="text-white/90 font-semibold">общий</span>
            </div>
            <div className="flex items-center gap-3">
              <Search size={18} className="text-white/30 cursor-pointer" />
              <Users size={18} className="text-white/30 cursor-pointer" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar name={msg.author} color={msg.color} size={40} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white/90 font-semibold text-sm">{msg.author}</span>
                    <span className="text-white/25 text-xs">{msg.time}</span>
                  </div>
                  {msg.text && (
                    <p className="text-white/55 text-sm mt-0.5 whitespace-pre-line">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl rounded-xl px-3 py-2.5 border border-purple-500/10">
              <Plus size={20} className="text-white/30 shrink-0 cursor-pointer" />
              <span className="flex-1 text-white/20 text-sm">Написать в #общий</span>
              <Smile size={20} className="text-white/30 shrink-0 cursor-pointer" />
              <Mic size={20} className="text-white/30 shrink-0 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="w-[200px] bg-white/[0.03] backdrop-blur-xl border-l border-purple-500/10 flex flex-col">
          <div className="px-3 py-3">
            <div className="text-[11px] uppercase text-white/25 font-semibold tracking-wider mb-3">
              В сети — 5
            </div>
            <div className="space-y-3">
              {onlineMembers.map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar name={m.name} color={m.color} size={32} />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a1035] ${
                        m.online ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white/85 text-xs font-medium truncate">{m.name}</div>
                    <div className="text-white/25 text-[10px] truncate">{m.status}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] uppercase text-white/25 font-semibold tracking-wider mt-5">
              Не в сети — 12
            </div>
          </div>
        </div>
      </div>

      {/* Design Label */}
      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-50">
        5
      </div>
    </div>
  )
}

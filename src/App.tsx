import { useMemo, useState } from 'react'
import {
  Bell,
  Compass,
  Hash,
  Headphones,
  Inbox,
  Megaphone,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  Pin,
  Plus,
  Radio,
  Search,
  Send,
  Settings,
  Smile,
  Sparkles,
  Users,
  Video,
  Volume2,
  ChevronDown,
  Gift,
  AtSign,
  Crown,
  Shield,
} from 'lucide-react'
import {
  activeChannel,
  activeServer,
  categories,
  currentUser,
  members,
  messages as seedMessages,
  servers,
  type Message,
} from './data'

const statusColor = {
  online: 'bg-mint-400',
  idle: 'bg-amber-400',
  dnd: 'bg-rose-400',
  offline: 'bg-ink-400',
} as const

function Avatar({ color, initials, size = 40, status }: { color: string; initials: string; size?: number; status?: keyof typeof statusColor }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`w-full h-full rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center font-semibold text-white shadow-lg shadow-black/20`}
        style={{ fontSize: Math.max(11, size * 0.36) }}
      >
        {initials}
      </div>
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-ink-900 ${statusColor[status]}`}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </div>
  )
}

function ServerRail({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <aside className="w-[78px] bg-ink-950 flex flex-col items-center py-3 gap-2 border-r border-black/40">
      <ServerButton
        active={activeId === 'home'}
        onClick={() => onSelect('home')}
        tooltip="Direct Messages"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
      </ServerButton>

      <div className="w-8 h-px bg-ink-700 my-1" />

      <div className="flex flex-col gap-2 overflow-y-auto scroll-thin px-2 -mx-2 flex-1 min-h-0">
        {servers.slice(1).map((s) => (
          <ServerButton
            key={s.id}
            active={activeId === s.id}
            onClick={() => onSelect(s.id)}
            tooltip={s.name}
            badge={s.unread}
            pulse={s.hasNotification}
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center font-semibold text-white text-sm shadow-lg shadow-black/30`}>
              {s.initials}
            </div>
          </ServerButton>
        ))}

        <ServerButton tooltip="Add a server">
          <div className="w-12 h-12 rounded-2xl bg-ink-800 hover:bg-brand-500/20 flex items-center justify-center text-brand-400 hover:text-brand-400 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
        </ServerButton>

        <ServerButton tooltip="Explore public servers">
          <div className="w-12 h-12 rounded-2xl bg-ink-800 hover:bg-mint-500/20 flex items-center justify-center text-mint-400 transition-colors">
            <Compass className="w-5 h-5" />
          </div>
        </ServerButton>
      </div>
    </aside>
  )
}

function ServerButton({
  children,
  active,
  onClick,
  tooltip,
  badge,
  pulse,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  tooltip?: string
  badge?: number
  pulse?: boolean
}) {
  return (
    <div className="relative group">
      <span
        className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-white transition-all ${
          active ? 'h-10 opacity-100' : 'h-0 opacity-0 group-hover:h-4 group-hover:opacity-70'
        }`}
      />
      <button
        onClick={onClick}
        className={`relative transition-transform hover:scale-[1.04] ${pulse ? 'pulse-glow rounded-2xl' : ''}`}
        aria-label={tooltip}
      >
        {children}
        {badge ? (
          <span className="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-400 text-[11px] font-bold text-white flex items-center justify-center ring-2 ring-ink-950">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </button>
      {tooltip && (
        <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-ink-950 text-white text-sm px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-ink-700">
          {tooltip}
        </div>
      )}
    </div>
  )
}

function ChannelIcon({ type, className = '' }: { type: 'text' | 'voice' | 'announce' | 'stage'; className?: string }) {
  const Icon = type === 'voice' ? Volume2 : type === 'announce' ? Megaphone : type === 'stage' ? Radio : Hash
  return <Icon className={`w-[18px] h-[18px] text-ink-300 ${className}`} strokeWidth={2} />
}

function ChannelsSidebar({ activeChannelId, onSelect }: { activeChannelId: string; onSelect: (id: string) => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  return (
    <aside className="w-64 bg-ink-900 flex flex-col border-r border-black/40 min-h-0">
      {/* Server header */}
      <div className="relative h-16 shrink-0 border-b border-black/40">
        <div className={`absolute inset-0 bg-gradient-to-r ${activeServer.banner} opacity-30`} />
        <button className="relative w-full h-full px-4 flex items-center justify-between text-left hover:bg-white/5 transition">
          <div className="flex flex-col">
            <span className="font-semibold text-white truncate">{activeServer.name}</span>
            <span className="text-[11px] text-ink-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-mint-400" />
              {activeServer.onlineCount} online · {activeServer.memberCount} members
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-ink-200" />
        </button>
      </div>

      {/* Quick actions */}
      <div className="px-3 pt-3 pb-2 flex gap-1.5">
        <QuickPill icon={<Sparkles className="w-3.5 h-3.5" />} label="Events" accent />
        <QuickPill icon={<Pin className="w-3.5 h-3.5" />} label="Pinned" />
        <QuickPill icon={<Users className="w-3.5 h-3.5" />} label="Threads" />
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
        {categories.map((cat) => {
          const isCollapsed = collapsed[cat.id]
          return (
            <div key={cat.id} className="mt-3">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [cat.id]: !c[cat.id] }))}
                className="w-full px-1.5 py-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-300 hover:text-white group"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                <span className="truncate">{cat.name}</span>
                <Plus className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100" />
              </button>
              {!isCollapsed && (
                <div className="mt-0.5 space-y-0.5">
                  {cat.channels.map((ch) => {
                    const active = ch.id === activeChannelId
                    return (
                      <button
                        key={ch.id}
                        onClick={() => onSelect(ch.id)}
                        className={`w-full group relative flex items-center gap-2 pl-2 pr-2 py-[7px] rounded-lg text-[15px] transition-colors ${
                          active
                            ? 'bg-gradient-to-r from-brand-500/20 to-transparent text-white'
                            : ch.unread
                            ? 'text-white hover:bg-white/5'
                            : 'text-ink-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {ch.unread && !active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                        )}
                        <ChannelIcon type={ch.type} />
                        <span className="truncate">{ch.name}</span>
                        {ch.mentions ? (
                          <span className="ml-auto min-w-[18px] h-[18px] px-1.5 rounded-full bg-rose-400 text-[10px] font-bold text-white flex items-center justify-center">
                            {ch.mentions}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* User card */}
      <div className="shrink-0 px-2 py-2 bg-ink-950/70 border-t border-black/50 flex items-center gap-2">
        <Avatar color={currentUser.avatarColor} initials="D" size={36} status={currentUser.status} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{currentUser.name}</div>
          <div className="text-[11px] text-ink-300 truncate">{currentUser.activity}</div>
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton icon={<Mic className="w-[18px] h-[18px]" />} />
          <IconButton icon={<Headphones className="w-[18px] h-[18px]" />} />
          <IconButton icon={<Settings className="w-[18px] h-[18px]" />} />
        </div>
      </div>
    </aside>
  )
}

function QuickPill({ icon, label, accent }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <button
      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition ${
        accent
          ? 'bg-gradient-to-r from-brand-500/30 to-accent-500/30 text-white hover:from-brand-500/40 hover:to-accent-500/40'
          : 'bg-ink-800 text-ink-200 hover:bg-ink-700 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function IconButton({ icon, onClick, label }: { icon: React.ReactNode; onClick?: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 rounded-md flex items-center justify-center text-ink-200 hover:text-white hover:bg-white/10 transition"
    >
      {icon}
    </button>
  )
}

function ChannelHeader() {
  return (
    <header className="h-14 shrink-0 px-4 flex items-center gap-3 border-b border-black/40 bg-ink-900/80 backdrop-blur">
      <ChannelIcon type={activeChannel.type} className="!text-ink-200" />
      <span className="font-semibold text-white">{activeChannel.name}</span>
      <span className="w-px h-5 bg-ink-700 mx-1" />
      <span className="text-sm text-ink-300 truncate">{activeChannel.topic}</span>

      <div className="ml-auto flex items-center gap-1">
        <IconButton icon={<Phone className="w-5 h-5" />} label="Start call" />
        <IconButton icon={<Video className="w-5 h-5" />} label="Video" />
        <IconButton icon={<Pin className="w-5 h-5" />} label="Pinned" />
        <IconButton icon={<Users className="w-5 h-5" />} label="Members" />

        <div className="ml-2 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input
            placeholder="Search"
            className="w-44 h-8 rounded-lg bg-ink-800 pl-8 pr-3 text-sm text-white placeholder:text-ink-300 outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        <IconButton icon={<Inbox className="w-5 h-5" />} label="Inbox" />
        <IconButton icon={<Bell className="w-5 h-5" />} label="Notifications" />
      </div>
    </header>
  )
}

function MessageView({ messages, membersById }: { messages: Message[]; membersById: Record<string, { name: string; avatarColor: string; initials: string }> }) {
  return (
    <div className="flex-1 overflow-y-auto scroll-thin px-6 pt-4 pb-2">
      <WelcomeBanner />
      <DayDivider label="Today" />
      <div className="space-y-0.5">
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const grouped = prev && prev.authorId === m.authorId && !m.reply
          const author = membersById[m.authorId] ?? { name: 'Unknown', avatarColor: 'from-ink-500 to-ink-700', initials: '?' }
          return (
            <MessageRow key={m.id} message={m} author={author} grouped={!!grouped} membersById={membersById} />
          )
        })}
      </div>
    </div>
  )
}

function WelcomeBanner() {
  return (
    <div className="mt-4 mb-6 p-5 rounded-2xl bg-gradient-to-br from-brand-500/15 via-accent-500/10 to-transparent border border-brand-500/20">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Hash className="w-7 h-7 text-white" strokeWidth={2.4} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome to #{activeChannel.name}</h2>
          <p className="text-ink-200 mt-1 max-w-lg">
            This is the start of the <span className="text-white font-medium">#{activeChannel.name}</span> channel. Say hi, share what you're working on, and keep things cozy ✨
          </p>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Tag icon={<Pin className="w-3 h-3" />}>2 pinned</Tag>
            <Tag icon={<Users className="w-3 h-3" />}>{activeServer.onlineCount} online</Tag>
            <Tag icon={<Sparkles className="w-3 h-3" />}>Slow mode: off</Tag>
          </div>
        </div>
      </div>
    </div>
  )
}

function Tag({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-800/80 text-ink-200 text-xs">
      {icon}
      {children}
    </span>
  )
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-ink-700" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">{label}</span>
      <div className="flex-1 h-px bg-ink-700" />
    </div>
  )
}

function MessageRow({
  message,
  author,
  grouped,
  membersById,
}: {
  message: Message
  author: { name: string; avatarColor: string; initials: string }
  grouped: boolean
  membersById: Record<string, { name: string; avatarColor: string; initials: string }>
}) {
  return (
    <div className={`group relative flex gap-4 px-2 py-1 rounded-lg hover:bg-white/[0.03] ${grouped ? 'mt-0' : 'mt-4'}`}>
      <div className="w-10 shrink-0 flex justify-center">
        {grouped ? (
          <span className="opacity-0 group-hover:opacity-60 text-[10px] text-ink-300 mt-1.5">
            {message.createdAt.split('at ')[1]}
          </span>
        ) : (
          <Avatar color={author.avatarColor} initials={author.initials} size={40} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {message.reply && (
          <div className="text-xs text-ink-300 mb-1 flex items-center gap-1.5 -ml-6">
            <span className="w-5 h-3 border-l-2 border-t-2 border-ink-600 rounded-tl-md block" />
            <span className="font-medium text-brand-400">↩ {membersById[message.reply.authorId]?.name}</span>
            <span className="truncate opacity-80">{message.reply.content}</span>
          </div>
        )}

        {!grouped && (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white">{author.name}</span>
            <span className="text-[11px] text-ink-300">{message.createdAt}</span>
          </div>
        )}

        <div className="text-[15px] leading-relaxed text-ink-100 whitespace-pre-wrap break-words">
          {message.content}
          {message.edited && <span className="text-[10px] text-ink-300 ml-1">(edited)</span>}
        </div>

        {message.attachments && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((a, i) =>
              a.kind === 'image' ? (
                <div
                  key={i}
                  className={`relative w-56 h-36 rounded-xl bg-gradient-to-br ${a.color} overflow-hidden ring-1 ring-white/10 hover:ring-brand-400 transition shadow-lg`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
                  <div className="absolute bottom-1.5 left-2 right-2 text-[11px] text-white/90 font-medium truncate">{a.name}</div>
                </div>
              ) : (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-ink-800 border border-ink-700 max-w-sm">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                    <Paperclip className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{a.name}</div>
                    <div className="text-[11px] text-ink-300">{a.size}</div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {message.reactions && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.reactions.map((r, i) => (
              <button
                key={i}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition ${
                  r.reacted
                    ? 'bg-brand-500/20 border-brand-500/60 text-white'
                    : 'bg-ink-800 border-ink-700 text-ink-200 hover:border-ink-500'
                }`}
              >
                <span>{r.emoji}</span>
                <span className="font-semibold">{r.count}</span>
              </button>
            ))}
            <button className="inline-flex items-center justify-center w-7 h-6 rounded-full bg-ink-800 border border-ink-700 text-ink-300 hover:text-white hover:border-ink-500 opacity-0 group-hover:opacity-100 transition">
              <Smile className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="absolute -top-3 right-4 hidden group-hover:flex items-center gap-0.5 bg-ink-900 border border-ink-700 rounded-lg p-0.5 shadow-xl">
        <IconButton icon={<Smile className="w-4 h-4" />} />
        <IconButton icon={<AtSign className="w-4 h-4" />} />
        <IconButton icon={<Pin className="w-4 h-4" />} />
      </div>
    </div>
  )
}

function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState('')
  const [typing] = useState(['Aurora', 'Kairo'])

  const send = () => {
    const v = value.trim()
    if (!v) return
    onSend(v)
    setValue('')
  }

  return (
    <div className="px-6 pb-5 shrink-0">
      <div className="relative rounded-2xl bg-ink-800 border border-ink-700 focus-within:border-brand-500/60 focus-within:ring-4 focus-within:ring-brand-500/10 transition">
        <div className="flex items-end gap-2 px-3 py-2.5">
          <button className="w-9 h-9 shrink-0 rounded-full bg-ink-700 hover:bg-brand-500 hover:text-white text-ink-200 flex items-center justify-center transition">
            <Plus className="w-5 h-5" />
          </button>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={`Message #${activeChannel.name}`}
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-[15px] text-white placeholder:text-ink-300 py-1.5 max-h-40"
          />
          <div className="flex items-center gap-0.5 shrink-0 pb-1">
            <IconButton icon={<Gift className="w-5 h-5" />} />
            <IconButton icon={<Smile className="w-5 h-5" />} />
            <button
              onClick={send}
              disabled={!value.trim()}
              className="ml-1 px-3 h-9 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white font-medium text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand-500/30 transition"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
      <div className="mt-1.5 px-2 h-4 text-[11px] text-ink-300 flex items-center gap-1.5">
        {typing.length > 0 && (
          <>
            <TypingDots />
            <span>
              <span className="text-white font-medium">{typing.join(' & ')}</span> {typing.length > 1 ? 'are' : 'is'} typing…
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="w-1 h-1 bg-ink-200 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 bg-ink-200 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
      <span className="w-1 h-1 bg-ink-200 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
    </span>
  )
}

function MembersPanel() {
  const grouped = useMemo(() => {
    const byRole: Record<string, typeof members> = {}
    for (const m of members) {
      const key = m.status === 'offline' ? 'Offline' : m.role ?? 'Members'
      byRole[key] = byRole[key] ?? []
      byRole[key].push(m)
    }
    return byRole
  }, [])

  const roleIcon = (role: string) => {
    if (role === 'Founders') return <Crown className="w-3.5 h-3.5 text-amber-400" />
    if (role === 'Moderators') return <Shield className="w-3.5 h-3.5 text-brand-400" />
    if (role === 'Offline') return null
    return null
  }

  return (
    <aside className="w-60 shrink-0 bg-ink-900 border-l border-black/40 overflow-y-auto scroll-thin">
      {Object.entries(grouped).map(([role, list]) => (
        <div key={role} className="px-3 pt-5">
          <div className="px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-300 flex items-center gap-1.5">
            {roleIcon(role)}
            <span>{role}</span>
            <span className="text-ink-400">— {list.length}</span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            {list.map((m) => {
              const initials = m.name.slice(0, 2).toUpperCase()
              return (
                <button
                  key={m.id}
                  className={`w-full flex items-center gap-2.5 px-1.5 py-1 rounded-lg hover:bg-white/5 transition text-left ${
                    m.status === 'offline' ? 'opacity-50' : ''
                  }`}
                >
                  <Avatar color={m.avatarColor} initials={initials} size={32} status={m.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{m.name}</div>
                    {m.activity && <div className="text-[11px] text-ink-300 truncate">{m.activity}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div className="h-4" />
    </aside>
  )
}

function App() {
  const [activeServerId, setActiveServerId] = useState('design')
  const [activeChannelId, setActiveChannelId] = useState(activeChannel.id)
  const [messages, setMessages] = useState<Message[]>(seedMessages)
  const [muted, setMuted] = useState(false)

  const membersById = useMemo(() => {
    const all = [...members, currentUser]
    return Object.fromEntries(
      all.map((m) => [
        m.id,
        { name: m.name, avatarColor: m.avatarColor, initials: m.name.slice(0, 2).toUpperCase() },
      ]),
    )
  }, [])

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: 'local-' + Date.now(),
        authorId: 'me',
        content: text,
        createdAt: 'Today at just now',
      },
    ])
  }

  return (
    <div className="flex h-screen w-screen text-ink-100 select-none">
      <ServerRail activeId={activeServerId} onSelect={setActiveServerId} />
      <ChannelsSidebar activeChannelId={activeChannelId} onSelect={setActiveChannelId} />

      <main className="flex-1 flex flex-col min-w-0 bg-ink-800">
        <ChannelHeader />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%)]">
            <MessageView messages={messages} membersById={membersById} />
            <Composer onSend={handleSend} />
          </div>
          <MembersPanel />
        </div>

        {/* Voice status bar */}
        <div className="h-10 shrink-0 bg-ink-950 border-t border-black/60 px-4 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-mint-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-mint-400 animate-pulse" />
            Voice Connected
          </span>
          <span className="text-ink-300">Cozy Lounge / Pixel Tavern</span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setMuted((m) => !m)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
                muted ? 'bg-rose-400/20 text-rose-400' : 'text-ink-200 hover:bg-white/5'
              }`}
            >
              {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {muted ? 'Muted' : 'Mic on'}
            </button>
            <button className="flex items-center gap-1 px-2 py-1 rounded-md text-ink-200 hover:bg-white/5 transition">
              <Headphones className="w-4 h-4" />
              Deafen
            </button>
            <button className="flex items-center gap-1 px-2 py-1 rounded-md text-rose-400 hover:bg-rose-400/10 transition">
              <Phone className="w-4 h-4 rotate-[135deg]" />
              Leave
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

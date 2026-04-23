import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AtSign,
  Bell,
  ChevronDown,
  Compass,
  Copy,
  Crown,
  Gift,
  Hash,
  Headphones,
  Inbox,
  LogOut,
  Megaphone,
  Mic,
  MicOff,
  Paperclip,
  Pencil,
  Phone,
  Pin,
  Plus,
  Radio,
  Reply,
  Search,
  Send,
  Settings,
  Shield,
  Smile,
  Sparkles,
  Trash2,
  Users,
  Video,
  Volume2,
  X,
} from 'lucide-react'
import { AuthScreen } from './AuthScreen'
import { connectWS, disconnectWS, emitTypingThrottled, keyOfTarget, useStore } from './store'
import { api } from './api'
import type { Attachment, Channel, Message, Server, UserMe, UserPublic } from './types'

const STATUS_COLOR = {
  online: 'bg-mint-400',
  idle: 'bg-amber-400',
  dnd: 'bg-rose-400',
  offline: 'bg-ink-400',
} as const

const EMOJI_PALETTE = ['🌙', '✨', '🌸', '🌊', '☕', '🔥', '🎉', '👀', '❤️', '😂']

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function Avatar({
  color,
  initials,
  size = 40,
  status,
}: {
  color: string
  initials: string
  size?: number
  status?: keyof typeof STATUS_COLOR
}) {
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
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-ink-900 ${STATUS_COLOR[status]}`}
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </div>
  )
}

function IconButton({
  icon,
  onClick,
  label,
  className = '',
}: {
  icon: React.ReactNode
  onClick?: () => void
  label?: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-8 h-8 rounded-md flex items-center justify-center text-ink-200 hover:text-white hover:bg-white/10 transition ${className}`}
    >
      {icon}
    </button>
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

// ---- Server rail (left) ----

function ServerRail({
  onOpenCreate,
  onOpenJoin,
}: {
  onOpenCreate: () => void
  onOpenJoin: () => void
}) {
  const servers = useStore((s) => s.servers)
  const target = useStore((s) => s.target)
  const selectChannel = useStore((s) => s.selectChannel)
  const loadChannels = useStore((s) => s.loadChannels)
  const loadMembers = useStore((s) => s.loadMembers)
  const selectHome = useStore((s) => s.selectHome)
  const channelsByServer = useStore((s) => s.channelsByServer)

  const activeServerId = target?.kind === 'channel' ? target.serverId : null

  const switchServer = async (s: Server) => {
    if (!channelsByServer[s.id]) await loadChannels(s.id)
    await loadMembers(s.id)
    const chans = useStore.getState().channelsByServer[s.id] || []
    const firstText = chans.find((c) => c.type === 'text') || chans[0]
    if (firstText) await selectChannel(s.id, firstText.id)
  }

  return (
    <aside className="w-[78px] bg-ink-950 flex flex-col items-center py-3 gap-2 border-r border-black/40">
      <ServerPill active={target === null} onClick={selectHome} tooltip="Direct Messages">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
      </ServerPill>

      <div className="w-8 h-px bg-ink-700 my-1" />

      <div className="flex flex-col gap-2 overflow-y-auto scroll-thin px-2 -mx-2 flex-1 min-h-0">
        {servers.map((s) => (
          <ServerPill
            key={s.id}
            active={activeServerId === s.id}
            onClick={() => switchServer(s)}
            tooltip={s.name}
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center font-semibold text-white text-sm shadow-lg shadow-black/30`}
            >
              {s.initials}
            </div>
          </ServerPill>
        ))}

        <ServerPill tooltip="Create a server" onClick={onOpenCreate}>
          <div className="w-12 h-12 rounded-2xl bg-ink-800 hover:bg-brand-500/20 flex items-center justify-center text-brand-400 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
        </ServerPill>

        <ServerPill tooltip="Join with invite code" onClick={onOpenJoin}>
          <div className="w-12 h-12 rounded-2xl bg-ink-800 hover:bg-mint-500/20 flex items-center justify-center text-mint-400 transition-colors">
            <Compass className="w-5 h-5" />
          </div>
        </ServerPill>
      </div>
    </aside>
  )
}

function ServerPill({
  children,
  active,
  onClick,
  tooltip,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  tooltip?: string
}) {
  return (
    <div className="relative group">
      <span
        className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-white transition-all ${
          active ? 'h-10 opacity-100' : 'h-0 opacity-0 group-hover:h-4 group-hover:opacity-70'
        }`}
      />
      <button onClick={onClick} className="relative transition-transform hover:scale-[1.04]" aria-label={tooltip}>
        {children}
      </button>
      {tooltip && (
        <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-ink-950 text-white text-sm px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-ink-700">
          {tooltip}
        </div>
      )}
    </div>
  )
}

function ChannelIcon({
  type,
  className = '',
}: {
  type: 'text' | 'voice' | 'announce' | 'stage'
  className?: string
}) {
  const Icon = type === 'voice' ? Volume2 : type === 'announce' ? Megaphone : type === 'stage' ? Radio : Hash
  return <Icon className={`w-[18px] h-[18px] text-ink-300 ${className}`} strokeWidth={2} />
}

// ---- Channels sidebar ----

function ChannelsSidebar({
  onCreateChannel,
  onCopyInvite,
  onLogout,
}: {
  onCreateChannel: (serverId: number) => void
  onCopyInvite: (code: string) => void
  onLogout: () => void
}) {
  const target = useStore((s) => s.target)
  const servers = useStore((s) => s.servers)
  const dms = useStore((s) => s.dms)
  const channelsByServer = useStore((s) => s.channelsByServer)
  const selectChannel = useStore((s) => s.selectChannel)
  const selectDM = useStore((s) => s.selectDM)
  const user = useStore((s) => s.user)
  const onlineIds = useStore((s) => s.onlineUserIds)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  if (target && target.kind === 'channel') {
    const server = servers.find((s) => s.id === target.serverId)
    const channels = channelsByServer[target.serverId] || []
    const grouped: Record<string, Channel[]> = {}
    for (const c of channels) {
      grouped[c.category] = grouped[c.category] ?? []
      grouped[c.category].push(c)
    }

    return (
      <aside className="w-64 bg-ink-900 flex flex-col border-r border-black/40 min-h-0">
        <div className="relative h-16 shrink-0 border-b border-black/40">
          <div className={`absolute inset-0 bg-gradient-to-r ${server?.banner ?? 'from-brand-600 to-accent-400'} opacity-30`} />
          <button className="relative w-full h-full px-4 flex items-center justify-between text-left hover:bg-white/5 transition">
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-white truncate">{server?.name ?? 'Server'}</span>
              <span className="text-[11px] text-ink-200 flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-400" />
                {server?.member_count ?? 0} members
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-ink-200" />
          </button>
        </div>

        <div className="px-3 pt-3 pb-2 flex gap-1.5">
          <QuickPill icon={<Sparkles className="w-3.5 h-3.5" />} label="Invite" accent onClick={() => server && onCopyInvite(server.invite_code)} />
          <QuickPill icon={<Plus className="w-3.5 h-3.5" />} label="Channel" onClick={() => server && onCreateChannel(server.id)} />
          <QuickPill icon={<Users className="w-3.5 h-3.5" />} label="Members" />
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
          {Object.entries(grouped).map(([cat, chans]) => {
            const isCollapsed = collapsed[cat]
            return (
              <div key={cat} className="mt-3">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
                  className="w-full px-1.5 py-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-300 hover:text-white group"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  <span className="truncate">{cat}</span>
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (server) onCreateChannel(server.id)
                    }}
                    className="ml-auto opacity-0 group-hover:opacity-100 hover:text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {chans.map((ch) => {
                      const active = target.kind === 'channel' && target.channelId === ch.id
                      return (
                        <button
                          key={ch.id}
                          onClick={() => selectChannel(ch.server_id, ch.id)}
                          className={`w-full group flex items-center gap-2 pl-2 pr-2 py-[7px] rounded-lg text-[15px] transition-colors ${
                            active
                              ? 'bg-gradient-to-r from-brand-500/20 to-transparent text-white'
                              : 'text-ink-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <ChannelIcon type={ch.type} />
                          <span className="truncate">{ch.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <UserCard user={user} onlineIds={onlineIds} onLogout={onLogout} />
      </aside>
    )
  }

  // HOME / DM list
  return (
    <aside className="w-64 bg-ink-900 flex flex-col border-r border-black/40 min-h-0">
      <div className="h-16 shrink-0 border-b border-black/40 px-4 flex items-center">
        <input
          placeholder="Find or start a conversation"
          className="w-full h-8 rounded-lg bg-ink-950 px-3 text-sm text-white placeholder:text-ink-300 outline-none focus:ring-2 focus:ring-brand-500/50"
        />
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin p-2">
        <div className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-300">Direct Messages</div>
        {dms.length === 0 && (
          <div className="px-3 py-4 text-sm text-ink-300">
            No DMs yet. Open one by clicking a member in any server.
          </div>
        )}
        {dms.map((dm) => {
          const active = target?.kind === 'dm' && target.dmId === dm.id
          return (
            <button
              key={dm.id}
              onClick={() => selectDM(dm.id)}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition ${
                active ? 'bg-gradient-to-r from-brand-500/20 to-transparent text-white' : 'text-ink-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Avatar
                color={dm.other_user.avatar_color}
                initials={initialsFrom(dm.other_user.name)}
                size={32}
                status={onlineIds.has(dm.other_user.id) ? 'online' : 'offline'}
              />
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-medium truncate">{dm.other_user.name}</div>
                <div className="text-[11px] text-ink-300 truncate">@{dm.other_user.handle}</div>
              </div>
            </button>
          )
        })}
      </div>
      <UserCard user={user} onlineIds={onlineIds} onLogout={onLogout} />
    </aside>
  )
}

function UserCard({
  user,
  onlineIds,
  onLogout,
}: {
  user: UserMe | null
  onlineIds: Set<number>
  onLogout: () => void
}) {
  if (!user) return null
  const initials = initialsFrom(user.name)
  return (
    <div className="shrink-0 px-2 py-2 bg-ink-950/70 border-t border-black/50 flex items-center gap-2">
      <Avatar color={user.avatar_color} initials={initials} size={36} status={onlineIds.has(user.id) ? 'online' : 'online'} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{user.name}</div>
        <div className="text-[11px] text-ink-300 truncate">@{user.handle}</div>
      </div>
      <div className="flex items-center gap-0.5">
        <IconButton icon={<Mic className="w-[18px] h-[18px]" />} label="Mic" />
        <IconButton icon={<Headphones className="w-[18px] h-[18px]" />} label="Headphones" />
        <IconButton icon={<LogOut className="w-[18px] h-[18px]" />} label="Log out" onClick={onLogout} />
      </div>
    </div>
  )
}

function QuickPill({
  icon,
  label,
  accent,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  accent?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
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

// ---- Header ----

function ChannelHeader({
  activeChannel,
  dmPeer,
}: {
  activeChannel: Channel | null
  dmPeer: UserPublic | null
}) {
  if (dmPeer) {
    return (
      <header className="h-14 shrink-0 px-4 flex items-center gap-3 border-b border-black/40 bg-ink-900/80 backdrop-blur">
        <AtSign className="w-[18px] h-[18px] text-ink-200" />
        <span className="font-semibold text-white">{dmPeer.name}</span>
        <span className="w-px h-5 bg-ink-700 mx-1" />
        <span className="text-sm text-ink-300 truncate">@{dmPeer.handle}</span>
        <div className="ml-auto flex items-center gap-1">
          <IconButton icon={<Phone className="w-5 h-5" />} />
          <IconButton icon={<Video className="w-5 h-5" />} />
          <IconButton icon={<Pin className="w-5 h-5" />} />
        </div>
      </header>
    )
  }
  if (!activeChannel) {
    return (
      <header className="h-14 shrink-0 px-4 flex items-center gap-3 border-b border-black/40 bg-ink-900/80 backdrop-blur">
        <Sparkles className="w-[18px] h-[18px] text-ink-200" />
        <span className="font-semibold text-white">Welcome</span>
      </header>
    )
  }
  return (
    <header className="h-14 shrink-0 px-4 flex items-center gap-3 border-b border-black/40 bg-ink-900/80 backdrop-blur">
      <ChannelIcon type={activeChannel.type} className="!text-ink-200" />
      <span className="font-semibold text-white">{activeChannel.name}</span>
      {activeChannel.topic && (
        <>
          <span className="w-px h-5 bg-ink-700 mx-1" />
          <span className="text-sm text-ink-300 truncate">{activeChannel.topic}</span>
        </>
      )}
      <div className="ml-auto flex items-center gap-1">
        <IconButton icon={<Phone className="w-5 h-5" />} />
        <IconButton icon={<Video className="w-5 h-5" />} />
        <IconButton icon={<Pin className="w-5 h-5" />} />
        <IconButton icon={<Users className="w-5 h-5" />} />
        <div className="ml-2 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input
            placeholder="Search"
            className="w-44 h-8 rounded-lg bg-ink-800 pl-8 pr-3 text-sm text-white placeholder:text-ink-300 outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
        <IconButton icon={<Inbox className="w-5 h-5" />} />
        <IconButton icon={<Bell className="w-5 h-5" />} />
      </div>
    </header>
  )
}

// ---- Messages ----

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-ink-700" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">{label}</span>
      <div className="flex-1 h-px bg-ink-700" />
    </div>
  )
}

function WelcomeBanner({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-4 mb-6 p-5 rounded-2xl bg-gradient-to-br from-brand-500/15 via-accent-500/10 to-transparent border border-brand-500/20">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Hash className="w-7 h-7 text-white" strokeWidth={2.4} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-ink-200 mt-1 max-w-lg">{description}</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Tag icon={<Pin className="w-3 h-3" />}>Pinned</Tag>
            <Tag icon={<Sparkles className="w-3 h-3" />}>Slow mode: off</Tag>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  if (sameDay) return `Today at ${hh}:${mm}`
  const y = d.getFullYear()
  const mo = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${mo}-${day} ${hh}:${mm}`
}

function MessageView({
  messages,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
  welcomeTitle,
  welcomeDesc,
}: {
  messages: Message[]
  currentUserId: number
  onReply: (m: Message) => void
  onReact: (m: Message, emoji: string) => void
  onEdit: (m: Message) => void
  onDelete: (m: Message) => void
  welcomeTitle: string
  welcomeDesc: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length])

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin px-6 pt-4 pb-2">
      <WelcomeBanner title={welcomeTitle} description={welcomeDesc} />
      <DayDivider label="Today" />
      <div className="space-y-0.5">
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const grouped = !!prev && prev.author.id === m.author.id && !m.reply_to_id && Date.parse(m.created_at) - Date.parse(prev.created_at) < 5 * 60 * 1000
          return (
            <MessageRow
              key={m.id}
              message={m}
              grouped={grouped}
              currentUserId={currentUserId}
              onReply={() => onReply(m)}
              onReact={(emoji) => onReact(m, emoji)}
              onEdit={() => onEdit(m)}
              onDelete={() => onDelete(m)}
            />
          )
        })}
      </div>
    </div>
  )
}

function MessageRow({
  message,
  grouped,
  currentUserId,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: {
  message: Message
  grouped: boolean
  currentUserId: number
  onReply: () => void
  onReact: (emoji: string) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const mine = message.author.id === currentUserId
  const initials = initialsFrom(message.author.name)

  return (
    <div className={`group relative flex gap-4 px-2 py-1 rounded-lg hover:bg-white/[0.03] ${grouped ? 'mt-0' : 'mt-4'}`}>
      <div className="w-10 shrink-0 flex justify-center">
        {grouped ? (
          <span className="opacity-0 group-hover:opacity-60 text-[10px] text-ink-300 mt-1.5">
            {formatTime(message.created_at).split('at ')[1] ?? ''}
          </span>
        ) : (
          <Avatar color={message.author.avatar_color} initials={initials} size={40} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {message.reply_preview && (
          <div className="text-xs text-ink-300 mb-1 flex items-center gap-1.5 -ml-6">
            <span className="w-5 h-3 border-l-2 border-t-2 border-ink-600 rounded-tl-md block" />
            <span className="font-medium text-brand-400">↩ {message.reply_preview.author_name}</span>
            <span className="truncate opacity-80">{message.reply_preview.content}</span>
          </div>
        )}

        {!grouped && (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white">{message.author.name}</span>
            <span className="text-[11px] text-ink-300">{formatTime(message.created_at)}</span>
          </div>
        )}

        <div className="text-[15px] leading-relaxed text-ink-100 whitespace-pre-wrap break-words">
          {message.content}
          {message.edited && <span className="text-[10px] text-ink-300 ml-1">(edited)</span>}
        </div>

        {message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((a, i) => (
              <AttachmentView key={i} attachment={a} />
            ))}
          </div>
        )}

        {message.reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.reactions.map((r, i) => {
              const reacted = r.user_ids.includes(currentUserId)
              return (
                <button
                  key={i}
                  onClick={() => onReact(r.emoji)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition ${
                    reacted
                      ? 'bg-brand-500/20 border-brand-500/60 text-white'
                      : 'bg-ink-800 border-ink-700 text-ink-200 hover:border-ink-500'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="font-semibold">{r.count}</span>
                </button>
              )
            })}
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="inline-flex items-center justify-center w-7 h-6 rounded-full bg-ink-800 border border-ink-700 text-ink-300 hover:text-white hover:border-ink-500 opacity-0 group-hover:opacity-100 transition"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {pickerOpen && (
          <EmojiPicker
            onPick={(e) => {
              onReact(e)
              setPickerOpen(false)
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>

      <div className="absolute -top-3 right-4 hidden group-hover:flex items-center gap-0.5 bg-ink-900 border border-ink-700 rounded-lg p-0.5 shadow-xl">
        <IconButton icon={<Smile className="w-4 h-4" />} onClick={() => setPickerOpen((o) => !o)} />
        <IconButton icon={<Reply className="w-4 h-4" />} onClick={onReply} />
        {mine && <IconButton icon={<Pencil className="w-4 h-4" />} onClick={onEdit} />}
        {mine && <IconButton icon={<Trash2 className="w-4 h-4" />} onClick={onDelete} className="hover:text-rose-400" />}
      </div>
    </div>
  )
}

function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (
    <div className="mt-1 inline-flex gap-1 p-1.5 rounded-xl bg-ink-900 border border-ink-700 shadow-xl">
      {EMOJI_PALETTE.map((e) => (
        <button
          key={e}
          onClick={() => onPick(e)}
          className="w-7 h-7 rounded-md hover:bg-white/10 text-lg leading-none"
        >
          {e}
        </button>
      ))}
      <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-white/10 text-ink-300 flex items-center justify-center">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function AttachmentView({ attachment }: { attachment: Attachment }) {
  if (attachment.kind === 'image') {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="block relative w-56 h-36 rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-brand-400 transition shadow-lg bg-ink-800"
      >
        <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
        <div className="absolute bottom-1.5 left-2 right-2 text-[11px] text-white/90 font-medium truncate">{attachment.name}</div>
      </a>
    )
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 px-3 py-3 rounded-xl bg-ink-800 border border-ink-700 max-w-sm hover:border-brand-500/50 transition"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
        <Paperclip className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-white truncate">{attachment.name}</div>
        <div className="text-[11px] text-ink-300">{attachment.size ? `${Math.ceil(attachment.size / 1024)} KB` : ''}</div>
      </div>
    </a>
  )
}

// ---- Composer ----

function Composer({
  placeholder,
  replyTo,
  editing,
  onCancelReply,
  onCancelEdit,
  onSubmit,
}: {
  placeholder: string
  replyTo: Message | null
  editing: Message | null
  onCancelReply: () => void
  onCancelEdit: () => void
  onSubmit: (content: string, replyToId: number | null, attachments: Attachment[], editingId: number | null) => Promise<void>
}) {
  const [value, setValue] = useState(editing?.content ?? '')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const target = useStore((s) => s.target)
  const typingByKey = useStore((s) => s.typing)
  const user = useStore((s) => s.user)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1500)
    return () => clearInterval(id)
  }, [])

  const typingKey = keyOfTarget(target)
  const typingList = useMemo(
    () =>
      (typingByKey[typingKey] || []).filter(
        (t) => user && t.user_id !== user.id && now - t.at < 5000,
      ),
    [typingByKey, typingKey, user, now],
  )

  const submit = async () => {
    const v = value.trim()
    if (!v && attachments.length === 0) return
    await onSubmit(v, replyTo?.id ?? null, attachments, editing?.id ?? null)
    setValue('')
    setAttachments([])
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setUploading(true)
    try {
      const uploaded = await api.uploadFile(f)
      setAttachments((xs) => [
        ...xs,
        {
          kind: uploaded.kind,
          name: uploaded.name,
          url: uploaded.url,
          size: uploaded.size,
          mime: uploaded.mime,
        },
      ])
    } catch {
      /* ignore */
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="px-6 pb-5 shrink-0">
      {(replyTo || editing) && (
        <div className="mb-1 flex items-center justify-between px-3 py-1.5 rounded-t-xl bg-ink-950/80 border border-b-0 border-ink-700 text-xs text-ink-200">
          <span className="truncate">
            {editing ? (
              <>Editing message</>
            ) : (
              <>Replying to <span className="text-brand-400 font-semibold">{replyTo?.author.name}</span></>
            )}
          </span>
          <button onClick={editing ? onCancelEdit : onCancelReply} className="text-ink-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-1 flex gap-2 flex-wrap px-3 py-2 rounded-t-xl bg-ink-950/80 border border-b-0 border-ink-700">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md bg-ink-800 text-xs text-white">
              <Paperclip className="w-3.5 h-3.5 text-ink-200" />
              <span className="truncate max-w-[160px]">{a.name}</span>
              <button onClick={() => setAttachments((xs) => xs.filter((_, j) => j !== i))} className="text-ink-300 hover:text-rose-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {uploading && <span className="text-[11px] text-ink-300 self-center">Uploading…</span>}
        </div>
      )}

      <div className="relative rounded-2xl bg-ink-800 border border-ink-700 focus-within:border-brand-500/60 focus-within:ring-4 focus-within:ring-brand-500/10 transition">
        <div className="flex items-end gap-2 px-3 py-2.5">
          <input ref={fileInputRef} type="file" className="hidden" onChange={onFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 shrink-0 rounded-full bg-ink-700 hover:bg-brand-500 hover:text-white text-ink-200 flex items-center justify-center transition"
            aria-label="Upload"
          >
            <Plus className="w-5 h-5" />
          </button>
          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              emitTypingThrottled()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void submit()
              }
              if (e.key === 'Escape') {
                if (editing) onCancelEdit()
                else if (replyTo) onCancelReply()
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-[15px] text-white placeholder:text-ink-300 py-1.5 max-h-40"
          />
          <div className="flex items-center gap-0.5 shrink-0 pb-1">
            <IconButton icon={<Gift className="w-5 h-5" />} />
            <IconButton icon={<Smile className="w-5 h-5" />} />
            <button
              onClick={submit}
              disabled={!value.trim() && attachments.length === 0}
              className="ml-1 px-3 h-9 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white font-medium text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand-500/30 transition"
            >
              <Send className="w-4 h-4" />
              {editing ? 'Save' : 'Send'}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-1.5 px-2 h-4 text-[11px] text-ink-300 flex items-center gap-1.5">
        {typingList.length > 0 && (
          <>
            <TypingDots />
            <span>
              <span className="text-white font-medium">
                {typingList.map((t) => t.user_name).join(' & ')}
              </span>{' '}
              {typingList.length > 1 ? 'are' : 'is'} typing…
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

// ---- Members panel ----

function MembersPanel({
  serverId,
  onOpenDM,
}: {
  serverId: number
  onOpenDM: (userId: number) => void
}) {
  const members = useStore((s) => s.membersByServer[serverId] || [])
  const onlineIds = useStore((s) => s.onlineUserIds)
  const current = useStore((s) => s.user)

  const grouped = useMemo(() => {
    const byRole: Record<string, UserPublic[]> = {}
    for (const m of members) {
      const online = onlineIds.has(m.id)
      const key = !online ? 'Offline' : m.role === 'founder' ? 'Founders' : m.role === 'moderator' ? 'Moderators' : 'Members'
      byRole[key] = byRole[key] ?? []
      byRole[key].push({ ...m, status: online ? 'online' : 'offline' })
    }
    return byRole
  }, [members, onlineIds])

  const roleIcon = (role: string) => {
    if (role === 'Founders') return <Crown className="w-3.5 h-3.5 text-amber-400" />
    if (role === 'Moderators') return <Shield className="w-3.5 h-3.5 text-brand-400" />
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
              const isMe = current?.id === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => !isMe && onOpenDM(m.id)}
                  className={`w-full flex items-center gap-2.5 px-1.5 py-1 rounded-lg hover:bg-white/5 transition text-left ${
                    m.status === 'offline' ? 'opacity-50' : ''
                  }`}
                >
                  <Avatar color={m.avatar_color} initials={initialsFrom(m.name)} size={32} status={m.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{m.name}{isMe && <span className="text-ink-300 text-[11px] ml-1">(you)</span>}</div>
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

// ---- Modals ----

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl bg-ink-900 border border-ink-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-ink-700 flex items-center justify-between">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-ink-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function CreateServerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const createServer = useStore((s) => s.createServer)
  const selectChannel = useStore((s) => s.selectChannel)
  const channelsByServer = useStore((s) => s.channelsByServer)

  const submit = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      const s = await createServer(name.trim())
      const chans = channelsByServer[s.id] || []
      const firstText = chans.find((c) => c.type === 'text') || chans[0]
      if (firstText) await selectChannel(s.id, firstText.id)
      setName('')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a server">
      <p className="text-sm text-ink-200 mb-3">Give it a cozy name. You can change it later.</p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Pixel Tavern"
        className="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-white outline-none focus:border-brand-500"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-ink-200 hover:bg-white/5">Cancel</button>
        <button
          onClick={submit}
          disabled={busy || !name.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </Modal>
  )
}

function JoinServerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const joinServer = useStore((s) => s.joinServer)
  const selectChannel = useStore((s) => s.selectChannel)

  const submit = async () => {
    if (!code.trim()) return
    setBusy(true)
    setErr('')
    try {
      const s = await joinServer(code.trim())
      const chans = useStore.getState().channelsByServer[s.id] || []
      const firstText = chans.find((c) => c.type === 'text') || chans[0]
      if (firstText) await selectChannel(s.id, firstText.id)
      setCode('')
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to join')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join with invite code">
      <p className="text-sm text-ink-200 mb-3">Paste the 8-character invite code from your friend.</p>
      <input
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.trim().toLowerCase())}
        placeholder="abcd1234"
        className="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-white outline-none focus:border-brand-500 font-mono"
      />
      {err && <div className="mt-2 text-sm text-rose-400">{err}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-ink-200 hover:bg-white/5">Cancel</button>
        <button
          onClick={submit}
          disabled={busy || !code.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold disabled:opacity-50"
        >
          Join
        </button>
      </div>
    </Modal>
  )
}

function CreateChannelModal({
  serverId,
  open,
  onClose,
}: {
  serverId: number | null
  open: boolean
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'text' | 'voice' | 'announce'>('text')
  const [busy, setBusy] = useState(false)
  const createChannel = useStore((s) => s.createChannel)
  const selectChannel = useStore((s) => s.selectChannel)

  const submit = async () => {
    if (!name.trim() || serverId == null) return
    setBusy(true)
    try {
      const c = await createChannel(serverId, name.trim().toLowerCase().replace(/\s+/g, '-'), type)
      if (c.type === 'text') await selectChannel(serverId, c.id)
      setName('')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New channel">
      <div className="space-y-3">
        <div className="flex gap-2">
          {(['text', 'voice', 'announce'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm border transition ${
                type === t ? 'bg-brand-500/20 border-brand-500 text-white' : 'bg-ink-800 border-ink-700 text-ink-200'
              }`}
            >
              <ChannelIcon type={t === 'announce' ? 'announce' : t} className="!text-inherit" />
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="new-channel"
          className="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-white outline-none focus:border-brand-500"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-ink-200 hover:bg-white/5">Cancel</button>
        <button
          onClick={submit}
          disabled={busy || !name.trim()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </Modal>
  )
}

// ---- Root ----

function HomeEmpty() {
  return (
    <div className="flex-1 flex items-center justify-center text-center p-10">
      <div>
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto shadow-xl shadow-brand-500/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">Welcome to Nebula</h2>
        <p className="mt-1 text-ink-200 max-w-sm mx-auto">
          Pick a server on the left, or open a DM. Create your own space with the <span className="text-brand-400 font-medium">+</span> button.
        </p>
      </div>
    </div>
  )
}

function ChatArea({
  user,
  activeChannel,
  activeDM,
  msgs,
  placeholder,
}: {
  user: UserMe
  activeChannel: Channel | null
  activeDM: { other_user: UserPublic } | null
  msgs: Message[]
  placeholder: string
}) {
  const sendMessage = useStore((s) => s.sendMessage)
  const reactAction = useStore((s) => s.toggleReaction)
  const editMessage = useStore((s) => s.editMessage)
  const deleteMessage = useStore((s) => s.deleteMessage)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)

  const handleSubmit = async (
    content: string,
    replyToId: number | null,
    attachments: Attachment[],
    editingId: number | null,
  ) => {
    if (editingId) {
      await editMessage(editingId, content)
      setEditing(null)
      return
    }
    await sendMessage(content, replyToId, attachments as unknown[])
    setReplyTo(null)
  }

  return (
    <>
      <MessageView
        messages={msgs}
        currentUserId={user.id}
        welcomeTitle={
          activeChannel
            ? `Welcome to #${activeChannel.name}`
            : activeDM
            ? `Chat with ${activeDM.other_user.name}`
            : 'Welcome'
        }
        welcomeDesc={
          activeChannel?.topic ||
          (activeDM ? `This is the start of your conversation with @${activeDM.other_user.handle}` : '')
        }
        onReply={(m) => {
          setReplyTo(m)
          setEditing(null)
        }}
        onReact={(m, e) => void reactAction(m.id, e)}
        onEdit={(m) => {
          setEditing(m)
          setReplyTo(null)
        }}
        onDelete={(m) => {
          if (confirm('Delete this message?')) void deleteMessage(m.id)
        }}
      />
      <Composer
        placeholder={placeholder}
        replyTo={replyTo}
        editing={editing}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditing(null)}
        onSubmit={handleSubmit}
      />
    </>
  )
}

function ChatScreen() {
  const user = useStore((s) => s.user)
  const target = useStore((s) => s.target)
  const servers = useStore((s) => s.servers)
  const channelsByServer = useStore((s) => s.channelsByServer)
  const dms = useStore((s) => s.dms)
  const messagesByKey = useStore((s) => s.messagesByKey)
  const logout = useStore((s) => s.logout)
  const openDM = useStore((s) => s.openDM)
  const selectDM = useStore((s) => s.selectDM)
  const selectHome = useStore((s) => s.selectHome)

  const [muted, setMuted] = useState(false)
  const [createServerOpen, setCreateServerOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [createChannelFor, setCreateChannelFor] = useState<number | null>(null)

  const activeChannel =
    target?.kind === 'channel'
      ? (channelsByServer[target.serverId] || []).find((c) => c.id === target.channelId) ?? null
      : null
  const activeDM = target?.kind === 'dm' ? dms.find((d) => d.id === target.dmId) ?? null : null

  const targetKey = keyOfTarget(target)
  const msgs = messagesByKey[targetKey] || []

  const onCopyInvite = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* noop */
    }
  }

  useEffect(() => {
    connectWS()
    return () => disconnectWS()
  }, [])

  const onOpenDM = async (userId: number) => {
    const dm = await openDM(userId)
    await selectDM(dm.id)
  }

  const placeholder =
    target?.kind === 'channel' && activeChannel
      ? `Message #${activeChannel.name}`
      : activeDM
      ? `Message @${activeDM.other_user.handle}`
      : 'Select a channel'

  return (
    <div className="flex h-screen w-screen text-ink-100 select-none">
      <ServerRail onOpenCreate={() => setCreateServerOpen(true)} onOpenJoin={() => setJoinOpen(true)} />
      <ChannelsSidebar
        onCreateChannel={(sid) => setCreateChannelFor(sid)}
        onCopyInvite={onCopyInvite}
        onLogout={logout}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-ink-800">
        <ChannelHeader activeChannel={activeChannel} dmPeer={activeDM?.other_user ?? null} />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%)]">
            {target && user ? (
              <ChatArea
                key={targetKey}
                user={user}
                activeChannel={activeChannel}
                activeDM={activeDM}
                msgs={msgs}
                placeholder={placeholder}
              />
            ) : (
              <HomeEmpty />
            )}
          </div>
          {target?.kind === 'channel' && <MembersPanel serverId={target.serverId} onOpenDM={onOpenDM} />}
        </div>

        {/* Voice status bar (cosmetic) */}
        <div className="h-10 shrink-0 bg-ink-950 border-t border-black/60 px-4 flex items-center gap-3 text-xs">
          {servers.length > 0 ? (
            <>
              <span className="flex items-center gap-1.5 text-mint-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-mint-400 animate-pulse" />
                Connected
              </span>
              <span className="text-ink-300">Nebula · {user?.name}</span>
            </>
          ) : (
            <span className="text-ink-300">Sign in to connect</span>
          )}
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
            <button
              onClick={selectHome}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-ink-200 hover:bg-white/5 transition"
              title="Go home"
            >
              <Headphones className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-rose-400 hover:bg-rose-400/10 transition"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </main>

      <CreateServerModal open={createServerOpen} onClose={() => setCreateServerOpen(false)} />
      <JoinServerModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      <CreateChannelModal serverId={createChannelFor} open={createChannelFor !== null} onClose={() => setCreateChannelFor(null)} />
      {/* Silence unused-import lint on Copy / Settings / Search etc used implicitly via icons above */}
      <span className="hidden">
        <Copy />
        <Settings />
      </span>
    </div>
  )
}

function App() {
  const booted = useStore((s) => s.booted)
  const user = useStore((s) => s.user)
  const bootstrap = useStore((s) => s.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  if (!booted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 animate-pulse" />
          <div className="text-sm text-ink-300">Loading Nebula…</div>
        </div>
      </div>
    )
  }

  if (!user) return <AuthScreen />
  return <ChatScreen />
}

export default App

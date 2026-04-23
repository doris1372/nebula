import { useMemo, useState } from 'react'
import { Check, MessageSquare, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { useStore } from './store'
import type { Friend, UserPublic } from './types'

const STATUS_COLOR = {
  online: 'bg-mint-400',
  idle: 'bg-amber-400',
  dnd: 'bg-rose-400',
  offline: 'bg-ink-400',
} as const

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function Avatar({ u, size = 40 }: { u: UserPublic; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`w-full h-full rounded-2xl bg-gradient-to-br ${u.avatar_color} flex items-center justify-center font-semibold text-white shadow-lg shadow-black/20`}
        style={{ fontSize: Math.max(11, size * 0.36) }}
      >
        {initialsFrom(u.name)}
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-ink-900 ${STATUS_COLOR[u.status] ?? STATUS_COLOR.offline}`}
        style={{ width: size * 0.3, height: size * 0.3 }}
      />
    </div>
  )
}

type Tab = 'online' | 'all' | 'pending' | 'add'

export function FriendsScreen({ onOpenDM }: { onOpenDM: (userId: number) => void }) {
  const friends = useStore((s) => s.friends)
  const incoming = useStore((s) => s.incoming)
  const outgoing = useStore((s) => s.outgoing)
  const acceptFriend = useStore((s) => s.acceptFriend)
  const removeFriend = useStore((s) => s.removeFriend)
  const sendFriendRequest = useStore((s) => s.sendFriendRequest)
  const [tab, setTab] = useState<Tab>('online')
  const [query, setQuery] = useState('')

  const online = useMemo(() => friends.filter((f) => f.user.status === 'online'), [friends])

  const pendingCount = incoming.length + outgoing.length

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_50%)]">
      <header className="h-14 shrink-0 px-4 flex items-center gap-3 border-b border-black/40 bg-ink-900/80 backdrop-blur">
        <Users className="w-5 h-5 text-ink-200" />
        <span className="font-semibold text-white">Friends</span>
        <div className="ml-4 flex items-center gap-1">
          <TabButton active={tab === 'online'} onClick={() => setTab('online')}>Online</TabButton>
          <TabButton active={tab === 'all'} onClick={() => setTab('all')}>All</TabButton>
          <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
            Pending{pendingCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">{pendingCount}</span>}
          </TabButton>
          <button
            onClick={() => setTab('add')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition ${
              tab === 'add' ? 'bg-mint-500 text-ink-950' : 'text-mint-400 hover:bg-white/5'
            }`}
          >
            Add Friend
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll-thin px-6 py-5">
        {tab === 'online' && (
          <FriendListView
            title={`Online — ${online.length}`}
            items={online}
            empty="No friends online right now. Go chat in a server while you wait 🌙"
            onOpenDM={onOpenDM}
            onRemove={(id) => void removeFriend(id)}
          />
        )}
        {tab === 'all' && (
          <FriendListView
            title={`All Friends — ${friends.length}`}
            items={friends}
            empty="You haven't added any friends yet. Hit 'Add Friend' to find someone by their handle."
            onOpenDM={onOpenDM}
            onRemove={(id) => void removeFriend(id)}
          />
        )}
        {tab === 'pending' && (
          <PendingView
            incoming={incoming}
            outgoing={outgoing}
            onAccept={(id) => void acceptFriend(id)}
            onReject={(id) => void removeFriend(id)}
            onCancel={(id) => void removeFriend(id)}
          />
        )}
        {tab === 'add' && (
          <AddFriend
            query={query}
            setQuery={setQuery}
            onSend={async (h) => {
              await sendFriendRequest(h)
            }}
          />
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition ${
        active ? 'bg-white/10 text-white' : 'text-ink-200 hover:bg-white/5 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function FriendRow({
  f,
  onOpenDM,
  onRemove,
}: {
  f: Friend
  onOpenDM: (userId: number) => void
  onRemove: (id: number) => void
}) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] border-b border-ink-800/60 last:border-0">
      <Avatar u={f.user} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate flex items-center gap-2">
          {f.user.name}
          <span className="text-[11px] text-ink-300 font-normal">@{f.user.handle}</span>
        </div>
        <div className="text-[12px] text-ink-300 truncate">
          {f.user.status === 'online' ? 'Online' : 'Offline'}
          {f.user.activity && ` · ${f.user.activity}`}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onOpenDM(f.user.id)}
          className="w-9 h-9 rounded-full bg-ink-800 hover:bg-brand-500 hover:text-white flex items-center justify-center text-ink-200 transition"
          title="Message"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRemove(f.id)}
          className="w-9 h-9 rounded-full bg-ink-800 hover:bg-rose-500 hover:text-white flex items-center justify-center text-ink-200 transition"
          title="Remove"
        >
          <UserMinus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function FriendListView({
  title,
  items,
  empty,
  onOpenDM,
  onRemove,
}: {
  title: string
  items: Friend[]
  empty: string
  onOpenDM: (userId: number) => void
  onRemove: (id: number) => void
}) {
  return (
    <div>
      <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-300">{title}</div>
      {items.length === 0 ? (
        <EmptyState message={empty} />
      ) : (
        <div className="rounded-2xl bg-ink-900/40 border border-ink-800">
          {items.map((f) => (
            <FriendRow key={f.id} f={f} onOpenDM={onOpenDM} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  )
}

function PendingView({
  incoming,
  outgoing,
  onAccept,
  onReject,
  onCancel,
}: {
  incoming: Friend[]
  outgoing: Friend[]
  onAccept: (id: number) => void
  onReject: (id: number) => void
  onCancel: (id: number) => void
}) {
  const total = incoming.length + outgoing.length
  if (total === 0) return <EmptyState message="No pending requests. Send one from the 'Add Friend' tab." />
  return (
    <div className="space-y-6">
      {incoming.length > 0 && (
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-300">Incoming — {incoming.length}</div>
          <div className="rounded-2xl bg-ink-900/40 border border-ink-800">
            {incoming.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-ink-800/60 last:border-0">
                <Avatar u={f.user} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{f.user.name}</div>
                  <div className="text-[11px] text-ink-300 truncate">Wants to be friends · @{f.user.handle}</div>
                </div>
                <button
                  onClick={() => onAccept(f.id)}
                  className="w-9 h-9 rounded-full bg-mint-500/20 hover:bg-mint-500 hover:text-ink-950 flex items-center justify-center text-mint-400 transition"
                  title="Accept"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onReject(f.id)}
                  className="w-9 h-9 rounded-full bg-ink-800 hover:bg-rose-500 hover:text-white flex items-center justify-center text-ink-200 transition"
                  title="Reject"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {outgoing.length > 0 && (
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-300">Sent — {outgoing.length}</div>
          <div className="rounded-2xl bg-ink-900/40 border border-ink-800">
            {outgoing.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-ink-800/60 last:border-0">
                <Avatar u={f.user} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{f.user.name}</div>
                  <div className="text-[11px] text-ink-300 truncate">Waiting for response · @{f.user.handle}</div>
                </div>
                <button
                  onClick={() => onCancel(f.id)}
                  className="w-9 h-9 rounded-full bg-ink-800 hover:bg-rose-500 hover:text-white flex items-center justify-center text-ink-200 transition"
                  title="Cancel request"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AddFriend({
  query,
  setQuery,
  onSend,
}: {
  query: string
  setQuery: (v: string) => void
  onSend: (handle: string) => Promise<void>
}) {
  const [status, setStatus] = useState<{ kind: 'idle' | 'ok' | 'err'; msg?: string }>({ kind: 'idle' })
  const [sending, setSending] = useState(false)

  const submit = async () => {
    const h = query.trim().replace(/^@/, '')
    if (h.length < 2) return
    setSending(true)
    setStatus({ kind: 'idle' })
    try {
      await onSend(h)
      setStatus({ kind: 'ok', msg: `Request sent to @${h}` })
      setQuery('')
    } catch (e) {
      setStatus({ kind: 'err', msg: e instanceof Error ? e.message : 'Failed' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="text-sm text-white font-semibold mb-1">Add a Friend</div>
      <p className="text-sm text-ink-300 mb-3">
        You can add a friend by their Nebula handle. It's case-sensitive and without the @ symbol.
      </p>
      <div className="relative rounded-2xl bg-ink-800 border border-ink-700 focus-within:border-brand-500/60 focus-within:ring-4 focus-within:ring-brand-500/10 transition">
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
            }}
            placeholder="someone's handle, e.g. aurora"
            className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-ink-300 py-1.5"
          />
          <button
            onClick={submit}
            disabled={sending || query.trim().replace(/^@/, '').length < 2}
            className="px-3 h-9 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white font-medium text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand-500/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            Send Request
          </button>
        </div>
      </div>
      {status.kind === 'ok' && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-mint-400/10 border border-mint-400/40 text-mint-400 text-sm">
          {status.msg}
        </div>
      )}
      {status.kind === 'err' && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-rose-400/10 border border-rose-400/40 text-rose-400 text-sm">
          {status.msg}
        </div>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-3 py-10 text-center text-sm text-ink-300">{message}</div>
  )
}

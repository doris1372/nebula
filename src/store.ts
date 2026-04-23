import { create } from 'zustand'
import { api, getToken, setToken, API_BASE } from './api'
import type { Channel, DM, Friend, Message, Server, UserMe, UserPublic, WSEvent } from './types'

type Target =
  | { kind: 'channel'; serverId: number; channelId: number }
  | { kind: 'dm'; dmId: number }

type State = {
  user: UserMe | null
  authLoading: boolean
  authError: string | null

  servers: Server[]
  dms: DM[]
  channelsByServer: Record<number, Channel[]>
  membersByServer: Record<number, UserPublic[]>
  onlineUserIds: Set<number>
  typing: Record<string, { user_id: number; user_name: string; at: number }[]>

  friends: Friend[]
  incoming: Friend[]
  outgoing: Friend[]

  messagesByKey: Record<string, Message[]>

  target: Target | null
  booted: boolean
  wsReady: boolean

  // actions
  bootstrap: () => Promise<void>
  signup: (b: { email: string; password: string; name: string; handle: string }) => Promise<void>
  login: (b: { email: string; password: string }) => Promise<void>
  logout: () => void

  loadServers: () => Promise<void>
  loadDMs: () => Promise<void>
  loadFriends: () => Promise<void>
  loadChannels: (serverId: number) => Promise<void>
  loadMembers: (serverId: number) => Promise<void>
  createServer: (name: string) => Promise<Server>
  joinServer: (code: string) => Promise<Server>
  createChannel: (serverId: number, name: string, type?: string) => Promise<Channel>
  openDM: (userId: number) => Promise<DM>
  sendFriendRequest: (handle: string) => Promise<Friend>
  acceptFriend: (id: number) => Promise<void>
  removeFriend: (id: number) => Promise<void>

  selectChannel: (serverId: number, channelId: number) => Promise<void>
  selectDM: (dmId: number) => Promise<void>
  selectHome: () => void

  loadMessages: () => Promise<void>
  sendMessage: (content: string, replyToId?: number | null, attachments?: unknown[]) => Promise<void>
  toggleReaction: (messageId: number, emoji: string) => Promise<void>
  editMessage: (messageId: number, content: string) => Promise<void>
  deleteMessage: (messageId: number) => Promise<void>
  sendTyping: () => void

  handleWS: (evt: WSEvent) => void
  setWsReady: (r: boolean) => void
}

export const keyOfTarget = (t: Target | null): string =>
  !t ? '' : t.kind === 'channel' ? `ch:${t.channelId}` : `dm:${t.dmId}`

export const useStore = create<State>((set, get) => ({
  user: null,
  authLoading: false,
  authError: null,
  servers: [],
  dms: [],
  channelsByServer: {},
  membersByServer: {},
  onlineUserIds: new Set(),
  typing: {},
  friends: [],
  incoming: [],
  outgoing: [],
  messagesByKey: {},
  target: null,
  booted: false,
  wsReady: false,

  bootstrap: async () => {
    if (!getToken()) {
      set({ booted: true })
      return
    }
    try {
      const me = await api.me()
      set({ user: me })
      await Promise.all([get().loadServers(), get().loadDMs(), get().loadFriends()])
      const s = get().servers[0]
      if (s) {
        await get().loadChannels(s.id)
        await get().loadMembers(s.id)
        const firstText = (get().channelsByServer[s.id] || []).find((c) => c.type === 'text')
        if (firstText) {
          await get().selectChannel(s.id, firstText.id)
        }
      }
    } catch {
      setToken(null)
    } finally {
      set({ booted: true })
    }
  },

  signup: async (b) => {
    set({ authLoading: true, authError: null })
    try {
      const r = await api.signup(b)
      setToken(r.token)
      set({ user: r.user })
      await Promise.all([get().loadServers(), get().loadDMs(), get().loadFriends()])
      const s = get().servers[0]
      if (s) {
        await get().loadChannels(s.id)
        await get().loadMembers(s.id)
        const firstText = (get().channelsByServer[s.id] || []).find((c) => c.type === 'text')
        if (firstText) await get().selectChannel(s.id, firstText.id)
      }
    } catch (e) {
      set({ authError: e instanceof Error ? e.message : 'Signup failed' })
      throw e
    } finally {
      set({ authLoading: false })
    }
  },

  login: async (b) => {
    set({ authLoading: true, authError: null })
    try {
      const r = await api.login(b)
      setToken(r.token)
      set({ user: r.user })
      await Promise.all([get().loadServers(), get().loadDMs(), get().loadFriends()])
      const s = get().servers[0]
      if (s) {
        await get().loadChannels(s.id)
        await get().loadMembers(s.id)
        const firstText = (get().channelsByServer[s.id] || []).find((c) => c.type === 'text')
        if (firstText) await get().selectChannel(s.id, firstText.id)
      }
    } catch (e) {
      set({ authError: e instanceof Error ? e.message : 'Login failed' })
      throw e
    } finally {
      set({ authLoading: false })
    }
  },

  logout: () => {
    setToken(null)
    set({
      user: null,
      servers: [],
      dms: [],
      channelsByServer: {},
      membersByServer: {},
      messagesByKey: {},
      target: null,
      onlineUserIds: new Set(),
      typing: {},
      friends: [],
      incoming: [],
      outgoing: [],
    })
  },

  loadServers: async () => {
    const servers = await api.listServers()
    set({ servers })
  },

  loadDMs: async () => {
    const dms = await api.listDMs()
    set({ dms })
  },

  loadFriends: async () => {
    const f = await api.listFriends()
    set({ friends: f.friends, incoming: f.incoming, outgoing: f.outgoing })
  },

  sendFriendRequest: async (handle) => {
    const f = await api.sendFriendRequest(handle)
    if (f.status === 'accepted') {
      set((s) => ({
        friends: [...s.friends, f],
        incoming: s.incoming.filter((x) => x.id !== f.id),
        outgoing: s.outgoing.filter((x) => x.id !== f.id),
      }))
    } else if (f.status === 'pending_out') {
      set((s) => ({
        outgoing: s.outgoing.some((x) => x.id === f.id) ? s.outgoing : [...s.outgoing, f],
      }))
    }
    return f
  },

  acceptFriend: async (id) => {
    const f = await api.acceptFriend(id)
    set((s) => ({
      friends: [...s.friends.filter((x) => x.id !== f.id), f],
      incoming: s.incoming.filter((x) => x.id !== id),
      outgoing: s.outgoing.filter((x) => x.id !== id),
    }))
  },

  removeFriend: async (id) => {
    await api.removeFriend(id)
    set((s) => ({
      friends: s.friends.filter((x) => x.id !== id),
      incoming: s.incoming.filter((x) => x.id !== id),
      outgoing: s.outgoing.filter((x) => x.id !== id),
    }))
  },

  loadChannels: async (serverId: number) => {
    const chans = await api.listChannels(serverId)
    set((s) => ({ channelsByServer: { ...s.channelsByServer, [serverId]: chans } }))
  },

  loadMembers: async (serverId: number) => {
    const mems = await api.listMembers(serverId)
    set((s) => ({ membersByServer: { ...s.membersByServer, [serverId]: mems } }))
  },

  createServer: async (name) => {
    const s = await api.createServer({ name })
    set((st) => ({ servers: [...st.servers, s] }))
    await get().loadChannels(s.id)
    await get().loadMembers(s.id)
    return s
  },

  joinServer: async (code) => {
    const s = await api.joinServer(code)
    set((st) => ({ servers: st.servers.some((x) => x.id === s.id) ? st.servers : [...st.servers, s] }))
    await get().loadChannels(s.id)
    await get().loadMembers(s.id)
    return s
  },

  createChannel: async (serverId, name, type = 'text') => {
    const c = await api.createChannel(serverId, { name, type })
    set((st) => ({
      channelsByServer: {
        ...st.channelsByServer,
        [serverId]: [...(st.channelsByServer[serverId] || []), c],
      },
    }))
    return c
  },

  openDM: async (userId) => {
    const dm = await api.openDM(userId)
    set((st) => ({
      dms: st.dms.some((x) => x.id === dm.id) ? st.dms : [...st.dms, dm],
    }))
    return dm
  },

  selectChannel: async (serverId, channelId) => {
    set({ target: { kind: 'channel', serverId, channelId } })
    await get().loadMessages()
  },
  selectDM: async (dmId) => {
    set({ target: { kind: 'dm', dmId } })
    await get().loadMessages()
  },
  selectHome: () => set({ target: null }),

  loadMessages: async () => {
    const t = get().target
    if (!t) return
    let msgs: Message[] = []
    if (t.kind === 'channel') msgs = await api.listMessages(t.channelId)
    else msgs = await api.listDMMessages(t.dmId)
    set((s) => ({ messagesByKey: { ...s.messagesByKey, [keyOfTarget(t)]: msgs } }))
  },

  sendMessage: async (content, replyToId = null, attachments = []) => {
    const t = get().target
    if (!t) return
    if (t.kind === 'channel') {
      await api.sendMessage(t.channelId, {
        content,
        reply_to_id: replyToId ?? undefined,
        attachments: attachments as unknown[],
      })
    } else {
      await api.sendDM(t.dmId, {
        content,
        reply_to_id: replyToId ?? undefined,
        attachments: attachments as unknown[],
      })
    }
  },

  toggleReaction: async (messageId, emoji) => {
    await api.toggleReaction(messageId, emoji)
  },

  editMessage: async (id, content) => {
    await api.editMessage(id, content)
  },

  deleteMessage: async (id) => {
    await api.deleteMessage(id)
  },

  sendTyping: () => {
    const t = get().target
    if (!t) return
    const payload =
      t.kind === 'channel'
        ? { type: 'typing', data: { channel_id: t.channelId } }
        : { type: 'typing', data: { dm_id: t.dmId } }
    wsSend(payload)
  },

  handleWS: (evt) => {
    if (evt.type === 'hello') {
      set({ onlineUserIds: new Set(evt.data.online_user_ids) })
      return
    }
    if (evt.type === 'presence') {
      set((s) => {
        const n = new Set(s.onlineUserIds)
        if (evt.data.status === 'online') n.add(evt.data.user_id)
        else n.delete(evt.data.user_id)
        return { onlineUserIds: n }
      })
      return
    }
    if (evt.type === 'message.create' || evt.type === 'message.update') {
      const m = evt.data
      const key = m.channel_id ? `ch:${m.channel_id}` : m.dm_id ? `dm:${m.dm_id}` : ''
      if (!key) return
      set((s) => {
        const cur = s.messagesByKey[key] || []
        const idx = cur.findIndex((x) => x.id === m.id)
        let next: Message[]
        if (idx >= 0) {
          next = [...cur]
          next[idx] = m
        } else {
          next = [...cur, m]
        }
        return { messagesByKey: { ...s.messagesByKey, [key]: next } }
      })
      return
    }
    if (evt.type === 'message.delete') {
      const d = evt.data
      const key = d.channel_id ? `ch:${d.channel_id}` : d.dm_id ? `dm:${d.dm_id}` : ''
      if (!key) return
      set((s) => {
        const cur = s.messagesByKey[key] || []
        return { messagesByKey: { ...s.messagesByKey, [key]: cur.filter((x) => x.id !== d.id) } }
      })
      return
    }
    if (evt.type === 'friend.request') {
      const f = evt.data
      set((s) => ({
        incoming: s.incoming.some((x) => x.id === f.id) ? s.incoming : [...s.incoming, f],
      }))
      return
    }
    if (evt.type === 'friend.accept') {
      const f = evt.data
      set((s) => ({
        friends: [...s.friends.filter((x) => x.id !== f.id), f],
        outgoing: s.outgoing.filter((x) => x.id !== f.id),
        incoming: s.incoming.filter((x) => x.id !== f.id),
      }))
      return
    }
    if (evt.type === 'friend.remove') {
      const fid = evt.data.friendship_id
      set((s) => ({
        friends: s.friends.filter((x) => x.id !== fid),
        incoming: s.incoming.filter((x) => x.id !== fid),
        outgoing: s.outgoing.filter((x) => x.id !== fid),
      }))
      return
    }
    if (evt.type === 'typing') {
      const me = get().user
      if (me && evt.data.user_id === me.id) return
      const key = evt.data.channel_id ? `ch:${evt.data.channel_id}` : evt.data.dm_id ? `dm:${evt.data.dm_id}` : ''
      if (!key) return
      const now = Date.now()
      set((s) => {
        const arr = (s.typing[key] || []).filter((t) => t.user_id !== evt.data.user_id && now - t.at < 5000)
        arr.push({ user_id: evt.data.user_id, user_name: evt.data.user_name, at: now })
        return { typing: { ...s.typing, [key]: arr } }
      })
      return
    }
  },

  setWsReady: (r) => set({ wsReady: r }),
}))

// ---- WebSocket management ----

let ws: WebSocket | null = null
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null

export function connectWS() {
  const tok = getToken()
  if (!tok) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
  const url = new URL(API_BASE)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws'
  url.searchParams.set('token', tok)
  const socket = new WebSocket(url.toString())
  ws = socket
  socket.onopen = () => useStore.getState().setWsReady(true)
  socket.onclose = () => {
    useStore.getState().setWsReady(false)
    ws = null
    if (wsReconnectTimer) clearTimeout(wsReconnectTimer)
    wsReconnectTimer = setTimeout(() => connectWS(), 2000)
  }
  socket.onerror = () => {
    try {
      socket.close()
    } catch {
      /* ignore */
    }
  }
  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data) as WSEvent
      useStore.getState().handleWS(data)
    } catch {
      /* ignore */
    }
  }
}

export function disconnectWS() {
  if (wsReconnectTimer) clearTimeout(wsReconnectTimer)
  wsReconnectTimer = null
  if (ws) {
    try {
      ws.close()
    } catch {
      /* ignore */
    }
  }
  ws = null
}

function wsSend(payload: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(payload))
    } catch {
      /* ignore */
    }
  }
}

// typing throttle
let lastTypingAt = 0
export function emitTypingThrottled() {
  const now = Date.now()
  if (now - lastTypingAt < 2500) return
  lastTypingAt = now
  useStore.getState().sendTyping()
}

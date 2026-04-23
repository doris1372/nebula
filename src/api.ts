import type { Channel, DM, Friend, FriendsList, Message, Server, UserMe, UserPublic } from './types'

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8000'

export const API_BASE = API_URL

const TOKEN_KEY = 'nebula.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

class ApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = new Headers(opts.headers || {})
  const tok = getToken()
  if (tok) headers.set('Authorization', `Bearer ${tok}`)
  if (opts.body && !(opts.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const j = await res.json()
      detail = (j.detail as string) || detail
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  // Auth
  signup: (body: { email: string; password: string; name: string; handle: string }) =>
    req<{ token: string; user: UserMe }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    req<{ token: string; user: UserMe }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  me: () => req<UserMe>('/api/auth/me'),

  // Servers
  listServers: () => req<Server[]>('/api/servers'),
  createServer: (body: { name: string }) =>
    req<Server>('/api/servers', { method: 'POST', body: JSON.stringify(body) }),
  joinServer: (invite_code: string) =>
    req<Server>('/api/servers/join', { method: 'POST', body: JSON.stringify({ invite_code }) }),
  listMembers: (serverId: number) =>
    req<UserPublic[]>(`/api/servers/${serverId}/members`),
  listChannels: (serverId: number) =>
    req<Channel[]>(`/api/servers/${serverId}/channels`),
  createChannel: (serverId: number, body: { name: string; type?: string; category?: string; topic?: string }) =>
    req<Channel>(`/api/servers/${serverId}/channels`, { method: 'POST', body: JSON.stringify(body) }),

  // Messages
  listMessages: (channelId: number) =>
    req<Message[]>(`/api/channels/${channelId}/messages`),
  sendMessage: (
    channelId: number,
    body: { content: string; reply_to_id?: number | null; attachments?: unknown[] },
  ) =>
    req<Message>(`/api/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  editMessage: (id: number, content: string) =>
    req<Message>(`/api/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  deleteMessage: (id: number) => req<void>(`/api/messages/${id}`, { method: 'DELETE' }),
  toggleReaction: (id: number, emoji: string) =>
    req<Message>(`/api/messages/${id}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),

  // DMs
  listDMs: () => req<DM[]>('/api/dms'),
  openDM: (user_id: number) =>
    req<DM>('/api/dms', { method: 'POST', body: JSON.stringify({ user_id }) }),
  listDMMessages: (dmId: number) => req<Message[]>(`/api/dms/${dmId}/messages`),
  sendDM: (dmId: number, body: { content: string; reply_to_id?: number | null; attachments?: unknown[] }) =>
    req<Message>(`/api/dms/${dmId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Friends
  listFriends: () => req<FriendsList>('/api/friends'),
  sendFriendRequest: (handle: string) =>
    req<Friend>('/api/friends/request', { method: 'POST', body: JSON.stringify({ handle }) }),
  acceptFriend: (id: number) =>
    req<Friend>(`/api/friends/${id}/accept`, { method: 'POST' }),
  removeFriend: (id: number) => req<void>(`/api/friends/${id}`, { method: 'DELETE' }),
  searchUsers: (q: string) => req<UserPublic[]>(`/api/friends/search?q=${encodeURIComponent(q)}`),

  // Files
  uploadFile: async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const data = await req<{ url: string; name: string; size: number; kind: 'image' | 'file'; mime: string }>(
      '/api/files/upload',
      { method: 'POST', body: fd },
    )
    return {
      ...data,
      url: data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`,
    }
  },
}

export type UserMe = {
  id: number
  email: string
  handle: string
  name: string
  avatar_color: string
  activity: string | null
}

export type UserPublic = {
  id: number
  handle: string
  name: string
  avatar_color: string
  activity: string | null
  status: 'online' | 'idle' | 'dnd' | 'offline'
  role?: string
}

export type Server = {
  id: number
  name: string
  initials: string
  color: string
  banner: string
  invite_code: string
  owner_id: number
  member_count: number
}

export type Channel = {
  id: number
  server_id: number
  name: string
  type: 'text' | 'voice' | 'announce' | 'stage'
  category: string
  position: number
  topic: string | null
}

export type Attachment = {
  kind: 'image' | 'file'
  name: string
  url: string
  size?: number
  mime?: string
  color?: string
}

export type Reaction = {
  emoji: string
  count: number
  user_ids: number[]
}

export type Message = {
  id: number
  channel_id: number | null
  dm_id: number | null
  author: UserPublic
  content: string
  reply_to_id: number | null
  reply_preview: { author_id: number; author_name: string; content: string } | null
  edited: boolean
  attachments: Attachment[]
  reactions: Reaction[]
  created_at: string
  _local?: boolean
}

export type DM = {
  id: number
  other_user: UserPublic
}

export type FriendStatus = 'accepted' | 'pending_in' | 'pending_out'

export type Friend = {
  id: number
  user: UserPublic
  status: FriendStatus
  since: string
}

export type FriendsList = {
  friends: Friend[]
  incoming: Friend[]
  outgoing: Friend[]
}

export type WSEvent =
  | { type: 'hello'; data: { user_id: number; online_user_ids: number[] } }
  | { type: 'presence'; data: { user_id: number; status: 'online' | 'offline' } }
  | { type: 'message.create'; data: Message }
  | { type: 'message.update'; data: Message }
  | { type: 'message.delete'; data: { id: number; channel_id?: number; dm_id?: number } }
  | { type: 'typing'; data: { user_id: number; user_name: string; channel_id?: number; dm_id?: number } }
  | { type: 'friend.request'; data: Friend }
  | { type: 'friend.accept'; data: Friend }
  | { type: 'friend.remove'; data: { friendship_id: number; user_id: number } }
  | { type: 'call.incoming'; data: { room: string; from_user: UserPublic } }
  | { type: 'call.declined'; data: { room: string; user_id: number } }
  | { type: 'call.joined'; data: { room: string; members: UserPublic[] } }
  | { type: 'call.peer_join'; data: { room: string; user: UserPublic } }
  | { type: 'call.peer_leave'; data: { room: string; user_id: number } }
  | { type: 'call.signal'; data: { room: string; from_user_id: number; payload: { type?: string; sdp?: string; candidate?: RTCIceCandidateInit } } }
  | { type: 'pong' }

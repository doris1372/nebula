export type Server = {
  id: string
  name: string
  initials: string
  color: string
  hasNotification?: boolean
  unread?: number
}

export type Channel = {
  id: string
  name: string
  type: 'text' | 'voice' | 'announce' | 'stage'
  unread?: boolean
  mentions?: number
}

export type ChannelCategory = {
  id: string
  name: string
  channels: Channel[]
}

export type Member = {
  id: string
  name: string
  handle: string
  avatarColor: string
  status: 'online' | 'idle' | 'dnd' | 'offline'
  activity?: string
  role?: string
}

export type Message = {
  id: string
  authorId: string
  content: string
  createdAt: string
  edited?: boolean
  reactions?: { emoji: string; count: number; reacted?: boolean }[]
  reply?: { authorId: string; content: string }
  attachments?: { kind: 'image' | 'file'; name: string; size?: string; color?: string }[]
}

export const servers: Server[] = [
  { id: 'home', name: 'Direct Messages', initials: 'N', color: 'from-brand-500 to-accent-500' },
  { id: 'design', name: 'Pixel Tavern', initials: 'PT', color: 'from-fuchsia-500 to-rose-400', hasNotification: true, unread: 3 },
  { id: 'devs', name: 'Code & Coffee', initials: 'C&C', color: 'from-amber-400 to-orange-500' },
  { id: 'music', name: 'Lo-fi Lounge', initials: 'LL', color: 'from-cyan-400 to-blue-500', unread: 12 },
  { id: 'games', name: 'Raid Party', initials: 'RP', color: 'from-emerald-400 to-teal-500', hasNotification: true },
  { id: 'art', name: 'Studio Noir', initials: 'SN', color: 'from-slate-400 to-slate-700' },
  { id: 'book', name: 'Ink & Chapter', initials: 'I&C', color: 'from-rose-400 to-pink-600' },
]

export const activeServer = {
  id: 'design',
  name: 'Pixel Tavern',
  banner: 'from-brand-600 via-fuchsia-500 to-accent-400',
  memberCount: 1284,
  onlineCount: 387,
}

export const categories: ChannelCategory[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    channels: [
      { id: 'announcements', name: 'announcements', type: 'announce' },
      { id: 'rules', name: 'rules-and-guidelines', type: 'text' },
      { id: 'introductions', name: 'introductions', type: 'text', unread: true },
    ],
  },
  {
    id: 'general',
    name: 'General',
    channels: [
      { id: 'lobby', name: 'lobby', type: 'text', unread: true, mentions: 2 },
      { id: 'random', name: 'random', type: 'text' },
      { id: 'memes', name: 'meme-factory', type: 'text', unread: true },
      { id: 'showcase', name: 'showcase', type: 'text' },
    ],
  },
  {
    id: 'voice',
    name: 'Voice Stages',
    channels: [
      { id: 'lounge', name: 'Cozy Lounge', type: 'voice' },
      { id: 'focus', name: 'Focus Room', type: 'voice' },
      { id: 'karaoke', name: 'Karaoke Night', type: 'stage' },
    ],
  },
  {
    id: 'design-cat',
    name: 'Design Crit',
    channels: [
      { id: 'critique', name: 'critique-corner', type: 'text' },
      { id: 'inspo', name: 'inspiration', type: 'text' },
      { id: 'resources', name: 'resources', type: 'text' },
    ],
  },
]

export const activeChannel = { id: 'lobby', name: 'lobby', type: 'text' as const, topic: 'Chill chat, share wins, and plan the next raid 🎉' }

export const members: Member[] = [
  { id: 'u1', name: 'Aurora', handle: 'aurora', avatarColor: 'from-fuchsia-400 to-rose-500', status: 'online', activity: 'Designing Figma frames', role: 'Founders' },
  { id: 'u2', name: 'Kairo', handle: 'kairo.dev', avatarColor: 'from-cyan-400 to-blue-600', status: 'online', activity: 'Playing Hades II', role: 'Moderators' },
  { id: 'u3', name: 'Luma', handle: 'luma', avatarColor: 'from-emerald-400 to-teal-500', status: 'idle', role: 'Moderators' },
  { id: 'u4', name: 'Riven', handle: 'riven', avatarColor: 'from-amber-400 to-orange-500', status: 'dnd', activity: 'In a meeting', role: 'Contributors' },
  { id: 'u5', name: 'Zephyr', handle: 'zeph', avatarColor: 'from-violet-400 to-purple-600', status: 'online', role: 'Contributors' },
  { id: 'u6', name: 'Nyx', handle: 'nyx', avatarColor: 'from-slate-400 to-slate-700', status: 'online', activity: 'Listening to Lo-fi girl', role: 'Contributors' },
  { id: 'u7', name: 'Orion', handle: 'orion', avatarColor: 'from-indigo-400 to-blue-700', status: 'idle', role: 'Members' },
  { id: 'u8', name: 'Pax', handle: 'paxel', avatarColor: 'from-pink-400 to-red-500', status: 'offline', role: 'Members' },
  { id: 'u9', name: 'Vale', handle: 'vale', avatarColor: 'from-lime-400 to-green-600', status: 'offline', role: 'Members' },
]

export const currentUser: Member = {
  id: 'me',
  name: 'Doris',
  handle: 'doris',
  avatarColor: 'from-brand-500 to-accent-500',
  status: 'online',
  activity: 'Building something cool',
}

export const messages: Message[] = [
  {
    id: 'm1',
    authorId: 'u1',
    content: "good morning stargazers ✨ anyone up for a quick design review in 20?",
    createdAt: 'Today at 09:14',
    reactions: [
      { emoji: '✨', count: 7, reacted: true },
      { emoji: '☕', count: 3 },
    ],
  },
  {
    id: 'm2',
    authorId: 'u2',
    content: "I'm in. Mind if I bring the new onboarding flow? Still unsure about the empty-state illustration.",
    createdAt: 'Today at 09:15',
  },
  {
    id: 'm3',
    authorId: 'u1',
    content: 'yes please, drop it here and we can react before the call',
    createdAt: 'Today at 09:15',
    reply: { authorId: 'u2', content: "I'm in. Mind if I bring the new onboarding flow?" },
  },
  {
    id: 'm4',
    authorId: 'u2',
    content: 'Here it is — three variants. Vote with 🌙 / 🌸 / 🌊.',
    createdAt: 'Today at 09:17',
    attachments: [
      { kind: 'image', name: 'onboarding-a.png', color: 'from-indigo-500 via-fuchsia-500 to-rose-400' },
      { kind: 'image', name: 'onboarding-b.png', color: 'from-emerald-400 via-teal-500 to-cyan-500' },
      { kind: 'image', name: 'onboarding-c.png', color: 'from-amber-400 via-orange-500 to-rose-500' },
    ],
    reactions: [
      { emoji: '🌙', count: 4 },
      { emoji: '🌸', count: 2 },
      { emoji: '🌊', count: 6, reacted: true },
    ],
  },
  {
    id: 'm5',
    authorId: 'u5',
    content: 'C gets my vote — the gradient carries the eye to the CTA. Also the copy is *chef\'s kiss*.',
    createdAt: 'Today at 09:20',
  },
  {
    id: 'm6',
    authorId: 'u6',
    content: 'Same. Only nit: the button contrast on mobile dark mode feels a bit low. Try a 2px outer glow?',
    createdAt: 'Today at 09:22',
    reactions: [{ emoji: '👀', count: 2 }],
  },
  {
    id: 'm7',
    authorId: 'u3',
    content: 'dropping the spec',
    createdAt: 'Today at 09:24',
    attachments: [{ kind: 'file', name: 'nebula-onboarding-v3.fig', size: '4.2 MB' }],
  },
  {
    id: 'm8',
    authorId: 'u4',
    content: 'catching up from a meeting — will review in 10. also: new emoji pack just dropped 🎉',
    createdAt: 'Today at 09:31',
    edited: true,
  },
]

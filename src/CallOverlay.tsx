import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Mic, MicOff, PhoneCall, PhoneOff, Video, VideoOff } from 'lucide-react'
import { CallManager } from './call'
import { useStore } from './store'
import type { UserPublic } from './types'

function subscribe(cb: () => void) {
  return CallManager.subscribe(cb)
}
function getSnap() {
  return CallManager.snapshot()
}

function useCall() {
  return useSyncExternalStore(subscribe, getSnap, getSnap)
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const ss = (s % 60).toString().padStart(2, '0')
  const mm = m.toString().padStart(2, '0')
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export function CallOverlay() {
  const call = useCall()
  const user = useStore((s) => s.user)
  const dms = useStore((s) => s.dms)
  const servers = useStore((s) => s.servers)
  const channelsByServer = useStore((s) => s.channelsByServer)
  const leaveCall = useStore((s) => s.leaveCall)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!call.startedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [call.startedAt])

  if (!call.room) return null

  const isVideo = call.kind === 'video' || call.hasVideoTrack
  const title = (() => {
    if (call.room.startsWith('dm:')) {
      const dmId = Number(call.room.slice(3))
      const dm = dms.find((d) => d.id === dmId)
      return dm ? `Call with ${dm.other_user.name}` : 'Direct call'
    }
    if (call.room.startsWith('vc:')) {
      const cid = Number(call.room.slice(3))
      for (const s of servers) {
        const ch = (channelsByServer[s.id] || []).find((c) => c.id === cid)
        if (ch) return `${s.name} · ${ch.name}`
      }
      return 'Voice channel'
    }
    return 'Call'
  })()

  const duration = call.startedAt ? formatDuration(now - call.startedAt) : '00:00'
  const peerCount = call.peers.length + 1

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col">
      <div className="pointer-events-auto mx-auto mt-3 w-full max-w-6xl px-4">
        <div className="rounded-3xl bg-ink-950/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-brand-500/20 via-transparent to-accent-500/20 border-b border-white/5">
            <span className="flex items-center gap-1.5 text-mint-400 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${call.connecting ? 'bg-amber-400 animate-pulse' : 'bg-mint-400'}`} />
              {call.connecting ? 'Connecting…' : isVideo ? 'Video call' : 'Voice call'}
            </span>
            <span className="text-ink-300 text-xs">·</span>
            <span className="text-white text-sm font-semibold truncate">{title}</span>
            <span className="ml-2 text-xs text-ink-300 tabular-nums">{duration}</span>
            <span className="ml-auto text-xs text-ink-300">{peerCount} {peerCount === 1 ? 'person' : 'people'}</span>
          </div>

          <div className="p-3">
            <div
              className={`grid gap-3 ${
                call.peers.length === 0
                  ? 'grid-cols-1'
                  : call.peers.length === 1
                  ? 'grid-cols-1 md:grid-cols-2'
                  : call.peers.length <= 3
                  ? 'grid-cols-2'
                  : 'grid-cols-2 md:grid-cols-3'
              }`}
            >
              {user && (
                <VideoTile
                  self
                  name={`${user.name} (you)`}
                  user={{
                    id: user.id,
                    handle: user.handle,
                    name: user.name,
                    avatar_color: user.avatar_color,
                    activity: user.activity,
                    status: 'online',
                  }}
                  stream={call.localStream}
                  muted={call.muted}
                  showVideo={isVideo && call.cameraOn}
                />
              )}
              {call.peers.map((p) => (
                <VideoTile
                  key={p.userId}
                  name={p.user.name}
                  user={p.user}
                  stream={p.stream}
                  muted={false}
                  showVideo={isVideo}
                  speaking={p.speaking}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/5 bg-ink-950/80">
            <button
              onClick={() => CallManager.toggleMic()}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                call.muted ? 'bg-rose-500 text-white' : 'bg-ink-800 text-white hover:bg-ink-700'
              }`}
              title={call.muted ? 'Unmute' : 'Mute'}
            >
              {call.muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => CallManager.toggleCamera()}
              disabled={!call.hasVideoTrack}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                !call.hasVideoTrack
                  ? 'bg-ink-900 text-ink-400 cursor-not-allowed'
                  : call.cameraOn
                  ? 'bg-ink-800 text-white hover:bg-ink-700'
                  : 'bg-rose-500 text-white'
              }`}
              title={call.hasVideoTrack ? (call.cameraOn ? 'Turn camera off' : 'Turn camera on') : 'Camera not available'}
            >
              {call.cameraOn && call.hasVideoTrack ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => void leaveCall()}
              className="ml-2 h-11 px-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm flex items-center gap-2"
              title="Leave call"
            >
              <PhoneOff className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VideoTile({
  self,
  user,
  name,
  stream,
  muted,
  showVideo,
  speaking,
}: {
  self?: boolean
  user: UserPublic
  name: string
  stream: MediaStream | null
  muted?: boolean
  showVideo: boolean
  speaking?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (stream && v.srcObject !== stream) {
      v.srcObject = stream
    }
  }, [stream])

  const hasVideoTrack = !!stream?.getVideoTracks().length && stream.getVideoTracks().some((t) => t.enabled)
  const showVid = showVideo && hasVideoTrack

  return (
    <div
      className={`relative aspect-video rounded-2xl overflow-hidden bg-ink-900 border transition ${
        speaking ? 'border-mint-400 ring-2 ring-mint-400/40' : 'border-ink-800'
      }`}
    >
      {showVid ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={self}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-900 to-ink-950">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${user.avatar_color} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
            {initialsFrom(user.name)}
          </div>
          {stream && !self && (
            <audio
              ref={(el) => {
                if (el && el.srcObject !== stream) el.srcObject = stream
              }}
              autoPlay
            />
          )}
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 text-xs text-white">
        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm truncate max-w-full">{name}</span>
        {muted && (
          <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white flex items-center" title="Muted">
            <MicOff className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  )
}

export function IncomingCallModal() {
  const incoming = useStore((s) => s.incomingCall)
  const accept = useStore((s) => s.acceptIncomingCall)
  const decline = useStore((s) => s.declineIncomingCall)
  if (!incoming) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[min(92vw,420px)] rounded-3xl bg-ink-900 border border-white/10 shadow-2xl p-6 text-center">
        <div
          className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${incoming.from_user.avatar_color} flex items-center justify-center text-white text-3xl font-bold shadow-xl`}
        >
          {initialsFrom(incoming.from_user.name)}
        </div>
        <div className="mt-4 text-sm text-ink-300">Incoming call</div>
        <div className="text-xl font-semibold text-white">{incoming.from_user.name}</div>
        <div className="text-sm text-ink-300">@{incoming.from_user.handle}</div>
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            onClick={decline}
            className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg flex items-center justify-center"
            title="Decline"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
          <button
            onClick={() => void accept('voice')}
            className="w-14 h-14 rounded-full bg-mint-500 hover:bg-mint-600 text-white shadow-lg flex items-center justify-center"
            title="Accept voice"
          >
            <PhoneCall className="w-5 h-5" />
          </button>
          <button
            onClick={() => void accept('video')}
            className="w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-lg flex items-center justify-center"
            title="Accept with video"
          >
            <Video className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

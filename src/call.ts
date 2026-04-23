import { wsSend } from './store'
import type { UserPublic } from './types'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
]

export type CallKind = 'voice' | 'video'

export type CallPeer = {
  userId: number
  user: UserPublic
  stream: MediaStream | null
  speaking: boolean
}

type Listener = () => void

type Snapshot = {
  room: string | null
  kind: CallKind
  connecting: boolean
  localStream: MediaStream | null
  peers: CallPeer[]
  muted: boolean
  cameraOn: boolean
  hasVideoTrack: boolean
  startedAt: number | null
}

class CallManagerImpl {
  private room: string | null = null
  private kind: CallKind = 'voice'
  private localStream: MediaStream | null = null
  private connections = new Map<number, RTCPeerConnection>()
  private streams = new Map<number, MediaStream>()
  private peerUsers = new Map<number, UserPublic>()
  private speaking = new Set<number>()
  private audioCtx: AudioContext | null = null
  private audioMonitors = new Map<number | 'me', { source: MediaStreamAudioSourceNode; analyser: AnalyserNode; raf: number }>()
  private listeners = new Set<Listener>()
  private muted = false
  private cameraOn = false
  private connecting = false
  private startedAt: number | null = null
  private myUserId = 0
  private cachedSnapshot: Snapshot = this.computeSnapshot()

  subscribe(l: Listener) {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }

  snapshot(): Snapshot {
    return this.cachedSnapshot
  }

  private computeSnapshot(): Snapshot {
    const peers: CallPeer[] = []
    this.connections.forEach((_, uid) => {
      const user = this.peerUsers.get(uid)
      if (!user) return
      peers.push({
        userId: uid,
        user,
        stream: this.streams.get(uid) || null,
        speaking: this.speaking.has(uid),
      })
    })
    return {
      room: this.room,
      kind: this.kind,
      connecting: this.connecting,
      localStream: this.localStream,
      peers,
      muted: this.muted,
      cameraOn: this.cameraOn,
      hasVideoTrack: !!this.localStream?.getVideoTracks().length,
      startedAt: this.startedAt,
    }
  }

  private emit() {
    this.cachedSnapshot = this.computeSnapshot()
    for (const l of this.listeners) l()
  }

  setMyUserId(id: number) {
    this.myUserId = id
  }

  async start(room: string, kind: CallKind) {
    if (this.room) {
      if (this.room === room) return
      await this.leave()
    }
    this.room = room
    this.kind = kind
    this.connecting = true
    this.startedAt = Date.now()
    this.emit()
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: kind === 'video',
      }
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      this.muted = false
      this.cameraOn = kind === 'video'
      this.setupVoiceMonitor('me', this.localStream, () => this.myUserId)
    } catch (e) {
      this.connecting = false
      this.room = null
      this.startedAt = null
      this.emit()
      throw e
    }
    wsSend({ type: 'call.join', data: { room } })
    // Server responds with 'call.joined' — then we initiate offers in onJoined
    this.emit()
  }

  async leave() {
    const r = this.room
    if (r) wsSend({ type: 'call.leave', data: { room: r } })
    for (const pc of this.connections.values()) {
      try {
        pc.close()
      } catch {
        /* noop */
      }
    }
    this.connections.clear()
    this.streams.clear()
    this.peerUsers.clear()
    this.speaking.clear()
    for (const m of this.audioMonitors.values()) {
      cancelAnimationFrame(m.raf)
      try {
        m.source.disconnect()
      } catch {
        /* noop */
      }
    }
    this.audioMonitors.clear()
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop())
      this.localStream = null
    }
    if (this.audioCtx) {
      try {
        await this.audioCtx.close()
      } catch {
        /* noop */
      }
      this.audioCtx = null
    }
    this.room = null
    this.connecting = false
    this.startedAt = null
    this.emit()
  }

  toggleMic() {
    if (!this.localStream) return
    const track = this.localStream.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    this.muted = !track.enabled
    this.emit()
  }

  toggleCamera() {
    if (!this.localStream) return
    const track = this.localStream.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    this.cameraOn = track.enabled
    this.emit()
  }

  // --- WS event handlers ---

  async onJoined(members: UserPublic[]) {
    this.connecting = false
    // initiate offer to each existing member
    for (const m of members) {
      const pc = this.createPeer(m.id, m)
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        wsSend({
          type: 'call.signal',
          data: {
            room: this.room,
            target_user_id: m.id,
            payload: { sdp: offer.sdp, type: offer.type },
          },
        })
      } catch (e) {
        console.error('offer failed', e)
      }
    }
    this.emit()
  }

  onPeerJoin(user: UserPublic) {
    if (!this.connections.has(user.id)) {
      this.createPeer(user.id, user)
    }
    this.emit()
  }

  onPeerLeave(userId: number) {
    const pc = this.connections.get(userId)
    if (pc) {
      try {
        pc.close()
      } catch {
        /* noop */
      }
    }
    this.connections.delete(userId)
    this.streams.delete(userId)
    this.peerUsers.delete(userId)
    this.speaking.delete(userId)
    const mon = this.audioMonitors.get(userId)
    if (mon) {
      cancelAnimationFrame(mon.raf)
      try {
        mon.source.disconnect()
      } catch {
        /* noop */
      }
      this.audioMonitors.delete(userId)
    }
    this.emit()
  }

  async onSignal(fromUserId: number, payload: { type?: string; sdp?: string; candidate?: RTCIceCandidateInit }) {
    let pc = this.connections.get(fromUserId)
    if (!pc) {
      // create a stub with minimal user info — will be enriched when peer_join arrives
      const placeholder: UserPublic = {
        id: fromUserId,
        handle: `user${fromUserId}`,
        name: `User ${fromUserId}`,
        avatar_color: 'from-ink-600 to-ink-800',
        activity: null,
        status: 'online',
      }
      pc = this.createPeer(fromUserId, this.peerUsers.get(fromUserId) || placeholder)
    }
    try {
      if (payload.type === 'offer' && payload.sdp) {
        await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp })
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        wsSend({
          type: 'call.signal',
          data: {
            room: this.room,
            target_user_id: fromUserId,
            payload: { type: answer.type, sdp: answer.sdp },
          },
        })
      } else if (payload.type === 'answer' && payload.sdp) {
        await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp })
      } else if (payload.candidate) {
        try {
          await pc.addIceCandidate(payload.candidate)
        } catch (e) {
          console.warn('addIceCandidate failed', e)
        }
      }
    } catch (e) {
      console.error('onSignal failed', e)
    }
  }

  // --- Internal ---

  private createPeer(userId: number, user: UserPublic): RTCPeerConnection {
    let pc = this.connections.get(userId)
    if (pc) return pc
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    this.connections.set(userId, pc)
    this.peerUsers.set(userId, user)

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream)
      }
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate && this.room) {
        wsSend({
          type: 'call.signal',
          data: {
            room: this.room,
            target_user_id: userId,
            payload: { candidate: ev.candidate.toJSON() },
          },
        })
      }
    }
    pc.ontrack = (ev) => {
      const stream = ev.streams[0] || new MediaStream([ev.track])
      this.streams.set(userId, stream)
      this.setupVoiceMonitor(userId, stream, () => userId)
      this.emit()
    }
    pc.onconnectionstatechange = () => {
      if (pc && ['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        // eventual peer_leave will clean up; don't force-remove here to tolerate transient drops
      }
    }
    return pc
  }

  private setupVoiceMonitor(key: number | 'me', stream: MediaStream, getId: () => number) {
    if (this.audioMonitors.has(key)) return
    try {
      type AudioContextCtor = typeof AudioContext
      const AC: AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: AudioContextCtor }).webkitAudioContext
      if (!this.audioCtx) this.audioCtx = new AC()
      const source = this.audioCtx.createMediaStreamSource(stream)
      const analyser = this.audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let peak = 0
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i] - 128)
          if (v > peak) peak = v
        }
        const speaking = peak > 10
        const id = getId()
        const key2: number | 'me' = key
        if (key2 === 'me') {
          // local speaking isn't shown as peer; skip
        } else {
          const had = this.speaking.has(id)
          if (speaking && !had) {
            this.speaking.add(id)
            this.emit()
          } else if (!speaking && had) {
            this.speaking.delete(id)
            this.emit()
          }
        }
        const raf = requestAnimationFrame(tick)
        const m = this.audioMonitors.get(key)
        if (m) m.raf = raf
      }
      const raf = requestAnimationFrame(tick)
      this.audioMonitors.set(key, { source, analyser, raf })
    } catch (e) {
      console.warn('voice monitor failed', e)
    }
  }
}

export const CallManager = new CallManagerImpl()

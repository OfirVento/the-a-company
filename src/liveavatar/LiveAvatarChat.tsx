import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LiveAvatarSession,
  SessionEvent,
  SessionState,
  AgentEventsEnum,
  ConnectionQuality,
  VoiceChatEvent,
  VoiceChatState,
} from '@heygen/liveavatar-web-sdk';
import {
  Mic,
  MicOff,
  MonitorPlay,
  PhoneOff,
  Send,
  CircleSlash,
  Loader2,
  RadioTower,
} from 'lucide-react';
import './liveavatar.css';

// --- Types ---

interface AvatarOption {
  id: string;
  name: string;
  preview?: string;
  isCustom: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'avatar';
  text: string;
  pending: boolean;
}

type Stage = 'setup' | 'connecting' | 'live' | 'error';

// The public gallery avatar HeyGen uses in its own quickstart — a safe
// fallback so the experience works even if the avatar list fails to load.
const FALLBACK_AVATAR: AvatarOption = {
  id: 'Katya_Chair_Sitting_public',
  name: 'Katya (public demo)',
  preview: undefined,
  isCustom: false,
};

// Normalize whatever shape the avatar list endpoints return into options.
function extractAvatars(payload: unknown, isCustom: boolean): AvatarOption[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as Record<string, unknown>;
  const data = root.data ?? root;
  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const firstArray = ['avatars', 'items', 'results', 'data'].find((k) => Array.isArray(obj[k]));
    if (firstArray) list = obj[firstArray] as unknown[];
  }
  return list
    .map((raw): AvatarOption | null => {
      if (!raw || typeof raw !== 'object') return null;
      const a = raw as Record<string, unknown>;
      const id = a.avatar_id ?? a.id;
      if (typeof id !== 'string') return null;
      const name = [a.avatar_name, a.name, a.pose_name].find((v) => typeof v === 'string') as
        | string
        | undefined;
      const preview = [a.preview_url, a.preview_image_url, a.normal_preview, a.image_url].find(
        (v) => typeof v === 'string',
      ) as string | undefined;
      return { id, name: name ?? id, preview, isCustom };
    })
    .filter((a): a is AvatarOption => a !== null);
}

let nextMsgId = 0;
const msgId = () => `msg-${++nextMsgId}`;

export default function LiveAvatarChat() {
  const [stage, setStage] = useState<Stage>('setup');
  const [error, setError] = useState<string | null>(null);

  const [avatars, setAvatars] = useState<AvatarOption[]>([]);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');

  const [sessionState, setSessionState] = useState<SessionState>(SessionState.INACTIVE);
  const [quality, setQuality] = useState<ConnectionQuality>(ConnectionQuality.UNKNOWN);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceChatState>(VoiceChatState.INACTIVE);
  const [micMuted, setMicMuted] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');

  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // --- Avatar list ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/liveavatar/avatars');
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? `HTTP ${res.status}`);
        const custom = extractAvatars(payload.custom, true);
        const pub = extractAvatars(payload.public, false);
        const all = [...custom, ...pub];
        if (cancelled) return;
        setAvatars(all.length > 0 ? all : [FALLBACK_AVATAR]);
        setSelectedAvatarId((custom[0] ?? all[0] ?? FALLBACK_AVATAR).id);
      } catch (err) {
        if (cancelled) return;
        console.warn('Failed to load avatar list', err);
        setAvatars([FALLBACK_AVATAR]);
        setSelectedAvatarId(FALLBACK_AVATAR.id);
      } finally {
        if (!cancelled) setAvatarsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Transcript helpers ---
  const upsertStreaming = useCallback((role: ChatMessage['role'], text: string, final: boolean) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.role === role && last.pending) {
        next[next.length - 1] = {
          ...last,
          text: final ? text : last.text + text,
          pending: !final,
        };
      } else if (text.trim()) {
        next.push({ id: msgId(), role, text, pending: !final });
      }
      return next;
    });
  }, []);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // --- Session lifecycle ---
  const teardown = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) {
      session.removeAllListeners();
      session.stop().catch(() => undefined);
    }
    setSessionState(SessionState.INACTIVE);
    setVoiceState(VoiceChatState.INACTIVE);
    setMicMuted(true);
    setAvatarSpeaking(false);
    setUserSpeaking(false);
  }, []);

  useEffect(() => teardown, [teardown]);

  const startSession = useCallback(async () => {
    setError(null);
    setStage('connecting');
    setMessages([]);
    try {
      // 1. Session token from our backend proxy (API key stays server-side).
      const res = await fetch('/api/liveavatar/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'FULL', // HeyGen-hosted LLM + voice: true out-of-the-box conversation
          avatar_id: selectedAvatarId,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error ?? payload.message ?? `Token request failed (HTTP ${res.status})`);
      }
      const token: string | undefined = payload?.data?.session_token;
      if (!token) throw new Error('LiveAvatar API returned no session_token');

      // 2. Start the realtime session. Voice chat starts later, on mic click,
      //    so the browser only asks for the microphone when the user opts in.
      const session = new LiveAvatarSession(token);
      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STATE_CHANGED, setSessionState);
      session.on(SessionEvent.SESSION_CONNECTION_QUALITY_CHANGED, setQuality);
      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (videoRef.current) session.attach(videoRef.current);
        setStage('live');
      });
      session.on(SessionEvent.SESSION_DISCONNECTED, (reason) => {
        if (sessionRef.current === session) {
          teardown();
          setStage('setup');
          setError(`Session ended (${reason})`);
        }
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => setAvatarSpeaking(true));
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => setAvatarSpeaking(false));
      session.on(AgentEventsEnum.USER_SPEAK_STARTED, () => setUserSpeaking(true));
      session.on(AgentEventsEnum.USER_SPEAK_ENDED, () => setUserSpeaking(false));

      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION_CHUNK, (e) =>
        upsertStreaming('avatar', e.text, false),
      );
      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (e) => upsertStreaming('avatar', e.text, true));
      session.on(AgentEventsEnum.USER_TRANSCRIPTION_CHUNK, (e) =>
        upsertStreaming('user', e.text, false),
      );
      session.on(AgentEventsEnum.USER_TRANSCRIPTION, (e) => upsertStreaming('user', e.text, true));

      const voice = session.voiceChat;
      voice.on(VoiceChatEvent.STATE_CHANGED, setVoiceState);
      voice.on(VoiceChatEvent.MUTED, () => setMicMuted(true));
      voice.on(VoiceChatEvent.UNMUTED, () => setMicMuted(false));

      await session.start();
    } catch (err) {
      teardown();
      setStage('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [selectedAvatarId, teardown, upsertStreaming]);

  const endSession = useCallback(() => {
    teardown();
    setStage('setup');
  }, [teardown]);

  // --- Interactions ---
  const sendMessage = useCallback(() => {
    const session = sessionRef.current;
    const text = draft.trim();
    if (!session || !text || sessionState !== SessionState.CONNECTED) return;
    session.message(text);
    setMessages((prev) => [...prev, { id: msgId(), role: 'user', text, pending: false }]);
    setDraft('');
  }, [draft, sessionState]);

  const toggleMic = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    const voice = session.voiceChat;
    if (voice.state === VoiceChatState.INACTIVE) {
      await voice.start({ defaultMuted: false });
    } else if (voice.isMuted) {
      await voice.unmute();
    } else {
      await voice.mute();
    }
  }, []);

  const interrupt = useCallback(() => {
    sessionRef.current?.interrupt();
  }, []);

  const micLive = voiceState === VoiceChatState.ACTIVE && !micMuted;

  // --- Render ---
  return (
    <div className="lava-wrapper">
      {stage === 'setup' || stage === 'error' ? (
        <div className="lava-setup">
          <div className="lava-setup-card">
            <div className="lava-setup-icon">
              <MonitorPlay size={28} />
            </div>
            <h2>Live Avatar Lab</h2>
            <p className="lava-muted">
              Real-time conversation with your HeyGen LiveAvatar — voice or text, powered by the
              LiveAvatar FULL mode agent.
            </p>

            <label className="lava-label" htmlFor="lava-avatar-select">
              Avatar
            </label>
            <select
              id="lava-avatar-select"
              className="lava-select"
              value={selectedAvatarId}
              disabled={avatarsLoading}
              onChange={(e) => setSelectedAvatarId(e.target.value)}
            >
              {avatarsLoading && <option>Loading avatars…</option>}
              {avatars.some((a) => a.isCustom) && (
                <optgroup label="My avatars">
                  {avatars
                    .filter((a) => a.isCustom)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="Public avatars">
                {avatars
                  .filter((a) => !a.isCustom)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </optgroup>
            </select>

            {error && <div className="lava-error">{error}</div>}

            <button
              className="lava-btn lava-btn-primary"
              disabled={avatarsLoading || !selectedAvatarId}
              onClick={startSession}
            >
              <RadioTower size={16} /> Start live session
            </button>
          </div>
        </div>
      ) : (
        <div className="lava-live">
          <div className="lava-stage">
            <video ref={videoRef} className="lava-video" autoPlay playsInline />
            {stage === 'connecting' && (
              <div className="lava-stage-overlay">
                <Loader2 className="lava-spin" size={32} />
                <span>Connecting to avatar…</span>
              </div>
            )}
            <div className="lava-stage-status">
              <span className={`lava-pill ${sessionState === SessionState.CONNECTED ? 'ok' : ''}`}>
                {sessionState}
              </span>
              <span className="lava-pill">{quality}</span>
              {avatarSpeaking && <span className="lava-pill speaking">avatar speaking</span>}
              {userSpeaking && <span className="lava-pill speaking">listening to you</span>}
            </div>
            <div className="lava-controls">
              <button
                className={`lava-btn lava-btn-round ${micLive ? 'lava-btn-live' : ''}`}
                onClick={toggleMic}
                title={
                  voiceState === VoiceChatState.INACTIVE
                    ? 'Enable microphone'
                    : micLive
                      ? 'Mute microphone'
                      : 'Unmute microphone'
                }
              >
                {micLive ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button
                className="lava-btn lava-btn-round"
                onClick={interrupt}
                title="Interrupt the avatar"
              >
                <CircleSlash size={18} />
              </button>
              <button
                className="lava-btn lava-btn-round lava-btn-danger"
                onClick={endSession}
                title="End session"
              >
                <PhoneOff size={18} />
              </button>
            </div>
          </div>

          <div className="lava-chat">
            <div className="lava-chat-header">Conversation</div>
            <div className="lava-transcript" ref={transcriptRef}>
              {messages.length === 0 && (
                <div className="lava-muted lava-transcript-empty">
                  Say hello — talk with the mic on, or type below. The transcript of both sides
                  shows up here in real time.
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`lava-msg ${m.role}`}>
                  <div className="lava-msg-role">{m.role === 'user' ? 'You' : 'Avatar'}</div>
                  <div className="lava-msg-text">
                    {m.text}
                    {m.pending && <span className="lava-cursor">▍</span>}
                  </div>
                </div>
              ))}
            </div>
            <form
              className="lava-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                className="lava-input"
                placeholder="Type a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={sessionState !== SessionState.CONNECTED}
              />
              <button
                type="submit"
                className="lava-btn lava-btn-primary lava-btn-send"
                disabled={!draft.trim() || sessionState !== SessionState.CONNECTED}
                title="Send"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

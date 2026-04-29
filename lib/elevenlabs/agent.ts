"use client";
import { Conversation } from "@elevenlabs/client";
import type { Caller } from "@/lib/game/callers";

export interface AgentSession {
  end: () => Promise<void>;
  setVolume: (v: number) => void;
  setMicMuted: (muted: boolean) => void;
}

export interface AgentEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (e: unknown) => void;
  onUserTranscript?: (text: string) => void;
  onAgentResponse?: (text: string) => void;
}

/** ElevenLabs Conv AI client tool callback: receives the parameters object directly. */
export type ToolHandler = (parameters: Record<string, unknown>) => Promise<string> | string;

export interface SessionOverrides {
  systemPrompt: string;
  firstMessage: string;
  voiceId: string;
}

interface StartSessionOptions {
  overrides: SessionOverrides;
  events?: AgentEvents;
  clientTools?: Record<string, ToolHandler>;
}

async function _startSession({ overrides, events = {}, clientTools }: StartSessionOptions): Promise<AgentSession> {
  const tokenRes = await fetch("/api/agent-token");
  if (!tokenRes.ok) throw new Error("Failed to mint agent token");
  const { signedUrl } = (await tokenRes.json()) as { signedUrl: string };

  const conv = await Conversation.startSession({
    signedUrl,
    overrides: {
      agent: {
        prompt: { prompt: overrides.systemPrompt },
        firstMessage: overrides.firstMessage,
        language: "en",
      },
      tts: { voiceId: overrides.voiceId },
    },
    clientTools: clientTools ?? {},
    onConnect: () => events.onConnect?.(),
    onDisconnect: () => events.onDisconnect?.(),
    onError: (e) => events.onError?.(e),
    onMessage: (m: { source: "user" | "ai"; message: string }) => {
      if (m.source === "user") events.onUserTranscript?.(m.message);
      if (m.source === "ai") events.onAgentResponse?.(m.message);
    },
  });

  return {
    end: () => conv.endSession(),
    setVolume: (v) => conv.setVolume({ volume: v }),
    setMicMuted: (muted) => conv.setMicMuted(muted),
  };
}

/** Caller persona session (DJ Mode — player IS the DJ, Tom/Mira/Eli/Frank calls in). */
export async function startCallerSession(caller: Caller, events: AgentEvents = {}): Promise<AgentSession> {
  return _startSession({
    overrides: {
      systemPrompt: caller.systemPrompt,
      firstMessage: caller.openingLine,
      voiceId: caller.voiceId,
    },
    events,
  });
}

/** AI-DJ session (Caller Mode — player is the caller, the chosen DJ picks up). */
export async function startDjSession(opts: {
  dj: { systemPrompt: string; firstMessage: string; voiceId: string };
  events?: AgentEvents;
  onPlaySong: (vibe: string, reason: string) => Promise<void> | void;
}): Promise<AgentSession> {
  return _startSession({
    overrides: {
      systemPrompt: opts.dj.systemPrompt,
      firstMessage: opts.dj.firstMessage,
      voiceId: opts.dj.voiceId,
    },
    events: opts.events,
    clientTools: {
      play_song: async (params) => {
        const vibe = String(params?.vibe ?? "").trim();
        const reason = String(params?.reason ?? "");
        console.log("[play_song tool]", { vibe, reason });
        if (!vibe) return "no vibe";
        await opts.onPlaySong(vibe, reason);
        return "now playing";
      },
    },
  });
}

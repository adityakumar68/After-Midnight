"use client";
import { Conversation } from "@elevenlabs/client";
import type { Caller } from "@/lib/game/callers";

export interface AgentSession {
  end: () => Promise<void>;
  setVolume: (v: number) => void;
}

export interface AgentEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (e: unknown) => void;
  onUserTranscript?: (text: string) => void;
  onAgentResponse?: (text: string) => void;
}

interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

export type ToolHandler = (call: ToolCall) => Promise<string> | string;

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

/** Kai-the-DJ session (Caller Mode — player is the caller, Kai picks up). */
export async function startDjSession(opts: {
  events?: AgentEvents;
  onPlaySong: (vibe: string, reason: string) => Promise<void> | void;
}): Promise<AgentSession> {
  const KAI_SYSTEM = [
    "You are Kai, the warm late-night host of \"After Midnight,\" a small AM radio show that plays songs for lonely listeners.",
    "It is 3 AM. A caller has just picked up.",
    "You speak in slow, gentle, lived-in sentences — like someone who genuinely wants to hear them out.",
    "Don't rush. Ask 2 to 4 follow-up questions to understand what they're feeling.",
    "When you have a clear sense of their mood, say something like \"I think I have just the song for you\" and CALL THE play_song TOOL.",
    "play_song takes two arguments: vibe (a short 2-4 word description like 'rainy synth heartbreak' or 'old country road') and reason (one private sentence on why this fits, the caller will not hear it).",
    "Don't announce the song's title — let it surprise them.",
    "Keep replies under 25 words.",
    "Never break character.",
  ].join(" ");

  const KAI_FIRST = "After Midnight. You're on the air. What's keeping you up tonight?";
  const KAI_VOICE = process.env.NEXT_PUBLIC_KAI_VOICE_ID ?? "3WqHLnw80rOZqJzW9YRB";

  return _startSession({
    overrides: {
      systemPrompt: KAI_SYSTEM,
      firstMessage: KAI_FIRST,
      voiceId: KAI_VOICE,
    },
    events: opts.events,
    clientTools: {
      play_song: async (call) => {
        const vibe = String(call.parameters.vibe ?? "").trim();
        const reason = String(call.parameters.reason ?? "");
        if (!vibe) return "no vibe";
        await opts.onPlaySong(vibe, reason);
        return "now playing";
      },
    },
  });
}

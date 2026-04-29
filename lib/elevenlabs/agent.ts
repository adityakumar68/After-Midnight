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

export async function startCallerSession(caller: Caller, events: AgentEvents = {}): Promise<AgentSession> {
  const tokenRes = await fetch("/api/agent-token");
  if (!tokenRes.ok) throw new Error("Failed to mint agent token");
  const { signedUrl } = (await tokenRes.json()) as { signedUrl: string };

  const conv = await Conversation.startSession({
    signedUrl,
    overrides: {
      agent: {
        prompt: { prompt: caller.systemPrompt },
        firstMessage: caller.openingLine,
        language: "en",
      },
      tts: { voiceId: caller.voiceId },
    },
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

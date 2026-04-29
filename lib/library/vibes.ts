const CANONICAL_VIBES = [
  "dusty-country",
  "synthwave-heartbreak",
  "lullaby-piano",
  "cozy-lo-fi",
] as const;

export type CanonicalVibe = (typeof CANONICAL_VIBES)[number];

const KEYWORDS: Record<CanonicalVibe, string[]> = {
  "dusty-country":         ["country", "dusty", "road", "trucker", "western", "americana", "slide", "steel", "harmonica"],
  "synthwave-heartbreak":  ["synth", "synthwave", "heartbreak", "neon", "rainy", "rain", "wave", "retrowave", "80s"],
  "lullaby-piano":         ["lullaby", "piano", "music", "box", "tender", "child", "sleep", "felt"],
  "cozy-lo-fi":            ["lo-fi", "lofi", "cozy", "quiet", "jazz", "jazzy", "rhodes", "tape", "mellow"],
};

export function canonicalizeVibe(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function scoreMatch(freeform: string, canonical: string): number {
  const cn = canonicalizeVibe(freeform);
  if (cn === canonical) return 1;
  const tokens = cn.split("-").filter(Boolean);
  if (tokens.length === 0) return 0;
  const kw = KEYWORDS[canonical as CanonicalVibe] ?? [];
  let hits = 0;
  for (const t of tokens) if (kw.includes(t) || canonical.includes(t)) hits++;
  return hits / tokens.length;
}

export function bestCanonicalMatch(freeform: string): { vibe: CanonicalVibe; score: number } | null {
  let best: { vibe: CanonicalVibe; score: number } | null = null;
  for (const v of CANONICAL_VIBES) {
    const s = scoreMatch(freeform, v);
    if (!best || s > best.score) best = { vibe: v, score: s };
  }
  if (!best || best.score < 0.34) return null;
  return best;
}

export function expandPrompt(freeform: string): string {
  const lc = freeform.toLowerCase();
  const adds: string[] = [];
  if (/\brainy?\b/.test(lc) || /\brain\b/.test(lc)) adds.push("with rain ambience");
  if (/country|trucker|road|western|americana/.test(lc)) adds.push("slide steel guitar, brushed snare, gravelly male voice singing about lonely highways");
  if (/synth|wave|neon|80s/.test(lc)) adds.push("breathy pads, slow analog arpeggios, soft female voice singing about lost love");
  if (/lullaby|child|sleep/.test(lc)) adds.push("felt piano, music box, gentle hummed vocals, very tender");
  if (/lo-?fi|cozy|jazz|jazzy|mellow/.test(lc)) adds.push("vinyl crackle, soft jazz keys, warm tape hiss, mellow vocals");
  if (/heartbreak|sad|aching|cry|cried|crying/.test(lc)) adds.push("aching but pretty, vulnerable vocals with a few sung lyrics");
  // Default to vocals unless caller explicitly says instrumental
  const wantsInstrumental = /\binstrumental\b|\bno vocals?\b/.test(lc);
  const vocalSuffix = wantsInstrumental
    ? ", instrumental, no vocals"
    : ", with soft vocals and a verse and a chorus, the lyrics should fit the mood";
  const base = `${freeform.trim()}, 60 seconds${vocalSuffix}`;
  return adds.length ? `${base}, ${adds.join(", ")}, late-night 3 AM character` : `${base}, late-night 3 AM character`;
}

export const ALL_CANONICAL_VIBES = CANONICAL_VIBES;

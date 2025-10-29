// src/audio/context.ts
let audioContext: AudioContext | null = null;

export function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Uživatelské spuštění (nutné kvůli browser policy)
export async function resumeAudio() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

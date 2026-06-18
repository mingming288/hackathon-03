let ctx: AudioContext | null = null;

export function playChime(freq: number, volume: number, enabled: boolean) {
  if (!enabled) return;
  ctx ||= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(Math.max(0.02, volume), now + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
  master.connect(ctx.destination);
  [1, 1.5, 2.01].forEach((ratio, index) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = index === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq * ratio, now + index * 0.05);
    gain.gain.setValueAtTime(0.0001, now + index * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.4 / (index + 2), now + 0.08 + index * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.08 + index * 0.09);
    osc.connect(gain).connect(master);
    osc.start(now + index * 0.05);
    osc.stop(now + 1.38);
  });
}

export function playPlanetChime(freq: number, volume: number, enabled: boolean) {
  if (!enabled) return;
  ctx ||= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = "sine"; // Pure chime tone
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  // Envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1.2);
}

export function playMagic(volume: number, enabled: boolean) {
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
    window.setTimeout(() => playChime(freq, volume * 0.8, enabled), index * 120);
  });
}

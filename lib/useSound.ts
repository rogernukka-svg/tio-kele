// lib/useSound.ts
import { useEffect, useRef } from 'react';

type Options = { volume?: number };

function makeCtx() {
  const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
  return Ctx ? new Ctx() : null;
}

export default function useSound(url: string | null, { volume = 1 }: Options = {}) {
  const bufRef = useRef<AudioBuffer | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const triedRef = useRef(false);

  // Lazy: no creamos context hasta el primer play()
  async function ensureContext() {
    if (!ctxRef.current) ctxRef.current = makeCtx();
    const ctx = ctxRef.current;
    if (ctx && ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
    return ctxRef.current;
  }

  // Pre-carga del buffer (si existe el archivo)
  useEffect(() => {
    if (!url) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) return;
        const arr = await res.arrayBuffer();
        const ctx = await ensureContext();
        if (!ctx) return;
        const buf: AudioBuffer = await new Promise((resolve, reject) => {
          const p = ctx.decodeAudioData(arr, resolve, reject);
          if (p && typeof (p as any).then === 'function') (p as Promise<AudioBuffer>).then(resolve).catch(reject);
        });
        if (alive) bufRef.current = buf;
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [url]);

  const play = async (rate = 1) => {
    triedRef.current = true;
    const ctx = await ensureContext();
    if (!ctx) return;

    // Si no hay buffer (404 o no cargó), generamos un bip corto como fallback
    if (!bufRef.current) {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = Math.max(0.0001, volume * 0.06);
        osc.frequency.value = 420;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } catch {}
      return;
    }

    try {
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.buffer = bufRef.current!;
      src.playbackRate.value = rate;
      src.connect(gain).connect(ctx.destination);
      src.start(0);
    } catch { /* ignore */ }
  };

  return play;
}

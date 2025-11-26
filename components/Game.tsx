'use client';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import useSound from '../lib/useSound';

type Prize = { label: string; payout: number; weight: number };
type Winner = { name: string; amount: number; ts: number };
type Role = 'admin' | 'cashier' | 'user' | null;

/* ===================== Config juego ===================== */
const PRIZES: Prize[] = [
  { label: '💸 ₲0', payout: 0, weight: 62 },
  { label: '🎟 ₲1.000', payout: 1000, weight: 18 },
  { label: '🎉 ₲5.000', payout: 5000, weight: 10 },
  { label: '🏅 ₲10.000', payout: 10000, weight: 6 },
  { label: '💎 ₲50.000', payout: 50000, weight: 3 },
  { label: '👑 ₲100.000', payout: 100000, weight: 1 },
];

const TICKET_PRICE = 1000;
const JACKPOT_BASE = 2_000_000;
const JACKPOT_CUT = 0.40;
const JACKPOT_ODDS = 0.004;

// Tamaños / visual
const SCRATCH_RADIUS = 26;
const PRIZE_FONT_FAMILY = '"Bebas Neue", ui-sans-serif';
const USE_PRIZE_IMAGES = true;

/* ===================== Utils globales ===================== */

// Vibración
const vib = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern as any);
    } catch {}
  }
};

/* ===================== Hook: Música de fondo (BGM) ===================== */
function useBgm(url: string | null, initialVolume = 0.25) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!url || typeof window === 'undefined') return;
    const a = new Audio(url);
    a.loop = true;
    a.preload = 'auto';
    a.volume = initialVolume;
    audioRef.current = a;
    return () => {
      a.pause();
      audioRef.current = null;
    };
  }, [url, initialVolume]);
  const play = async () => {
    try {
      await audioRef.current?.play();
      setEnabled(true);
    } catch {}
  };
  const pause = () => {
    try {
      audioRef.current?.pause();
      setEnabled(false);
    } catch {}
  };
  const toggle = () => (enabled ? pause() : play());
  const setVolume = (v: number) => {
    if (audioRef.current)
      audioRef.current.volume = Math.min(1, Math.max(0, v));
  };
  return { play, pause, toggle, setVolume, enabled };
}

/* ===================== Hook: Sonido en loop simple ===================== */
function useLoopSound(url: string, volume = 0.22) {
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio(url);
    a.loop = true;
    a.preload = 'auto';
    a.volume = volume;
    ref.current = a;
    return () => {
      try {
        a.pause();
      } catch {}
      ref.current = null;
    };
  }, [url, volume]);
  const play = async () => {
    try {
      await ref.current?.play();
    } catch {}
  };
  const stop = () => {
    const a = ref.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {}
  };
  const setVolume = (v: number) => {
    if (ref.current)
      ref.current.volume = Math.min(1, Math.max(0, v));
  };
  return { play, stop, setVolume };
}

/* ===================== Audio unlock robusto ===================== */
function installGlobalAudioUnlock(startFns: Array<() => void>) {
  const tryResume = () => {
    const anyWin = window as any;
    const ctxs: AudioContext[] = anyWin.__audioContexts || [];
    ctxs.forEach((ctx) => {
      if (ctx && ctx.state !== 'running') ctx.resume?.();
    });
    startFns.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
    window.removeEventListener('pointerdown', tryResume);
    window.removeEventListener('touchstart', tryResume);
    window.removeEventListener('keydown', tryResume);
    window.removeEventListener('click', tryResume);
  };
  window.addEventListener('pointerdown', tryResume, {
    once: true,
    passive: true,
  });
  window.addEventListener('touchstart', tryResume, {
    once: true,
    passive: true,
  });
  window.addEventListener('keydown', tryResume, { once: true });
  window.addEventListener('click', tryResume, { once: true });
}

/* ===================== Confetti dorado ===================== */
function boomConfetti(
  node: HTMLElement | null,
  opts: { gold?: boolean; power?: number } = {}
) {
  if (!node) return;
  const { gold = true, power = 1 } = opts;

  const c = document.createElement('canvas');
  c.width = node.clientWidth;
  c.height = node.clientHeight;
  c.style.position = 'absolute';
  c.style.inset = '0';
  c.style.pointerEvents = 'none';
  node.appendChild(c);

  const ctx = c.getContext('2d')!;
  const N = Math.round(140 * power);
  const palette = gold
    ? ['#FACC15', '#FDE68A', '#FBBF24', '#EAB308', '#FFD166']
    : ['#ef4444', '#3b82f6', '#22c55e', '#f97316'];

  const parts = Array.from({ length: N }).map(() => {
    const color = palette[Math.floor(Math.random() * palette.length)];
    const r = (2 + Math.random() * 3) * (gold ? 1.4 * power : 1 * power);
    const vx = (-1 + Math.random() * 2) * (gold ? 1.2 : 1);
    const vy = (2 + Math.random() * 3) * (gold ? 1.2 * power : 1 * power);
    const shape =
      Math.random() < 0.2
        ? 'star'
        : Math.random() < 0.5
        ? 'rect'
        : 'circle';
    return {
      x: Math.random() * c.width,
      y: -20 - Math.random() * 80,
      vx,
      vy,
      r,
      a: 1,
      spin: (Math.random() - 0.5) * 0.25,
      rot: Math.random() * Math.PI,
      color,
      shape,
    };
  });

  (function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.a *= 0.992;
      p.rot += p.spin;

      ctx.globalAlpha = p.a;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = gold ? 12 : 0;
      ctx.fillStyle = p.color;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === 'rect') {
        ctx.fillRect(-p.r * 1.1, -p.r * 0.6, p.r * 2.2, p.r * 1.2);
      } else if (p.shape === 'star') {
        const spikes = 5,
          outer = p.r * 1.8,
          inner = p.r * 0.7;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const rad = (i * Math.PI) / spikes;
          const rr = i % 2 === 0 ? outer : inner;
          ctx.lineTo(Math.cos(rad) * rr, Math.sin(rad) * rr);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    if (parts.some((p) => p.a > 0.05 && p.y < c.height + 20))
      requestAnimationFrame(tick);
    else node.removeChild(c);
  })();
}

/* ===================== Imágenes de premios (opcional) ===================== */
const IMG_CACHE: Record<string, HTMLImageElement> = {};
function loadPrizeImage(key: string) {
  if (IMG_CACHE[key]) return Promise.resolve(IMG_CACHE[key]);
  const img = new Image();
  img.decoding = 'async';
  img.src = `/prizes/${key}.png`;
  return new Promise<HTMLImageElement>((res, rej) => {
    img.onload = () => {
      IMG_CACHE[key] = img;
      res(img);
    };
    img.onerror = rej;
  });
}
function keyFromLabel(label: string) {
  if (label.includes('₲100.000')) return '100k';
  if (label.includes('₲50.000')) return '50k';
  if (label.includes('₲10.000')) return '10k';
  if (label.includes('₲5.000')) return '5k';
  if (label.includes('₲1.000')) return '1k';
  return '0';
}

/* ===================== ScratchCard (1 casilla) ===================== */

type ScratchCardProps = {
  index: number;
  prize: Prize | null;
  ticketActive: boolean;
  onRevealed: (index: number) => void;
  playScratch: () => void;
  stopScratch: () => void;
};

function ScratchCard({
  index,
  prize,
  ticketActive,
  onRevealed,
  playScratch,
  stopScratch,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coverRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [revealed, setRevealed] = useState(false);

  async function ensurePrizeFont(px: number) {
    try {
      await (document as any).fonts?.load(
        `800 ${px}px ${PRIZE_FONT_FAMILY}`
      );
    } catch {}
  }

  const drawPrizeLayer = async (label: string) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, c.width, c.height);

    // Fondo verde oscuro
    const bg = ctx.createLinearGradient(0, 0, c.width, c.height);
    bg.addColorStop(0, '#064E3B');
    bg.addColorStop(1, '#022C22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);

    const PAD = Math.round(Math.min(c.width, c.height) * 0.12);
    const maxW = c.width - PAD * 2;
    const maxH = c.height - PAD * 2;

    const tw = maxW;
    const th = maxH;
    const tx = (c.width - tw) / 2;
    const ty = (c.height - th) / 2;
    const radius = Math.min(14, Math.round(th * 0.18));

    // Ticket interno verde + borde dorado
    const ticketGrad = ctx.createLinearGradient(tx, ty, tx, ty + th);
    ticketGrad.addColorStop(0, '#022C22');
    ticketGrad.addColorStop(1, '#065F46');

    ctx.save();
    ctx.beginPath();
    const r = radius;
    ctx.moveTo(tx + r, ty);
    ctx.lineTo(tx + tw - r, ty);
    ctx.quadraticCurveTo(tx + tw, ty, tx + tw, ty + r);
    ctx.lineTo(tx + tw, ty + th - r);
    ctx.quadraticCurveTo(tx + tw, ty + th, tx + tw - r, ty + th);
    ctx.lineTo(tx + r, ty + th);
    ctx.quadraticCurveTo(tx, ty + th, tx, ty + th - r);
    ctx.lineTo(tx, ty + r);
    ctx.quadraticCurveTo(tx, ty, tx + r, ty);
    ctx.closePath();

    ctx.shadowColor = 'rgba(0,0,0,.4)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = ticketGrad;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FACC15';
    ctx.stroke();
    ctx.restore();

    // Luz suave arriba
    const gloss = ctx.createLinearGradient(0, ty, 0, ty + th * 0.6);
    gloss.addColorStop(0, 'rgba(255,255,255,.16)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(tx + 2, ty + 2, tw - 4, th * 0.55);

    let drewImage = false;
    if (USE_PRIZE_IMAGES) {
      try {
        const img = await loadPrizeImage(keyFromLabel(label));
        const innerPad = Math.round(th * 0.24);
        const iwMax = tw - innerPad * 2;
        const ihMax = th - innerPad * 2;
        const s = Math.min(iwMax / img.width, ihMax / img.height);
        const iw = img.width * s;
        const ih = img.height * s;
        const ix = tx + (tw - iw) / 2;
        const iy = ty + (th - ih) / 2;
        ctx.globalAlpha = 0.98;
        ctx.drawImage(img, ix, iy, iw, ih);
        ctx.globalAlpha = 1;
        drewImage = true;
      } catch {}
    }

    if (!drewImage) {
      const fontPx = Math.floor(th * 0.38);
      await ensurePrizeFont(fontPx);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(250,204,21,.7)';
      ctx.shadowBlur = 18;
      ctx.lineWidth = Math.max(2, Math.floor(fontPx * 0.08));
      ctx.strokeStyle = '#854D0E';
      const tg = ctx.createLinearGradient(0, ty, 0, ty + th);
      tg.addColorStop(0, '#FEF9C3');
      tg.addColorStop(1, '#FACC15');
      ctx.fillStyle = tg;
      ctx.font = `800 ${fontPx}px ${PRIZE_FONT_FAMILY}`;
      const cx = tx + tw / 2;
      const cy = ty + th / 2;
      ctx.strokeText(label, cx, cy);
      ctx.fillText(label, cx, cy);
      ctx.shadowBlur = 0;
    }
  };

  const drawCover = () => {
    const k = coverRef.current;
    if (!k) return;
    const kctx = k.getContext('2d');
    if (!kctx) return;
    kctx.globalCompositeOperation = 'source-over';
    kctx.clearRect(0, 0, k.width, k.height);
    kctx.fillStyle = '#111827';
    kctx.fillRect(0, 0, k.width, k.height);
    kctx.fillStyle = '#1F2937';
    for (let i = 0; i < Math.floor((k.width * k.height) / 900); i++) {
      const x = Math.random() * k.width;
      const y = Math.random() * k.height;
      const r = 2 + Math.random() * 2.6;
      kctx.beginPath();
      kctx.arc(x, y, r, 0, Math.PI * 2);
      kctx.fill();
    }
    kctx.globalCompositeOperation = 'destination-out';
  };

  const computeScratched = () => {
    const k = coverRef.current;
    if (!k) return 0;
    const kctx = k.getContext(
      '2d',
      { willReadFrequently: true } as any
    ) as CanvasRenderingContext2D | null;
    if (!kctx) return 0;
    const img = kctx.getImageData(0, 0, k.width, k.height);
    const total = img.data.length / 4;
    let clear = 0;
    for (let i = 3; i < img.data.length; i += 4)
      if (img.data[i] === 0) clear++;
    return clear / total;
  };

  const scratchAt = (clientX: number, clientY: number) => {
    const k = coverRef.current;
    if (!k) return;
    const rect = k.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const kctx = k.getContext('2d');
    if (!kctx) return;
    kctx.beginPath();
    kctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
    kctx.fill();
  };

  useEffect(() => {
    // Resize + redibujar cuando cambia premio
    const c = canvasRef.current;
    const k = coverRef.current;
    if (!c || !k) return;

    const resize = () => {
      const parent = c.parentElement;
      const rect = parent?.getBoundingClientRect();
      const w = rect ? rect.width : 220;
      const h = Math.max(110, Math.min(160, w * 0.6));
      c.width = w;
      c.height = h;
      k.width = w;
      k.height = h;
      drawCover();
      if (prize) drawPrizeLayer(prize.label);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (c.parentElement) ro.observe(c.parentElement);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prize?.label]);

  useEffect(() => {
    // Nuevo ticket → reset
    setRevealed(false);
    const k = coverRef.current;
    if (k) drawCover();
  }, [prize?.label]);

  const finishReveal = () => {
    if (revealed) return;
    setRevealed(true);
    stopScratch();
    onRevealed(index);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ticketActive || revealed || !prize) return;
    e.preventDefault();
    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    scratchAt(e.clientX, e.clientY);
    playScratch();
    vib(10);
  };

  let lastVib = 0;
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ticketActive || revealed || !isDrawingRef.current) return;
    e.preventDefault();
    scratchAt(e.clientX, e.clientY);
    const now = performance.now();
    if (now - lastVib > 120) {
      vib(4);
      lastVib = now;
    }
    if (Math.random() < 0.2) {
      const pct = computeScratched();
      if (pct >= 0.55) finishReveal();
    }
  };

  const endScratch = () => {
    isDrawingRef.current = false;
    stopScratch();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ticketActive || revealed) return;
    e.preventDefault();
    endScratch();
    const pct = computeScratched();
    if (pct >= 0.55) finishReveal();
  };

  return (
    <div
      className="scratch-card-item"
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top, #064E3B 0%, #022C22 60%, #020617 100%)',
        padding: 4,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', display: 'block', borderRadius: 10 }}
      />
      <canvas
        ref={coverRef}
        style={{
          position: 'absolute',
          inset: 4,
          borderRadius: 10,
          width: 'calc(100% - 8px)',
          height: 'calc(100% - 8px)',
          touchAction: 'none',
          cursor:
            ticketActive && !revealed && prize ? 'pointer' : 'default',
          opacity: revealed ? 0 : 1,
          transition: 'opacity .25s ease-out',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={endScratch}
        onPointerLeave={() => {
          if (isDrawingRef.current) endScratch();
        }}
      />
    </div>
  );
}

/* ===================== Componente principal ===================== */

export default function Game() {
  /* ===== Sesión & rol ===== */
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hash.includes('access_token=')
    ) {
      history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email ?? null);
      if (session?.user?.id) {
        setRoleLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        setRole(
          !error && data?.role ? (data.role as Role) : 'user'
        );
        setRoleLoading(false);
      } else setRole(null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUserEmail(session?.user?.email ?? null);
        if (session?.user?.id) {
          setRoleLoading(true);
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          setRole(
            !error && data?.role ? (data.role as Role) : 'user'
          );
          setRoleLoading(false);
        } else setRole(null);
      }
    );
    return () => {
      sub.subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setRole(null);
  };
  const panelHref =
    role === 'admin' ? '/admin' : role === 'cashier' ? '/cashier' : '/';

  /* ===== Juego ===== */
  const [balance, setBalance] = useState<number>(5000);
  const [jackpot, setJackpot] = useState<number>(JACKPOT_BASE);
  const [winners, setWinners] = useState<Winner[]>([
    { name: 'María A.', amount: 50000, ts: Date.now() - 1000 * 60 * 35 },
    { name: 'Juan G.', amount: 10000, ts: Date.now() - 1000 * 60 * 50 },
  ]);
  const [streak, setStreak] = useState(0); // Pity timer

  // 5 casillas
  const [cardPrizes, setCardPrizes] = useState<Prize[]>([]);
  const [cardRevealed, setCardRevealed] = useState<boolean[]>([]);
  const [ticketResolved, setTicketResolved] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [bonusPct, setBonusPct] = useState<number | null>(null);
  useEffect(() => {
    setBonusPct(Math.floor(Math.random() * 8) + 2);
  }, []);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  /* ===== Sonidos ===== */
  const sTap = useSound('/sfx/tap.wav', { volume: 0.6 });
  const sPrize = useSound('/sfx/win.wav', { volume: 0.85 });
  const scratchLoop = useLoopSound('/sfx/scratch_loop.wav', 0.2);

  /* ===== Música de fondo ===== */
  const bgm = useBgm('/sfx/bgm.wav', 0.22);

  // 🔓 Desbloqueo de audio en el primer gesto
  useEffect(() => {
    installGlobalAudioUnlock([
      () => sTap(1),
      () => bgm.play(),
      () => scratchLoop.play(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatGs = (n: number) =>
    new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0,
    }).format(n);

  const maskName = () => {
    const first = [
      'María',
      'Juan',
      'Pedro',
      'Ana',
      'Luis',
      'Camila',
      'Diego',
      'Sol',
      'Rosa',
      'Mario',
    ];
    const last = ['G.', 'A.', 'L.', 'R.', 'M.', 'P.', 'N.', 'V.', 'D.', 'S.'];
    return `${
      first[Math.floor(Math.random() * first.length)]
    } ${last[Math.floor(Math.random() * last.length)]}`;
  };

  // Elegir un premio según pesos (con pity en racha larga)
  const drawRandomPrize = (): Prize => {
    const boosted = [...PRIZES];
    if (streak >= 6) {
      const i = boosted.findIndex((p) => p.payout === 1000);
      if (i >= 0)
        boosted[i] = {
          ...boosted[i],
          weight: boosted[i].weight + 8,
        };
    }
    const total = boosted.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of boosted) {
      r -= p.weight;
      if (r <= 0) return p;
    }
    return boosted[boosted.length - 1];
  };

  const shortEmail = userEmail
    ? userEmail.length > 26
      ? `${userEmail.slice(0, 12)}…${userEmail.slice(-10)}`
      : userEmail
    : null;
  const roleChip = roleLoading ? 'Cargando…' : role ?? '';

  const visibleTitle = !isActive && !ticketResolved
    ? 'Comprá tu ticket y rascá las 5 casillas'
    : isActive && !ticketResolved
    ? 'Rascá las 5 casillas para revelar tu suerte'
    : ticketResolved
    ? message || 'Resultado del ticket'
    : '—';

  const buyTicket = () => {
    if (isActive) return;
    if (balance < TICKET_PRICE) {
      setMessage('Saldo insuficiente.');
      return;
    }
    sTap();
    setBalance((b) => b - TICKET_PRICE);
    setJackpot((j) => j + Math.floor(TICKET_PRICE * JACKPOT_CUT));

    const prizes = Array.from({ length: 5 }, () => drawRandomPrize());
    setCardPrizes(prizes);
    setCardRevealed(new Array(5).fill(false));
    setTicketResolved(false);
    setIsActive(true);
    setMessage('Rascá las 5 casillas para ver si sacás 3 iguales ✨');
  };

  const handleCardRevealed = (index: number) => {
    setCardRevealed((prev) => {
      const base =
        prev.length === 5 ? [...prev] : new Array(5).fill(false);
      if (base[index]) return prev;
      base[index] = true;
      return base;
    });
  };

  // Resolver ticket cuando las 5 casillas fueron reveladas
  useEffect(() => {
    if (!isActive) return;
    if (cardPrizes.length !== 5) return;
    if (cardRevealed.length !== 5) return;
    if (!cardRevealed.every(Boolean)) return;
    if (ticketResolved) return;

    let paid = 0;

    // Contar labels
    const counts: Record<string, number> = {};
    for (const p of cardPrizes) {
      counts[p.label] = (counts[p.label] || 0) + 1;
    }

    let winnerLabel: string | null = null;
    for (const [label, count] of Object.entries(counts)) {
      const base = PRIZES.find((p) => p.label === label);
      if (count >= 3 && base && base.payout > 0) {
        winnerLabel = label;
        break;
      }
    }

    if (winnerLabel) {
      const winnerPrize =
        PRIZES.find((p) => p.label === winnerLabel) || null;
      if (winnerPrize) {
        paid += winnerPrize.payout;
      }
    }

    // Jackpot opcional si hubo premio
    let winJackpot = false;
    if (paid > 0 && Math.random() < JACKPOT_ODDS) {
      paid += jackpot;
      winJackpot = true;
      setJackpot(JACKPOT_BASE);
    }

    if (paid > 0) {
      sPrize();
      setWinners((w) =>
        [{ name: maskName(), amount: paid, ts: Date.now() }, ...w].slice(
          0,
          6
        )
      );
      const big = paid >= 50000;
      boomConfetti(wrapRef.current, {
        gold: true,
        power: big ? 1.6 : 1.2,
      });
      vib(big ? [12, 100, 12] : 18);
      setBalance((b) => b + paid);
      setStreak(0);
      setMessage(
        `¡Ganaste ${formatGs(
          paid
        )}${winJackpot ? ' + JACKPOT 🎰' : ''}! 🎉`
      );
    } else {
      setStreak((s) => Math.min(s + 1, 6));
      setMessage('No hubo 3 iguales esta vez. ¡Probá de nuevo! ✨');
    }

    setTicketResolved(true);
    setIsActive(false);
  }, [
    isActive,
    cardPrizes,
    cardRevealed,
    ticketResolved,
    jackpot,
    formatGs,
    sPrize,
  ]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (isActive && !ticketResolved) el.classList.add('active');
    else el.classList.remove('active');
  }, [isActive, ticketResolved]);

  return (
    <div
      ref={wrapRef}
      className="container"
      style={{ position: 'relative' }}
    >
      {/* HEADER */}
      <div
        className="header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background:
            'linear-gradient(90deg, #064E3B 0%, #16A34A 50%, #15803D 100%)',
          color: '#ECFDF5',
          padding: '10px 20px',
          borderRadius: '12px',
          marginBottom: '16px',
        }}
      >
        {/* 🎭 Logo + Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="logo" style={{ fontSize: 26 }}>
            🎭
          </div>
          <div style={{ fontWeight: 900, fontSize: 20 }}>
            <span>Joker</span>
            <span
              className="text-gold"
              style={{ color: '#FACC15', marginLeft: 2 }}
            >
              Pay
            </span>
          </div>
        </div>

        {/* 🔊 Controles y usuario */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn"
            onClick={bgm.toggle}
            title={bgm.enabled ? 'Silenciar música' : 'Activar música'}
          >
            {bgm.enabled ? '🔊 Música' : '🔇 Mudo'}
          </button>

          {shortEmail ? (
            <>
              <span className="btn btn-pill" title={userEmail || ''}>
                👤 {shortEmail}
              </span>
              {role && (
                <>
                  <span className="btn btn-pill" title="Rol del perfil">
                    🔑 {roleChip}
                  </span>
                  <a className="btn btn-gold" href={panelHref}>
                    {role === 'admin'
                      ? 'Ir al panel Admin'
                      : role === 'cashier'
                      ? 'Ir al panel Cajero'
                      : 'Ir al inicio'}
                  </a>
                </>
              )}
              <button className="btn" onClick={handleSignOut}>
                Salir
              </button>
            </>
          ) : (
            <a href="/login" className="btn btn-gold">
              Iniciar sesión
            </a>
          )}
        </div>
      </div>

      {/* HERO */}
      <div
        className="card-strong"
        style={{
          marginBottom: 16,
          background:
            'radial-gradient(circle at top, #022C22 0%, #064E3B 40%, #020617 100%)',
          color: '#ECFDF5',
        }}
      >
        <h1
          style={{
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: 0.5,
          }}
        >
          PREMIO MAYOR{' '}
          <span
            className="text-gold"
            style={{ color: '#FACC15' }}
          >
            Gs. 5.000.000
          </span>
        </h1>
        <p
          className="text-muted"
          style={{ maxWidth: 900, marginTop: 8, color: '#A7F3D0' }}
        >
          Rascá <b>5 casillas</b> en segundos y si sacás{' '}
          <b>3 iguales</b>, cobrás. Partidas rápidas desde Gs. 1.000.{' '}
          <b>Tu suerte, tu momento.</b>
        </p>
        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-gold pulse"
            onClick={() => {
              bgm.play();
              buyTicket();
            }}
            disabled={isActive}
          >
            {isActive ? 'Rascá ahora' : 'Probar ahora'}
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="main-grid">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div className="card">
            <div className="small">JACKPOT ACTUAL</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 28,
                color: '#15803D',
              }}
            >
              {formatGs(jackpot)}
            </div>
            <div className="small">Crece con cada jugada.</div>
          </div>
          <div className="card">
            <div className="small">SALDO</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 28,
                color: '#065F46',
              }}
            >
              {formatGs(balance)}
            </div>
          </div>
          <div className="card">
            <div className="small">COSTO X TICKET</div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 28,
                color: '#F59E0B',
              }}
            >
              {formatGs(1000)}
            </div>
          </div>
          <div className="card">
            <div
              className="small"
              style={{ marginBottom: 8 }}
            >
              GANADORES RECIENTES
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                rowGap: 8,
              }}
            >
              {winners.map((w, i) => (
                <React.Fragment key={i}>
                  <div>{w.name}</div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: '#16A34A',
                    }}
                  >
                    {formatGs(w.amount)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="small">RACHA</div>
            <div
              style={{ fontWeight: 900, fontSize: 22 }}
            >
              {streak === 0
                ? '¡En racha positiva! ✨'
                : `${streak} sin premio`}
            </div>
            {streak >= 6 && (
              <div className="small text-gold">
                ¡Próxima jugada con boost!
              </div>
            )}
          </div>
        </div>

        <div>
          <div
            className="card"
            style={{ marginBottom: 16 }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {visibleTitle}
            </div>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => {
                  bgm.play();
                  buyTicket();
                }}
                className="btn btn-gold"
                disabled={isActive}
              >
                {isActive ? 'Rascá ahora' : 'Comprar'}
              </button>
              {bonusPct !== null && (
                <span
                  className="btn btn-pill"
                  style={{ fontSize: 12 }}
                >
                  {`Bonus +${bonusPct}% 🎁`}
                </span>
              )}
            </div>
          </div>

          <div className="scratch-wrap card">
            <div
              className="scratch-grid"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(5, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {cardPrizes.length === 5 ? (
                cardPrizes.map((p, i) => (
                  <ScratchCard
                    key={i}
                    index={i}
                    prize={p}
                    ticketActive={isActive && !ticketResolved}
                    onRevealed={handleCardRevealed}
                    playScratch={scratchLoop.play}
                    stopScratch={scratchLoop.stop}
                  />
                ))
              ) : (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        borderRadius: 14,
                        background:
                          'repeating-linear-gradient(135deg,#020617,#020617 6px,#111827 6px,#111827 12px)',
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6B7280',
                        fontSize: 12,
                        textAlign: 'center',
                        padding: 8,
                      }}
                    >
                      Comprá un ticket
                      <br />
                      para habilitar
                    </div>
                  ))}
                </>
              )}
            </div>

            {message && (
              <div
                className="card"
                style={{ marginTop: 12 }}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS mínimo incrustado */}
      <style jsx global>{`
        .btn.btn-gold.pulse:not([disabled]) {
          animation: rp-pulse 1.8s ease-in-out infinite;
        }
        @keyframes rp-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }
        .scratch-wrap {
          box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.55);
          transition: box-shadow 0.3s;
        }
        .scratch-wrap.active {
          box-shadow: 0 0 32px 0 rgba(22, 163, 74, 0.45);
        }
        .scratch-wrap canvas {
          display: block;
        }
      `}</style>
    </div>
  );
}

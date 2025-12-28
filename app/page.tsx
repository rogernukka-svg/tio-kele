'use client';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import useSound from '../lib/useSound';

/* ===================== TIPOS ===================== */
type Prize = {
  key: string;        // nombre interno
  image: string;      // imagen revelada
  payout: number;     // dinero
  bonus: number;      // bonus
  weight: number;     // probabilidad
  special?: string;   // premios especiales
};

type Winner = { name: string; amount: number; ts: number };
type Role = 'admin' | 'cashier' | 'user' | null;

/* ===================== CONFIGURACIÓN ===================== */

const PRIZES: Prize[] = [
  // ================= FILA 1 =================
  { key: "tiokele", image: "/figures/tiokele.png", payout: 100000, bonus: 0, weight: 1 },
  { key: "alfaro", image: "/figures/alfaro.png", payout: 30000, bonus: 0, weight: 1 },
  { key: "aliana", image: "/figures/aliana.png", payout: 20000, bonus: 0, weight: 1 },
  { key: "bachi", image: "/figures/bachi.png", payout: 30000, bonus: 0, weight: 1 },
  { key: "beto", image: "/figures/beto.png", payout: 10000, bonus: 0, weight: 1 },
  { key: "blas", image: "/figures/blas.png", payout: 40000, bonus: 0, weight: 1 },
  { key: "busarquis", image: "/figures/busarquis.png", payout: 0, bonus: 2, weight: 1 },
  { key: "casa_pentium", image: "/figures/casapentium.png", payout: 0, bonus: 0, weight: 1, special: "1 karaoke" },
  { key: "castilloni", image: "/figures/castilloni.png", payout: 0, bonus: 0, weight: 1 },

  // ================= FILA 2 =================
  { key: "celeste", image: "/figures/celeste.png", payout: 40000, bonus: 0, weight: 1 },
  { key: "chaquenito", image: "/figures/chaquenito.png", payout: 20000, bonus: 0, weight: 1 },
  { key: "chila", image: "/figures/chila.png", payout: 0, bonus: 3, weight: 1 },
  { key: "comodin", image: "/figures/comodin.png", payout: 0, bonus: 0, weight: 1, special: "JOKER" },
  { key: "desire", image: "/figures/desire.png", payout: 0, bonus: 0, weight: 1 },
  { key: "efrain", image: "/figures/efrain.png", payout: 0, bonus: 0, weight: 1 },
  { key: "esperanza", image: "/figures/esperanza.png", payout: 0, bonus: 0, weight: 1 },
  { key: "estigarribia", image: "/figures/estigarribia.png", payout: 10000, bonus: 0, weight: 1 },
  { key: "euclides", image: "/figures/euclides.png", payout: 5000, bonus: 0, weight: 1 },

  // ================= FILA 3 =================
  { key: "franco", image: "/figures/franco.png", payout: 0, bonus: 0, weight: 1 },
  { key: "goyo", image: "/figures/goyo.png", payout: 0, bonus: 0, weight: 1 },
  { key: "horacio", image: "/figures/horacio.png", payout: 50000, bonus: 0, weight: 1 },
  { key: "kachulo", image: "/figures/kachulo.png", payout: 0, bonus: 0, weight: 1, special: "5 kg de costilla" },
  { key: "kale", image: "/figures/kale.png", payout: 1000, bonus: 0, weight: 1 },
  { key: "katya", image: "/figures/katya.png", payout: 0, bonus: 2, weight: 1 },
  { key: "latorre", image: "/figures/latorre.png", payout: 0, bonus: 2, weight: 1 },
  { key: "lugo", image: "/figures/lugo.png", payout: 60000, bonus: 0, weight: 1 },
  { key: "marito", image: "/figures/marito.png", payout: 0, bonus: 0, weight: 1 },

  // ================= FILA 4 =================
  { key: "miguel", image: "/figures/miguel.png", payout: 0, bonus: 1, weight: 1 },
  { key: "nakayama", image: "/figures/nakayama.png", payout: 0, bonus: 3, weight: 1 },
  { key: "nenecho", image: "/figures/nenecho.png", payout: 0, bonus: 3, weight: 1 },
  { key: "nicanor", image: "/figures/nicanor.png", payout: 0, bonus: 0, weight: 1 },
  { key: "payo", image: "/figures/payo.png", payout: 50000, bonus: 0, weight: 1 },
  { key: "portillo", image: "/figures/portillo.png", payout: 0, bonus: 1, weight: 1 },
  { key: "riera", image: "/figures/riera.png", payout: 0, bonus: 1, weight: 1 },
  { key: "santi", image: "/figures/santi.png", payout: 0, bonus: 1, weight: 1 },
  { key: "sole", image: "/figures/sole.png", payout: 40000, bonus: 0, weight: 1 },

  // ================= FILA 5 =================
  { key: "toro", image: "/figures/toro.png", payout: 70000, bonus: 0, weight: 1 },
  { key: "zacarias", image: "/figures/zacarias.png", payout: 0, bonus: 0, weight: 1 },
];





const TICKET_PRICE = 1000;
const JACKPOT_BASE = 2_000_000;
const JACKPOT_CUT = 0.40;
const JACKPOT_ODDS = 0.004;

const SCRATCH_RADIUS = 18;


/* ===================== Vibración ===================== */
const vib = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(pattern as any); } catch {}
  }
};

/* ===================== Hooks de sonido ===================== */
function useBgm(url: string | null, initialVolume = 0.25) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.loop = true;
    a.volume = initialVolume;
    audioRef.current = a;
    return () => a.pause();
  }, [url]);

  return {
    play: async () => { try { await audioRef.current?.play(); setEnabled(true); } catch {} },
    pause: () => { audioRef.current?.pause(); setEnabled(false); },
    enabled,
  };
}

/* ===================== Scratch super preciso ===================== */
function useScratchSound(url: string, volume = 0.25) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const a = new Audio(url);
    a.loop = true;
    a.volume = volume;
    audioRef.current = a;

    return () => {
      try { a.pause(); } catch {}
    };
  }, [url, volume]);

  const play = () => {
    if (!audioRef.current) return;
    if (isPlaying) return;

    // ⭐ arranca en parte fuerte del sonido
    audioRef.current.currentTime = 0.05;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const stop = () => {
    if (!audioRef.current) return;
    if (!isPlaying) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  return { play, stop };
}

/* ===================== Loop genérico (otros sonidos) ===================== */
function useLoopSound(url: string, volume = 0.22) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio(url);
    a.loop = true;
    a.volume = volume;
    ref.current = a;
    return () => { try { a.pause(); } catch {} };
  }, [url, volume]);

  return {
    play: async () => { try { await ref.current?.play(); } catch {} },
    stop: () => {
      if (!ref.current) return;
      try {
        ref.current.pause();
        ref.current.currentTime = 0;
      } catch {}
    },
  };
}

/* ===================== Desbloqueo global ===================== */
function installGlobalAudioUnlock(startFns: Array<() => void>) {
  const resume = () => {
    startFns.forEach(f => { try { f(); } catch {} });
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('touchstart', resume);
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('touchstart', resume, { once: true });
}

/* ===================== CONFETTI ===================== */
function boomConfetti(node: HTMLElement | null) {
  if (!node) return;
  const c = document.createElement("canvas");
  c.style.position = "absolute";
  c.style.inset = "0";
  c.style.pointerEvents = "none";
  node.appendChild(c);

  const ctx = c.getContext("2d")!;
  c.width = node.clientWidth;
  c.height = node.clientHeight;

  const img = new Image();
  img.src = "/scratch/test.png";

  img.onload = () => {
    const pieces = Array.from({ length: 90 }).map(() => {
      const size = 24 + Math.random() * 26;
      return {
        x: Math.random() * c.width,
        y: Math.random() * -120,
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 4,
        a: 1,
        size,
        rotation: Math.random() * 360,
        vr: -6 + Math.random() * 12,
      };
    });

    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        p.a *= 0.985;

        ctx.globalAlpha = p.a;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (pieces.some(p => p.a > 0.05)) requestAnimationFrame(tick);
      else node.removeChild(c);
    };

    tick();
  };
}

/* ===================== ScratchCard FINAL ===================== */
type ScratchCardProps = {
  index: number;
  prize: Prize | null;
  ticketActive: boolean;
  onRevealed: (i: number) => void;
  playScratch: () => void;
  stopScratch: () => void;
  winningCells: number[];
};

function ScratchCard({
  index,
  prize,
  ticketActive,
  onRevealed,
  playScratch,
  stopScratch,
  winningCells,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coverRef = useRef<HTMLCanvasElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const drawing = useRef(false);
  const isWinner = winningCells.includes(index);

  /* ===================== COVER ===================== */
  const drawCover = () => {
    const k = coverRef.current;
    if (!k) return;
    const ctx = k.getContext("2d")!;
    const coverImg = new Image();
    coverImg.src = "/scratch/raspe.png";

    coverImg.onload = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(coverImg, 0, 0, k.width, k.height);
      ctx.globalCompositeOperation = "destination-out";
    };
  };

  /* ===================== SCRATCH ===================== */
  const scratch = (x: number, y: number) => {
    const k = coverRef.current;
    if (!k) return;
    const ctx = k.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  };

  const computePct = () => {
    const k = coverRef.current;
    if (!k) return 0;
    const ctx = k.getContext("2d")!;
    const img = ctx.getImageData(0, 0, k.width, k.height);
    let clear = 0;
    for (let i = 3; i < img.data.length; i += 4) {
      if (img.data[i] === 0) clear++;
    }
    return clear / (img.data.length / 4);
  };

  const finish = () => {
    if (!revealed) {
      setRevealed(true);
      stopScratch();
      onRevealed(index);
    }
  };

  /* ===================== POINTER EVENTS ===================== */
  const pointerDown = (e: React.PointerEvent) => {
    if (!ticketActive || revealed) return;
    drawing.current = true;
    const r = coverRef.current!.getBoundingClientRect();
    scratch(e.clientX - r.left, e.clientY - r.top);
    playScratch();
    vib(10);
  };

  const pointerMove = (e: React.PointerEvent) => {
    if (!drawing.current || !ticketActive || revealed) return;
    const r = coverRef.current!.getBoundingClientRect();
    scratch(e.clientX - r.left, e.clientY - r.top);
    if (computePct() > 0.72) finish();
  };

  const pointerUp = () => {
    drawing.current = false;
    stopScratch();
    if (computePct() > 0.72) finish();
  };

  /* ===================== CANVAS SETUP (ANTI NEGRO) ===================== */
  useEffect(() => {
    const c = canvasRef.current;
    const k = coverRef.current;
    if (!c || !k) return;

    const resize = () => {
      const parent = c.parentElement!;
      const w = parent.clientWidth;
      const h = Math.round(w * 1.25);

      c.width = w;
      c.height = h;
      k.width = w;
      k.height = h;

      // 🟢 Fondo seguro SIEMPRE (nunca negro)
      const ctx = c.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#020617"; // mismo color de tu UI
      ctx.fillRect(0, 0, w, h);

      drawCover();

      if (prize) {
        const img = new Image();
        img.src = prize.image;

        img.onload = () => {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
        };

        img.onerror = () => {
          // fallback si la imagen falla
          ctx.fillStyle = "#020617";
          ctx.fillRect(0, 0, w, h);
        };
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c.parentElement!);
    return () => ro.disconnect();
  }, [prize]);

  /* ===================== RENDER ===================== */
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        border: "3px solid #FACC15",
        boxShadow: isWinner ? "0 0 16px rgba(250,204,21,0.9)" : undefined,
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%" }} />

      <canvas
        ref={coverRef}
        style={{
          position: "absolute",
          inset: 0,
          touchAction: "none",
          opacity: revealed ? 0 : 1,
          transition: "opacity .25s",
        }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      />
    </div>
  );
}


/* ===================== Componente principal ===================== */

export default function Game() {
  const [showSplash, setShowSplash] = useState(true);

  // ================= SPLASH ANIMACIÓN =================
  useEffect(() => {
    const canvas = document.getElementById("matrix") as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function resizeMatrix() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeMatrix();
    window.addEventListener("resize", resizeMatrix);

    const letters = "TIO KELE";
    const fontSize = 18;
    let columns = canvas.width / fontSize;
    let drops = Array(Math.floor(columns)).fill(1);

    function drawMatrix() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#6bff6b";
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(drawMatrix, 40);
    return () => clearInterval(interval);
  }, []);

// ================= PORCENTAJE HASTA 300 =================
useEffect(() => {
  let pct = 1;
  const pctEl = document.getElementById("percentText");
  const lineEl = document.querySelector(".loader-line") as HTMLDivElement | null;

  if (pctEl) {
    const el = pctEl as HTMLElement;

    // ⭐ CENTRADO Y DESTACADO
    el.style.position = "absolute";
    el.style.left = "50%";
    el.style.top = "85%";
    el.style.transform = "translateX(-50%)";
    el.style.color = "#ffdb4d";
    el.style.textShadow =
      "0 0 10px #ffdb4d, 0 0 22px #ffaf00, 0 0 30px #ff9000";
    el.style.fontWeight = "900";
    el.style.fontSize = "36px";
    el.style.zIndex = "10";
    el.style.animation = "pulsePct 1.4s infinite ease-in-out";
  }

  const pctTimer = setInterval(() => {
    pct += Math.floor(Math.random() * 6) + 2;
    if (pct > 300) pct = 300;

    if (pctEl) pctEl.textContent = pct + "%";

    if (lineEl) {
      const visualWidth = Math.min(pct, 100);
      lineEl.style.width = visualWidth + "%";
    }

    // ⭐ CUANDO LLEGA A 300 → Glow + explosión + fade-out
    if (pct === 300 && pctEl) {
      const el = pctEl as HTMLElement;

      // detener la animación normal
      el.style.animation = "none";

      // activar la explosión final
      el.style.animation = "finalGlow 1.1s forwards ease-out";
    }

    // ⭐ Cambia a la app un poquito después de la explosión
    if (pct >= 300) {
      clearInterval(pctTimer);
      setTimeout(() => setShowSplash(false), 1150);
    }
  }, 110);

  return () => clearInterval(pctTimer);
}, []);

  /* ===== Sesión & rol ===== */
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash.includes("access_token=")
    ) {
      history.replaceState(
        null,
        "",
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
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        setRole(!error && data?.role ? (data.role as Role) : "user");
        setRoleLoading(false);
      } else {
        setRole(null);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUserEmail(session?.user?.email ?? null);

        if (session?.user?.id) {
          setRoleLoading(true);

          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle();

          setRole(!error && data?.role ? (data.role as Role) : "user");
          setRoleLoading(false);
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      sub.subscription?.unsubscribe();
    };
  }, []);

 // ⭐ LLUVIA MASIVA + MICRO EXPLOSIONES DESPUÉS DEL SPLASH ⭐
useEffect(() => {
  if (showSplash) return;

  const container = document.getElementById("rain-money");
  if (!container) return;

  const bills = [
    "/DOLAR.png",
    "/DOLAR1.png",
    "/DOLAR2.png",
    "/DOLAR3.png",
    "/DOLAR4.png",
    "/DOLAR5.png",
    "/DOLAR6.png",
    "/DOLAR7.png",
  ];

  /* ===========================
    🟩 1) LLUVIA MASIVA
  ============================ */
  const totalDrops = 160; // ACADEMIA RAS-PAY: lluvia intensa
  for (let i = 0; i < totalDrops; i++) {
    setTimeout(() => {
      const drop = document.createElement("img");
      drop.src = bills[Math.floor(Math.random() * bills.length)];

      drop.style.position = "absolute";
      drop.style.top = "-140px";
      drop.style.left = Math.random() * 100 + "%";
      drop.style.width = 35 + Math.random() * 55 + "px";
      drop.style.opacity = "0.9";
      drop.style.pointerEvents = "none";
      drop.style.zIndex = "9999";

      // Caída más larga → más lluvia en pantalla
      drop.style.animation = `moneyRainFall ${2.2 + Math.random() * 1.8}s linear`;

      container.appendChild(drop);
      drop.addEventListener("animationend", () => drop.remove());
    }, Math.random() * 1200); // abanico en el tiempo
  }

  /* ===========================
    🔥 2) MICRO EXPLOSIONES LATERALES
  ============================ */
  const microExplosion = (xPercent: number, delay: number) => {
    setTimeout(() => {
      for (let i = 0; i < 14; i++) {
        const im = document.createElement("img");
        im.src = bills[Math.floor(Math.random() * bills.length)];

        im.style.position = "absolute";
        im.style.top = "50%";
        im.style.left = xPercent + "%";
        im.style.width = 40 + Math.random() * 40 + "px";
        im.style.opacity = "0.95";
        im.style.zIndex = "9999";

        const angle = Math.random() * 360;
        const dist = 80 + Math.random() * 160;

        im.animate(
          [
            {
              transform: "translate(0, 0) scale(1) rotate(0deg)",
              opacity: 1,
            },
            {
              transform: `translate(${Math.cos(angle) * dist}px, ${
                Math.sin(angle) * dist
              }px) rotate(${Math.random() * 360 - 180}deg)`,
              opacity: 0,
            },
          ],
          {
            duration: 1700 + Math.random() * 600,
            easing: "cubic-bezier(0.22, 0.62, 0.2, 1)",
            fill: "forwards",
          }
        );

        container.appendChild(im);
        setTimeout(() => im.remove(), 2500);
      }
    }, delay);
  };

  // ⭐ Explosión izquierda + derecha + centro
  microExplosion(20, 300);
  microExplosion(80, 600);
  microExplosion(50, 900);

}, [showSplash]);



  const panelHref =
    role === "admin" ? "/admin" : role === "cashier" ? "/cashier" : "/";
// ===== BONUS =====
const [bonusLeft, setBonusLeft] = useState(3);
const MAX_BONUS = 3;

  /* ===== Juego ===== */
  const [balance, setBalance] = useState<number>(5000);
  const [jackpot, setJackpot] = useState<number>(JACKPOT_BASE);
  const [winners, setWinners] = useState<Winner[]>([
    { name: "María A.", amount: 50000, ts: Date.now() - 1000 * 60 * 35 },
    { name: "Juan G.", amount: 10000, ts: Date.now() - 1000 * 60 * 50 },
  ]);
  const [streak, setStreak] = useState(0);

  const [cardPrizes, setCardPrizes] = useState<Prize[]>([]);
  const [cardRevealed, setCardRevealed] = useState<boolean[]>([]);
  const [ticketResolved, setTicketResolved] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [ticketId, setTicketId] = useState(0);
  const [winningCells, setWinningCells] = useState<number[]>([]); // ⭐ NUEVO


  const [bonusPct, setBonusPct] = useState<number | null>(null);
  useEffect(() => {
    setBonusPct(Math.floor(Math.random() * 8) + 2);
  }, []);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  /* Rankings */
  const monthlyWinners = [
    { name: "Carlos D.", shares: 42 },
    { name: "Ana R.", shares: 39 },
    { name: "Luis V.", shares: 31 },
    { name: "Jenny L.", shares: 28 },
    { name: "Pedro S.", shares: 26 },
  ];

  const dailyWinners = [
    { name: "María A.", shares: 12 },
    { name: "Juan G.", shares: 10 },
    { name: "Pedro L.", shares: 9 },
    { name: "Ana R.", shares: 7 },
    { name: "Luis M.", shares: 5 },
  ];

  const weeklyWinners = [
    { name: "Miguel T.", shares: 14 },
    { name: "Sofi M.", shares: 12 },
    { name: "Arturo L.", shares: 9 },
    { name: "Gabi F.", shares: 8 },
    { name: "Leo A.", shares: 7 },
  ];

  /* Sonidos */
  const sTap = useSound("/sfx/tap.wav", { volume: 0.6 });
  const sPrize = useSound("/sfx/win.wav", { volume: 0.85 });
  const scratchLoop = useScratchSound("/sfx/scratch_loop.mp3", 0.32);
  const sLose = useSound("/sfx/perdida.wav", { volume: 0.8 });


  /* Música */
const bgm = useBgm("/sfx/bgm.wav", 0.22);

useEffect(() => {
  installGlobalAudioUnlock([
    () => sTap(1),   // desbloquea audio
    () => bgm.play() // música de fondo
    // ❌ NO scratchLoop acá
  ]);
}, []);


const formatGs = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
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

  const visibleTitle =
    !isActive && !ticketResolved
      ? 'RASPA Y GANA'
      : isActive && !ticketResolved
      ? 'Rascá las 6 casillas para revelar tu suerte'
      : ticketResolved
      ? message || 'Resultado del ticket'
      : '—';

  const buyTicket = () => {
  if (bonusLeft <= 0) {
    setMessage("Tu bono terminó. Reinicia para volver a jugar.");
    return;
  }

  if (isActive) return;

  if (balance < TICKET_PRICE) {
    setMessage("Saldo insuficiente.");
    return;
  }

  sTap();
  setBalance((b) => b - TICKET_PRICE);
  setJackpot((j) => j + Math.floor(TICKET_PRICE * JACKPOT_CUT));

  setBonusLeft((b) => b - 1);

  const prizes = Array.from({ length: 6 }, () => drawRandomPrize());
  setCardPrizes(prizes);
  setCardRevealed(new Array(6).fill(false));

  // ⭐ AGREGADO IMPORTANTE
  setWinningCells([]);          // Limpia las casillas ganadoras

  setTicketResolved(false);
  setIsActive(true);
  setTicketId((id) => id + 1);

  setMessage(`Te quedan ${bonusLeft - 1} intentos.`);
};



  const handleCardRevealed = (index: number) => {
    setCardRevealed((prev) => {
      const base =
        prev.length === 6 ? [...prev] : new Array(6).fill(false);
      if (base[index]) return prev;
      base[index] = true;
      return base;
    });
  };

  // Resolver ticket cuando las 6 casillas fueron reveladas
  useEffect(() => {
    if (!isActive) return;
    if (cardPrizes.length !== 6) return;
    if (cardRevealed.length !== 6) return;
    if (!cardRevealed.every(Boolean)) return;
    if (ticketResolved) return;

    let paid = 0;

    // Contar keys
const counts: Record<string, number> = {};
let jokers = 0;

cardPrizes.forEach((p) => {
  if (p.key === "comodin") {
    jokers++;
  } else {
    counts[p.key] = (counts[p.key] || 0) + 1;
  }
});

let winnerKey: string | null = null;

for (const key in counts) {
  const base = PRIZES.find((p) => p.key === key);
  if (!base || base.payout <= 0) continue;

  if (counts[key] + jokers >= 3) {
    winnerKey = key;
    break;
  }
}


if (winnerKey) {
  const winnerPrize = PRIZES.find((p) => p.key === winnerKey) || null;
  if (winnerPrize) {
    paid += winnerPrize.payout;
  }
}
// ⭐ NUEVO: obtener las casillas ganadoras
const winningIndexes: number[] = [];
for (let i = 0; i < cardPrizes.length; i++) {
  if (cardPrizes[i].key === winnerKey) winningIndexes.push(i);
}
// 👉 Guardar las casillas ganadoras en el estado
setWinningCells(winningIndexes);


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
boomConfetti(wrapRef.current);
vib(big ? [12, 100, 12] : 18);

      vib(big ? [12, 100, 12] : 18);
      setBalance((b) => b + paid);
      setStreak(0);
      setMessage(
        `¡Ganaste ${formatGs(
          paid
        )}${winJackpot ? ' + JACKPOT 🎰' : ''}! 🎉`
      );
   } else {
  sLose(); // 🔊 SONIDO DE PÉRDIDA

  setStreak((s) => Math.min(s + 1, 6));
  setMessage('No hubo 3 iguales esta vez. ¡Probá de nuevo! ✨');

  document.body.classList.add("no-win");
  setTimeout(() => document.body.classList.remove("no-win"), 800);
}



    setTicketResolved(true);
    setIsActive(false);
    // ⭐ OCULTAR TODAS LAS TAPAS (covers) DEL SCRATCH CUANDO TERMINA EL TICKET
setTimeout(() => {
  const covers = document.querySelectorAll("canvas[style*='absolute']");
  covers.forEach((c) => {
    (c as HTMLCanvasElement).style.opacity = "0";
  });
}, 50);

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

  // 💥 EXPLOSIÓN + LLUVIA — versión react mejorada
  useEffect(() => {
    const container = document.getElementById('money-explosion');
    
    if (!container) return;

    const bills = [
      '/DOLAR.png',
      '/DOLAR1.png',
      '/DOLAR2.png',
      '/DOLAR3.png',
      '/DOLAR4.png',
      '/DOLAR5.png',
      '/DOLAR6.png',
      '/DOLAR7.png',
    ];

    /* =============================
        🔥 EXPLOSIÓN LENTA
    ============================== */
    function launchExplosion() {
      for (let i = 0; i < 14; i++) {
        const img = document.createElement('img');
        img.src = bills[Math.floor(Math.random() * bills.length)];

        img.style.position = 'absolute';
        img.style.width = Math.random() * 40 + 40 + 'px';
        img.style.left = '50%';
        img.style.top = '50%';
        img.style.transform = 'translate(-50%, -50%)';
        img.style.opacity = '0.95';
        img.style.zIndex = '1';

        const angle = Math.random() * 360;
        const distance = Math.random() * 260 + 100;

        // 🔥 Explosión más lenta (2.8s)
        img.animate(
          [
            {
              transform: 'translate(-50%,-50%) scale(1) rotate(0deg)',
              opacity: 1,
            },
            {
              transform:
                'translate(' +
                Math.cos(angle) * distance +
                'px,' +
                Math.sin(angle) * distance +
                'px) rotate(' +
                (Math.random() * 500 - 250) +
                'deg)',
              opacity: 0,
            },
          ],
          {
            duration: 2800,
            easing: 'cubic-bezier(0.2,0.8,0.3,1)',
            fill: 'forwards',
          }
        );

        container.appendChild(img);
        setTimeout(() => img.remove(), 3500);
      }
    }

    /* =============================
        🌧️ LLUVIA AL FINAL
    ============================== */
    function rainFall() {
      for (let i = 0; i < 12; i++) {
        const drop = document.createElement('img');
        drop.src = bills[Math.floor(Math.random() * bills.length)];

        drop.style.position = 'absolute';
        drop.style.top = '-80px';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.width = Math.random() * 28 + 32 + 'px';
        drop.style.opacity = '0.95';
        drop.style.zIndex = '1';

        drop.style.animation = `moneyRainFall ${
          2.5 + Math.random()
        }s linear`;

        container.appendChild(drop);
        drop.addEventListener('animationend', () => drop.remove());
      }
    }

    /* =============================
          🔁 BUCLE INFINITO
    ============================== */
    function cycle() {
      launchExplosion();

      // lluvia después de la explosión (delay 2.8s)
      setTimeout(() => {
        rainFall();
      }, 2800);
    }

    cycle(); // primera vez
    const interval = setInterval(cycle, 5500); // más lento

    return () => clearInterval(interval);
  }, []);
if (showSplash) {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      overflow: "hidden",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>

      {/* === Fondo Matrix === */}
      <canvas
        id="matrix"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
        }}
      />

      {/* Logo */}
      <img
        src="/servidor/logo.png"
        className="logo"
        style={{
          width: "clamp(250px, 50vw, 420px)",
          zIndex: 2,
          filter: "drop-shadow(0 0 15px #00ff88)",
          marginBottom: 10
        }}
      />

      <div
        className="subtitle"
        style={{
          fontSize: "clamp(18px,4vw,32px)",
          color: "#ffe600",
          textShadow: "0 0 10px black",
          marginBottom: 20,
          letterSpacing: 3,
          fontWeight: "bold",
          zIndex: 2
        }}
      >
        CARGANDO INFORMACIÓN...
      </div>

      {/* Contenedor animación */}
      <div
        className="loader-container"
        style={{
          position: "relative",
          width: "80%",
          maxWidth: 600,
          textAlign: "center",
          zIndex: 2,
          marginTop: 20
        }}
      >

        {/* Van animada */}
        <img
          src="/servidor/tiokele.png"
          className="tiokele"
          style={{
            width: 140,
            position: "absolute",
            top: -110,
            left: 0,
            transform: "translateX(-50%)",
            animation: "moveVan 4s linear forwards",
            zIndex: 3
          }}
        />

        {/* Porcentaje */}
        <div
          id="percentText"
          className="percent-text"
          style={{
            position: "absolute",
            top: 70,
            left: 0,
            transform: "translateX(-50%)",
            fontSize: 26,
            fontWeight: "bold",
            color: "#fff",
            textShadow: "0 0 5px #00ff88",
            zIndex: 3,
            animation: "moveText 4s linear forwards"
          }}
        >
          1%
        </div>

        {/* Barra */}
        <div
          className="loader"
          style={{
            width: "100%",
            height: 10,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 10,
            overflow: "hidden",
            marginTop: 80
          }}
        >
          <div
            className="loader-line"
            style={{
              height: "100%",
              width: "0%",
              background: "#ffffff",
              borderRadius: 10,
              boxShadow: "0 0 12px #ffffff",
              animation: "load 4s linear forwards",
            }}
          />
        </div>
      </div>

      {/* CSS global exacto del HTML */}
      
     <style jsx global>{`
  .btn.btn-gold.pulse:not([disabled]) {
    animation: rp-pulse 1.8s ease-in-out infinite;
  }

  @keyframes rp-pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.04);
    }
  }

  .scratch-wrap {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.55);
    transition: box-shadow 0.3s;
    background: #020617;
    border-radius: 14px;
    padding: 8px;
  }
`}
</style>

    </div>
  );
}

  return (
  <div
    ref={wrapRef}
    className="container"
    style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#00120B',
      padding: '0 10px 24px',
      color: '#F9FAFB',
      overflow: "visible", // ⭐ evita cortar la lluvia
    }}
  >
    {/* ⭐ LLUVIA DE DINERO GLOBAL Y FULL-SCREEN */}
    <div
      id="rain-money"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 999999, // ⭐ lluvia siempre arriba
      }}
    ></div>

      {/* 🔰 BANNER VER MI PERFIL */}
      <div
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 14,
          background:
            'linear-gradient(90deg,#0B924F 0%, #0AA463 50%, #089A55 100%)',
          boxShadow: '0 3px 0 rgba(0,0,0,0.45)',
          margin: '8px 0 14px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = panelHref;
            }
          }}
          style={{
            background: '#000',
            padding: '10px 20px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 16,
            color: '#fff',
            border: '2px solid #1E293B',
            boxShadow: '0 3px 0 #000',
          }}
        >
          Ver mi perfil
        </button>
      </div>

      {/* BLOQUE PRINCIPAL CON KELE */}
      <div
        className="card-strong"
        style={{
          marginBottom: 12,
          background:
            'linear-gradient(180deg,#047857 0%,#065F46 50%,#022C22 100%)',
          color: '#ECFDF5',
          padding: '16px 14px 18px',
          borderRadius: 14,
          boxShadow: '0 4px 0 rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 💥 EXPLOSIÓN ANIMADA DE BILLETES */}
        <div
          id="money-explosion"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 1,
          }}
        ></div>

        {/* KELE + TIO KELE */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          <img
            src="/kelembu.png"
            alt="Kelembu"
            style={{
              height: 150,
              width: 'auto',
              borderRadius: 10,
              objectFit: 'cover',
              background: 'transparent',
            }}
          />

          <img
            src="/tiokele.png"
            alt="Tío Kele"
            style={{
              marginTop: 6,
              width: 120,
              height: 'auto',
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0, zIndex: 2 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            RASPA Y GANA
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#FACC15',
              marginBottom: 8,
              lineHeight: 1.25,
            }}
          >
            – ENCUENTRE 3 FIGURAS IGUALES Y GANE DINERO EN EFECTIVO
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.35,
              background: 'rgba(15,23,42,0.75)',
              padding: '8px 10px',
              borderRadius: 8,
            }}
          >
            Raspa 6 casillas y busque 3 figuras iguales y gane{' '}
            <span style={{ fontWeight: 700, color: '#FBBF24' }}>
              Gs 50.000
            </span>{' '}
            y{' '}
            <span style={{ fontWeight: 800, color: '#F97316' }}>
              Gs 100.000
            </span>
            .
          </div>
        </div>
      </div>

      {/* BARRA JUGAR / BONUS 3 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 14,
          background:
            'linear-gradient(90deg,#0EA463 0%, #0B8F53 50%, #067A45 100%)',
          padding: '10px 12px',
          borderRadius: 14,
          boxShadow: '0 3px 0 rgba(0,0,0,0.45)',
        }}
      >
        {/* BOTÓN JUGAR - AMARILLO */}
        <button
          className="btn btn-gold pulse"
          onClick={() => {
            bgm.play();
            buyTicket();
          }}
          disabled={isActive}
          style={{
            background:
              'linear-gradient(180deg, #F4C400 0%, #DDA600 100%)',
            color: '#000',
            borderRadius: 12,
            padding: '12px 26px',
            fontWeight: 900,
            fontSize: 20,
            border: '2px solid #C89200',
            boxShadow: '0 4px 0 #7A5A00',
            textTransform: 'uppercase',
            minWidth: 140,
          }}
        >
          JUGAR
        </button>

        <button
  type="button"
  style={{
    flex: 1,
    background: '#4338CA',
    color: '#E5E7EB',
    borderRadius: 10,
    padding: '8px 14px',
    fontWeight: 700,
    fontSize: 15,
    border: '2px solid #3730A3',
    boxShadow: '0 3px 0 #1E1B4B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    maxWidth: 140,
  }}
>
  Bonus <span style={{ fontWeight: 900 }}>{bonusLeft}</span>
</button>


      </div>  {/* ← cierre correcto de la barra JUGAR */}




       {/* CASILLAS */}
<div className="scratch-wrap card">
  <div
    className="scratch-grid"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10,
      padding: 8,
    }}
  >
    {cardPrizes.length === 6 ? (
      cardPrizes.map((p, i) => (
        <ScratchCard
  key={`${ticketId}-${i}`}   // ⭐ Fix real
  index={i}
  prize={p}
  ticketActive={isActive && !ticketResolved}
  onRevealed={handleCardRevealed}
  playScratch={scratchLoop.play}
  stopScratch={scratchLoop.stop}
  winningCells={winningCells}   // ⭐ NUEVO — para resaltar ganadores
/>

      ))
    ) : (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 14,
              background: '#000',
              height: 150,
              width: '100%',
              overflow: 'hidden',
              border: '3px solid #FACC15',
              boxShadow: '0 3px 0 rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/scratch/raspe.png"
              alt="Raspe aquí"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ))}
      </>
    )}
  </div>

  {message && (
    <div
      className="card"
      style={{
        marginTop: 10,
        background: '#020617',
        borderRadius: 10,
        padding: '8px 10px',
        fontSize: 13,
      }}
    >
      {message}
    </div>
  )}
</div>

{/* INFO: GANADORES + RACHA */}
<div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  }}
>
  {/* === BLOQUES DE PUBLICIDAD (3 columnas) === */}
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10,
      marginBottom: 14,
      width: '100%',
    }}
  >
    <div
      style={{
        background: '#020617',
        borderRadius: 10,
        padding: '10px 12px',
        height: 78,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 3px 0 rgba(0,0,0,0.40)',
        border: '2px solid #0EA463',
        color: '#F9FAFB',
        fontWeight: 800,
        fontSize: 14,
        textAlign: 'center',
      }}
    >
      Publicidad 1
    </div>

    <div
      style={{
        background: '#020617',
        borderRadius: 10,
        padding: '10px 12px',
        height: 78,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 3px 0 rgba(0,0,0,0.40)',
        border: '2px solid #0EA463',
        color: '#F9FAFB',
        fontWeight: 800,
        fontSize: 14,
        textAlign: 'center',
      }}
    >
      Publicidad 2
    </div>

    <div
      style={{
        background: '#020617',
        borderRadius: 10,
        padding: '10px 12px',
        height: 78,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 3px 0 rgba(0,0,0,0.40)',
        border: '2px solid #0EA463',
        color: '#F9FAFB',
        fontWeight: 800,
        fontSize: 14,
        textAlign: 'center',
      }}
    >
      Publicidad 3
    </div>
  </div>
          {/* === RANKINGS DE COMPARTIDOS === */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {/* 🔥 Ranking diario */}
            <div
              className="card"
              style={{
                flex: '1 1 190px',
                background: '#020617',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div
                className="small"
                style={{
                  marginBottom: 6,
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: '#A7F3D0',
                  fontWeight: 800,
                }}
              >
                Ranking de compartidos 🔗🔥
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  rowGap: 6,
                  fontSize: 13,
                }}
              >
                {dailyWinners.slice(0, 5).map((w, i) => (
                  <React.Fragment key={i}>
                    <div>{w.name}</div>
                    <div
                      style={{ fontWeight: 900, color: '#A7F3D0' }}
                    >
                      {w.shares}x
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* 🟡 Ranking mensual */}
            <div
              className="card"
              style={{
                flex: '1 1 190px',
                background: '#020617',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div
                className="small"
                style={{
                  marginBottom: 6,
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: '#FDE047',
                  fontWeight: 800,
                }}
              >
                Acumulado 3 meses 🏆
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  rowGap: 6,
                  fontSize: 13,
                }}
              >
                {monthlyWinners.slice(0, 5).map((w, i) => (
                  <React.Fragment key={i}>
                    <div>{w.name}</div>
                    <div
                      style={{
                        fontWeight: 900,
                        color: '#FACC15',
                      }}
                    >
                      {w.shares ?? 0}x
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* 🔵 Ranking semanal */}
            <div
              className="card"
              style={{
                flex: '1 1 190px',
                background: '#020617',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div
                className="small"
                style={{
                  marginBottom: 6,
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: '#38BDF8',
                  fontWeight: 800,
                }}
              >
                Ranking semanal 📅
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  rowGap: 6,
                  fontSize: 13,
                }}
              >
                {weeklyWinners.slice(0, 5).map((w, i) => (
                  <React.Fragment key={i}>
                    <div>{w.name}</div>
                    <div
                      style={{
                        fontWeight: 900,
                        color: '#0EA5E9',
                      }}
                    >
                      {w.shares ?? 0}x
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
 </div>   {/* ← ESTE ES EL QUE FALTABA */} 

        {/* === CSS GLOBAL === */}
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
            background: #020617;
            border-radius: 14px;
            padding: 8px;
          }

          .scratch-wrap.active {
            box-shadow: 0 0 32px 0 rgba(22, 163, 74, 0.45);
          }

      
        `}</style>
      </div>
    </div>
    
  );
}
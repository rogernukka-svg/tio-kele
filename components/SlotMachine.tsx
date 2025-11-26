'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useSound from '../lib/useSound';

/* ====== CONFIG ====== */
type SymbolKey =
  | 'diamond' | 'cherry' | 'dice' | 'wild' | 'bell'
  | 'seven'   | 'bar'    | 'lemon'| 'watermelon' | 'grape' | 'horseshoe';

type SlotSymbol = {
  key: SymbolKey;
  src: string;
  weight: number; // prob. relativa
  payout: number; // premio por 5 iguales (ejemplo)
};

const SYMBOLS: SlotSymbol[] = [
  { key: 'diamond',    src: '/slots/diamond.png',    weight: 10, payout: 5000 },
  { key: 'cherry',     src: '/slots/cherry.png',     weight: 12, payout: 1200 },
  { key: 'dice',       src: '/slots/dice.png',       weight: 10, payout: 1500 },
  { key: 'wild',       src: '/slots/wild.png',       weight: 3,  payout: 9000 },
  { key: 'bell',       src: '/slots/bell.png',       weight: 8,  payout: 1800 },
  { key: 'seven',      src: '/slots/seven.png',      weight: 5,  payout: 7000 },
  { key: 'bar',        src: '/slots/bar.png',        weight: 7,  payout: 2500 },
  { key: 'lemon',      src: '/slots/lemon.png',      weight: 12, payout: 900  },
  { key: 'watermelon', src: '/slots/watermelon.png', weight: 8,  payout: 1600 },
  { key: 'grape',      src: '/slots/grape.png',      weight: 9,  payout: 1400 },
  { key: 'horseshoe',  src: '/slots/horseshoe.png',  weight: 6,  payout: 3000 },
];

const REELS = 5;
const SPIN_TIME_MS = 1400; // duración aproximada de giro visual
const MIN_BET = 1000;
const MAX_BET = 100000;
const BET_STEP = 1000;

function weightedPick(list: SlotSymbol[]) {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const s of list) { r -= s.weight; if (r <= 0) return s; }
  return list[list.length - 1];
}

function preloadImages(urls: string[]) {
  urls.forEach(u => { const img = new Image(); img.src = u; });
}

/* ====== COMPONENTE ====== */
export default function SlotMachinePro() {
  const [balance, setBalance] = useState(20000);
  const [bet, setBet] = useState(2000);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SlotSymbol[]>(
    Array.from({ length: REELS }, () => weightedPick(SYMBOLS))
  );
  const [win, setWin] = useState(0);

  // sonidos
  const spinSfx = useSound('/sfx/spin.wav', { volume: 0.35 });
  const winSfx  = useSound('/sfx/win.wav',  { volume: 0.55 });
  const loseSfx = useSound('/sfx/lose.wav', { volume: 0.45 });

  // precarga imágenes
  useEffect(() => {
    preloadImages(SYMBOLS.map(s => s.src));
  }, []);

  const canSpin = balance >= bet && !spinning;

  function changeBet(delta: number) {
    setBet(b => {
      const n = Math.min(MAX_BET, Math.max(MIN_BET, b + delta));
      return Math.round(n / BET_STEP) * BET_STEP;
    });
  }

  function rollOnce(): SlotSymbol[] {
    return Array.from({ length: REELS }, () => weightedPick(SYMBOLS));
  }

  function computePayout(arr: SlotSymbol[], betAmount: number) {
    // Regla simple: si las 5 coinciden => premio base * (bet/1000)
    // Si hay 3 o 4 iguales, premios menores.
    const byKey: Record<SymbolKey, number> = {} as any;
    arr.forEach(s => { byKey[s.key] = (byKey[s.key] ?? 0) + 1; });
    let bestKey: SymbolKey | null = null;
    let bestCount = 0;
    Object.entries(byKey).forEach(([k, cnt]) => {
      if (cnt > bestCount) { bestCount = cnt; bestKey = k as SymbolKey; }
    });

    if (!bestKey) return 0;
    const base = SYMBOLS.find(s => s.key === bestKey)!.payout;
    const mult = betAmount / 1000;

    if (bestCount >= 5) return Math.round(base * mult);
    if (bestCount === 4) return Math.round(base * 0.25 * mult);
    if (bestCount === 3) return Math.round(base * 0.10 * mult);
    return 0;
  }

  async function spin() {
    if (!canSpin) return;
    setSpinning(true);
    setWin(0);
    setBalance(b => b - bet);
    spinSfx();

    // animación: durante el giro vamos mostrando tiradas fugaces
    const start = performance.now();
    const tempTimer = setInterval(() => setResult(rollOnce()), 90);

    await new Promise<void>(res => setTimeout(res, SPIN_TIME_MS));
    clearInterval(tempTimer);

    // resultado final
    const final = rollOnce();
    setResult(final);

    const payout = computePayout(final, bet);
    setWin(payout);
    if (payout > 0) { winSfx(); setBalance(b => b + payout); }
    else { loseSfx(); }

    setSpinning(false);
  }

  const totalWinText = useMemo(
    () => `Gs. ${win.toLocaleString('es-PY')}`, [win]
  );

  return (
    <div className="slot-wrap">
      {/* HEADER compacto dentro del juego (opcional) */}
      <div className="slot-top">
        <div className="brand">
          <span className="brand-emoji">🎭</span>
          <span className="brand-word">Joker</span>
          <span className="brand-gold">Pay</span>&nbsp;Casino
        </div>

        <div className="top-counters">
          <div className="chip">Saldo: <b>Gs. {balance.toLocaleString('es-PY')}</b></div>
          <div className="chip alt">Apuesta: <b>Gs. {bet.toLocaleString('es-PY')}</b></div>
        </div>
      </div>

      {/* MARCO */}
      <div className="machine">
        <div className="panel panel-win">
          <div className="panel-label">TOTAL WIN</div>
          <div className={`panel-value ${win > 0 ? 'glow' : ''}`}>{totalWinText}</div>
        </div>

        {/* REELS */}
        <div className="reels">
          {result.map((s, i) => (
            <div key={i} className="reel-cell">
              <motion.img
                src={s.src}
                alt={s.key}
                initial={false}
                animate={{ y: spinning ? [-10, 10, -10] : 0 }}
                transition={{ repeat: spinning ? Infinity : 0, duration: 0.3, ease: 'easeInOut' }}
                className="symbol"
                draggable={false}
              />
              {/* separadores luminosos */}
              {i < REELS - 1 && <div className="divider" />}
            </div>
          ))}
        </div>

        {/* CONTROLES */}
        <div className="controls">
          <button className="btn circle info">i</button>

          <div className="bet">
            <button className="btn pill" onClick={() => changeBet(-BET_STEP)} disabled={spinning}>–</button>
            <div className="bet-box">Gs. {bet.toLocaleString('es-PY')}</div>
            <button className="btn pill" onClick={() => changeBet(+BET_STEP)} disabled={spinning}>+</button>
          </div>

          <button
            className={`btn spin ${canSpin ? '' : 'disabled'}`}
            onClick={spin}
            disabled={!canSpin}
            title={canSpin ? 'Girar' : 'Saldo insuficiente o girando'}
          >
            SPIN
          </button>

          <button
            className="btn max"
            onClick={() => setBet(MAX_BET)}
            disabled={spinning}
          >
            MAX BET
          </button>
        </div>
      </div>

      {/* ESTILOS */}
      <style jsx>{`
        .slot-wrap{
          min-height: calc(100vh - 110px);
          padding: 16px 14px 32px;
          background: radial-gradient(1200px 600px at 50% -100px, #2f1a67 0%, #190930 45%, #110622 100%);
          display:flex; flex-direction:column; gap:14px; color:#fff;
        }

        .slot-top{
          display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;
        }
        .brand{ font-weight:900; font-size:20px; letter-spacing:.3px; display:flex; align-items:center; gap:6px; }
        .brand-emoji{ font-size:22px; }
        .brand-word{ }
        .brand-gold{ color:#FFD33D; text-shadow:0 0 8px rgba(255,211,61,.55); }

        .top-counters{ display:flex; gap:8px; flex-wrap:wrap; }
        .chip{
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,211,61,.35);
          border-radius: 12px; padding:6px 12px; font-weight:700;
          box-shadow: 0 0 10px rgba(255,211,61,.15) inset;
        }
        .chip.alt{ border-color:rgba(120,170,255,.35); box-shadow:0 0 10px rgba(120,170,255,.12) inset; }

        .machine{
          margin-top:6px;
          border-radius:22px;
          padding:18px 16px 16px;
          background: linear-gradient(180deg, #2b0f4d 0%, #1b0d33 100%);
          box-shadow:
            inset 0 0 0 2px rgba(255,215,128,.28),
            0 10px 30px rgba(0,0,0,.45);
          position:relative;
        }

        .panel{ display:flex; gap:10px; align-items:center; }
        .panel-win{
          background: linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.1));
          border:2px solid rgba(255,215,128,.35);
          border-radius:14px; padding:8px 12px; margin:0 auto 12px; width:max-content;
          box-shadow: inset 0 0 18px rgba(255,215,128,.15);
        }
        .panel-label{
          font-size:12px; letter-spacing:.5px; opacity:.9;
          background: rgba(0,0,0,.3); padding:6px 10px; border-radius:10px;
          border: 1px solid rgba(255,255,255,.08);
        }
        .panel-value{
          font-weight:900; font-size:18px;
          padding:4px 10px; border-radius:10px;
          color: #fff;
          text-shadow: 0 0 8px rgba(100,180,255,.6);
        }
        .panel-value.glow{ color:#9fe8ff; text-shadow:0 0 14px rgba(111,220,255,.9), 0 0 22px rgba(111,220,255,.6); }

        .reels{
          position:relative;
          background: linear-gradient(180deg, #2d1353 0%, #250f45 70%, #1b0c35 100%);
          border: 3px solid #E9C25B; /* marco dorado */
          border-radius:18px;
          padding:16px;
          box-shadow:
            0 0 0 6px rgba(233,194,91,.18),
            inset 0 0 40px rgba(255,255,255,.08),
            inset 0 0 120px rgba(255,215,128,.07);
          display:grid; grid-template-columns: repeat(${REELS}, 1fr); gap:12px;
          margin-bottom:14px;
        }

        .reel-cell{
          position:relative;
          background: radial-gradient(circle at 50% 30%, rgba(255,255,255,.06) 0%, rgba(255,255,255,0) 70%),
                      linear-gradient(180deg, #2a1249, #1a0b33);
          border-radius:14px;
          border:2px solid rgba(255,215,128,.35);
          min-height: 92px;
          display:flex; align-items:center; justify-content:center;
          overflow:hidden;
          box-shadow: inset 0 0 18px rgba(0,0,0,.45);
        }

        .symbol{ width:64px; height:64px; object-fit:contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,.4)); }

        .divider{
          position:absolute; right:-7px; top:10%; bottom:10%;
          width:6px; border-radius:999px;
          background: radial-gradient(circle, rgba(255,215,128,.9) 0%, rgba(255,215,128,.35) 35%, rgba(0,0,0,0) 70%);
          filter: blur(0.6px);
          box-shadow: 0 0 12px rgba(255,215,128,.8);
        }

        .controls{
          display:grid; grid-template-columns: 64px 1fr 120px 110px; gap:10px; align-items:center;
        }

        .btn{ user-select:none; cursor:pointer; font-weight:900; }
        .btn:disabled{ opacity:.6; cursor:not-allowed; }

        .circle{
          height:48px; width:64px; border-radius:999px;
          background: linear-gradient(180deg,#5b7dff,#3a58e8);
          border:2px solid rgba(255,255,255,.2);
          display:flex; align-items:center; justify-content:center;
          font-size:18px; box-shadow: 0 6px 18px rgba(58,88,232,.35);
        }

        .bet{ display:flex; align-items:center; gap:8px; justify-content:center; }
        .pill{
          min-width:44px; height:44px; border-radius:12px; border:none;
          background: linear-gradient(180deg,#3b145f 0%, #2a0f4d 100%);
          color:#fff; font-size:18px; box-shadow: inset 0 0 6px rgba(255,255,255,.08);
        }
        .bet-box{
          min-width: 180px; text-align:center; height:44px; padding:0 10px; line-height:44px; font-weight:800;
          background: linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.15));
          border:2px solid rgba(255,215,128,.35); border-radius:12px;
        }

        .spin{
          height:48px; border-radius:16px; border:none;
          background: radial-gradient(120% 120% at 50% -20%, #3dfc8a 0%, #14c25e 50%, #0ea34b 100%);
          box-shadow: 0 10px 24px rgba(20,194,94,.4), inset 0 -6px 0 rgba(0,0,0,.18);
          color:#082813; font-size:18px; letter-spacing:.6px;
        }
        .spin.disabled{
          background: linear-gradient(180deg,#8a8a8a,#707070);
          color:#1e1e1e; box-shadow:none;
        }

        .max{
          height:48px; border-radius:16px; border:none;
          background: radial-gradient(120% 120% at 50% -20%, #ffe68a 0%, #ffcc42 50%, #ffb300 100%);
          color:#3a2100; font-size:16px; letter-spacing:.3px;
          box-shadow: 0 10px 24px rgba(255,204,66,.35), inset 0 -6px 0 rgba(0,0,0,.18);
        }

        @media (max-width: 480px){
          .controls{ grid-template-columns: 54px 1fr 100px 100px; }
          .bet-box{ min-width: 140px; }
          .symbol{ width:56px; height:56px; }
          .reel-cell{ min-height: 84px; }
        }
      `}</style>
    </div>
  );
}

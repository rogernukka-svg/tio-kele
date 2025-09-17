'use client';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Prize = { label: string; payout: number; weight: number };
type Winner = { name: string; amount: number; ts: number };
type Role = 'admin'|'cashier'|'user'|null;

const PRIZES: Prize[] = [
  { label: '💸 ₲0',        payout: 0,      weight: 62 },
  { label: '🎟 ₲1.000',    payout: 1000,   weight: 18 },
  { label: '🎉 ₲5.000',    payout: 5000,   weight: 10 },
  { label: '🏅 ₲10.000',   payout: 10000,  weight: 6  },
  { label: '💎 ₲50.000',   payout: 50000,  weight: 3  },
  { label: '👑 ₲100.000',  payout: 100000, weight: 1  },
];

const TICKET_PRICE = 1000;
const JACKPOT_BASE = 2_000_000;
const JACKPOT_CUT  = 0.40;
const JACKPOT_ODDS = 0.004;

export default function Game() {
  /* ===== Sesión & rol ===== */
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    // Limpia el fragmento de acceso del redirect
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email ?? null);

      // Cargar rol si hay sesión
      if (session?.user?.id) {
        setRoleLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle(); // igual que RoleGate:contentReference[oaicite:1]{index=1}

        if (!error && data?.role) setRole(data.role as Role);
        else setRole('user'); // fallback
        setRoleLoading(false);
      } else {
        setRole(null);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      if (session?.user?.id) {
        setRoleLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!error && data?.role) setRole(data.role as Role);
        else setRole('user');
        setRoleLoading(false);
      } else {
        setRole(null);
      }
    });
    return () => { sub.subscription?.unsubscribe(); };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setRole(null);
  };

  const panelHref = role === 'admin' ? '/admin' : role === 'cashier' ? '/cashier' : '/';

  /* ===== Juego ===== */
  const [balance, setBalance] = useState<number>(5000);
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [scratchedPct, setScratchedPct] = useState<number>(0);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [bonusPct, setBonusPct] = useState<number | null>(null);
  useEffect(() => { setBonusPct(Math.floor(Math.random()*8)+2); }, []);

  const [jackpot, setJackpot] = useState<number>(JACKPOT_BASE);
  const [winners, setWinners] = useState<Winner[]>([
    { name: 'María A.', amount: 50000, ts: Date.now()-1000*60*35 },
    { name: 'Juan G.',  amount: 10000, ts: Date.now()-1000*60*50 },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coverRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current, k = coverRef.current, box = containerRef.current;
      if (!c || !k || !box) return;
      const w = Math.min(900, box.clientWidth);
      const h = 220;
      c.width = w; c.height = h;
      k.width = w; k.height = h;
      drawCover();
      if (currentPrize) drawPrizeLayer(currentPrize.label);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [currentPrize]);

  const drawPrizeLayer = (text: string) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0,0,c.width,c.height);
    const g = ctx.createLinearGradient(0,0,c.width,c.height);
    g.addColorStop(0, '#3a134f');
    g.addColorStop(1, '#f5c451');
    ctx.fillStyle = g; ctx.fillRect(0,0,c.width,c.height);
    ctx.font = `800 ${Math.floor(c.width*0.11)}px ui-sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,.24)';
    ctx.fillText(text, c.width/2+2, c.height/2+2);
    ctx.fillStyle = 'rgba(255,255,255,.98)';
    ctx.fillText(text, c.width/2, c.height/2);
  };

  const drawCover = () => {
    const k = coverRef.current; if (!k) return;
    const kctx = k.getContext('2d'); if (!kctx) return;
    kctx.globalCompositeOperation = 'source-over';
    kctx.clearRect(0,0,k.width,k.height);
    kctx.fillStyle = '#231a2f';
    kctx.fillRect(0,0,k.width,k.height);
    kctx.fillStyle = '#2b1f3a';
    for (let i=0;i<Math.floor((k.width*k.height)/1200);i++) {
      const x = Math.random()*k.width, y = Math.random()*k.height;
      const r = 2 + Math.random()*3;
      kctx.beginPath(); kctx.arc(x,y,r,0,Math.PI*2); kctx.fill();
    }
    kctx.globalCompositeOperation = 'destination-out';
    setScratchedPct(0);
  };

  const computeScratched = () => {
    const k = coverRef.current; if (!k) return 0;
    const kctx = k.getContext('2d', { willReadFrequently: true } as any); if (!kctx) return 0;
    const img = kctx.getImageData(0,0,k.width,k.height);
    const total = img.data.length / 4;
    let clear = 0;
    for (let i = 3; i < img.data.length; i += 4) if (img.data[i] === 0) clear++;
    return clear / total;
  };

  const scratchAt = (clientX:number, clientY:number) => {
    const k = coverRef.current; if (!k) return;
    const rect = k.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    const kctx = k.getContext('2d'); if (!kctx) return;
    kctx.beginPath(); kctx.arc(x, y, 18, 0, Math.PI*2); kctx.fill();
  };

  const handlePointerDown = (e: any) => {
    if (!isActive || revealed) return;
    e.preventDefault();
    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    scratchAt(e.clientX, e.clientY);
  };
  const handlePointerMove = (e: any) => {
    if (!isActive || revealed || !isDrawingRef.current) return;
    e.preventDefault();
    scratchAt(e.clientX, e.clientY);
    if (Math.random() < 0.18) {
      const pct = computeScratched();
      setScratchedPct(pct);
      if (pct >= 0.55) doReveal();
    }
  };
  const handlePointerUp = (e: any) => {
    if (!isActive || revealed) return;
    e.preventDefault();
    isDrawingRef.current = false;
    const pct = computeScratched();
    setScratchedPct(pct);
    if (pct >= 0.55) doReveal();
  };

  const formatGs = (n:number) =>
    new Intl.NumberFormat('es-PY',{style:'currency',currency:'PYG',maximumFractionDigits:0}).format(n);

  const maskName = () => {
    const first = ['María','Juan','Pedro','Ana','Luis','Camila','Diego','Sol','Rosa','Mario'];
    const last  = ['G.','A.','L.','R.','M.','P.','N.','V.','D.','S.'];
    return `${first[Math.floor(Math.random()*first.length)]} ${last[Math.floor(Math.random()*last.length)]}`;
  };

  const doReveal = () => {
    setRevealed(true);
    setIsActive(false);

    let paid = 0;
    if (currentPrize && currentPrize.payout > 0) paid += currentPrize.payout;

    const winJackpot = Math.random() < JACKPOT_ODDS;
    if (winJackpot) {
      paid += jackpot;
      setJackpot(JACKPOT_BASE);
    }
    if (paid > 0) setWinners(w => [{ name: maskName(), amount: paid, ts: Date.now() }, ...w].slice(0,6));

    setMessage(paid > 0 ? `¡Ganaste ${formatGs(paid)}! 🎉` : 'No hubo premio esta vez. ¡Probá de nuevo! ✨');
    if (paid > 0) setBalance(b => b + paid);
  };

  const buyTicket = () => {
    if (isActive) return;
    if (balance < TICKET_PRICE) { setMessage('Saldo insuficiente.'); return; }

    // random ponderado
    let total = PRIZES.reduce((s,p)=>s+p.weight,0);
    let r = Math.random() * total;
    let prize = PRIZES[0];
    for (const p of PRIZES){ if((r-=p.weight)<=0){ prize = p; break; } }

    setBalance(b => b - TICKET_PRICE);
    setJackpot(j => j + Math.floor(TICKET_PRICE * JACKPOT_CUT));
    setCurrentPrize(prize);
    setRevealed(false);
    setMessage('');
    setIsActive(true);
    setTimeout(() => { drawCover(); drawPrizeLayer(prize.label); }, 0);
  };

  // No spoilear el premio hasta reveal
  const visiblePrizeText = revealed && currentPrize ? currentPrize.label : '—';

  // Email abreviado para chip
  const shortEmail = userEmail
    ? (userEmail.length > 26 ? `${userEmail.slice(0, 12)}…${userEmail.slice(-10)}` : userEmail)
    : null;

  // Chip rol
  const roleChip = roleLoading ? 'Cargando…' : role ?? '';

  return (
    <div className="container">
      {/* HEADER con email, rol y acceso a panel */}
      <div className="header">
        <div className="logo">🎰</div>
        <div style={{fontWeight:900,fontSize:20}}><span>Ras</span><span className="text-gold">Pay</span></div>
        <div style={{flex:1}} />
        {shortEmail ? (
          <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
            <span className="btn btn-pill" title={userEmail || ''}>👤 {shortEmail}</span>
            {role && (
              <>
                <span className="btn btn-pill" title="Rol del perfil">🔑 {roleChip}</span>
                <a className="btn btn-gold" href={panelHref}>
                  {role === 'admin' ? 'Ir al panel Admin' : role === 'cashier' ? 'Ir al panel Cajero' : 'Ir al inicio'}
                </a>
              </>
            )}
            <button className="btn" onClick={handleSignOut}>Salir</button>
          </div>
        ) : (
          <a href="/login" className="btn btn-gold">Iniciar sesión</a>
        )}
      </div>

      {/* HERO */}
      <div className="card-strong" style={{marginBottom:16}}>
        <h1 style={{fontSize:40, fontWeight:900, letterSpacing:0.5}}>
          PREMIO MAYOR <span className="text-gold">Gs. 5.000.000</span>
        </h1>
        <p className="text-muted" style={{maxWidth:900, marginTop:8}}>
          Rascá en 3 segundos y descubrí si ganaste. Partidas rápidas desde Gs. 1.000. <b>Tu suerte, tu momento.</b>
        </p>
        <div style={{marginTop:12}}><button className="btn btn-gold" onClick={buyTicket}>Probar ahora</button></div>
      </div>

      {/* GRID */}
      <div className="main-grid">
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          <div className="card">
            <div className="small">JACKPOT ACTUAL</div>
            <div style={{fontWeight:900, fontSize:28}}>{formatGs(jackpot)}</div>
            <div className="small">Crece con cada jugada.</div>
          </div>
          <div className="card">
            <div className="small">SALDO</div>
            <div style={{fontWeight:900, fontSize:28}}>{formatGs(balance)}</div>
          </div>
          <div className="card">
            <div className="small">COSTO X TICKET</div>
            <div style={{fontWeight:900, fontSize:28}}>{formatGs(1000)}</div>
          </div>
          <div className="card">
            <div className="small" style={{marginBottom:8}}>GANADORES RECIENTES</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr auto', rowGap:8}}>
              {winners.map((w,i)=>(
                <React.Fragment key={i}>
                  <div>{w.name}</div>
                  <div style={{fontWeight:800}}>{formatGs(w.amount)}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontSize:20, fontWeight:700}}>{visiblePrizeText}</div>
            <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
              <button onClick={buyTicket} className="btn btn-gold" disabled={isActive}>
                {isActive ? 'Rascá ahora' : 'Comprar'}
              </button>
              {bonusPct !== null && (<span className="btn btn-pill" style={{fontSize:12}}>{`Bonus +${bonusPct}% 🎁`}</span>)}
            </div>
          </div>

          <div ref={containerRef} className="scratch-wrap card">
            <div className="relative" style={{position:'relative'}}>
              <canvas ref={canvasRef} style={{width:'100%', borderRadius:16}} />
              <canvas
                ref={coverRef}
                className="scratch-cover"
                style={{position:'absolute', inset:0, borderRadius:16, opacity: revealed?0:1, width:'100%'}}
                onPointerDown={(e:any)=>{ if(!isActive||revealed) return; e.preventDefault(); isDrawingRef.current=true; (e.target as HTMLElement).setPointerCapture(e.pointerId); scratchAt(e.clientX, e.clientY); }}
                onPointerMove={(e:any)=>{ if(!isActive||revealed||!isDrawingRef.current) return; e.preventDefault(); scratchAt(e.clientX, e.clientY); if(Math.random()<0.18){ const pct=computeScratched(); setScratchedPct(pct); if(pct>=0.55) doReveal(); } }}
                onPointerUp={(e:any)=>{ if(!isActive||revealed) return; e.preventDefault(); isDrawingRef.current=false; const pct=computeScratched(); setScratchedPct(pct); if(pct>=0.55) doReveal(); }}
              />
            </div>
            <div className="small" style={{marginTop:8}}>Rascado: {(scratchedPct*100).toFixed(0)}%</div>
            {message && <div className="card" style={{marginTop:12}}>{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

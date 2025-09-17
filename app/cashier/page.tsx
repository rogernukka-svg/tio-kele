
'use client';
import React, { useState } from 'react';
import { RoleGate } from '../../components/RoleGate';
import { supabase } from '../../lib/supabaseClient';

export default function CashierPage(){
  const [userId,setUserId]=useState('');
  const [amount,setAmount]=useState<number>(20000);
  const [note,setNote]=useState('Recarga');
  const [log,setLog]=useState('');

  const transfer = async()=>{
    if(!userId){ alert('Ingresá UUID del usuario'); return; }
    const { error } = await supabase.rpc('cashier_grant_to_user', { user_id: userId, _amount: amount, _note: note });
    if(error) setLog('Error: '+error.message);
    else setLog('Recarga enviada.');
  };

  return (
    <RoleGate allow="cashier">
      <div className="container">
        <div className="header"><div className="logo">💳</div><b>Panel Cajero</b></div>
        <div className="card" style={{maxWidth:560}}>
          <div className="small">Enviar monedas a USUARIO</div>
          <div style={{display:'grid', gap:10}}>
            <label>Id usuario (UUID):
              <input value={userId} onChange={e=>setUserId(e.target.value)} placeholder="UUID del usuario" style={{width:'100%', padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,.2)', background:'#110b18', color:'white'}}/>
            </label>
            <label>Monto:
              <input type="number" value={amount} onChange={e=>setAmount(parseInt(e.target.value||'0'))} style={{width:'100%', padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,.2)', background:'#110b18', color:'white'}}/>
            </label>
            <label>Nota:
              <input value={note} onChange={e=>setNote(e.target.value)} style={{width:'100%', padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,.2)', background:'#110b18', color:'white'}}/>
            </label>
            <div><button className="btn btn-gold" onClick={transfer}>Transferir</button></div>
            {log && <div className="small">{log}</div>}
          </div>
        </div>
      </div>
    </RoleGate>
  );
}

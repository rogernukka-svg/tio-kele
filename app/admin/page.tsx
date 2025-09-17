
'use client';
import React, { useEffect, useState } from 'react';
import { RoleGate } from '../../components/RoleGate';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage(){
  const [cashiers,setCashiers]=useState<{id:string,email:string}[]>([]);
  const [selected,setSelected]=useState<string>('');
  const [amount,setAmount]=useState<number>(50000);
  const [note,setNote]=useState('Carga inicial');
  const [log,setLog]=useState<string>('');

  useEffect(()=>{
    (async()=>{
      const { data, error } = await supabase.from('auth_users_view').select('id,email');
      // si no existe la view, intentamos auth.users via rpc (no disponible); fallback: pedir cajeros desde profiles
      if(error || !data){
        const { data:rows } = await supabase.from('profiles').select('id, role').eq('role','cashier');
        if(rows){
          const ids = rows.map((r:any)=>r.id);
          if(ids.length){
            const { data: u } = await supabase.from('users_public').select('id,email').in('id', ids);
            if(u) setCashiers(u as any);
          }
        }
      }else{
        setCashiers(data as any);
      }
    })();
  },[]);

  const transfer = async()=>{
    if(!selected){ alert('Elegí un cajero'); return; }
    const { error } = await supabase.rpc('admin_grant_to_cashier', { cashier_id: selected, _amount: amount, _note: note });
    if(error) setLog('Error: '+error.message);
    else setLog('Transferencia enviada.');
  };

  return (
    <RoleGate allow="admin">
      <div className="container">
        <div className="header"><div className="logo">🛠</div><b>Panel Admin</b></div>
        <div className="card" style={{maxWidth:560}}>
          <div className="small">Enviar monedas a CAJERO</div>
          <div style={{display:'grid', gap:10}}>
            <label>Id cajero (UUID):
              <input value={selected} onChange={e=>setSelected(e.target.value)} placeholder="UUID del cajero" style={{width:'100%', padding:10, borderRadius:10, border:'1px solid rgba(255,255,255,.2)', background:'#110b18', color:'white'}}/>
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

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function CoinsPage() {
  const [cashiers, setCashiers] = useState<{ id: string; email: string }[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('id,email,role').eq('role','cashier');
      if (data) setCashiers(data);
    })();
  }, []);

  const emit = async () => {
    if (!selected || amount <= 0) return;
    // ⚡ guardar en tabla "wallets" (id, balance)
    const { error } = await supabase.rpc('give_coins', { target_id: selected, qty: amount });
    if (error) alert('Error: ' + error.message);
    else alert('Monedas entregadas');
    setAmount(0);
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>💰 Emitir monedas</h1>
      <div className="card" style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
        <select className="input" value={selected ?? ''} onChange={e => setSelected(e.target.value)}>
          <option value="">Seleccioná cajero…</option>
          {cashiers.map(c => (
            <option key={c.id} value={c.id}>{c.email}</option>
          ))}
        </select>
        <input
          type="number"
          className="input"
          placeholder="Cantidad"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
        />
        <button className="btn btn-gold" onClick={emit}>Emitir</button>
      </div>
    </div>
  );
}

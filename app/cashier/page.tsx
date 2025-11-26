'use client';
import { useState } from 'react';

export default function CashierPage() {
  const [ticket, setTicket] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const validateTicket = () => {
    // lógica simple, en producción sería un RPC en Supabase
    if(ticket.trim() === '') { setResult('Ingresa un código'); return; }
    setResult(`Ticket ${ticket} ✅ válido y pagado`);
  };

  return (
    <div className="container">
      <h1>💵 Panel Cajero</h1>
      <div className="card">
        <input
          value={ticket}
          onChange={e => setTicket(e.target.value)}
          placeholder="Código del ticket"
          className="input"
        />
        <button onClick={validateTicket} className="btn btn-gold" style={{ marginTop: 12 }}>
          Validar
        </button>
        {result && <p style={{ marginTop: 10 }}>{result}</p>}
      </div>
    </div>
  );
}

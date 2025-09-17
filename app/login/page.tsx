'use client';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage(){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [error,setError] = useState<string|null>(null);
  const [loading,setLoading] = useState(false);
  const router = useRouter();

  const doLogin = async(e:React.FormEvent)=>{
    e.preventDefault();
    setError(null); 
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if(error){ 
      setError(error.message); 
      return; 
    }
    router.replace('/');
  };

  const doSignup = async()=>{
    if(!email || !password){
      setError("Ingresá un correo y una contraseña para registrarte.");
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if(error) setError(error.message);
    else alert('Revisá tu email para confirmar.');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {/* Banner superior */}
        <div className="banner">
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div className="logo">🎰</div>
            <div style={{fontWeight:900, fontSize:18}}>
              <span>Ras</span><span className="text-gold">Pay</span>
            </div>
          </div>
          <div className="brand-chip">777</div>
        </div>

        <div className="content">
          <div className="title">Iniciar sesión</div>
          <form onSubmit={doLogin} style={{display:'grid', gap:12}}>
            <input
              className="input"
              required
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="Correo o Usuario"
            />
            <input
              className="input"
              required
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Contraseña"
            />
            {error && <div className="small" style={{color:'#ff9b9b'}}>{error}</div>}
            <button disabled={loading} className="btn btn-gold" type="submit">
              {loading ? 'Entrando...' : 'Enviar'}
            </button>
          </form>

          <div className="small" style={{marginTop:10, textAlign:'center'}}>
            ¿Olvidaste tu contraseña?
          </div>

          <div className="small" style={{marginTop:12, textAlign:'center'}}>
            ¿Sin cuenta?&nbsp;
            <button type="button" className="btn" onClick={doSignup}>Crear cuenta</button>
          </div>
        </div>
      </div>
    </div>
  );
}

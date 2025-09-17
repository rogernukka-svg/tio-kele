
'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export function RoleGate({ allow, children }:{ allow: 'admin'|'cashier'|'user', children: React.ReactNode }){
  const [ok,setOk] = useState<boolean>(false);
  const [loading,setLoading]=useState(true);
  const router = useRouter();

  useEffect(()=>{
    (async()=>{
      const { data: { session } } = await supabase.auth.getSession();
      if(!session){ router.replace('/login'); return; }
      const userId = session.user.id;
      const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
      if(error){ console.error(error); router.replace('/login'); return; }
      if(!data){ router.replace('/login'); return; }
      setOk(data.role === allow);
      setLoading(false);
    })();
  },[allow, router]);

  if(loading) return <div className="container"><div className="card">Cargando...</div></div>;
  if(!ok) return <div className="container"><div className="card">Acceso denegado.</div></div>;
  return <>{children}</>;
}

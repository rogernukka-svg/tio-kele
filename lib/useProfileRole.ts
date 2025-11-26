import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export function useProfileRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) setRole(null);
      else setRole(data?.role ?? null);

      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription?.unsubscribe();
  }, []);

  return { role, loading };
}

import { useEffect, useState } from "react";
import InventoryApp from "./components/InventoryApp";
import { LoginScreen } from "./components/LoginScreen";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingAuth(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession),
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <InventoryApp />;
}

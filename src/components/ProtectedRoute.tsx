import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let retryAttempts = 0;
    let graceTimer: number | undefined;

    const safeSet = (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    };

    const tryRecover = () => {
      window.clearTimeout(graceTimer);
      graceTimer = window.setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          safeSet(session);
          retryAttempts = 0;
        } else if (retryAttempts < 3) {
          retryAttempts += 1;
          tryRecover();
        }
      }, 500);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Update immediately
      safeSet(session);
      // If we momentarily lost session (e.g., token refresh 429), start a short recovery loop
      if (!session) {
        tryRecover();
      }
    });

    // Initial session fetch after listener is set
    supabase.auth.getSession().then(({ data: { session } }) => safeSet(session));

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(graceTimer);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Reconnecting session…</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    // Grace window: don't hard-redirect if we're still attempting recovery
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
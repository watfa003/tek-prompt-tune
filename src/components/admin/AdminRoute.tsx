import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Shield, Lock } from 'lucide-react';

const OWNER_EMAIL = 'watfa003@gmail.com';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnerAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email === OWNER_EMAIL) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
      
      setLoading(false);
    };

    checkOwnerAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsOwner(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
        setIsOwner(session?.user?.email === OWNER_EMAIL);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/auth" replace />;
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-card border border-destructive/50 rounded-xl p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              This area is restricted to authorized personnel only.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                Logged in as: <span className="font-mono text-foreground">{user.email}</span>
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Protected by owner-only access control</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;

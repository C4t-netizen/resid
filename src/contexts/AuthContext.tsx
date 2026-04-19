import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "editor" | "viewer";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  puesto: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  canEdit: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Coordinador (Super Admin)",
  admin: "Coordinador",
  editor: "Participante",
  viewer: "Solo lectura",
};

export const ROLE_BADGE_COLORS: Record<AppRole, string> = {
  super_admin: "bg-primary/10 text-primary border-primary/20",
  admin: "bg-success/10 text-success border-success/20",
  editor: "bg-warning/10 text-warning border-warning/20",
  viewer: "bg-muted text-muted-foreground border-border",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = async (uid: string) => {
    const [{ data: prof }, { data: roleData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.rpc("get_user_role", { _user_id: uid }),
    ]);
    setProfile(prof as Profile | null);
    setRole((roleData as AppRole) ?? null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndRole(user.id);
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // defer to avoid deadlock
        setTimeout(() => fetchProfileAndRole(newSession.user.id), 0);
      } else {
        setProfile(null);
        setRole(null);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        fetchProfileAndRole(existing.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const canEdit = role === "super_admin" || role === "admin" || role === "editor";
  const isAdmin = role === "super_admin" || role === "admin";
  const isSuperAdmin = role === "super_admin";

  return (
    <AuthContext.Provider
      value={{ user, session, profile, role, loading, signOut, refreshProfile, canEdit, isAdmin, isSuperAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

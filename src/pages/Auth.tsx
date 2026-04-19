import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Nombre requerido").max(100),
});

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suName, setSuName] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Credenciales incorrectas" : error.message);
    } else {
      toast.success("Sesión iniciada");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ email: suEmail, password: suPassword, fullName: suName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Este correo ya está registrado" : error.message);
    } else {
      toast.success("Cuenta creada. Iniciando sesión…");
    }
  };

  const fillDemo = () => {
    setLoginEmail("coordinador@nom019.demo");
    setLoginPassword("Demo1234!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Gestión NOM-019</h1>
          <p className="text-sm text-muted-foreground">STPS · Comisión de Seguridad e Higiene</p>
        </div>

        <Card className="rounded-2xl border-border/50 p-6 shadow-soft">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="li-email">Correo electrónico</Label>
                  <Input id="li-email" type="email" autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="li-pass">Contraseña</Label>
                  <Input id="li-pass" type="password" autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                <button type="button" onClick={fillDemo} className="block w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline">
                  Usar credenciales demo (super admin)
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Nombre completo</Label>
                  <Input id="su-name" value={suName} onChange={(e) => setSuName(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Correo electrónico</Label>
                  <Input id="su-email" type="email" autoComplete="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pass">Contraseña</Label>
                  <Input id="su-pass" type="password" autoComplete="new-password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} className="h-11 rounded-xl" />
                  <p className="text-[11px] text-muted-foreground">Tu cuenta inicia con rol <strong>Solo lectura</strong>. Un coordinador podrá elevar tus permisos.</p>
                </div>
                <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          Demo · Coordinador: <code className="rounded bg-muted px-1.5 py-0.5">coordinador@nom019.demo</code>
        </p>
      </div>
    </div>
  );
}

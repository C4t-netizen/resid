import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, KeyRound } from "lucide-react";
import { z } from "zod";
import sgiLogo from "@/assets/sgi-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const schema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    // When the user clicks the recovery link, Supabase sets a session via the hash.
    // onAuthStateChange fires with event "PASSWORD_RECOVERY" or sets a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setVerified(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setVerified(true);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirm) return toast.error("Las contraseñas no coinciden");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <img src={sgiLogo} alt="Logo SGI" className="h-24 w-24 object-contain drop-shadow-lg" />
          <h1 className="mt-4 font-display text-2xl font-bold">Restablecer contraseña</h1>
          <p className="text-sm text-muted-foreground">Verificamos tu enlace y te permitimos crear una nueva contraseña</p>
        </div>

        <Card className="rounded-2xl border-border/50 p-6 shadow-soft">
          {checking ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !verified ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                El enlace no es válido o ha expirado. Solicita un nuevo correo de restablecimiento desde la pantalla de inicio de sesión.
              </p>
              <Button onClick={() => navigate("/auth")} className="w-full rounded-xl">Volver a iniciar sesión</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                <KeyRound className="h-4 w-4" />
                Correo verificado. Crea tu nueva contraseña.
              </div>
              <div className="space-y-2">
                <Label htmlFor="np">Nueva contraseña</Label>
                <Input id="np" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cp">Confirmar contraseña</Label>
                <Input id="cp" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar contraseña
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

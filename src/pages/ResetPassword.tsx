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

const RECOVERY_VERIFIED_KEY = "sgi-password-recovery-verified";

const getRecoveryParams = () => {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return {
    type: search.get("type") ?? hash.get("type"),
    tokenHash: search.get("token_hash") ?? hash.get("token_hash"),
    code: search.get("code") ?? hash.get("code"),
    accessToken: search.get("access_token") ?? hash.get("access_token"),
    errorDescription: search.get("error_description") ?? hash.get("error_description"),
  };
};

const cleanResetUrl = () => {
  window.history.replaceState(window.history.state, "", "/reset-password");
};

const schema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState("El enlace no es válido o ha expirado. Solicita un nuevo correo de restablecimiento desde la pantalla de inicio de sesión.");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    let mounted = true;

    const markVerified = () => {
      sessionStorage.setItem(RECOVERY_VERIFIED_KEY, "true");
      if (!mounted) return;
      setVerified(true);
      setChecking(false);
    };

    const markInvalid = (message?: string) => {
      sessionStorage.removeItem(RECOVERY_VERIFIED_KEY);
      if (!mounted) return;
      if (message) setErrorMessage(message);
      setVerified(false);
      setChecking(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) markVerified();
    });

    const verifyRecoveryLink = async () => {
      const params = getRecoveryParams();

      if (params.errorDescription) {
        markInvalid(decodeURIComponent(params.errorDescription.replace(/\+/g, " ")));
        cleanResetUrl();
        return;
      }

      if (params.tokenHash && params.type === "recovery") {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: params.tokenHash,
          type: "recovery",
        });

        if (error || !data.session) {
          console.error("Password recovery token_hash verification failed", error);
          markInvalid();
          cleanResetUrl();
          return;
        }

        cleanResetUrl();
        markVerified();
        return;
      }

      if (params.code && params.type === "recovery") {
        const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);

        if (error || !data.session) {
          console.error("Password recovery code exchange failed", error);
          markInvalid();
          cleanResetUrl();
          return;
        }

        cleanResetUrl();
        markVerified();
        return;
      }

      if (params.type === "recovery" && params.accessToken) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          cleanResetUrl();
          markVerified();
          return;
        }
      }

      if (sessionStorage.getItem(RECOVERY_VERIFIED_KEY) === "true") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          markVerified();
          return;
        }
      }

      markInvalid();
    };

    verifyRecoveryLink();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
    sessionStorage.removeItem(RECOVERY_VERIFIED_KEY);
    toast.success("Contraseña actualizada");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const handleRequestNewLink = async () => {
    sessionStorage.removeItem(RECOVERY_VERIFIED_KEY);
    await supabase.auth.signOut();
    navigate("/auth?forgot=1", { replace: true });
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
                {errorMessage}
              </p>
              <Button onClick={handleRequestNewLink} className="w-full rounded-xl">Solicitar nuevo enlace</Button>
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

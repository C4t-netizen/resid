import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, UserCog, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { AppRole, ROLE_BADGE_COLORS, ROLE_LABELS, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  puesto: string | null;
  is_active: boolean;
  role: AppRole | null;
}

const ROLES: AppRole[] = ["super_admin", "admin", "editor", "viewer"];

export default function Usuarios() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, puesto, is_active")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("No se pudieron cargar los usuarios");
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, AppRole>();
    (roles ?? []).forEach((r: any) => {
      const current = roleMap.get(r.user_id);
      const order: Record<AppRole, number> = { super_admin: 1, admin: 2, editor: 3, viewer: 4 };
      if (!current || order[r.role as AppRole] < order[current]) roleMap.set(r.user_id, r.role);
    });

    setRows((profiles ?? []).map((p: any) => ({ ...p, role: roleMap.get(p.id) ?? null })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (userId: string, newRole: AppRole) => {
    setUpdating(userId);
    // Replace all roles for this user with the new single role
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) {
      toast.error("Error al actualizar rol");
      setUpdating(null);
      return;
    }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    setUpdating(null);
    if (insErr) {
      toast.error(insErr.message);
      return;
    }
    toast.success(`Rol actualizado a ${ROLE_LABELS[newRole]}`);
    setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: newRole } : r)));
  };

  const initials = (name: string | null, email: string) =>
    (name || email).split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <PageHeader
        title="Gestión de usuarios"
        subtitle="Administra integrantes de la CSH y sus niveles de acceso."
        breadcrumbs={[{ label: "Configuración" }, { label: "Usuarios" }]}
        badge={<Badge className="border-primary/20 bg-primary/10 text-primary"><ShieldCheck className="mr-1 h-3 w-3" /> Solo Super Admin</Badge>}
      />
      <div className="px-4 py-6 md:px-8">
        <Card className="overflow-hidden rounded-2xl border-border/50 shadow-soft">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No hay usuarios registrados.</div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((u) => (
                <div key={u.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                      <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                        {initials(u.full_name, u.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold">
                        {u.full_name || u.email.split("@")[0]}
                        {u.id === me?.id && <span className="ml-2 text-[10px] font-medium text-muted-foreground">(tú)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {u.role && (
                      <Badge className={`${ROLE_BADGE_COLORS[u.role]} hidden md:inline-flex`}>{ROLE_LABELS[u.role]}</Badge>
                    )}
                    <Select
                      value={u.role ?? undefined}
                      onValueChange={(v) => changeRole(u.id, v as AppRole)}
                      disabled={updating === u.id || u.id === me?.id}
                    >
                      <SelectTrigger className="h-10 w-[210px] rounded-xl">
                        <SelectValue placeholder="Asignar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="mt-6 rounded-2xl border-border/50 bg-secondary/30 p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <UserCog className="mt-0.5 h-5 w-5 text-primary" />
            <div className="space-y-2 text-sm">
              <p className="font-display font-bold">Niveles de acceso</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Coordinador (Super Admin):</strong> control total, gestiona usuarios.</li>
                <li><strong className="text-foreground">Coordinador:</strong> CRUD en todos los módulos.</li>
                <li><strong className="text-foreground">Participante:</strong> crea, edita y sube información.</li>
                <li><strong className="text-foreground">Solo lectura:</strong> únicamente consulta.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

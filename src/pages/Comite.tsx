import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Miembro {
  id: string;
  nombre: string;
  puesto: string | null;
  representacion: "patronal" | "trabajadores";
  cargo_csh: "coordinador" | "secretario" | "vocal";
  email: string | null;
  telefono: string | null;
  fecha_designacion: string | null;
  activo: boolean;
}

const empty = {
  nombre: "", puesto: "", representacion: "patronal" as const,
  cargo_csh: "vocal" as const, email: "", telefono: "", fecha_designacion: "",
};

export default function Comite() {
  const { canEdit, isAdmin, user } = useAuth();
  const [rows, setRows] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("comite_miembros").select("*").order("created_at");
    setRows((data ?? []) as Miembro[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    const { error } = await supabase.from("comite_miembros").insert({
      ...form,
      fecha_designacion: form.fecha_designacion || null,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Integrante agregado");
    setForm(empty); setOpen(false); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("comite_miembros").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Integrante eliminado");
    load();
  };

  const cargoLabel: Record<string, string> = { coordinador: "Coordinador", secretario: "Secretario", vocal: "Vocal" };
  const repColor = (r: string) => r === "patronal" ? "bg-primary/10 text-primary border-primary/20" : "bg-success/10 text-success border-success/20";

  return (
    <>
      <PageHeader
        title="Elección del comité"
        subtitle="Integrantes designados para la Comisión de Seguridad e Higiene."
        breadcrumbs={[{ label: "Operación CSH" }, { label: "Elección comité" }]}
        actions={canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
                <Plus className="mr-2 h-4 w-4" /> Agregar integrante
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Nuevo integrante del comité</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-1.5"><Label>Nombre completo</Label>
                  <Input value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="h-11 rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Puesto</Label>
                    <Input value={form.puesto} onChange={(e) => setForm({...form, puesto: e.target.value})} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label>Fecha designación</Label>
                    <Input type="date" value={form.fecha_designacion} onChange={(e) => setForm({...form, fecha_designacion: e.target.value})} className="h-11 rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Representación</Label>
                    <Select value={form.representacion} onValueChange={(v: any) => setForm({...form, representacion: v})}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patronal">Patronal</SelectItem>
                        <SelectItem value="trabajadores">Trabajadores</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div className="space-y-1.5"><Label>Cargo en CSH</Label>
                    <Select value={form.cargo_csh} onValueChange={(v: any) => setForm({...form, cargo_csh: v})}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coordinador">Coordinador</SelectItem>
                        <SelectItem value="secretario">Secretario</SelectItem>
                        <SelectItem value="vocal">Vocal</SelectItem>
                      </SelectContent>
                    </Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Correo</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label>Teléfono</Label>
                    <Input value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="h-11 rounded-xl" /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button onClick={save} disabled={saving} className="rounded-xl bg-gradient-primary">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />
      <div className="px-4 py-6 md:px-8">
        <Card className="overflow-hidden rounded-2xl border-border/50 shadow-soft">
          {loading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Aún no hay integrantes registrados.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((m) => (
                <div key={m.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold">{m.nombre}</p>
                    <p className="text-xs text-muted-foreground">{m.puesto || "—"} · {m.email || "sin correo"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={repColor(m.representacion)}>{m.representacion === "patronal" ? "Patronal" : "Trabajadores"}</Badge>
                    <Badge variant="outline">{cargoLabel[m.cargo_csh]}</Badge>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => remove(m.id)} className="rounded-xl text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

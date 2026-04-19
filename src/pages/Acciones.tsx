import { useEffect, useState } from "react";
import { Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Accion {
  id: string;
  titulo: string;
  descripcion: string | null;
  origen: string | null;
  responsable: string | null;
  prioridad: string;
  fecha_deteccion: string;
  fecha_compromiso: string | null;
  fecha_cierre: string | null;
  avance: number;
  estatus: string;
}

const prioridadColor: Record<string, string> = {
  baja: "bg-muted text-muted-foreground",
  media: "bg-primary/10 text-primary border-primary/20",
  alta: "bg-warning/10 text-warning border-warning/20",
  critica: "bg-destructive text-destructive-foreground",
};
const estatusColor: Record<string, string> = {
  abierta: "bg-warning/10 text-warning border-warning/20",
  en_progreso: "bg-primary/10 text-primary border-primary/20",
  cerrada: "bg-success/10 text-success border-success/20",
  vencida: "bg-destructive/10 text-destructive border-destructive/20",
};

const initialForm = {
  titulo: "",
  descripcion: "",
  origen: "recorrido",
  responsable: "",
  prioridad: "media",
  fecha_compromiso: "",
};

export default function Acciones() {
  const { user, canEdit, isAdmin } = useAuth();
  const [list, setList] = useState<Accion[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("todas");
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("acciones_correctivas").select("*").order("fecha_deteccion", { ascending: false });
    setList((data ?? []) as Accion[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.titulo.trim()) return toast.error("Título obligatorio");
    const payload: any = {
      ...form,
      fecha_compromiso: form.fecha_compromiso || null,
      created_by: user?.id,
    };
    const { error } = await supabase.from("acciones_correctivas").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Acción creada");
    setOpen(false);
    setForm(initialForm);
    load();
  };

  const updateAvance = async (id: string, avance: number) => {
    const estatus = avance === 100 ? "cerrada" : avance > 0 ? "en_progreso" : "abierta";
    const fecha_cierre = avance === 100 ? new Date().toISOString().slice(0, 10) : null;
    const { error } = await supabase.from("acciones_correctivas").update({ avance, estatus, fecha_cierre }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta acción?")) return;
    await supabase.from("acciones_correctivas").delete().eq("id", id);
    load();
  };

  const filtered = filter === "todas" ? list : list.filter((a) => a.estatus === filter);
  const stats = {
    abiertas: list.filter((a) => a.estatus === "abierta").length,
    en_progreso: list.filter((a) => a.estatus === "en_progreso").length,
    cerradas: list.filter((a) => a.estatus === "cerrada").length,
  };

  return (
    <>
      <PageHeader
        title="Acciones correctivas"
        subtitle="Seguimiento de acciones derivadas de hallazgos, verificaciones e incidentes."
        breadcrumbs={[{ label: "Acciones correctivas" }]}
        actions={canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-gradient-primary shadow-elegant"><Plus className="mr-2 h-4 w-4" /> Nueva acción</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Nueva acción correctiva</DialogTitle></DialogHeader>
              <div className="grid gap-4">
                <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
                <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Origen</Label>
                    <Select value={form.origen} onValueChange={(v) => setForm({ ...form, origen: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recorrido">Recorrido</SelectItem>
                        <SelectItem value="verificacion">Verificación</SelectItem>
                        <SelectItem value="incidente">Incidente</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridad</Label>
                    <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Responsable</Label><Input value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} /></div>
                  <div><Label>Fecha compromiso</Label><Input type="date" value={form.fecha_compromiso} onChange={(e) => setForm({ ...form, fecha_compromiso: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="px-4 py-6 md:px-8">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {[
            { label: "Abiertas", value: stats.abiertas, color: "text-warning" },
            { label: "En progreso", value: stats.en_progreso, color: "text-primary" },
            { label: "Cerradas", value: stats.cerradas, color: "text-success" },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl border-border/50 p-5 shadow-soft">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className={`mt-1 font-display text-3xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {["todas", "abierta", "en_progreso", "cerrada"].map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(f)}>
              {f.replace("_", " ")}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-border/60 bg-secondary/30 p-12 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-base font-bold">Sin acciones</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((a) => (
              <Card key={a.id} className="rounded-2xl border-border/50 p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className={prioridadColor[a.prioridad]}>{a.prioridad}</Badge>
                      <Badge className={estatusColor[a.estatus]}>{a.estatus.replace("_", " ")}</Badge>
                      {a.origen && <Badge variant="outline">{a.origen}</Badge>}
                    </div>
                    <h3 className="font-display text-base font-bold">{a.titulo}</h3>
                    {a.descripcion && <p className="mt-1 text-sm text-muted-foreground">{a.descripcion}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Detección: {a.fecha_deteccion}
                      {a.fecha_compromiso && ` · Compromiso: ${a.fecha_compromiso}`}
                      {a.responsable && ` · ${a.responsable}`}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <Progress value={a.avance} className="h-2 flex-1" />
                      <span className="text-xs font-medium tabular-nums">{a.avance}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <Select value={String(a.avance)} onValueChange={(v) => updateAvance(a.id, Number(v))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0, 25, 50, 75, 100].map((p) => <SelectItem key={p} value={String(p)}>{p}%</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

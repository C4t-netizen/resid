import { useEffect, useState } from "react";
import { CalendarCheck, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileUploader, ArchivoItem } from "@/components/FileUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Actividad {
  id: string;
  anio: number;
  mes: number;
  actividad: string;
  tipo: string | null;
  responsable: string | null;
  fecha_programada: string | null;
  hora: string | null;
  estatus: "programada" | "en_proceso" | "realizada" | "cancelada";
}

const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const estatusColor: Record<string, string> = {
  programada: "bg-muted text-muted-foreground",
  en_proceso: "bg-warning/10 text-warning border-warning/20",
  realizada: "bg-success/10 text-success border-success/20",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
};

const emptyForm = {
  mes: 1, actividad: "", tipo: "recorrido", responsable: "",
  fecha_programada: "", hora: "",
};

export default function Programa() {
  const { user, canEdit, isAdmin } = useAuth();
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const [rows, setRows] = useState<Actividad[]>([]);
  const [archivos, setArchivos] = useState<ArchivoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Actividad | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const YEARS = [2024, 2025, 2026, 2027, 2028];

  const load = async () => {
    setLoading(true);
    const [act, arc] = await Promise.all([
      supabase.from("programa_anual").select("*").eq("anio", anio).order("mes").order("fecha_programada"),
      supabase.from("programa_archivos").select("*").eq("anio", anio).order("created_at", { ascending: false }),
    ]);
    setRows((act.data ?? []) as Actividad[]);
    setArchivos((arc.data ?? []) as ArchivoItem[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [anio]);

  const save = async () => {
    if (!form.actividad.trim()) { toast.error("Actividad requerida"); return; }
    setSaving(true);
    const payload = {
      anio, mes: form.mes, actividad: form.actividad, tipo: form.tipo,
      responsable: form.responsable || null,
      fecha_programada: form.fecha_programada || null,
      hora: form.hora || null,
    };
    const { error } = editing
      ? await supabase.from("programa_anual").update(payload).eq("id", editing.id)
      : await supabase.from("programa_anual").insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Actividad actualizada" : "Actividad agregada");
    setForm(emptyForm); setEditing(null); setOpen(false); load();
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (a: Actividad) => {
    setEditing(a);
    setForm({
      mes: a.mes, actividad: a.actividad, tipo: a.tipo ?? "recorrido",
      responsable: a.responsable ?? "", fecha_programada: a.fecha_programada ?? "",
      hora: a.hora ? a.hora.slice(0,5) : "",
    });
    setOpen(true);
  };

  const updateEstatus = async (id: string, estatus: Actividad["estatus"]) => {
    const { error } = await supabase.from("programa_anual").update({ estatus, fecha_realizada: estatus === "realizada" ? new Date().toISOString().slice(0,10) : null }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("programa_anual").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const handleUpload = async (file: { nombre: string; archivo_url: string }) => {
    const { error, data } = await supabase.from("programa_archivos").insert({
      anio, nombre: file.nombre, archivo_url: file.archivo_url, created_by: user?.id,
    }).select().single();
    if (error) throw error;
    setArchivos((p) => [data as ArchivoItem, ...p]);
  };

  const handleDeleteArchivo = async (item: ArchivoItem) => {
    const { error } = await supabase.from("programa_archivos").delete().eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    setArchivos((p) => p.filter((a) => a.id !== item.id));
    toast.success("Archivo eliminado");
  };

  const completadas = rows.filter((r) => r.estatus === "realizada").length;
  const avance = rows.length ? Math.round((completadas / rows.length) * 100) : 0;

  // Group rows by month for calendar view
  const porMes = MESES_FULL.map((nombre, idx) => ({
    nombre, num: idx + 1,
    items: rows.filter((r) => r.mes === idx + 1),
  }));

  return (
    <>
      <PageHeader
        title="Programa anual"
        subtitle="Plan de actividades de la CSH para el año en curso."
        breadcrumbs={[{ label: "Operación CSH" }, { label: "Programa anual" }]}
        badge={<Badge className="bg-primary/10 text-primary border-primary/20">{avance}% avance</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Select value={String(anio)} onValueChange={(v) => setAnio(parseInt(v))}>
              <SelectTrigger className="h-10 w-32 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canEdit && (
              <Button onClick={openNew} className="rounded-xl bg-gradient-primary shadow-elegant">
                <Plus className="mr-2 h-4 w-4" /> Actividad
              </Button>
            )}
          </div>
        }
      />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} actividad {anio}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Mes</Label>
                <Select value={String(form.mes)} onValueChange={(v) => setForm({...form, mes: parseInt(v)})}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{MESES_FULL.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({...form, tipo: v})}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recorrido">Recorrido</SelectItem>
                    <SelectItem value="verificacion">Verificación</SelectItem>
                    <SelectItem value="capacitacion">Capacitación</SelectItem>
                    <SelectItem value="reunion">Reunión</SelectItem>
                    <SelectItem value="simulacro">Simulacro</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
            <div className="space-y-1.5"><Label>Actividad</Label>
              <Input value={form.actividad} onChange={(e) => setForm({...form, actividad: e.target.value})} className="h-11 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Responsable</Label>
                <Input value={form.responsable} onChange={(e) => setForm({...form, responsable: e.target.value})} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Fecha programada</Label>
                <Input type="date" value={form.fecha_programada} onChange={(e) => setForm({...form, fecha_programada: e.target.value})} className="h-11 rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Hora</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({...form, hora: e.target.value})} className="h-11 rounded-xl" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={save} disabled={saving} className="rounded-xl bg-gradient-primary">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 px-4 py-6 md:px-8">
        <Tabs defaultValue="lista">
          <TabsList className="rounded-xl">
            <TabsTrigger value="lista" className="rounded-lg">Lista</TabsTrigger>
            <TabsTrigger value="calendario" className="rounded-lg">Calendario</TabsTrigger>
            <TabsTrigger value="archivos" className="rounded-lg">Archivos</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="mt-4">
            <Card className="overflow-hidden rounded-2xl border-border/50 shadow-soft">
              {loading ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-3 p-12 text-center">
                  <CalendarCheck className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Sin actividades para {anio}.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {rows.map((a) => (
                    <div key={a.id} className="grid gap-3 p-4 md:grid-cols-[60px_1fr_180px_auto] md:items-center md:p-5">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span className="text-[10px] font-semibold uppercase">{MESES[a.mes-1]}</span>
                        <span className="text-xs font-bold">{a.anio}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-sm font-bold">{a.actividad}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.tipo} · {a.responsable || "Sin responsable"}
                          {a.fecha_programada && ` · ${a.fecha_programada}`}
                          {a.hora && ` · ${a.hora.slice(0,5)}`}
                        </p>
                      </div>
                      <Select value={a.estatus} onValueChange={(v: any) => updateEstatus(a.id, v)} disabled={!canEdit}>
                        <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="programada">Programada</SelectItem>
                          <SelectItem value="en_proceso">En proceso</SelectItem>
                          <SelectItem value="realizada">Realizada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2 justify-self-end">
                        <Badge className={estatusColor[a.estatus]}>{a.estatus.replace("_"," ")}</Badge>
                        {canEdit && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(a)} className="rounded-xl text-primary hover:bg-primary/10">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => remove(a.id)} className="rounded-xl text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="calendario" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {porMes.map((m) => (
                <Card key={m.num} className="rounded-2xl border-border/50 p-4 shadow-soft">
                  <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
                    <h4 className="font-display text-sm font-bold">{m.nombre} {anio}</h4>
                    <Badge variant="outline" className="rounded-lg text-xs">{m.items.length}</Badge>
                  </div>
                  {m.items.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">Sin actividades</p>
                  ) : (
                    <ul className="space-y-2">
                      {m.items.map((a) => (
                        <li key={a.id} className="rounded-xl border border-border/40 bg-secondary/30 p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold leading-tight">{a.actividad}</p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {a.fecha_programada ?? "Sin fecha"}{a.hora ? ` · ${a.hora.slice(0,5)}` : ""}
                              </p>
                              {a.responsable && <p className="text-[11px] text-muted-foreground">{a.responsable}</p>}
                            </div>
                            <Badge className={`${estatusColor[a.estatus]} text-[10px]`}>{a.estatus.replace("_"," ")}</Badge>
                          </div>
                          {canEdit && (
                            <div className="mt-2 flex justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 rounded-lg px-2 text-xs" onClick={() => openEdit(a)}>
                                <Pencil className="mr-1 h-3 w-3" /> Editar
                              </Button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="archivos" className="mt-4">
            <Card className="rounded-2xl border-border/50 p-6 shadow-soft">
              <FileUploader
                archivos={archivos}
                canEdit={canEdit}
                folder={`programa/${anio}`}
                onUpload={handleUpload}
                onDelete={handleDeleteArchivo}
                label={`Programas anuales ${anio}`}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

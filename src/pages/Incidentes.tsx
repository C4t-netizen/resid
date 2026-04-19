import { useEffect, useState } from "react";
import { Loader2, Plus, AlertTriangle, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Incidente {
  id: string;
  fecha: string;
  hora: string | null;
  area: string;
  tipo: string;
  gravedad: string;
  persona_afectada: string | null;
  descripcion: string;
  dias_incapacidad: number | null;
  estatus: string;
}

const gravedadColor: Record<string, string> = {
  leve: "bg-muted text-muted-foreground",
  moderado: "bg-warning/10 text-warning border-warning/20",
  grave: "bg-destructive/10 text-destructive border-destructive/20",
  fatal: "bg-destructive text-destructive-foreground",
};

const estatusColor: Record<string, string> = {
  abierto: "bg-warning/10 text-warning border-warning/20",
  en_investigacion: "bg-primary/10 text-primary border-primary/20",
  cerrado: "bg-success/10 text-success border-success/20",
};

const initialForm = {
  fecha: new Date().toISOString().slice(0, 10),
  hora: "",
  area: "",
  lugar: "",
  tipo: "accidente",
  gravedad: "leve",
  persona_afectada: "",
  puesto: "",
  edad: "",
  descripcion: "",
  causas: "",
  consecuencias: "",
  dias_incapacidad: "0",
  costo_estimado: "0",
  reportado_por: "",
};

export default function Incidentes() {
  const { user, canEdit, isAdmin } = useAuth();
  const [list, setList] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("incidentes").select("*").order("fecha", { ascending: false });
    setList((data ?? []) as Incidente[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.area.trim() || !form.descripcion.trim()) {
      toast.error("Área y descripción son obligatorios");
      return;
    }
    const payload: any = {
      ...form,
      hora: form.hora || null,
      edad: form.edad ? Number(form.edad) : null,
      dias_incapacidad: Number(form.dias_incapacidad || 0),
      costo_estimado: Number(form.costo_estimado || 0),
      created_by: user?.id,
    };
    const { error } = await supabase.from("incidentes").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Incidente registrado");
    setOpen(false);
    setForm(initialForm);
    load();
  };

  const updateEstatus = async (id: string, estatus: string) => {
    const { error } = await supabase.from("incidentes").update({ estatus }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este incidente?")) return;
    const { error } = await supabase.from("incidentes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  return (
    <>
      <PageHeader
        title="Registro de incidentes"
        subtitle="Bitácora de accidentes, incidentes y casi-accidentes ocurridos en el centro de trabajo."
        breadcrumbs={[{ label: "Incidentes" }]}
        badge={<Badge className="bg-destructive/10 text-destructive border-destructive/20">{list.length} registros</Badge>}
        actions={canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-gradient-primary shadow-elegant"><Plus className="mr-2 h-4 w-4" /> Nuevo incidente</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Registrar incidente</DialogTitle></DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Fecha *</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
                <div><Label>Hora</Label><Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
                <div><Label>Área *</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Producción" /></div>
                <div><Label>Lugar específico</Label><Input value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} placeholder="Zona de embalaje" /></div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accidente">Accidente</SelectItem>
                      <SelectItem value="incidente">Incidente</SelectItem>
                      <SelectItem value="casi_accidente">Casi-accidente</SelectItem>
                      <SelectItem value="enfermedad">Enfermedad laboral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gravedad</Label>
                  <Select value={form.gravedad} onValueChange={(v) => setForm({ ...form, gravedad: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leve">Leve</SelectItem>
                      <SelectItem value="moderado">Moderado</SelectItem>
                      <SelectItem value="grave">Grave</SelectItem>
                      <SelectItem value="fatal">Fatal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Persona afectada</Label><Input value={form.persona_afectada} onChange={(e) => setForm({ ...form, persona_afectada: e.target.value })} /></div>
                <div><Label>Puesto</Label><Input value={form.puesto} onChange={(e) => setForm({ ...form, puesto: e.target.value })} /></div>
                <div><Label>Edad</Label><Input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} /></div>
                <div><Label>Días de incapacidad</Label><Input type="number" value={form.dias_incapacidad} onChange={(e) => setForm({ ...form, dias_incapacidad: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Descripción *</Label><Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} /></div>
                <div className="md:col-span-2"><Label>Causas probables</Label><Textarea value={form.causas} onChange={(e) => setForm({ ...form, causas: e.target.value })} rows={2} /></div>
                <div className="md:col-span-2"><Label>Consecuencias</Label><Textarea value={form.consecuencias} onChange={(e) => setForm({ ...form, consecuencias: e.target.value })} rows={2} /></div>
                <div><Label>Costo estimado (MXN)</Label><Input type="number" value={form.costo_estimado} onChange={(e) => setForm({ ...form, costo_estimado: e.target.value })} /></div>
                <div><Label>Reportado por</Label><Input value={form.reportado_por} onChange={(e) => setForm({ ...form, reportado_por: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Registrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="px-4 py-6 md:px-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : list.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-border/60 bg-secondary/30 p-12 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-base font-bold">Sin incidentes registrados</p>
            <p className="text-sm text-muted-foreground">Registra el primer evento para construir el histórico.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {list.map((i) => (
              <Card key={i.id} className="rounded-2xl border-border/50 p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className={gravedadColor[i.gravedad]}>{i.gravedad}</Badge>
                      <Badge variant="outline">{i.tipo.replace("_", " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{i.fecha} {i.hora ?? ""}</span>
                    </div>
                    <h3 className="font-display text-base font-bold">{i.area}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{i.descripcion}</p>
                    {i.persona_afectada && <p className="mt-1 text-xs text-muted-foreground">Afectado: {i.persona_afectada} · {i.dias_incapacidad ?? 0} días incapacidad</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit ? (
                      <Select value={i.estatus} onValueChange={(v) => updateEstatus(i.id, v)}>
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="abierto">Abierto</SelectItem>
                          <SelectItem value="en_investigacion">En investigación</SelectItem>
                          <SelectItem value="cerrado">Cerrado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={estatusColor[i.estatus]}>{i.estatus.replace("_", " ")}</Badge>
                    )}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => remove(i.id)}>
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

import { useEffect, useState } from "react";
import { Loader2, Plus, Search, Trash2, AlertTriangle, ArrowLeft, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

interface Recorrido {
  id: string;
  fecha: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  area: string;
  tipo: string;
  integrantes: string | null;
  observaciones_generales: string | null;
  estatus: "borrador" | "cerrado";
}
interface Hallazgo {
  id: string;
  recorrido_id: string;
  descripcion: string;
  ubicacion: string | null;
  nivel_riesgo: "bajo" | "medio" | "alto" | "critico";
  recomendacion: string | null;
  estatus: "abierto" | "en_proceso" | "resuelto";
}

const riesgoColor: Record<string, string> = {
  bajo: "bg-muted text-muted-foreground",
  medio: "bg-warning/10 text-warning border-warning/20",
  alto: "bg-destructive/10 text-destructive border-destructive/20",
  critico: "bg-destructive text-destructive-foreground",
};

export default function Recorridos() {
  const { user, canEdit, isAdmin } = useAuth();
  const [list, setList] = useState<Recorrido[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Recorrido | null>(null);
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);
  const [form, setForm] = useState({ fecha: new Date().toISOString().slice(0,10), fecha_inicio: new Date().toISOString().slice(0,10), fecha_fin: "", hora_inicio: "", hora_fin: "", area: "", tipo: "ordinario", integrantes: "" });
  const [hForm, setHForm] = useState({ descripcion: "", ubicacion: "", nivel_riesgo: "medio", recomendacion: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("recorridos").select("*").order("fecha", { ascending: false });
    setList((data ?? []) as Recorrido[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadHallazgos = async (recorridoId: string) => {
    const { data } = await supabase.from("recorrido_hallazgos").select("*").eq("recorrido_id", recorridoId).order("created_at");
    setHallazgos((data ?? []) as Hallazgo[]);
  };

  const openDetail = async (r: Recorrido) => { setSelected(r); await loadHallazgos(r.id); };

  const create = async () => {
    if (!form.area.trim()) { toast.error("Área requerida"); return; }
    const payload = {
      ...form,
      fecha_fin: form.fecha_fin || null,
      hora_inicio: form.hora_inicio || null,
      hora_fin: form.hora_fin || null,
      created_by: user?.id,
    };
    const { error, data } = await supabase.from("recorridos").insert(payload).select().single();
    if (error) return toast.error(error.message);
    toast.success("Recorrido creado");
    setOpen(false);
    setForm({ fecha: new Date().toISOString().slice(0,10), fecha_inicio: new Date().toISOString().slice(0,10), fecha_fin: "", hora_inicio: "", hora_fin: "", area: "", tipo: "ordinario", integrantes: "" });
    load();
    if (data) openDetail(data as Recorrido);
  };

  const addHallazgo = async () => {
    if (!selected || !hForm.descripcion.trim()) { toast.error("Descripción requerida"); return; }
    const { error } = await supabase.from("recorrido_hallazgos").insert({
      recorrido_id: selected.id,
      descripcion: hForm.descripcion,
      ubicacion: hForm.ubicacion || null,
      nivel_riesgo: hForm.nivel_riesgo,
      recomendacion: hForm.recomendacion || null,
    });
    if (error) return toast.error(error.message);
    setHForm({ descripcion: "", ubicacion: "", nivel_riesgo: "medio", recomendacion: "" });
    loadHallazgos(selected.id);
  };

  const updateHallazgo = async (id: string, estatus: Hallazgo["estatus"]) => {
    await supabase.from("recorrido_hallazgos").update({ estatus }).eq("id", id);
    if (selected) loadHallazgos(selected.id);
  };

  const removeRecorrido = async (id: string) => {
    await supabase.from("recorridos").delete().eq("id", id);
    toast.success("Recorrido eliminado");
    load();
  };

  const exportRecorridoPdf = (r: Recorrido, hs: Hallazgo[]) => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, w, 28, "F");
    doc.setTextColor(255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Recorrido de Seguridad", 14, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Área: ${r.area}  ·  Tipo: ${r.tipo}`, 14, 22);
    doc.setTextColor(0);
    autoTable(doc, {
      startY: 36,
      head: [["Campo", "Valor"]],
      body: [
        ["Fecha inicio", `${r.fecha_inicio ?? r.fecha}${r.hora_inicio ? ` ${r.hora_inicio.slice(0,5)}` : ""}`],
        ["Fecha fin", r.fecha_fin ? `${r.fecha_fin}${r.hora_fin ? ` ${r.hora_fin.slice(0,5)}` : ""}` : "-"],
        ["Integrantes", r.integrantes ?? "-"],
        ["Observaciones", r.observaciones_generales ?? "-"],
        ["Estatus", r.estatus],
      ],
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 9 },
    });
    let y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Hallazgos (${hs.length})`, 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["#", "Descripción", "Ubicación", "Riesgo", "Recomendación", "Estatus"]],
      body: hs.map((h, i) => [i + 1, h.descripcion, h.ubicacion ?? "-", h.nivel_riesgo, h.recomendacion ?? "-", h.estatus]),
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 8, cellPadding: 2 },
    });
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Página ${p} de ${pages} · Generado ${new Date().toLocaleDateString("es-MX")}`, 14, doc.internal.pageSize.getHeight() - 8);
    }
    doc.save(`recorrido-${r.area}-${r.fecha_inicio ?? r.fecha}.pdf`);
  };

  // ============ DETAIL VIEW ============
  if (selected) {
    return (
      <>
        <PageHeader
          title={`Recorrido · ${selected.area}`}
          subtitle={`${selected.fecha_inicio ?? selected.fecha}${selected.hora_inicio ? ` ${selected.hora_inicio.slice(0,5)}` : ""}${selected.fecha_fin ? ` → ${selected.fecha_fin}` : ""}${selected.hora_fin ? ` ${selected.hora_fin.slice(0,5)}` : ""} · ${selected.tipo}`}
          breadcrumbs={[{ label: "Recorridos", href: "/recorridos" }, { label: selected.area }]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportRecorridoPdf(selected, hallazgos)} className="rounded-xl">
                <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
            </div>
          }
        />
        <div className="space-y-6 px-4 py-6 md:px-8">
          {canEdit && (
            <Card className="rounded-2xl border-border/50 p-5 shadow-soft">
              <h3 className="mb-4 font-display text-base font-bold">Agregar hallazgo</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2"><Label>Descripción</Label>
                  <Input value={hForm.descripcion} onChange={(e) => setHForm({...hForm, descripcion: e.target.value})} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Ubicación</Label>
                  <Input value={hForm.ubicacion} onChange={(e) => setHForm({...hForm, ubicacion: e.target.value})} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Nivel de riesgo</Label>
                  <Select value={hForm.nivel_riesgo} onValueChange={(v) => setHForm({...hForm, nivel_riesgo: v})}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bajo">Bajo</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="critico">Crítico</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div className="space-y-1.5 md:col-span-2"><Label>Recomendación</Label>
                  <Textarea value={hForm.recomendacion} onChange={(e) => setHForm({...hForm, recomendacion: e.target.value})} className="min-h-[80px] rounded-xl" /></div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={addHallazgo} className="rounded-xl bg-gradient-primary"><Plus className="mr-2 h-4 w-4" /> Agregar</Button>
              </div>
            </Card>
          )}
          <Card className="overflow-hidden rounded-2xl border-border/50 shadow-soft">
            <div className="border-b border-border bg-secondary/30 px-5 py-3">
              <p className="font-display text-sm font-bold">Hallazgos ({hallazgos.length})</p>
            </div>
            {hallazgos.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Sin hallazgos registrados.</p>
            ) : (
              <div className="divide-y divide-border">
                {hallazgos.map((h) => (
                  <div key={h.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                        <div>
                          <p className="text-sm font-medium">{h.descripcion}</p>
                          {h.ubicacion && <p className="text-xs text-muted-foreground">📍 {h.ubicacion}</p>}
                          {h.recomendacion && <p className="mt-1 text-xs italic text-muted-foreground">→ {h.recomendacion}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={riesgoColor[h.nivel_riesgo]}>{h.nivel_riesgo}</Badge>
                      <Select value={h.estatus} onValueChange={(v: any) => updateHallazgo(h.id, v)} disabled={!canEdit}>
                        <SelectTrigger className="h-9 w-32 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="abierto">Abierto</SelectItem>
                          <SelectItem value="en_proceso">En proceso</SelectItem>
                          <SelectItem value="resuelto">Resuelto</SelectItem>
                        </SelectContent>
                      </Select>
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

  // ============ LIST VIEW ============
  return (
    <>
      <PageHeader
        title="Recorridos de seguridad"
        subtitle="Inspecciones programadas para identificar riesgos en el centro de trabajo."
        breadcrumbs={[{ label: "Operación CSH" }, { label: "Recorridos" }]}
        actions={canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-gradient-primary shadow-elegant"><Plus className="mr-2 h-4 w-4" /> Nuevo recorrido</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Nuevo recorrido</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Fecha inicio</Label>
                    <Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({...form, fecha_inicio: e.target.value, fecha: e.target.value})} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label>Fecha fin</Label>
                    <Input type="date" value={form.fecha_fin} onChange={(e) => setForm({...form, fecha_fin: e.target.value})} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label>Hora inicio</Label>
                    <Input type="time" value={form.hora_inicio} onChange={(e) => setForm({...form, hora_inicio: e.target.value})} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label>Hora fin</Label>
                    <Input type="time" value={form.hora_fin} onChange={(e) => setForm({...form, hora_fin: e.target.value})} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5 col-span-2"><Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm({...form, tipo: v})}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ordinario">Ordinario</SelectItem>
                        <SelectItem value="extraordinario">Extraordinario</SelectItem>
                        <SelectItem value="especial">Especial</SelectItem>
                      </SelectContent>
                    </Select></div>
                </div>
                <div className="space-y-1.5"><Label>Área</Label>
                  <Input value={form.area} onChange={(e) => setForm({...form, area: e.target.value})} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Integrantes</Label>
                  <Input value={form.integrantes} onChange={(e) => setForm({...form, integrantes: e.target.value})} placeholder="Nombres separados por coma" className="h-11 rounded-xl" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button onClick={create} className="rounded-xl bg-gradient-primary">Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />
      <div className="px-4 py-6 md:px-8">
        <Card className="overflow-hidden rounded-2xl border-border/50 shadow-soft">
          {loading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No hay recorridos registrados.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {list.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-4 md:p-5">
                  <button onClick={() => openDetail(r)} className="flex flex-1 items-center gap-3 text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Search className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold">{r.area}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.fecha_inicio ?? r.fecha}{r.hora_inicio ? ` ${r.hora_inicio.slice(0,5)}` : ""}
                        {r.fecha_fin ? ` → ${r.fecha_fin}${r.hora_fin ? ` ${r.hora_fin.slice(0,5)}` : ""}` : ""}
                        {" · "}{r.tipo}
                      </p>
                    </div>
                    <Badge className={r.estatus === "cerrado" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
                      {r.estatus}
                    </Badge>
                  </button>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => removeRecorrido(r.id)} className="rounded-xl text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

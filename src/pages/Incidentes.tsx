import { useEffect, useState } from "react";
import { Loader2, Plus, FileSearch, Trash2, FileDown, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
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
import { usePdfPreview } from "@/components/PdfPreviewDialog";

interface Accion {
  id?: string;
  accion: string;
  depto_responsable: string;
  fecha_probable: string;
  fecha_real: string;
  responsable_seguimiento: string;
}

interface Investigacion {
  id: string;
  folio: string | null;
  nombre_persona: string;
  fecha_evento: string;
  fecha_notificacion: string | null;
  fecha_nacimiento: string | null;
  rfc_num_control: string | null;
  sexo: string | null;
  departamento: string | null;
  edad: number | null;
  puesto: string | null;
  tipo: string;
  lugar_accidente: string | null;
  area: string | null;
  actividad_tipo: string | null;
  descripcion: string | null;
  acto_inseguro: string | null;
  condicion_insegura: string | null;
  condicion_peligrosa: string | null;
  consecuencias: string | null;
  causas: string | null;
  estatus: string;
}

const empty = {
  folio: "",
  nombre_persona: "",
  fecha_notificacion: new Date().toISOString().slice(0, 10),
  fecha_nacimiento: "",
  rfc_num_control: "",
  sexo: "M",
  departamento: "",
  edad: "",
  puesto: "",
  fecha_evento: new Date().toISOString().slice(0, 10),
  tipo: "incidente",
  lugar_accidente: "sitio_trabajo",
  area: "",
  actividad_tipo: "rutinaria",
  descripcion: "",
  acto_inseguro: "",
  condicion_insegura: "",
  condicion_peligrosa: "",
  consecuencias: "",
  causas: "",
  estatus: "abierto",
};

const STEPS = ["Datos personales", "Evento", "Causas y consecuencias", "Acciones correctivas"];

export default function Incidentes() {
  const { user, canEdit, isAdmin } = useAuth();
  const [list, setList] = useState<Investigacion[]>([]);
  const [acciones, setAcciones] = useState<Record<string, Accion[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [accForm, setAccForm] = useState<Accion[]>([]);
  const { openPdfPreview, PdfPreviewDialogElement } = usePdfPreview();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("investigaciones").select("*").order("fecha_evento", { ascending: false });
    const inv = (data ?? []) as Investigacion[];
    setList(inv);
    if (inv.length) {
      const { data: accs } = await supabase
        .from("investigacion_acciones")
        .select("*")
        .in("investigacion_id", inv.map((i) => i.id));
      const map: Record<string, Accion[]> = {};
      (accs ?? []).forEach((a: any) => {
        (map[a.investigacion_id] ??= []).push(a);
      });
      setAcciones(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(empty);
    setAccForm([]);
    setStep(0);
    setEditId(null);
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (inv: Investigacion) => {
    setEditId(inv.id);
    setForm({
      folio: inv.folio ?? "",
      nombre_persona: inv.nombre_persona,
      fecha_notificacion: inv.fecha_notificacion ?? "",
      fecha_nacimiento: inv.fecha_nacimiento ?? "",
      rfc_num_control: inv.rfc_num_control ?? "",
      sexo: inv.sexo ?? "M",
      departamento: inv.departamento ?? "",
      edad: inv.edad?.toString() ?? "",
      puesto: inv.puesto ?? "",
      fecha_evento: inv.fecha_evento,
      tipo: inv.tipo,
      lugar_accidente: inv.lugar_accidente ?? "sitio_trabajo",
      area: inv.area ?? "",
      actividad_tipo: inv.actividad_tipo ?? "rutinaria",
      descripcion: inv.descripcion ?? "",
      acto_inseguro: inv.acto_inseguro ?? "",
      condicion_insegura: inv.condicion_insegura ?? "",
      condicion_peligrosa: inv.condicion_peligrosa ?? "",
      consecuencias: inv.consecuencias ?? "",
      causas: inv.causas ?? "",
      estatus: inv.estatus,
    });
    setAccForm((acciones[inv.id] ?? []).map((a) => ({ ...a })));
    setStep(0);
    setOpen(true);
  };

  const save = async () => {
    if (!form.nombre_persona.trim()) return toast.error("Nombre de la persona es obligatorio");
    const payload = {
      ...form,
      edad: form.edad ? Number(form.edad) : null,
      fecha_notificacion: form.fecha_notificacion || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      created_by: user?.id,
    };
    let invId = editId;
    if (editId) {
      const { error } = await supabase.from("investigaciones").update(payload).eq("id", editId);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("investigaciones").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      invId = data.id;
    }
    // replace acciones
    if (invId) {
      await supabase.from("investigacion_acciones").delete().eq("investigacion_id", invId);
      const valid = accForm.filter((a) => a.accion.trim());
      if (valid.length) {
        await supabase.from("investigacion_acciones").insert(
          valid.map((a) => ({
            investigacion_id: invId,
            accion: a.accion,
            depto_responsable: a.depto_responsable || null,
            fecha_probable: a.fecha_probable || null,
            fecha_real: a.fecha_real || null,
            responsable_seguimiento: a.responsable_seguimiento || null,
          })),
        );
      }
    }
    toast.success(editId ? "Investigación actualizada" : "Investigación registrada");
    setOpen(false);
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta investigación?")) return;
    const { error } = await supabase.from("investigaciones").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    load();
  };

  const exportPDF = (inv: Investigacion) => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const W = doc.internal.pageSize.getWidth();
    const M = 12;
    // header
    doc.setFillColor(120, 30, 50);
    doc.rect(0, 0, W, 22, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INSTITUTO TECNOLÓGICO DE DURANGO", W / 2, 9, { align: "center" });
    doc.setFontSize(10);
    doc.text("Formato de Investigación de Incidentes y Accidentes", W / 2, 15, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Código: ITD-SS-PO-03-01  ·  Revisión: 1  ·  Ref. ISO 45001:2018 8.2, 10.2", W / 2, 19.5, { align: "center" });
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 26,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.6 },
      body: [
        [{ content: "Nombre de la persona que sufre el daño:", styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, { content: inv.nombre_persona, colSpan: 3 }],
        [{ content: "Fecha de notificación:", styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, inv.fecha_notificacion ?? "", { content: "Fecha de nacimiento:", styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, inv.fecha_nacimiento ?? ""],
        [{ content: "R.F.C./Núm. de Control:", styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, inv.rfc_num_control ?? "", { content: "Sexo:", styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, inv.sexo ?? ""],
        [{ content: "Departamento de adscripción:", styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, inv.departamento ?? "", { content: "Edad:", styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, inv.edad?.toString() ?? ""],
        [{ content: "Puesto de trabajo:", styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, { content: inv.puesto ?? "", colSpan: 3 }],
        [{ content: "Fecha del incidente/accidente:", styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, { content: inv.fecha_evento, colSpan: 3 }],
      ],
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 40 }, 3: { cellWidth: 40 } },
      margin: { left: M, right: M },
    });

    const block = (title: string, val: string | null) => {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 1,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 1.6 },
        body: [
          [{ content: title, styles: { fontStyle: "bold", fillColor: [240, 240, 245] } }, val || "—"],
        ],
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: "auto" as any } },
        margin: { left: M, right: M },
      });
    };
    block(`Tipo: ${inv.tipo === "accidente" ? "Accidente" : "Incidente"}`, `Lugar: ${inv.lugar_accidente?.replace("_", " ") ?? ""}`);
    block("Área donde ocurrió:", inv.area);
    block("Tipo de actividad:", inv.actividad_tipo);
    block("Descripción:", inv.descripcion);
    block("Acto inseguro:", inv.acto_inseguro);
    block("Condición insegura:", inv.condicion_insegura);
    block("Condición peligrosa:", inv.condicion_peligrosa);
    block("Consecuencias:", inv.consecuencias);
    block("Causas (árbol causa-raíz):", inv.causas);

    const accs = acciones[inv.id] ?? [];
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: "grid",
      head: [["Acción correctiva", "Departamento", "Fecha probable", "Fecha real", "Responsable seguimiento"]],
      body: accs.length
        ? accs.map((a) => [a.accion, a.depto_responsable ?? "", a.fecha_probable ?? "", a.fecha_real ?? "", a.responsable_seguimiento ?? ""])
        : [["Sin acciones registradas", "", "", "", ""]],
      headStyles: { fillColor: [120, 30, 50], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.4 },
      margin: { left: M, right: M },
    });

    openPdfPreview(doc, `investigacion_${inv.nombre_persona.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <>
      <PageHeader
        title="Investigación de Incidentes y Accidentes"
        subtitle="Formato ITD-SS-PO-03-01 · ISO 45001:2018 8.2, 10.2"
        breadcrumbs={[{ label: "Eventos" }, { label: "Investigación" }]}
        badge={<Badge className="bg-primary/10 text-primary border-primary/20">{list.length} registros</Badge>}
        actions={canEdit && (
          <Button onClick={openNew} className="rounded-xl bg-gradient-primary shadow-elegant">
            <Plus className="mr-2 h-4 w-4" /> Nueva investigación
          </Button>
        )}
      />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar" : "Nueva"} investigación · Paso {step + 1} de {STEPS.length}: {STEPS[step]}</DialogTitle>
          </DialogHeader>

          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Nombre de la persona *</Label><Input value={form.nombre_persona} onChange={(e) => setForm({ ...form, nombre_persona: e.target.value })} /></div>
              <div><Label>Fecha de notificación</Label><Input type="date" value={form.fecha_notificacion} onChange={(e) => setForm({ ...form, fecha_notificacion: e.target.value })} /></div>
              <div><Label>Fecha de nacimiento</Label><Input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} /></div>
              <div><Label>R.F.C. / Número de control</Label><Input value={form.rfc_num_control} onChange={(e) => setForm({ ...form, rfc_num_control: e.target.value })} /></div>
              <div>
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Femenino</SelectItem><SelectItem value="O">Otro</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Departamento de adscripción</Label><Input value={form.departamento} onChange={(e) => setForm({ ...form, departamento: e.target.value })} /></div>
              <div><Label>Edad</Label><Input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Puesto de trabajo</Label><Input value={form.puesto} onChange={(e) => setForm({ ...form, puesto: e.target.value })} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Fecha del evento *</Label><Input type="date" value={form.fecha_evento} onChange={(e) => setForm({ ...form, fecha_evento: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="incidente">Incidente</SelectItem><SelectItem value="accidente">Accidente</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lugar del accidente</Label>
                <Select value={form.lugar_accidente} onValueChange={(v) => setForm({ ...form, lugar_accidente: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sitio_trabajo">En el sitio de trabajo</SelectItem>
                    <SelectItem value="comision">En comisión</SelectItem>
                    <SelectItem value="trayecto">En trayecto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Área donde ocurrió</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
              <div className="md:col-span-2">
                <Label>Actividad que realizaba</Label>
                <Select value={form.actividad_tipo} onValueChange={(v) => setForm({ ...form, actividad_tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="rutinaria">Rutinaria</SelectItem><SelectItem value="no_rutinaria">No rutinaria</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Descripción del incidente/accidente</Label><Textarea rows={4} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div><Label>Acto inseguro</Label><Textarea rows={2} value={form.acto_inseguro} onChange={(e) => setForm({ ...form, acto_inseguro: e.target.value })} /></div>
              <div><Label>Condición insegura</Label><Textarea rows={2} value={form.condicion_insegura} onChange={(e) => setForm({ ...form, condicion_insegura: e.target.value })} /></div>
              <div><Label>Condición peligrosa</Label><Textarea rows={2} value={form.condicion_peligrosa} onChange={(e) => setForm({ ...form, condicion_peligrosa: e.target.value })} /></div>
              <div><Label>Consecuencias</Label><Textarea rows={2} value={form.consecuencias} onChange={(e) => setForm({ ...form, consecuencias: e.target.value })} /></div>
              <div><Label>Esquema de investigación por árbol causa-raíz / Causas</Label><Textarea rows={3} value={form.causas} onChange={(e) => setForm({ ...form, causas: e.target.value })} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Acciones correctivas asociadas</p>
                <Button size="sm" variant="outline" onClick={() => setAccForm([...accForm, { accion: "", depto_responsable: "", fecha_probable: "", fecha_real: "", responsable_seguimiento: "" }])}>
                  <Plus className="mr-1 h-3 w-3" /> Agregar acción
                </Button>
              </div>
              {accForm.length === 0 && <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">Sin acciones. Agrega una para comenzar.</p>}
              {accForm.map((a, idx) => (
                <Card key={idx} className="space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">Acción #{idx + 1}</p>
                    <Button size="icon" variant="ghost" onClick={() => setAccForm(accForm.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                  <Textarea placeholder="Acción correctiva" rows={2} value={a.accion} onChange={(e) => { const c = [...accForm]; c[idx].accion = e.target.value; setAccForm(c); }} />
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label className="text-xs">Departamento responsable de la implementación de las acciones correctivas</Label>
                      <Input placeholder="Departamento responsable" value={a.depto_responsable} onChange={(e) => { const c = [...accForm]; c[idx].depto_responsable = e.target.value; setAccForm(c); }} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Responsable de seguimiento</Label>
                      <Input placeholder="Responsable de seguimiento" value={a.responsable_seguimiento} onChange={(e) => { const c = [...accForm]; c[idx].responsable_seguimiento = e.target.value; setAccForm(c); }} />
                    </div>
                    <div><Label className="text-xs">Fecha probable</Label><Input type="date" value={a.fecha_probable} onChange={(e) => { const c = [...accForm]; c[idx].fecha_probable = e.target.value; setAccForm(c); }} /></div>
                    <div><Label className="text-xs">Fecha real</Label><Input type="date" value={a.fecha_real} onChange={(e) => { const c = [...accForm]; c[idx].fecha_real = e.target.value; setAccForm(c); }} /></div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>Siguiente <ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={save}>{editId ? "Actualizar" : "Guardar"} investigación</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="px-4 py-6 md:px-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : list.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-border/60 bg-secondary/30 p-12 text-center">
            <FileSearch className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-base font-bold">Sin investigaciones registradas</p>
            <p className="text-sm text-muted-foreground">Crea la primera para iniciar el seguimiento.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {list.map((i) => (
              <Card key={i.id} className="rounded-2xl border-border/50 p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">{i.tipo}</Badge>
                      {i.lugar_accidente && <Badge variant="outline">{i.lugar_accidente.replace("_", " ")}</Badge>}
                      <span className="text-xs text-muted-foreground">{i.fecha_evento}</span>
                    </div>
                    <h3 className="font-display text-base font-bold">{i.nombre_persona}</h3>
                    <p className="text-xs text-muted-foreground">{i.departamento ?? "—"} · {i.puesto ?? "—"}</p>
                    {i.descripcion && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{i.descripcion}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">Acciones correctivas: {(acciones[i.id] ?? []).length}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportPDF(i)}><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>
                    {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>}
                    {isAdmin && <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
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

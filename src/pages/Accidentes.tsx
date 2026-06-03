import { useEffect, useState } from "react";
import { Loader2, Plus, HeartPulse, Trash2, FileDown, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePdfPreview } from "@/components/PdfPreviewDialog";

interface Registro {
  id: string;
  investigacion_id: string | null;
  fecha: string;
  rfc_num_control: string | null;
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  sexo: string | null;
  edad: number | null;
  telefono: string | null;
  email: string | null;
  calle_numero: string | null;
  colonia: string | null;
  codigo_postal: string | null;
  ciudad: string | null;
  estado: string | null;
  no_tarjeta: string | null;
  adscripcion: string | null;
  area_accidente: string | null;
  fecha_accidente: string | null;
  folio: string | null;
  mecanismo_lesion: string | null;
  consecuencia: string | null;
  region_anatomica: string | null;
  causa_acto_inseguro: string | null;
  causa_condicion_insegura: string | null;
  licencia_inicio: string | null;
  licencia_alta: string | null;
  incapacidad_total: number | null;
  incapacidad_parcial: number | null;
  muerte: boolean | null;
  dictamen_riesgo: string | null;
}

interface InvOption {
  id: string;
  nombre_persona: string;
  fecha_evento: string;
  rfc_num_control: string | null;
  departamento: string | null;
  area: string | null;
  edad: number | null;
  sexo: string | null;
}

const empty = {
  investigacion_id: "none",
  fecha: new Date().toISOString().slice(0, 10),
  rfc_num_control: "",
  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",
  sexo: "M",
  edad: "",
  telefono: "",
  email: "",
  calle_numero: "",
  colonia: "",
  codigo_postal: "",
  ciudad: "",
  estado: "",
  no_tarjeta: "",
  adscripcion: "",
  area_accidente: "",
  fecha_accidente: "",
  folio: "",
  mecanismo_lesion: "",
  consecuencia: "",
  region_anatomica: "",
  causa_acto_inseguro: "",
  causa_condicion_insegura: "",
  licencia_inicio: "",
  licencia_alta: "",
  incapacidad_total: "0",
  incapacidad_parcial: "0",
  muerte: false,
  dictamen_riesgo: "",
};

const STEPS = ["Identificación", "Domicilio", "Trabajo", "Accidente", "Médico / Dictamen"];

export default function Accidentes() {
  const { user, canEdit, isAdmin } = useAuth();
  const [list, setList] = useState<Registro[]>([]);
  const [investigaciones, setInvestigaciones] = useState<InvOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const { openPdfPreview, PdfPreviewDialogElement } = usePdfPreview();

  const load = async () => {
    setLoading(true);
    const [{ data: regs }, { data: invs }] = await Promise.all([
      supabase.from("registro_accidentes").select("*").order("fecha", { ascending: false }),
      supabase.from("investigaciones").select("id,nombre_persona,fecha_evento,rfc_num_control,departamento,area,edad,sexo").order("fecha_evento", { ascending: false }),
    ]);
    setList((regs ?? []) as Registro[]);
    setInvestigaciones((invs ?? []) as InvOption[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(empty); setStep(0); setEditId(null); };

  const openNew = () => { resetForm(); setOpen(true); };

  const onInvSelect = (id: string) => {
    if (id === "none") return setForm({ ...form, investigacion_id: "none" });
    const inv = investigaciones.find((i) => i.id === id);
    if (!inv) return;
    const parts = inv.nombre_persona.split(/\s+/);
    setForm({
      ...form,
      investigacion_id: id,
      nombres: parts.slice(0, parts.length - 2).join(" ") || parts[0] || "",
      apellido_paterno: parts[parts.length - 2] ?? "",
      apellido_materno: parts[parts.length - 1] ?? "",
      rfc_num_control: inv.rfc_num_control ?? form.rfc_num_control,
      adscripcion: inv.departamento ?? form.adscripcion,
      area_accidente: inv.area ?? form.area_accidente,
      fecha_accidente: inv.fecha_evento ?? form.fecha_accidente,
      edad: inv.edad?.toString() ?? form.edad,
      sexo: inv.sexo ?? form.sexo,
    });
  };

  const openEdit = (r: Registro) => {
    setEditId(r.id);
    setForm({
      ...empty,
      ...r,
      investigacion_id: r.investigacion_id ?? "none",
      edad: r.edad?.toString() ?? "",
      incapacidad_total: r.incapacidad_total?.toString() ?? "0",
      incapacidad_parcial: r.incapacidad_parcial?.toString() ?? "0",
      muerte: r.muerte ?? false,
    });
    setStep(0);
    setOpen(true);
  };

  const save = async () => {
    const payload: any = {
      ...form,
      investigacion_id: form.investigacion_id === "none" ? null : form.investigacion_id,
      edad: form.edad ? Number(form.edad) : null,
      incapacidad_total: Number(form.incapacidad_total || 0),
      incapacidad_parcial: Number(form.incapacidad_parcial || 0),
      muerte: !!form.muerte,
      fecha_accidente: form.fecha_accidente || null,
      licencia_inicio: form.licencia_inicio || null,
      licencia_alta: form.licencia_alta || null,
      created_by: user?.id,
    };
    if (editId) {
      const { error } = await supabase.from("registro_accidentes").update(payload).eq("id", editId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("registro_accidentes").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success(editId ? "Registro actualizado" : "Registro guardado");
    setOpen(false);
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    const { error } = await supabase.from("registro_accidentes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  const exportPDF = (r: Registro) => {
    const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "landscape" });
    const W = doc.internal.pageSize.getWidth();
    const M = 10;
    doc.setFillColor(120, 30, 50);
    doc.rect(0, 0, W, 20, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INSTITUTO TECNOLÓGICO DE DURANGO", W / 2, 8, { align: "center" });
    doc.setFontSize(10);
    doc.text("Formato de Registro de Accidentes", W / 2, 14, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Código: ITD-SS-PO-03-02  ·  Revisión: 1  ·  Ref. ISO 45001:2018 8.2, 10.2", W / 2, 18, { align: "center" });
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 24,
      theme: "grid",
      head: [[
        "Fecha", "R.F.C./Control", "Nombres", "A. Paterno", "A. Materno", "Sexo", "Edad", "Teléfono", "Email",
      ]],
      body: [[
        r.fecha, r.rfc_num_control ?? "", r.nombres ?? "", r.apellido_paterno ?? "", r.apellido_materno ?? "",
        r.sexo ?? "", r.edad?.toString() ?? "", r.telefono ?? "", r.email ?? "",
      ]],
      headStyles: { fillColor: [120, 30, 50], textColor: 255, fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 1.2 },
      margin: { left: M, right: M },
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 1,
      theme: "grid",
      head: [["Calle y número", "Colonia", "C.P.", "Ciudad", "Estado", "No. Tarjeta", "Adscripción"]],
      body: [[r.calle_numero ?? "", r.colonia ?? "", r.codigo_postal ?? "", r.ciudad ?? "", r.estado ?? "", r.no_tarjeta ?? "", r.adscripcion ?? ""]],
      headStyles: { fillColor: [120, 30, 50], textColor: 255, fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 1.2 },
      margin: { left: M, right: M },
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 1,
      theme: "grid",
      head: [["Área accidente", "Fecha accidente", "Folio", "Mecanismo lesión", "Consecuencia", "Región anatómica"]],
      body: [[r.area_accidente ?? "", r.fecha_accidente ?? "", r.folio ?? "", r.mecanismo_lesion ?? "", r.consecuencia ?? "", r.region_anatomica ?? ""]],
      headStyles: { fillColor: [120, 30, 50], textColor: 255, fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 1.2 },
      margin: { left: M, right: M },
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 1,
      theme: "grid",
      head: [["Causa: Acto inseguro", "Causa: Condición insegura", "Licencia inicio", "Licencia alta", "Incap. total", "Incap. parcial", "Muerte", "Dictamen"]],
      body: [[
        r.causa_acto_inseguro ?? "", r.causa_condicion_insegura ?? "", r.licencia_inicio ?? "", r.licencia_alta ?? "",
        r.incapacidad_total?.toString() ?? "0", r.incapacidad_parcial?.toString() ?? "0", r.muerte ? "Sí" : "No", r.dictamen_riesgo ?? "",
      ]],
      headStyles: { fillColor: [120, 30, 50], textColor: 255, fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 1.2 },
      margin: { left: M, right: M },
    });

    openPdfPreview(doc, `registro_accidente_${r.fecha}.pdf`);
  };

  return (
    <>
      <PageHeader
        title="Registro de Accidentes"
        subtitle="Formato ITD-SS-PO-03-02 · ISO 45001:2018 8.2, 10.2"
        breadcrumbs={[{ label: "Eventos" }, { label: "Registro de accidentes" }]}
        badge={<Badge className="bg-primary/10 text-primary border-primary/20">{list.length} registros</Badge>}
        actions={canEdit && (
          <Button onClick={openNew} className="rounded-xl bg-gradient-primary shadow-elegant">
            <Plus className="mr-2 h-4 w-4" /> Nuevo registro
          </Button>
        )}
      />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar" : "Nuevo"} registro · Paso {step + 1} de {STEPS.length}: {STEPS[step]}</DialogTitle>
          </DialogHeader>

          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Investigación asociada (autocompleta datos)</Label>
                <Select value={form.investigacion_id} onValueChange={onInvSelect}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asociar</SelectItem>
                    {investigaciones.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.nombre_persona} · {i.fecha_evento}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Fecha registro</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
              <div><Label>R.F.C./Núm. de control</Label><Input value={form.rfc_num_control} onChange={(e) => setForm({ ...form, rfc_num_control: e.target.value })} /></div>
              <div><Label>Nombres</Label><Input value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} /></div>
              <div><Label>Apellido paterno</Label><Input value={form.apellido_paterno} onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value })} /></div>
              <div><Label>Apellido materno</Label><Input value={form.apellido_materno} onChange={(e) => setForm({ ...form, apellido_materno: e.target.value })} /></div>
              <div>
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Femenino</SelectItem><SelectItem value="O">Otro</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Edad</Label><Input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Calle y número</Label><Input value={form.calle_numero} onChange={(e) => setForm({ ...form, calle_numero: e.target.value })} /></div>
              <div><Label>Colonia / Fracc.</Label><Input value={form.colonia} onChange={(e) => setForm({ ...form, colonia: e.target.value })} /></div>
              <div><Label>Código postal</Label><Input value={form.codigo_postal} onChange={(e) => setForm({ ...form, codigo_postal: e.target.value })} /></div>
              <div><Label>Ciudad</Label><Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></div>
              <div><Label>Estado</Label><Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>No. de tarjeta</Label><Input value={form.no_tarjeta} onChange={(e) => setForm({ ...form, no_tarjeta: e.target.value })} /></div>
              <div><Label>Adscripción</Label><Input value={form.adscripcion} onChange={(e) => setForm({ ...form, adscripcion: e.target.value })} /></div>
              <div><Label>Área del accidente</Label><Input value={form.area_accidente} onChange={(e) => setForm({ ...form, area_accidente: e.target.value })} /></div>
              <div><Label>Folio</Label><Input value={form.folio} onChange={(e) => setForm({ ...form, folio: e.target.value })} /></div>
              <div><Label>Fecha del accidente</Label><Input type="date" value={form.fecha_accidente} onChange={(e) => setForm({ ...form, fecha_accidente: e.target.value })} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <div><Label>Mecanismo de la lesión</Label><Textarea rows={2} value={form.mecanismo_lesion} onChange={(e) => setForm({ ...form, mecanismo_lesion: e.target.value })} /></div>
              <div><Label>Consecuencia</Label><Textarea rows={2} value={form.consecuencia} onChange={(e) => setForm({ ...form, consecuencia: e.target.value })} /></div>
              <div><Label>Región anatómica afectada</Label><Input value={form.region_anatomica} onChange={(e) => setForm({ ...form, region_anatomica: e.target.value })} /></div>
              <div><Label>Causa - Acto inseguro</Label><Textarea rows={2} value={form.causa_acto_inseguro} onChange={(e) => setForm({ ...form, causa_acto_inseguro: e.target.value })} /></div>
              <div><Label>Causa - Condición insegura</Label><Textarea rows={2} value={form.causa_condicion_insegura} onChange={(e) => setForm({ ...form, causa_condicion_insegura: e.target.value })} /></div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Licencia médica - inicio</Label><Input type="date" value={form.licencia_inicio} onChange={(e) => setForm({ ...form, licencia_inicio: e.target.value })} /></div>
              <div><Label>Licencia médica - alta</Label><Input type="date" value={form.licencia_alta} onChange={(e) => setForm({ ...form, licencia_alta: e.target.value })} /></div>
              <div><Label>Incapacidad total (días)</Label><Input type="number" value={form.incapacidad_total} onChange={(e) => setForm({ ...form, incapacidad_total: e.target.value })} /></div>
              <div><Label>Incapacidad parcial (días)</Label><Input type="number" value={form.incapacidad_parcial} onChange={(e) => setForm({ ...form, incapacidad_parcial: e.target.value })} /></div>
              <div className="md:col-span-2">
                <Label>Muerte</Label>
                <Select value={form.muerte ? "si" : "no"} onValueChange={(v) => setForm({ ...form, muerte: v === "si" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="si">Sí</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Dictamen del riesgo de trabajo</Label><Textarea rows={3} value={form.dictamen_riesgo} onChange={(e) => setForm({ ...form, dictamen_riesgo: e.target.value })} /></div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>Siguiente <ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={save}>{editId ? "Actualizar" : "Guardar"} registro</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="px-4 py-6 md:px-8">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : list.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-border/60 bg-secondary/30 p-12 text-center">
            <HeartPulse className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-base font-bold">Sin registros de accidentes</p>
            <p className="text-sm text-muted-foreground">Captura el primer registro para construir el histórico.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {list.map((r) => (
              <Card key={r.id} className="rounded-2xl border-border/50 p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {r.folio && <Badge variant="outline">Folio {r.folio}</Badge>}
                      {r.muerte && <Badge className="bg-destructive text-destructive-foreground">Muerte</Badge>}
                      <span className="text-xs text-muted-foreground">{r.fecha}</span>
                    </div>
                    <h3 className="font-display text-base font-bold">{[r.nombres, r.apellido_paterno, r.apellido_materno].filter(Boolean).join(" ") || "—"}</h3>
                    <p className="text-xs text-muted-foreground">{r.adscripcion ?? "—"} · {r.area_accidente ?? "—"}</p>
                    {r.mecanismo_lesion && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.mecanismo_lesion}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportPDF(r)}><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>
                    {canEdit && <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>}
                    {isAdmin && <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
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

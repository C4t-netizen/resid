import { useEffect, useState } from "react";
import { ArrowLeft, CalendarRange, CheckCircle2, FileBarChart, Loader2, Plus, Save, ShieldCheck, Trash2, XCircle, MinusCircle, FileDown } from "lucide-react";
import { FileUploader, ArchivoItem } from "@/components/FileUploader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Verif {
  id: string;
  norma: string;
  titulo: string;
  area: string | null;
  fecha: string;
  responsable: string | null;
  porcentaje_cumplimiento: number | null;
  estatus: "borrador" | "cerrada";
  observaciones: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}
interface Item {
  id: string;
  verificacion_id: string;
  numero: number | null;
  descripcion: string;
  cumple: "si" | "no" | "na";
  observaciones: string | null;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};
const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "-";

const diffStr = (a: string | null, b: string | null) => {
  if (!a || !b) return "-";
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (ms <= 0) return "-";
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins || (!days && !hours)) parts.push(`${mins}m`);
  return parts.join(" ");
};

export default function Verificaciones() {
  const { user, canEdit, isAdmin } = useAuth();
  const [list, setList] = useState<Verif[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Verif | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState({ norma: "NOM-019-STPS", titulo: "", area: "", fecha: new Date().toISOString().slice(0,10), responsable: "" });
  const [newItem, setNewItem] = useState("");

  // Detail editable fields
  const [detailObs, setDetailObs] = useState("");
  const [detailInicio, setDetailInicio] = useState("");
  const [detailFin, setDetailFin] = useState("");
  const [savingDetail, setSavingDetail] = useState(false);

  const [archivos, setArchivos] = useState<ArchivoItem[]>([]);

  // Reporte por período
  const [reportOpen, setReportOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [rep, setRep] = useState({ desde: monthAgo, hasta: today });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("verificaciones").select("*").order("fecha", { ascending: false });
    setList((data ?? []) as Verif[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadItems = async (vid: string) => {
    const { data } = await supabase.from("verificacion_items").select("*").eq("verificacion_id", vid).order("numero");
    setItems((data ?? []) as Item[]);
  };

  const loadArchivos = async (vid: string) => {
    const { data } = await supabase.from("verificacion_archivos").select("*").eq("verificacion_id", vid).order("created_at", { ascending: false });
    setArchivos((data ?? []) as ArchivoItem[]);
  };

  const openDetail = async (v: Verif) => {
    setSelected(v);
    setDetailObs(v.observaciones ?? "");
    setDetailInicio(toLocalInput(v.fecha_inicio));
    setDetailFin(toLocalInput(v.fecha_fin));
    await loadItems(v.id);
    await loadArchivos(v.id);
  };

  const saveDetail = async () => {
    if (!selected) return;
    setSavingDetail(true);
    const payload = {
      observaciones: detailObs || null,
      fecha_inicio: detailInicio ? new Date(detailInicio).toISOString() : null,
      fecha_fin: detailFin ? new Date(detailFin).toISOString() : null,
    };
    const { error } = await supabase.from("verificaciones").update(payload).eq("id", selected.id);
    setSavingDetail(false);
    if (error) return toast.error(error.message);
    setSelected({ ...selected, ...payload });
    load();
    toast.success("Detalles guardados");
  };

  const create = async () => {
    if (!form.titulo.trim()) { toast.error("Título requerido"); return; }
    const { error, data } = await supabase.from("verificaciones").insert({ ...form, area: form.area || null, responsable: form.responsable || null, created_by: user?.id }).select().single();
    if (error) return toast.error(error.message);
    setOpen(false);
    setForm({ norma: "NOM-019-STPS", titulo: "", area: "", fecha: new Date().toISOString().slice(0,10), responsable: "" });
    load();
    if (data) openDetail(data as Verif);
  };

  const addItem = async () => {
    if (!selected || !newItem.trim()) return;
    const numero = items.length + 1;
    const { error } = await supabase.from("verificacion_items").insert({ verificacion_id: selected.id, numero, descripcion: newItem });
    if (error) return toast.error(error.message);
    setNewItem("");
    loadItems(selected.id);
  };

  const updateCumple = async (id: string, cumple: Item["cumple"]) => {
    await supabase.from("verificacion_items").update({ cumple }).eq("id", id);
    if (selected) {
      await loadItems(selected.id);
      const { data: refreshed } = await supabase.from("verificacion_items").select("cumple").eq("verificacion_id", selected.id);
      const aplicables = (refreshed ?? []).filter((x: any) => x.cumple !== "na");
      const cumplidos = aplicables.filter((x: any) => x.cumple === "si").length;
      const pct = aplicables.length ? (cumplidos / aplicables.length) * 100 : 0;
      await supabase.from("verificaciones").update({ porcentaje_cumplimiento: pct }).eq("id", selected.id);
      setSelected({ ...selected, porcentaje_cumplimiento: pct });
      setList((prev) => prev.map((v) => (v.id === selected.id ? { ...v, porcentaje_cumplimiento: pct } : v)));
    }
  };

  const removeItem = async (id: string) => {
    await supabase.from("verificacion_items").delete().eq("id", id);
    if (selected) loadItems(selected.id);
  };

  const removeVerif = async (id: string) => {
    await supabase.from("verificaciones").delete().eq("id", id);
    load();
  };

  const exportVerifPdf = (v: Verif, its: Item[]) => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, w, 28, "F");
    doc.setTextColor(255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Lista de Verificación", 14, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${v.norma} · ${v.titulo}`, 14, 22);
    doc.setTextColor(0);
    const aplicables = its.filter((x) => x.cumple !== "na");
    const cumplidos = aplicables.filter((x) => x.cumple === "si").length;
    const pct = aplicables.length ? Math.round((cumplidos / aplicables.length) * 100) : 0;
    autoTable(doc, {
      startY: 36,
      head: [["Campo", "Valor"]],
      body: [
        ["Norma", v.norma],
        ["Área", v.area ?? "-"],
        ["Fecha", v.fecha],
        ["Inicio", fmtDateTime(v.fecha_inicio)],
        ["Fin", fmtDateTime(v.fecha_fin)],
        ["Duración", diffStr(v.fecha_inicio, v.fecha_fin)],
        ["Responsable", v.responsable ?? "-"],
        ["Cumplimiento", `${pct}%`],
        ["Estatus", v.estatus],
      ],
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 9 },
    });
    let y = (doc as any).lastAutoTable.finalY + 8;
    if (v.observaciones) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Observaciones", 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(v.observaciones, w - 28);
      doc.text(lines, 14, y + 5);
      y += 5 + lines.length * 4 + 4;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Puntos de verificación (${its.length})`, 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["#", "Descripción", "Cumple", "Observaciones"]],
      body: its.map((it) => [
        it.numero ?? "-",
        it.descripcion,
        it.cumple === "si" ? "Sí" : it.cumple === "no" ? "No" : "N/A",
        it.observaciones ?? "-",
      ]),
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
    doc.save(`verificacion-${v.titulo}-${v.fecha}.pdf`);
  };

  const exportRangePdf = () => {
    const desde = rep.desde;
    const hasta = rep.hasta;
    if (!desde || !hasta) { toast.error("Selecciona ambas fechas"); return; }
    const filtered = list.filter((v) => v.fecha >= desde && v.fecha <= hasta);
    if (filtered.length === 0) { toast.error("Sin verificaciones en el período"); return; }

    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, w, 28, "F");
    doc.setTextColor(255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Verificaciones", 14, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${desde} al ${hasta}`, 14, 22);
    doc.setTextColor(0);

    const total = filtered.length;
    const cerradas = filtered.filter((v) => v.estatus === "cerrada").length;
    const promedio = total ? filtered.reduce((s, v) => s + (v.porcentaje_cumplimiento ?? 0), 0) / total : 0;

    autoTable(doc, {
      startY: 36,
      head: [["Indicador", "Valor"]],
      body: [
        ["Total de verificaciones", String(total)],
        ["Cerradas", String(cerradas)],
        ["Borradores", String(total - cerradas)],
        ["Cumplimiento promedio", `${promedio.toFixed(1)}%`],
      ],
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 9 },
    });

    let y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detalle", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Fecha", "Norma", "Título", "Área", "Inicio", "Fin", "Duración", "% Cumpl.", "Estatus"]],
      body: filtered.map((v) => [
        v.fecha,
        v.norma,
        v.titulo,
        v.area ?? "-",
        fmtDateTime(v.fecha_inicio),
        fmtDateTime(v.fecha_fin),
        diffStr(v.fecha_inicio, v.fecha_fin),
        `${(v.porcentaje_cumplimiento ?? 0).toFixed(0)}%`,
        v.estatus,
      ]),
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 7, cellPadding: 2 },
    });

    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Página ${p} de ${pages} · Generado ${new Date().toLocaleDateString("es-MX")}`, 14, doc.internal.pageSize.getHeight() - 8);
    }
    doc.save(`reporte-verificaciones-${desde}_${hasta}.pdf`);
    setReportOpen(false);
  };

  // ============ DETAIL ============
  if (selected) {
    const pct = selected.porcentaje_cumplimiento ?? 0;
    return (
      <>
        <PageHeader
          title={selected.titulo}
          subtitle={`${selected.norma} · ${selected.fecha} · ${selected.area || "Sin área"}`}
          breadcrumbs={[{ label: "Verificaciones", href: "/verificaciones" }, { label: selected.titulo }]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportVerifPdf(selected, items)} className="rounded-xl">
                <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
            </div>
          }
        />
        <div className="space-y-6 px-4 py-6 md:px-8">
          <Card className="rounded-2xl border-border/50 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Cumplimiento global</p>
                <p className="font-display text-3xl font-bold">{pct.toFixed(0)}%</p>
              </div>
              <div className="w-1/2"><Progress value={pct} className="h-3" /></div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/50 p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Datos del recorrido</h3>
              {canEdit && (
                <Button size="sm" onClick={saveDetail} disabled={savingDetail} className="rounded-xl bg-gradient-primary">
                  {savingDetail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Fecha y hora de inicio</Label>
                <Input type="datetime-local" value={detailInicio} onChange={(e) => setDetailInicio(e.target.value)} disabled={!canEdit} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha y hora de fin</Label>
                <Input type="datetime-local" value={detailFin} onChange={(e) => setDetailFin(e.target.value)} disabled={!canEdit} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Duración: <span className="font-semibold text-foreground">{diffStr(detailInicio ? new Date(detailInicio).toISOString() : null, detailFin ? new Date(detailFin).toISOString() : null)}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Textarea value={detailObs} onChange={(e) => setDetailObs(e.target.value)} disabled={!canEdit} placeholder="Notas generales del recorrido, hallazgos, contexto…" rows={4} className="rounded-xl" />
            </div>
          </Card>

          {canEdit && (
            <Card className="rounded-2xl border-border/50 p-5 shadow-soft">
              <Label>Agregar punto de verificación</Label>
              <div className="mt-2 flex gap-2">
                <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Ej. Existe acta de constitución vigente" className="h-11 rounded-xl" />
                <Button onClick={addItem} className="rounded-xl bg-gradient-primary"><Plus className="h-4 w-4" /></Button>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden rounded-2xl border-border/50 shadow-soft">
            {items.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Sin puntos registrados.</p>
            ) : (
              <div className="divide-y divide-border">
                {items.map((it) => (
                  <div key={it.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{it.numero}</span>
                      <p className="text-sm">{it.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant={it.cumple === "si" ? "default" : "outline"} onClick={() => updateCumple(it.id, "si")} disabled={!canEdit}
                        className={`rounded-xl ${it.cumple === "si" ? "bg-success text-success-foreground hover:bg-success/90" : ""}`}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Sí
                      </Button>
                      <Button size="sm" variant={it.cumple === "no" ? "default" : "outline"} onClick={() => updateCumple(it.id, "no")} disabled={!canEdit}
                        className={`rounded-xl ${it.cumple === "no" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}>
                        <XCircle className="mr-1 h-4 w-4" /> No
                      </Button>
                      <Button size="sm" variant={it.cumple === "na" ? "default" : "outline"} onClick={() => updateCumple(it.id, "na")} disabled={!canEdit}
                        className="rounded-xl">
                        <MinusCircle className="mr-1 h-4 w-4" /> N/A
                      </Button>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" onClick={() => removeItem(it.id)} className="rounded-xl text-destructive">
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

  // ============ LIST ============
  return (
    <>
      <PageHeader
        title="Listas de verificación"
        subtitle="Auditorías de cumplimiento normativo en seguridad e higiene."
        breadcrumbs={[{ label: "Operación CSH" }, { label: "Verificaciones" }]}
        actions={
          <div className="flex gap-2">
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl"><FileBarChart className="mr-2 h-4 w-4" /> Reporte por período</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>Generar reporte por período</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Desde</Label>
                      <Input type="date" value={rep.desde} onChange={(e) => setRep({ ...rep, desde: e.target.value })} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label>Hasta</Label>
                      <Input type="date" value={rep.hasta} onChange={(e) => setRep({ ...rep, hasta: e.target.value })} className="h-11 rounded-xl" /></div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <CalendarRange className="h-4 w-4" /> Se incluirán todas las verificaciones cuya fecha esté en el rango.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReportOpen(false)} className="rounded-xl">Cancelar</Button>
                  <Button onClick={exportRangePdf} className="rounded-xl bg-gradient-primary"><FileDown className="mr-2 h-4 w-4" /> Generar PDF</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {canEdit && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-gradient-primary shadow-elegant"><Plus className="mr-2 h-4 w-4" /> Nueva lista</Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader><DialogTitle>Nueva lista de verificación</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="space-y-1.5"><Label>Norma</Label>
                      <Input value={form.norma} onChange={(e) => setForm({...form, norma: e.target.value})} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label>Título</Label>
                      <Input value={form.titulo} onChange={(e) => setForm({...form, titulo: e.target.value})} className="h-11 rounded-xl" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label>Área</Label>
                        <Input value={form.area} onChange={(e) => setForm({...form, area: e.target.value})} className="h-11 rounded-xl" /></div>
                      <div className="space-y-1.5"><Label>Fecha</Label>
                        <Input type="date" value={form.fecha} onChange={(e) => setForm({...form, fecha: e.target.value})} className="h-11 rounded-xl" /></div>
                    </div>
                    <div className="space-y-1.5"><Label>Responsable</Label>
                      <Input value={form.responsable} onChange={(e) => setForm({...form, responsable: e.target.value})} className="h-11 rounded-xl" /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
                    <Button onClick={create} className="rounded-xl bg-gradient-primary">Crear</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />
      <div className="px-4 py-6 md:px-8">
        <Card className="overflow-hidden rounded-2xl border-border/50 shadow-soft">
          {loading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No hay listas de verificación.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {list.map((v) => {
                const pct = v.porcentaje_cumplimiento ?? 0;
                return (
                  <div key={v.id} className="flex items-center gap-3 p-4 md:p-5">
                    <button onClick={() => openDetail(v)} className="flex flex-1 items-center gap-3 text-left">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-bold">{v.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.norma} · {v.fecha} · {v.area || "Sin área"}
                          {v.fecha_inicio && v.fecha_fin ? ` · ${diffStr(v.fecha_inicio, v.fecha_fin)}` : ""}
                        </p>
                      </div>
                      <div className="hidden w-32 md:block">
                        <Progress value={pct} className="h-2" />
                        <p className="mt-1 text-right text-xs font-semibold">{pct.toFixed(0)}%</p>
                      </div>
                      <Badge className={v.estatus === "cerrada" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
                        {v.estatus}
                      </Badge>
                    </button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => removeVerif(v.id)} className="rounded-xl text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

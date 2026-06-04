import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Plus, ShieldCheck, Trash2, XCircle, MinusCircle, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}
interface Item {
  id: string;
  verificacion_id: string;
  numero: number | null;
  descripcion: string;
  cumple: "si" | "no" | "na";
  observaciones: string | null;
}

export default function Verificaciones() {
  const { user, canEdit, isAdmin } = useAuth();
  const [list, setList] = useState<Verif[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Verif | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState({ norma: "NOM-019-STPS", titulo: "", area: "", fecha: new Date().toISOString().slice(0,10), responsable: "" });
  const [newItem, setNewItem] = useState("");

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

  const openDetail = async (v: Verif) => { setSelected(v); await loadItems(v.id); };

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
      // recalc % cumplimiento
      const { data: refreshed } = await supabase.from("verificacion_items").select("cumple").eq("verificacion_id", selected.id);
      const aplicables = (refreshed ?? []).filter((x: any) => x.cumple !== "na");
      const cumplidos = aplicables.filter((x: any) => x.cumple === "si").length;
      const pct = aplicables.length ? (cumplidos / aplicables.length) * 100 : 0;
      await supabase.from("verificaciones").update({ porcentaje_cumplimiento: pct }).eq("id", selected.id);
      setSelected({ ...selected, porcentaje_cumplimiento: pct });
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
        ["Responsable", v.responsable ?? "-"],
        ["Cumplimiento", `${pct}%`],
        ["Estatus", v.estatus],
      ],
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 9 },
    });
    let y = (doc as any).lastAutoTable.finalY + 8;
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
        actions={canEdit && (
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
                        <p className="text-xs text-muted-foreground">{v.norma} · {v.fecha} · {v.area || "Sin área"}</p>
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

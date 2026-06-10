import { useEffect, useMemo, useRef, useState } from "react";
import { FileSignature, Loader2, Save, Plus, FileText, Calendar } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploader, ArchivoItem } from "@/components/FileUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Acta {
  id?: string;
  lugar: string;
  fecha_acta: string;
  hora: string;
  vigencia_inicio: string;
  vigencia_fin: string;
  observaciones: string;
  patron_firma: string;
  representante_trabajadores_firma: string;
  testigo_stps: string;
  estatus: "borrador" | "firmada" | "vigente" | "vencida";
}

const empty: Acta = {
  lugar: "", fecha_acta: "", hora: "", vigencia_inicio: "", vigencia_fin: "",
  observaciones: "", patron_firma: "", representante_trabajadores_firma: "",
  testigo_stps: "", estatus: "borrador",
};

const estatusColor: Record<string, string> = {
  borrador: "bg-warning/10 text-warning border-warning/20",
  firmada: "bg-primary/10 text-primary border-primary/20",
  vigente: "bg-success/10 text-success border-success/20",
  vencida: "bg-destructive/10 text-destructive border-destructive/20",
};

const formatFecha = (d: string) => {
  if (!d) return "Sin fecha";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return d; }
};

export default function Acta() {
  const { user, canEdit } = useAuth();
  const [form, setForm] = useState<Acta>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archivos, setArchivos] = useState<ArchivoItem[]>([]);
  const [actas, setActas] = useState<Acta[]>([]);

  const loadArchivos = async (actaId: string) => {
    const { data } = await supabase.from("acta_archivos").select("*").eq("acta_id", actaId).order("created_at", { ascending: false });
    setArchivos((data ?? []) as ArchivoItem[]);
  };

  const loadActas = async () => {
    const { data } = await supabase.from("acta_constitucion").select("*").order("fecha_acta", { ascending: false });
    return (data ?? []) as Acta[];
  };

  const selectActa = async (a: Acta) => {
    setForm({
      ...empty, ...a,
      fecha_acta: a.fecha_acta ?? "", hora: a.hora ?? "",
      vigencia_inicio: a.vigencia_inicio ?? "", vigencia_fin: a.vigencia_fin ?? "",
    });
    if (a.id) await loadArchivos(a.id);
    else setArchivos([]);
  };

  useEffect(() => {
    (async () => {
      const list = await loadActas();
      setActas(list);
      if (list[0]) await selectActa(list[0]);
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof Acta>(k: K, v: Acta[K]) => setForm((p) => ({ ...p, [k]: v }));

  const nuevaActa = () => {
    setForm(empty);
    setArchivos([]);
  };

  const save = async () => {
    if (!form.fecha_acta) { toast.error("La fecha del acta es obligatoria"); return; }
    setSaving(true);
    const payload: any = {
      ...form,
      hora: form.hora || null,
      vigencia_inicio: form.vigencia_inicio || null,
      vigencia_fin: form.vigencia_fin || null,
      created_by: user?.id,
    };
    const { error, data } = form.id
      ? await supabase.from("acta_constitucion").update(payload).eq("id", form.id).select().single()
      : await supabase.from("acta_constitucion").insert(payload).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (data) { setForm((p) => ({ ...p, id: data.id })); await loadArchivos(data.id); }
    setActas(await loadActas());
    toast.success("Acta guardada");
  };

  const handleUpload = async (file: { nombre: string; archivo_url: string }) => {
    let actaId = form.id;
    if (!actaId) {
      if (!form.fecha_acta) throw new Error("Captura la fecha del acta antes de adjuntar archivos");
      const { error: e1, data: d1 } = await supabase.from("acta_constitucion").insert({
        ...form,
        hora: form.hora || null,
        vigencia_inicio: form.vigencia_inicio || null,
        vigencia_fin: form.vigencia_fin || null,
        created_by: user?.id,
      }).select().single();
      if (e1) throw e1;
      actaId = d1.id;
      setForm((p) => ({ ...p, id: actaId }));
      setActas(await loadActas());
    }
    const { error, data } = await supabase.from("acta_archivos").insert({
      acta_id: actaId, nombre: file.nombre, archivo_url: file.archivo_url, created_by: user?.id,
    }).select().single();
    if (error) throw error;
    setArchivos((p) => [data as ArchivoItem, ...p]);
  };

  const handleDelete = async (item: ArchivoItem) => {
    const { error } = await supabase.from("acta_archivos").delete().eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    setArchivos((p) => p.filter((a) => a.id !== item.id));
    toast.success("Archivo eliminado");
  };

  const grouped = useMemo(() => {
    const g: Record<string, Acta[]> = {};
    for (const a of actas) {
      const year = a.fecha_acta ? a.fecha_acta.slice(0, 4) : "Sin fecha";
      (g[year] ||= []).push(a);
    }
    return Object.entries(g).sort(([a], [b]) => b.localeCompare(a));
  }, [actas]);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <>
      <PageHeader
        title="Acta constitutiva"
        subtitle="Documento que formaliza la integración del comité ante la STPS."
        breadcrumbs={[{ label: "Operación CSH" }, { label: "Acta constitutiva" }]}
        badge={<Badge className={estatusColor[form.estatus]}>{form.estatus.toUpperCase()}</Badge>}
      />
      <div className="px-4 py-6 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar de actas guardadas */}
          <Card className="rounded-2xl border-border/50 p-4 shadow-soft h-fit lg:sticky lg:top-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-bold">Actas guardadas</h3>
              </div>
              {canEdit && (
                <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={nuevaActa} title="Nueva acta">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {actas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                Aún no hay actas guardadas.
              </p>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {grouped.map(([year, list]) => (
                  <div key={year}>
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Calendar className="h-3 w-3" />{year}
                    </div>
                    <ul className="space-y-1.5">
                      {list.map((a) => {
                        const active = a.id && a.id === form.id;
                        return (
                          <li key={a.id}>
                            <button
                              type="button"
                              onClick={() => selectActa(a)}
                              className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${active ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/50"}`}
                            >
                              <div className="font-medium">{formatFecha(a.fecha_acta)}</div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Badge variant="outline" className={`${estatusColor[a.estatus]} px-1.5 py-0 text-[9px]`}>{a.estatus}</Badge>
                                {a.lugar && <span className="truncate">{a.lugar}</span>}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Formulario del acta */}
          <Card className="rounded-2xl border-border/50 p-6 shadow-soft md:p-8">
            <fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-70">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><FileSignature className="h-4 w-4 text-primary" /></div>
                <h3 className="font-display text-base font-bold">{form.id ? "Editar acta" : "Nueva acta"}</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2"><Label>Lugar</Label><Input value={form.lugar} onChange={(e) => set("lugar", e.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Fecha *</Label><Input type="date" value={form.fecha_acta} onChange={(e) => set("fecha_acta", e.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Hora</Label><Input type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Inicio vigencia</Label><Input type="date" value={form.vigencia_inicio} onChange={(e) => set("vigencia_inicio", e.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Fin vigencia</Label><Input type="date" value={form.vigencia_fin} onChange={(e) => set("vigencia_fin", e.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Estatus</Label>
                  <Select value={form.estatus} onValueChange={(v: any) => set("estatus", v)}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="firmada">Firmada</SelectItem>
                      <SelectItem value="vigente">Vigente</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div className="space-y-1.5 md:col-span-2"><Label>Observaciones</Label>
                  <Textarea value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} className="min-h-[100px] rounded-xl" /></div>
              </div>

              <div className="border-t border-border/60 pt-5">
                <h3 className="mb-4 font-display text-base font-bold">Firmas</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5"><Label>Patrón / Representante</Label><Input value={form.patron_firma} onChange={(e) => set("patron_firma", e.target.value)} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label>Repr. trabajadores</Label><Input value={form.representante_trabajadores_firma} onChange={(e) => set("representante_trabajadores_firma", e.target.value)} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label>Testigo STPS</Label><Input value={form.testigo_stps} onChange={(e) => set("testigo_stps", e.target.value)} className="h-11 rounded-xl" /></div>
                </div>
              </div>

              <div className="border-t border-border/60 pt-5">
                <FileUploader
                  archivos={archivos}
                  canEdit={canEdit}
                  folder={`actas/${form.id ?? "nueva"}`}
                  onUpload={handleUpload}
                  onDelete={handleDelete}
                  label="Actas y documentos adjuntos"
                />
                {!form.id && canEdit && (
                  <p className="mt-2 text-xs text-muted-foreground">Captura la fecha del acta; al subir se guardará automáticamente.</p>
                )}
              </div>

              {canEdit && (
                <div className="flex justify-end border-t border-border/60 pt-5">
                  <Button onClick={save} disabled={saving} className="rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar acta
                  </Button>
                </div>
              )}
            </fieldset>
          </Card>
        </div>
      </div>
    </>
  );
}

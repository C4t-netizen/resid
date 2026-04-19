import { useEffect, useState } from "react";
import { FileSignature, Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function Acta() {
  const { user, canEdit } = useAuth();
  const [form, setForm] = useState<Acta>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("acta_constitucion").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setForm({
        ...empty, ...(data as any),
        fecha_acta: data.fecha_acta ?? "", hora: data.hora ?? "",
        vigencia_inicio: data.vigencia_inicio ?? "", vigencia_fin: data.vigencia_fin ?? "",
      });
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof Acta>(k: K, v: Acta[K]) => setForm((p) => ({ ...p, [k]: v }));

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
    if (data) setForm((p) => ({ ...p, id: data.id }));
    toast.success("Acta guardada");
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <>
      <PageHeader
        title="Acta de constitución"
        subtitle="Documento que formaliza la integración del comité ante la STPS."
        breadcrumbs={[{ label: "Operación CSH" }, { label: "Acta constitución" }]}
        badge={<Badge className={estatusColor[form.estatus]}>{form.estatus.toUpperCase()}</Badge>}
      />
      <div className="px-4 py-6 md:px-8">
        <Card className="mx-auto max-w-4xl rounded-2xl border-border/50 p-6 shadow-soft md:p-8">
          <fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-70">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><FileSignature className="h-4 w-4 text-primary" /></div>
              <h3 className="font-display text-base font-bold">Datos del acta</h3>
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
    </>
  );
}

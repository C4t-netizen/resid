import { useEffect, useState } from "react";
import { Building2, FileDown, Loader2, MapPin, Save, Users } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Section = ({ icon: Icon, title, children }: any) => (
  <div>
    <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="font-display text-base font-bold">{title}</h3>
    </div>
    <div className="grid gap-4 md:grid-cols-2">{children}</div>
  </div>
);

const Field = ({ label, children }: any) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
    {children}
  </div>
);

interface CshForm {
  id?: string;
  razon_social: string;
  rfc: string;
  nombre_centro: string;
  domicilio: string;
  municipio: string;
  estado: string;
  cp: string;
  telefono: string;
  rama_actividad: string;
  num_trabajadores: number | null;
  num_hombres: number | null;
  num_mujeres: number | null;
  representante_legal: string;
  representante_patronal: string;
  representante_trabajadores: string;
  fecha_constitucion: string;
  vigencia_anios: number | null;
}

const empty: CshForm = {
  razon_social: "", rfc: "", nombre_centro: "", domicilio: "", municipio: "", estado: "", cp: "",
  telefono: "", rama_actividad: "", num_trabajadores: null, num_hombres: null, num_mujeres: null,
  representante_legal: "", representante_patronal: "", representante_trabajadores: "",
  fecha_constitucion: "", vigencia_anios: 2,
};

export default function Configuracion() {
  const { user, canEdit } = useAuth();
  const [form, setForm] = useState<CshForm>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("csh_config").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) setForm({ ...empty, ...data, fecha_constitucion: data.fecha_constitucion ?? "" });
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof CshForm>(k: K, v: CshForm[K]) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.razon_social.trim()) { toast.error("La razón social es obligatoria"); return; }
    setSaving(true);
    const payload = { ...form, fecha_constitucion: form.fecha_constitucion || null, created_by: user?.id };
    const { error } = form.id
      ? await supabase.from("csh_config").update(payload).eq("id", form.id)
      : await supabase.from("csh_config").insert(payload).select().single().then((r) => {
          if (r.data) setForm((p) => ({ ...p, id: r.data.id }));
          return r;
        });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Configuración guardada");
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text("Configuración del centro de trabajo", pageWidth / 2, 40, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString()}`, pageWidth / 2, 58, { align: "center" });

    const sections: { title: string; rows: [string, string][] }[] = [
      {
        title: "Datos de la empresa",
        rows: [
          ["Razón social", form.razon_social],
          ["RFC", form.rfc],
          ["Nombre del centro de trabajo", form.nombre_centro],
          ["Rama de actividad económica", form.rama_actividad],
        ],
      },
      {
        title: "Domicilio",
        rows: [
          ["Calle y número", form.domicilio],
          ["Municipio / Alcaldía", form.municipio],
          ["Estado", form.estado],
          ["Código postal", form.cp],
          ["Teléfono", form.telefono],
        ],
      },
      {
        title: "Personal y representantes",
        rows: [
          ["Total de trabajadores", form.num_trabajadores?.toString() ?? ""],
          ["Hombres", form.num_hombres?.toString() ?? ""],
          ["Mujeres", form.num_mujeres?.toString() ?? ""],
          ["Vigencia (años)", form.vigencia_anios?.toString() ?? ""],
          ["Representante legal", form.representante_legal],
          ["Representante patronal en CSH", form.representante_patronal],
          ["Representante de los trabajadores", form.representante_trabajadores],
          ["Fecha de constitución de la CSH", form.fecha_constitucion],
        ],
      },
    ];

    let startY = 80;
    sections.forEach((s) => {
      autoTable(doc, {
        startY,
        head: [[{ content: s.title, colSpan: 2, styles: { halign: "left", fillColor: [37, 99, 235], textColor: 255 } }]],
        body: s.rows.map(([k, v]) => [k, v || "—"]),
        styles: { fontSize: 10, cellPadding: 6, valign: "top" },
        columnStyles: { 0: { cellWidth: 200, fontStyle: "bold" } },
        margin: { left: 40, right: 40 },
      });
      startY = (doc as any).lastAutoTable.finalY + 14;
    });

    doc.save(`Configuracion_CSH_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <PageHeader
        title="Configuración del centro de trabajo"
        subtitle="Datos generales requeridos por la NOM-019-STPS para conformar la CSH."
        breadcrumbs={[{ label: "Configuración" }]}
        badge={form.id ? <Badge className="border-success/20 bg-success/10 text-success">Guardado</Badge> : <Badge variant="outline">Sin guardar</Badge>}
      />
      <div className="px-4 py-6 md:px-8">
        <Card className="mx-auto max-w-5xl rounded-2xl border-border/50 p-6 shadow-soft md:p-8">
          <fieldset disabled={!canEdit} className="space-y-8 disabled:opacity-70">
            <Section icon={Building2} title="Datos de la empresa">
              <Field label="Razón social *"><Input value={form.razon_social} onChange={(e) => set("razon_social", e.target.value)} className="h-11 rounded-xl" /></Field>
              <Field label="RFC"><Input value={form.rfc} onChange={(e) => set("rfc", e.target.value.toUpperCase())} className="h-11 rounded-xl" /></Field>
              <Field label="Nombre del centro de trabajo"><Input value={form.nombre_centro} onChange={(e) => set("nombre_centro", e.target.value)} className="h-11 rounded-xl" /></Field>
              <Field label="Rama de actividad económica"><Input value={form.rama_actividad} onChange={(e) => set("rama_actividad", e.target.value)} className="h-11 rounded-xl" /></Field>
            </Section>

            <Section icon={MapPin} title="Domicilio">
              <Field label="Calle y número"><Input value={form.domicilio} onChange={(e) => set("domicilio", e.target.value)} className="h-11 rounded-xl" /></Field>
              <Field label="Municipio / Alcaldía"><Input value={form.municipio} onChange={(e) => set("municipio", e.target.value)} className="h-11 rounded-xl" /></Field>
              <Field label="Estado"><Input value={form.estado} onChange={(e) => set("estado", e.target.value)} className="h-11 rounded-xl" /></Field>
              <Field label="Código postal"><Input value={form.cp} onChange={(e) => set("cp", e.target.value)} className="h-11 rounded-xl" /></Field>
              <Field label="Teléfono"><Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} className="h-11 rounded-xl" /></Field>
            </Section>

            <Section icon={Users} title="Personal y representantes">
              <Field label="Total de trabajadores"><Input type="number" value={form.num_trabajadores ?? ""} onChange={(e) => set("num_trabajadores", e.target.value ? parseInt(e.target.value) : null)} className="h-11 rounded-xl" /></Field>
              <Field label="Vigencia (años)"><Input type="number" value={form.vigencia_anios ?? ""} onChange={(e) => set("vigencia_anios", e.target.value ? parseInt(e.target.value) : null)} className="h-11 rounded-xl" /></Field>
              <Field label="Hombres"><Input type="number" value={form.num_hombres ?? ""} onChange={(e) => set("num_hombres", e.target.value ? parseInt(e.target.value) : null)} className="h-11 rounded-xl" /></Field>
              <Field label="Mujeres"><Input type="number" value={form.num_mujeres ?? ""} onChange={(e) => set("num_mujeres", e.target.value ? parseInt(e.target.value) : null)} className="h-11 rounded-xl" /></Field>
              <Field label="Representante legal"><Input value={form.representante_legal} onChange={(e) => set("representante_legal", e.target.value)} className="h-11 rounded-xl" /></Field>
              <Field label="Representante patronal en CSH"><Input value={form.representante_patronal} onChange={(e) => set("representante_patronal", e.target.value)} className="h-11 rounded-xl" /></Field>
              <Field label="Representante de los trabajadores"><Input value={form.representante_trabajadores} onChange={(e) => set("representante_trabajadores", e.target.value)} className="h-11 rounded-xl" /></Field>
              <Field label="Fecha de constitución de la CSH"><Input type="date" value={form.fecha_constitucion} onChange={(e) => set("fecha_constitucion", e.target.value)} className="h-11 rounded-xl" /></Field>
            </Section>

            {canEdit && (
              <div className="flex justify-end border-t border-border/60 pt-6">
                <Button onClick={save} disabled={saving} className="rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar configuración
                </Button>
              </div>
            )}
            {!canEdit && (
              <p className="rounded-xl bg-muted/50 p-3 text-center text-xs text-muted-foreground">
                Tu rol es de solo lectura. Contacta al coordinador para modificar esta información.
              </p>
            )}
          </fieldset>
        </Card>
      </div>
    </>
  );
}

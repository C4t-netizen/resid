import { useRef, useState } from "react";
import {
  Calendar,
  ClipboardList,
  FileDown,
  Image as ImageIcon,
  Save,
  Send,
  Trash2,
  UploadCloud,
  User,
  PenLine,
  FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="font-display text-base font-bold">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid items-center gap-2 md:grid-cols-[200px_1fr]">
    <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
    {children}
  </div>
);

type Evidencia = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  isImage: boolean;
  path?: string;
  uploading?: boolean;
};

const BUCKET = "evidencias-accidentes";

export default function Accidentes() {
  const { toast } = useToast();
  const [drag, setDrag] = useState(false);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [notasEvidencia, setNotasEvidencia] = useState("");
  const [form, setForm] = useState({
    fecha: "2026-03-24",
    area: "produccion",
    responsable: "Mario López",
    nombre: "Juan Pérez",
    puesto: "Operador",
    edad: "35",
    descripcion: "",
    tipo: "caida",
    lugar: "Zona de embalaje",
    hora: "10:15",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const isImage = file.type.startsWith("image/");
      const localUrl = URL.createObjectURL(file);
      setEvidencias((prev) => [
        ...prev,
        { id, name: file.name, size: file.size, type: file.type, url: localUrl, isImage, uploading: true },
      ]);

      const path = `${id}-${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (error) {
        toast({ title: "Error al subir", description: error.message, variant: "destructive" });
        setEvidencias((prev) => prev.filter((e) => e.id !== id));
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setEvidencias((prev) =>
        prev.map((e) => (e.id === id ? { ...e, url: data.publicUrl, path, uploading: false } : e)),
      );
    }
  };

  const removeEvidencia = async (ev: Evidencia) => {
    if (ev.path) await supabase.storage.from(BUCKET).remove([ev.path]);
    setEvidencias((prev) => prev.filter((e) => e.id !== ev.id));
  };

  const fetchAsDataUrl = (url: string): Promise<string> =>
    new Promise(async (resolve, reject) => {
      try {
        const r = await fetch(url);
        const b = await r.blob();
        const fr = new FileReader();
        fr.onloadend = () => resolve(fr.result as string);
        fr.onerror = reject;
        fr.readAsDataURL(b);
      } catch (e) {
        reject(e);
      }
    });

  const exportPDF = async () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Informe de Accidente", pw / 2, 18, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, pw / 2, 25, { align: "center" });

    autoTable(doc, {
      startY: 32,
      head: [["Campo", "Valor"]],
      body: [
        ["Fecha", form.fecha],
        ["Hora", form.hora],
        ["Área", form.area],
        ["Responsable de área", form.responsable],
        ["Lugar", form.lugar],
        ["Tipo de accidente", form.tipo],
        ["Persona afectada", form.nombre],
        ["Puesto", form.puesto],
        ["Edad", form.edad],
      ],
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    });

    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text("Descripción del accidente", 14, y);
    doc.setFont("helvetica", "normal");
    const desc = doc.splitTextToSize(form.descripcion || "(sin descripción)", pw - 28);
    doc.text(desc, 14, y + 6);
    y = y + 6 + desc.length * 5 + 6;

    if (notasEvidencia.trim()) {
      doc.setFont("helvetica", "bold");
      doc.text("Notas / texto de evidencia", 14, y);
      doc.setFont("helvetica", "normal");
      const notas = doc.splitTextToSize(notasEvidencia, pw - 28);
      doc.text(notas, 14, y + 6);
      y = y + 6 + notas.length * 5 + 6;
    }

    const imgs = evidencias.filter((e) => e.isImage && !e.uploading);
    if (imgs.length) {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Evidencias fotográficas", pw / 2, 18, { align: "center" });
      let cy = 28;
      for (const im of imgs) {
        try {
          const data = await fetchAsDataUrl(im.url);
          if (cy > 230) { doc.addPage(); cy = 20; }
          doc.addImage(data, "JPEG", 20, cy, 170, 100, undefined, "FAST");
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.text(im.name, 20, cy + 106);
          cy += 118;
        } catch {}
      }
    }

    const otros = evidencias.filter((e) => !e.isImage);
    if (otros.length) {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Archivos adjuntos", pw / 2, 18, { align: "center" });
      autoTable(doc, {
        startY: 26,
        head: [["Archivo", "Tipo", "URL"]],
        body: otros.map((o) => [o.name, o.type || "—", o.url]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save(`informe-accidente-${form.fecha}.pdf`);
    toast({ title: "PDF generado", description: "El informe se descargó correctamente." });
  };

  return (
    <>
      <PageHeader
        title="Informe de Accidente"
        subtitle="Registro detallado de eventos con afectación a personal o instalaciones."
        breadcrumbs={[{ label: "Accidentes", href: "/accidentes" }, { label: "Nuevo informe" }]}
        badge={<Badge className="bg-warning/10 text-warning border-warning/20">Borrador</Badge>}
        actions={<span className="text-sm font-medium text-muted-foreground">{form.fecha}</span>}
      />

      <div className="px-4 py-6 md:px-8">
        <Card className="mx-auto max-w-5xl rounded-2xl border-border/50 bg-card p-6 shadow-soft md:p-8">
          <div className="space-y-8">
            <Section icon={ClipboardList} title="Datos generales">
              <Field label="Fecha del accidente">
                <Input type="date" value={form.fecha} onChange={(e) => update("fecha", e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Área">
                <Select value={form.area} onValueChange={(v) => update("area", v)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produccion">Producción</SelectItem>
                    <SelectItem value="almacen">Almacén</SelectItem>
                    <SelectItem value="oficinas">Oficinas</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Responsable del área">
                <Input value={form.responsable} onChange={(e) => update("responsable", e.target.value)} className="h-11 rounded-xl" />
              </Field>
            </Section>

            <Section icon={User} title="Persona afectada">
              <Field label="Nombre completo">
                <Input value={form.nombre} onChange={(e) => update("nombre", e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Puesto">
                <Input value={form.puesto} onChange={(e) => update("puesto", e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Edad">
                <Input type="number" value={form.edad} onChange={(e) => update("edad", e.target.value)} className="h-11 w-32 rounded-xl" />
              </Field>
            </Section>

            <Section icon={PenLine} title="Descripción del accidente">
              <Textarea
                value={form.descripcion}
                onChange={(e) => update("descripcion", e.target.value)}
                placeholder="Describa cómo ocurrió el accidente, factores contribuyentes y consecuencias inmediatas…"
                className="min-h-[140px] rounded-xl"
              />
            </Section>

            <Section icon={Calendar} title="Detalles adicionales">
              <Field label="Tipo de accidente">
                <Select value={form.tipo} onValueChange={(v) => update("tipo", v)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caida">Caída</SelectItem>
                    <SelectItem value="golpe">Golpe</SelectItem>
                    <SelectItem value="quemadura">Quemadura</SelectItem>
                    <SelectItem value="corte">Corte</SelectItem>
                    <SelectItem value="electrico">Eléctrico</SelectItem>
                    <SelectItem value="quimico">Químico</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Lugar del accidente">
                <Input value={form.lugar} onChange={(e) => update("lugar", e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Hora del accidente">
                <Input type="time" value={form.hora} onChange={(e) => update("hora", e.target.value)} className="h-11 w-40 rounded-xl" />
              </Field>
            </Section>

            <Section icon={ImageIcon} title="Evidencias">
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-smooth ${drag ? "border-primary bg-primary/5" : "border-border bg-secondary/30"}`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-elegant">
                  <UploadCloud className="h-7 w-7 text-primary-foreground" />
                </div>
                <p className="mt-4 font-display text-base font-bold">Subir fotos / archivos</p>
                <p className="mt-1 text-sm text-muted-foreground">Arrastra o haz clic para subir (imágenes, PDF, documentos)</p>
                <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
                  Seleccionar archivos
                </Button>
              </div>

              {evidencias.length > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {evidencias.map((ev) => (
                    <div key={ev.id} className="group relative overflow-hidden rounded-xl border border-border bg-secondary/40">
                      {ev.isImage ? (
                        <img src={ev.url} alt={ev.name} className="h-32 w-full object-cover" />
                      ) : (
                        <div className="flex h-32 w-full flex-col items-center justify-center gap-2 p-2">
                          <FileText className="h-8 w-8 text-primary" />
                          <span className="line-clamp-2 text-center text-xs">{ev.name}</span>
                        </div>
                      )}
                      {ev.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs">Subiendo…</div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeEvidencia(ev)}
                        className="absolute right-1 top-1 rounded-md bg-destructive/90 p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label className="mb-2 block text-sm font-medium text-muted-foreground">Notas / descripción de evidencias</Label>
                <Textarea
                  value={notasEvidencia}
                  onChange={(e) => setNotasEvidencia(e.target.value)}
                  placeholder="Agrega notas o testimonios escritos que acompañen las evidencias…"
                  className="min-h-[100px] rounded-xl"
                />
              </div>
            </Section>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 md:flex-row md:justify-end">
              <Button variant="outline" className="rounded-xl" onClick={exportPDF}>
                <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
              </Button>
              <Button variant="secondary" className="rounded-xl">
                <Save className="mr-2 h-4 w-4" /> Guardar borrador
              </Button>
              <Button className="rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
                <Send className="mr-2 h-4 w-4" /> Enviar informe
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

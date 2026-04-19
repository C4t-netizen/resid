import { useState } from "react";
import {
  Calendar,
  ClipboardList,
  FileDown,
  Image,
  Save,
  Send,
  UploadCloud,
  User,
  PenLine,
} from "lucide-react";
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

export default function Accidentes() {
  const [drag, setDrag] = useState(false);

  return (
    <>
      <PageHeader
        title="Informe de Accidente"
        subtitle="Registro detallado de eventos con afectación a personal o instalaciones."
        breadcrumbs={[{ label: "Accidentes", href: "/accidentes" }, { label: "Nuevo informe" }]}
        badge={<Badge className="bg-warning/10 text-warning border-warning/20">Borrador</Badge>}
        actions={<span className="text-sm font-medium text-muted-foreground">24 / 03 / 2026</span>}
      />

      <div className="px-4 py-6 md:px-8">
        <Card className="mx-auto max-w-5xl rounded-2xl border-border/50 bg-card p-6 shadow-soft md:p-8">
          <div className="space-y-8">
            <Section icon={ClipboardList} title="Datos generales">
              <Field label="Fecha del accidente">
                <Input type="date" defaultValue="2026-03-24" className="h-11 rounded-xl" />
              </Field>
              <Field label="Área">
                <Select defaultValue="produccion">
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
                <Select defaultValue="mario">
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mario">Mario López</SelectItem>
                    <SelectItem value="juan">Juan Pérez</SelectItem>
                    <SelectItem value="antonio">Antonio T.</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            <Section icon={User} title="Persona afectada">
              <Field label="Nombre completo">
                <Input defaultValue="Juan Pérez" className="h-11 rounded-xl" />
              </Field>
              <Field label="Puesto">
                <Input defaultValue="Operador" className="h-11 rounded-xl" />
              </Field>
              <Field label="Edad">
                <Input type="number" defaultValue="35" className="h-11 w-32 rounded-xl" />
              </Field>
            </Section>

            <Section icon={PenLine} title="Descripción del accidente">
              <Textarea
                placeholder="Describa cómo ocurrió el accidente, factores contribuyentes y consecuencias inmediatas…"
                className="min-h-[140px] rounded-xl"
              />
            </Section>

            <Section icon={Calendar} title="Detalles adicionales">
              <Field label="Tipo de accidente">
                <Select defaultValue="caida">
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
                <Input defaultValue="Zona de embalaje" className="h-11 rounded-xl" />
              </Field>
              <Field label="Hora del accidente">
                <Input type="time" defaultValue="10:15" className="h-11 w-40 rounded-xl" />
              </Field>
            </Section>

            <Section icon={Image} title="Evidencias">
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); }}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-smooth ${drag ? "border-primary bg-primary/5" : "border-border bg-secondary/30"}`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-elegant">
                  <UploadCloud className="h-7 w-7 text-primary-foreground" />
                </div>
                <p className="mt-4 font-display text-base font-bold">Subir fotos / archivos</p>
                <p className="mt-1 text-sm text-muted-foreground">Arrastra o haz clic para subir archivos</p>
                <Button variant="outline" className="mt-4 rounded-xl">Seleccionar archivos</Button>
              </div>
            </Section>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 md:flex-row md:justify-end">
              <Button variant="outline" className="rounded-xl">
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

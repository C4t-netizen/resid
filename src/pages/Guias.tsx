import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FolderOpen } from "lucide-react";

const BASE_URL =
  "https://integrado.itdurango.edu.mx/Proceso%20de%20Seguridad%20y%20Salud%20en%20el%20Trabajo/";

const folders = [
  {
    code: "ITD-SS-PO-01",
    title: "Consulta y Participación",
    rev: "Rev O",
    path: "ITD-SS-PO-01%20Consulta%20y%20Participaci%c3%b3n_Rev%20O/",
  },
  {
    code: "ITD-SS-PO-02",
    title: "Respuesta ante Emergencias",
    rev: "Rev 1",
    path: "ITD-SS-PO-02%20Respuesta%20ante%20Emergencias_Rev%201/",
  },
  {
    code: "ITD-SS-PO-03",
    title: "Investigación de Incidentes",
    rev: "Rev 1",
    path: "ITD-SS-PO-03%20Investigaci%c3%b3n%20de%20Incidentes_Rev%201/",
  },
  {
    code: "ITD-SS-PO-04",
    title: "Determinación de los requerimientos legales y otros requerimientos",
    rev: "Rev O",
    path: "ITD-SS-PO-04%20Determinaci%c3%b3n%20de%20los%20requerimientos%20legales%20y%20otros%20requerimientos_Rev%20O/",
  },
  {
    code: "ITD-SS-PO-05",
    title: "Identificación de Peligros",
    rev: "Rev 2",
    path: "ITD-SS-PO-05%20Identificaci%c3%b3n%20de%20Peligros_Rev%202/",
  },
];

export default function Guias() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Guías / Formatos"
        description="Procedimientos y formatos oficiales del Proceso de Seguridad y Salud en el Trabajo del ITD."
      />

      <Card className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-primary/20">
        <div>
          <p className="text-sm font-medium">Repositorio institucional</p>
          <p className="text-xs text-muted-foreground break-all">
            integrado.itdurango.edu.mx · Proceso SST
          </p>
        </div>
        <Button asChild>
          <a href={BASE_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir repositorio
          </a>
        </Button>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {folders.map((f) => (
          <Card key={f.code} className="p-5 hover:shadow-elegant transition-smooth">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-muted-foreground">
                  {f.code} · {f.rev}
                </p>
                <h3 className="font-semibold leading-snug mt-1">{f.title}</h3>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  <a
                    href={`${BASE_URL}${f.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Ver formatos
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

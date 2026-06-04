import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, Save, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { NOM019_ITEMS } from "@/data/nom019";

type Status = "Si" | "No" | "NA" | "";

interface Answer {
  status: Status;
  comment: string;
}

type Answers = Record<string, Answer>;

export default function Nom019() {
  const { user } = useAuth();
  const storageKey = `nom019-answers-${user?.id ?? "anon"}`;

  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setAnswers(JSON.parse(raw));
      else setAnswers({});
    } catch {
      setAnswers({});
    }
  }, [storageKey]);

  const sections = useMemo(() => {
    const map = new Map<string, typeof NOM019_ITEMS>();
    NOM019_ITEMS.forEach((it) => {
      if (!map.has(it.section)) map.set(it.section, []);
      map.get(it.section)!.push(it);
    });
    return Array.from(map.entries());
  }, []);

  const stats = useMemo(() => {
    const total = NOM019_ITEMS.length;
    let answered = 0,
      si = 0,
      no = 0,
      na = 0;
    NOM019_ITEMS.forEach((it) => {
      const s = answers[it.code]?.status;
      if (s) answered++;
      if (s === "Si") si++;
      else if (s === "No") no++;
      else if (s === "NA") na++;
    });
    return { total, answered, si, no, na, pct: total ? Math.round((answered / total) * 100) : 0 };
  }, [answers]);

  const update = (code: string, patch: Partial<Answer>) => {
    setAnswers((prev) => ({
      ...prev,
      [code]: { status: "", comment: "", ...prev[code], ...patch },
    }));
  };

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(answers));
    toast({ title: "Respuestas guardadas", description: "Tus respuestas se almacenaron localmente." });
  };

  const reset = () => {
    if (!confirm("¿Borrar todas las respuestas del cuestionario?")) return;
    localStorage.removeItem(storageKey);
    setAnswers({});
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="NOM-019-STPS"
        subtitle="Cuestionario de cumplimiento — Comisiones de seguridad e higiene"
        breadcrumbs={[{ label: "Reportes" }, { label: "NOM-019-STPS" }]}
        badge={<Badge variant="secondary"><ClipboardCheck className="mr-1 h-3 w-3" />Requerimientos Legales</Badge>}
        actions={
          <>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
            </Button>
            <Button onClick={save}>
              <Save className="mr-2 h-4 w-4" /> Guardar
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-4 md:p-8">
        <Card className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Progreso del cuestionario</p>
              <p className="font-display text-2xl font-bold">
                {stats.answered} / {stats.total} respondidas ({stats.pct}%)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">Sí: {stats.si}</Badge>
              <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/15">No: {stats.no}</Badge>
              <Badge variant="secondary">N/A: {stats.na}</Badge>
            </div>
          </div>
          <Progress value={stats.pct} />
        </Card>

        {sections.map(([sectionName, items]) => (
          <Card key={sectionName} className="overflow-hidden">
            <div className="border-b bg-gradient-card px-5 py-3">
              <h2 className="font-display text-lg font-semibold">{sectionName}</h2>
            </div>
            <div className="divide-y">
              {items.map((it) => {
                const ans = answers[it.code] ?? { status: "" as Status, comment: "" };
                return (
                  <div key={it.code} className="p-5">
                    <div className="mb-3 flex items-start gap-3">
                      <Badge variant="outline" className="shrink-0 font-mono">
                        {it.code}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-foreground whitespace-pre-line">{it.question}</p>
                        {it.subitems.length > 0 && (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            {it.subitems.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        )}
                        {it.indicator && (
                          <p className="mt-2 text-xs italic text-muted-foreground">{it.indicator}</p>
                        )}
                      </div>
                    </div>

                    <div className="ml-0 md:ml-16 space-y-3">
                      <RadioGroup
                        value={ans.status}
                        onValueChange={(v) => update(it.code, { status: v as Status })}
                        className="flex flex-wrap gap-4"
                      >
                        {(["Si", "No", "NA"] as Status[]).map((opt) => (
                          <div key={opt} className="flex items-center gap-2">
                            <RadioGroupItem value={opt} id={`${it.code}-${opt}`} />
                            <Label htmlFor={`${it.code}-${opt}`} className="cursor-pointer">
                              {opt === "NA" ? "No aplica" : opt === "Si" ? "Sí" : "No"}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <Textarea
                        placeholder="Comentarios / Evidencia (documentos, registros, observaciones)"
                        value={ans.comment}
                        onChange={(e) => update(it.code, { comment: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

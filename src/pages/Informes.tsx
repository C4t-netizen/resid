import { useEffect, useState } from "react";
import { Loader2, FileDown, BarChart3, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--success))"];
const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function Informes() {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState({
    incidentes: [] as any[],
    hallazgos: [] as any[],
    acciones: [] as any[],
    verificaciones: [] as any[],
    recorridos: [] as any[],
  });

  const load = async () => {
    setLoading(true);
    const ini = `${year}-01-01`;
    const fin = `${year}-12-31`;
    const [i, h, a, v, r] = await Promise.all([
      supabase.from("incidentes").select("*").gte("fecha", ini).lte("fecha", fin),
      supabase.from("recorrido_hallazgos").select("*"),
      supabase.from("acciones_correctivas").select("*").gte("fecha_deteccion", ini).lte("fecha_deteccion", fin),
      supabase.from("verificaciones").select("*").gte("fecha", ini).lte("fecha", fin),
      supabase.from("recorridos").select("*").gte("fecha", ini).lte("fecha", fin),
    ]);
    setData({
      incidentes: i.data ?? [],
      hallazgos: h.data ?? [],
      acciones: a.data ?? [],
      verificaciones: v.data ?? [],
      recorridos: r.data ?? [],
    });
    setLoading(false);
  };
  useEffect(() => { load(); }, [year]);

  const kpis = {
    recorridos: data.recorridos.length,
    incidentes: data.incidentes.length,
    hallazgos: data.hallazgos.length,
    acciones: data.acciones.length,
    accionesCerradas: data.acciones.filter((a) => a.estatus === "cerrada").length,
    cumplimiento: data.verificaciones.length
      ? Math.round(data.verificaciones.reduce((s, v) => s + Number(v.porcentaje_cumplimiento ?? 0), 0) / data.verificaciones.length)
      : 0,
    diasIncapacidad: data.incidentes.reduce((s, i) => s + (i.dias_incapacidad ?? 0), 0),
  };

  const incidentesPorMes = meses.map((m, idx) => ({
    mes: m,
    incidentes: data.incidentes.filter((i) => new Date(i.fecha).getMonth() === idx).length,
    recorridos: data.recorridos.filter((r) => new Date(r.fecha).getMonth() === idx).length,
  }));

  const incidentesPorGravedad = ["leve", "moderado", "grave", "fatal"].map((g) => ({
    name: g,
    value: data.incidentes.filter((i) => i.gravedad === g).length,
  })).filter((x) => x.value > 0);

  const accionesPorEstatus = ["abierta", "en_progreso", "cerrada", "vencida"].map((e) => ({
    name: e.replace("_", " "),
    value: data.acciones.filter((a) => a.estatus === e).length,
  })).filter((x) => x.value > 0);

  const cumplimientoPorMes = meses.map((m, idx) => {
    const vs = data.verificaciones.filter((v) => new Date(v.fecha).getMonth() === idx);
    const avg = vs.length ? vs.reduce((s, v) => s + Number(v.porcentaje_cumplimiento ?? 0), 0) / vs.length : 0;
    return { mes: m, cumplimiento: Math.round(avg) };
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, w, 30, "F");
    doc.setTextColor(255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Informe Anual CSH - NOM-019", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Periodo: 01/01/${year} - 31/12/${year}`, 14, 23);

    doc.setTextColor(0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Indicadores clave", 14, 42);

    autoTable(doc, {
      startY: 46,
      head: [["Indicador", "Valor"]],
      body: [
        ["Recorridos realizados", String(kpis.recorridos)],
        ["Incidentes registrados", String(kpis.incidentes)],
        ["Hallazgos detectados", String(kpis.hallazgos)],
        ["Acciones correctivas", `${kpis.accionesCerradas} cerradas / ${kpis.acciones} totales`],
        ["Días de incapacidad", String(kpis.diasIncapacidad)],
        ["Cumplimiento promedio", `${kpis.cumplimiento}%`],
      ],
      headStyles: { fillColor: [30, 64, 175] },
      theme: "striped",
    });

    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle de incidentes", 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["Fecha", "Área", "Tipo", "Gravedad", "Estatus"]],
      body: data.incidentes.slice(0, 20).map((i) => [
        i.fecha, i.area, i.tipo, i.gravedad, i.estatus,
      ]),
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 8 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Acciones correctivas", 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["Título", "Prioridad", "Responsable", "Avance", "Estatus"]],
      body: data.acciones.slice(0, 20).map((a) => [
        a.titulo, a.prioridad, a.responsable ?? "-", `${a.avance}%`, a.estatus,
      ]),
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 8 },
    });

    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Página ${p} de ${pages} · Generado ${new Date().toLocaleDateString("es-MX")}`, 14, doc.internal.pageSize.getHeight() - 8);
    }

    doc.save(`informe-csh-${year}.pdf`);
    toast.success("Informe PDF generado");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Informes y métricas"
        subtitle="Tablero ejecutivo del desempeño anual de la Comisión de Seguridad e Higiene."
        breadcrumbs={[{ label: "Informes" }]}
        badge={<Badge className="bg-primary/10 text-primary border-primary/20">Año {year}</Badge>}
        actions={
          <div className="flex gap-2">
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={exportPDF} className="rounded-xl bg-gradient-primary shadow-elegant">
              <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Recorridos", value: kpis.recorridos, icon: BarChart3, color: "text-primary" },
            { label: "Incidentes", value: kpis.incidentes, icon: AlertTriangle, color: "text-destructive" },
            { label: "Acciones cerradas", value: `${kpis.accionesCerradas}/${kpis.acciones}`, icon: TrendingUp, color: "text-success" },
            { label: "Cumplimiento", value: `${kpis.cumplimiento}%`, icon: ShieldCheck, color: "text-warning" },
          ].map((k) => (
            <Card key={k.label} className="rounded-2xl border-border/50 p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className={`mt-2 font-display text-3xl font-bold ${k.color}`}>{k.value}</p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl border-border/50 p-5 shadow-soft">
            <h3 className="mb-4 font-display text-base font-bold">Recorridos vs incidentes por mes</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={incidentesPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="recorridos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="incidentes" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="rounded-2xl border-border/50 p-5 shadow-soft">
            <h3 className="mb-4 font-display text-base font-bold">Cumplimiento mensual (%)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={cumplimientoPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="cumplimiento" stroke="hsl(var(--success))" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="rounded-2xl border-border/50 p-5 shadow-soft">
            <h3 className="mb-4 font-display text-base font-bold">Incidentes por gravedad</h3>
            {incidentesPorGravedad.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={incidentesPorGravedad} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {incidentesPorGravedad.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="rounded-2xl border-border/50 p-5 shadow-soft">
            <h3 className="mb-4 font-display text-base font-bold">Acciones por estatus</h3>
            {accionesPorEstatus.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={accionesPorEstatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {accionesPorEstatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

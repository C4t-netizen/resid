import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


type Status = "Cumplido" | "Pendiente" | "No cumplido" | "Reprogramado";

type Acuerdo = {
  id: number;
  actividad: string;
  responsable: string;
  iniciales: string;
  fecha: string;
  fechaCumplimiento?: string;
  horaInicio?: string;
  horaFin?: string;
  estado: Status;
  cumplimiento: string;
  imagenes?: string[];
};

interface MinutaInfo {
  id: number;
  titulo: string;
  coordinador: string;
  iniciales: string;
  fecha: string;
  fechaFin?: string;
  horaInicio?: string;
  horaFin?: string;
  estado: string;
  anio: string;
}

const initialAcuerdos: Acuerdo[] = [
  { id: 1, actividad: "Constitución de la Comisión", responsable: "Juan Pérez", iniciales: "JP", fecha: "16 marzo, 2026", estado: "Cumplido", cumplimiento: "16 marzo, 2026" },
  { id: 2, actividad: "Acta constitutiva firmada y entregada", responsable: "Juan Pérez", iniciales: "JP", fecha: "17 marzo, 2026", estado: "Cumplido", cumplimiento: "17 marzo, 2026" },
  { id: 3, actividad: "Inspeccionar áreas de trabajo", responsable: "Antonio T.", iniciales: "AT", fecha: "18 marzo, 2026", estado: "Cumplido", cumplimiento: "18 marzo, 2026" },
  { id: 4, actividad: "Elaborar informe de hallazgos", responsable: "Juan Pérez", iniciales: "JP", fecha: "19 marzo, 2026", estado: "Cumplido", cumplimiento: "19 marzo, 2026" },
  { id: 5, actividad: "Capacitar sobre uso de EPP", responsable: "Juan Pérez", iniciales: "JP", fecha: "19 marzo, 2026", estado: "Pendiente", cumplimiento: "—" },
  { id: 6, actividad: "Señalizar zonas de riesgo", responsable: "David López", iniciales: "DL", fecha: "20 marzo, 2026", estado: "Pendiente", cumplimiento: "23 marzo, 2026" },
  { id: 7, actividad: "Actualizar plan de seguridad e higiene", responsable: "Antonio T.", iniciales: "AT", fecha: "20 marzo, 2026", estado: "No cumplido", cumplimiento: "23 marzo, 2026" },
  { id: 8, actividad: "Reunión de cierre mensual", responsable: "Juan Pérez", iniciales: "JP", fecha: "30 marzo, 2026", estado: "Pendiente", cumplimiento: "—" },
];

const statusStyles: Record<Status, string> = {
  Cumplido: "bg-success/10 text-success border-success/20 hover:bg-success/15",
  Pendiente: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/15",
  "No cumplido": "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
  Reprogramado: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15",
};

const statusIcons: Record<Status, typeof CheckCircle2> = {
  Cumplido: CheckCircle2,
  Pendiente: Clock,
  "No cumplido": XCircle,
  Reprogramado: Clock,
};

const getIniciales = (nombre: string) =>
  nombre
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "??";

const initialMinutas: MinutaInfo[] = [
  { id: 1, titulo: "FT-Minuta 10457", coordinador: "Antonio T.", iniciales: "AT", fecha: "15 marzo, 2026", estado: "En proceso", anio: "2026" },
];

const AÑOS_DISPONIBLES = ["2024", "2025", "2026", "2027", "2028"];
const ESTADO_COLORS: Record<Status, string> = {
  Cumplido: "hsl(var(--success))",
  Pendiente: "hsl(var(--warning))",
  "No cumplido": "hsl(var(--destructive))",
  Reprogramado: "hsl(var(--primary))",
};

export default function Minutas() {
  const [minutas, setMinutas] = useState<MinutaInfo[]>(initialMinutas);
  const [acuerdosByMinuta, setAcuerdosByMinuta] = useState<Record<number, Acuerdo[]>>({ 1: initialAcuerdos });
  const [selectedMinutaId, setSelectedMinutaId] = useState<number>(1);
  const [yearFilter, setYearFilter] = useState<string>("todos");
  const [editingMinuta, setEditingMinuta] = useState<MinutaInfo | null>(null);
  const [newMinuta, setNewMinuta] = useState<MinutaInfo | null>(null);
  const [selected, setSelected] = useState<number | null>(6);
  const [editing, setEditing] = useState<Acuerdo | null>(null);
  const [creatingAcuerdo, setCreatingAcuerdo] = useState<Acuerdo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [comentariosByAcuerdo, setComentariosByAcuerdo] = useState<Record<string, { id: number; texto: string; fecha: string }[]>>({});
  const [nuevoComentario, setNuevoComentario] = useState("");
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  

  const filteredMinutas = yearFilter === "todos" ? minutas : minutas.filter((m) => m.anio === yearFilter);
  const minuta = filteredMinutas.find((m) => m.id === selectedMinutaId) ?? filteredMinutas[0];
  const acuerdos = minuta ? acuerdosByMinuta[minuta.id] ?? [] : [];

  const cumplidos = acuerdos.filter((a) => a.estado === "Cumplido").length;
  const pendientesCount = acuerdos.filter((a) => a.estado === "Pendiente").length;
  const noCumplidos = acuerdos.filter((a) => a.estado === "No cumplido").length;
  const pendientes = acuerdos.length - cumplidos;
  const progreso = acuerdos.length ? Math.round((cumplidos / acuerdos.length) * 100) : 0;
  const detail = acuerdos.find((a) => a.id === selected);

  const chartData = useMemo(
    () => [
      { name: "Cumplido", value: cumplidos, fill: ESTADO_COLORS.Cumplido },
      { name: "Pendiente", value: pendientesCount, fill: ESTADO_COLORS.Pendiente },
      { name: "No cumplido", value: noCumplidos, fill: ESTADO_COLORS["No cumplido"] },
    ],
    [cumplidos, pendientesCount, noCumplidos]
  );

  const handleSaveEdit = () => {
    if (!editing || !minuta) return;
    setAcuerdosByMinuta((prev) => ({
      ...prev,
      [minuta.id]: (prev[minuta.id] ?? []).map((a) =>
        a.id === editing.id ? { ...editing, iniciales: getIniciales(editing.responsable) } : a
      ),
    }));
    toast({ title: "Acuerdo actualizado", description: `“${editing.actividad}” se guardó correctamente.` });
  };

  const openNewAcuerdo = () => {
    if (!minuta) return;
    const nextId = Math.max(0, ...(acuerdosByMinuta[minuta.id] ?? []).map((a) => a.id)) + 1;
    setCreatingAcuerdo({
      id: nextId,
      actividad: "",
      responsable: "",
      iniciales: "",
      fecha: "",
      estado: "Pendiente",
      cumplimiento: "—",
    });
  };

  const handleCreateAcuerdo = () => {
    if (!creatingAcuerdo || !minuta) return;
    if (!creatingAcuerdo.actividad.trim() || !creatingAcuerdo.responsable.trim()) {
      toast({ title: "Datos incompletos", description: "Completa actividad y responsable." });
      return;
    }
    const nuevo: Acuerdo = { ...creatingAcuerdo, iniciales: getIniciales(creatingAcuerdo.responsable) };
    setAcuerdosByMinuta((prev) => ({
      ...prev,
      [minuta.id]: [...(prev[minuta.id] ?? []), nuevo],
    }));
    toast({ title: "Actividad agregada", description: `“${nuevo.actividad}” se agregó a la minuta.` });
    setCreatingAcuerdo(null);
  };

  const handleSaveMinuta = () => {
    if (!editingMinuta) return;
    setMinutas((prev) =>
      prev.map((m) => (m.id === editingMinuta.id ? { ...editingMinuta, iniciales: getIniciales(editingMinuta.coordinador) } : m))
    );
    toast({ title: "Minuta actualizada", description: "Los datos de la minuta se guardaron correctamente." });
    setEditingMinuta(null);
  };

  const handleCreateMinuta = () => {
    if (!newMinuta) return;
    if (!newMinuta.titulo.trim() || !newMinuta.coordinador.trim()) {
      toast({ title: "Datos incompletos", description: "Completa título y coordinador." });
      return;
    }
    const id = Math.max(0, ...minutas.map((m) => m.id)) + 1;
    const anio = (newMinuta.fecha.match(/(20\d{2})/) || [])[1] ?? new Date().getFullYear().toString();
    const created: MinutaInfo = { ...newMinuta, id, iniciales: getIniciales(newMinuta.coordinador), anio };
    setMinutas((prev) => [...prev, created]);
    setAcuerdosByMinuta((prev) => ({ ...prev, [id]: [] }));
    setSelectedMinutaId(id);
    setNewMinuta(null);
    toast({ title: "Minuta creada", description: `"${created.titulo}" se agregó correctamente.` });
  };

  const handleConfirmDelete = () => {
    if (deletingId == null || !minuta) return;
    setAcuerdosByMinuta((prev) => ({
      ...prev,
      [minuta.id]: (prev[minuta.id] ?? []).filter((a) => a.id !== deletingId),
    }));
    if (selected === deletingId) setSelected(null);
    toast({ title: "Acuerdo eliminado", description: "El acuerdo se eliminó de la minuta." });
    setDeletingId(null);
  };

  const downloadPDF = () => {
    if (!minuta) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text("Resumen de Minuta", pageW / 2, 18, { align: "center" });
    doc.setFontSize(11);
    doc.text(`${minuta.titulo}`, pageW / 2, 26, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(`Coordinador: ${minuta.coordinador}  ·  Fecha: ${minuta.fecha}  ·  Año: ${minuta.anio}  ·  Estado: ${minuta.estado}`, pageW / 2, 32, { align: "center" });
    doc.setTextColor(0);

    // Resumen
    doc.setFontSize(11);
    doc.text("Resumen de cumplimiento", 14, 44);
    autoTable(doc, {
      startY: 48,
      head: [["Total", "Cumplidos", "Pendientes", "No cumplidos", "% Avance"]],
      body: [[acuerdos.length, cumplidos, pendientesCount, noCumplidos, `${progreso}%`]],
      headStyles: { fillColor: [101, 22, 47] },
      theme: "grid",
    });

    // Gráfico de barras dibujado manualmente
    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text("Gráfico de estadísticas", 14, y);
    y += 4;
    const barX = 20;
    const barMaxW = pageW - 60;
    const maxVal = Math.max(1, cumplidos, pendientesCount, noCumplidos);
    const colors: [number, number, number][] = [
      [34, 139, 87],
      [217, 152, 31],
      [200, 50, 50],
    ];
    const labels = ["Cumplido", "Pendiente", "No cumplido"];
    const values = [cumplidos, pendientesCount, noCumplidos];
    values.forEach((v, i) => {
      const yy = y + 6 + i * 14;
      doc.setFontSize(9);
      doc.setTextColor(60);
      doc.text(labels[i], barX, yy + 5);
      doc.setFillColor(...colors[i]);
      const w = (v / maxVal) * barMaxW;
      doc.rect(barX + 30, yy, w, 7, "F");
      doc.setTextColor(0);
      doc.text(String(v), barX + 32 + w, yy + 5);
    });

    y = y + 6 + values.length * 14 + 6;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Acuerdos", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["#", "Actividad", "Responsable", "Fecha", "Estado", "Cumplimiento"]],
      body: acuerdos.map((a) => [a.id, a.actividad, a.responsable, a.fecha, a.estado, a.cumplimiento]),
      headStyles: { fillColor: [101, 22, 47] },
      styles: { fontSize: 9 },
      theme: "striped",
    });

    doc.save(`${minuta.titulo.replace(/\s+/g, "_")}_resumen.pdf`);
    toast({ title: "Vista previa lista", description: "Revisa el documento antes de descargarlo." });
  };

  if (!minuta) {
    return (
      <>
        <PageHeader
          title="Minutas"
          subtitle={yearFilter === "todos" ? "Crea tu primera minuta para comenzar." : `No hay minutas registradas en ${yearFilter}.`}
          breadcrumbs={[{ label: "Minutas", href: "/minutas" }]}
          actions={
            <Button
              className="rounded-xl bg-gradient-primary"
              onClick={() => setNewMinuta({ id: 0, titulo: "", coordinador: "", iniciales: "", fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }), estado: "En proceso", anio: new Date().getFullYear().toString() })}
            >
              <Plus className="mr-2 h-4 w-4" /> Nueva minuta
            </Button>
          }
        />
        <div className="space-y-6 px-4 py-6 md:px-8">
          <Card className="rounded-2xl border-border/50 p-4 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Filtrar por año</Label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="h-9 w-32 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {AÑOS_DISPONIBLES.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">0 minuta(s)</p>
            </div>
          </Card>
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {yearFilter === "todos" ? "No hay minutas registradas." : `Sin minutas en ${yearFilter}.`}
          </div>
        </div>
        {renderNewMinutaDialog()}
      </>
    );
  }


  function renderNewMinutaDialog() {
    return (
      <Dialog open={!!newMinuta} onOpenChange={(open) => !open && setNewMinuta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva minuta</DialogTitle>
          </DialogHeader>
          {newMinuta && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={newMinuta.titulo} onChange={(e) => setNewMinuta({ ...newMinuta, titulo: e.target.value })} placeholder="FT-Minuta 10458" />
              </div>
              <div className="space-y-2">
                <Label>Coordinador</Label>
                <Input value={newMinuta.coordinador} onChange={(e) => setNewMinuta({ ...newMinuta, coordinador: e.target.value })} placeholder="Nombre completo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fecha de inicio</Label>
                  <Input type="date" onChange={(e) => {
                    const d = new Date(e.target.value);
                    const txt = isNaN(d.getTime()) ? e.target.value : d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
                    setNewMinuta({ ...newMinuta, fecha: txt, anio: isNaN(d.getTime()) ? newMinuta.anio : String(d.getFullYear()) });
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de terminación</Label>
                  <Input type="date" onChange={(e) => {
                    const d = new Date(e.target.value);
                    const txt = isNaN(d.getTime()) ? e.target.value : d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
                    setNewMinuta({ ...newMinuta, fechaFin: txt });
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Hora de inicio</Label>
                  <Input type="time" value={newMinuta.horaInicio ?? ""} onChange={(e) => setNewMinuta({ ...newMinuta, horaInicio: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Hora final</Label>
                  <Input type="time" value={newMinuta.horaFin ?? ""} onChange={(e) => setNewMinuta({ ...newMinuta, horaFin: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Estado</Label>
                  <Select value={newMinuta.estado} onValueChange={(v) => setNewMinuta({ ...newMinuta, estado: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Borrador">Borrador</SelectItem>
                      <SelectItem value="En proceso">En proceso</SelectItem>
                      <SelectItem value="Cerrada">Cerrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMinuta(null)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={handleCreateMinuta}>Crear minuta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      
      <PageHeader
        title={minuta.titulo}
        subtitle={`Seguimiento de acuerdos · Comisión de Seguridad e Higiene · ${minuta.anio}`}
        breadcrumbs={[{ label: "Minutas", href: "/minutas" }, { label: minuta.titulo }]}
        badge={<Badge className="bg-warning/10 text-warning border-warning/20">{minuta.estado}</Badge>}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditingMinuta(minuta)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar minuta
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setStatsOpen(true)}>
              <BarChart3 className="mr-2 h-4 w-4" /> Estadísticas
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={downloadPDF}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button
              className="rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow"
              onClick={() => setNewMinuta({ id: 0, titulo: "", coordinador: "", iniciales: "", fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }), estado: "En proceso", anio: new Date().getFullYear().toString() })}
            >
              <Plus className="mr-2 h-4 w-4" /> Nueva minuta
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
        {/* Filtro de año + lista de minutas */}
        <Card className="rounded-2xl border-border/50 p-4 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Filtrar por año</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="h-9 w-32 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {AÑOS_DISPONIBLES.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">{filteredMinutas.length} minuta(s)</p>
          </div>
          {filteredMinutas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filteredMinutas.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMinutaId(m.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-smooth",
                    m.id === selectedMinutaId
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border/50 hover:bg-secondary/50"
                  )}
                >
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium leading-tight">{m.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">{m.fecha} · {m.anio}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Resumen */}
        <Card className="rounded-2xl border-border/50 bg-gradient-card p-6 shadow-soft">
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total de acuerdos</p>
              <p className="mt-1 font-display text-3xl font-bold">{acuerdos.length}</p>
              <Progress value={progreso} className="mt-3 h-1.5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cumplidos</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-display text-3xl font-bold text-success">{cumplidos}</p>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{progreso}% del total</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pendientes</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-display text-3xl font-bold text-warning">{pendientes}</p>
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Requieren atención</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Coordinador</p>
              <div className="mt-2 flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                    {minuta.iniciales}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold leading-tight">{minuta.coordinador}</p>
                  <p className="text-xs text-muted-foreground">{minuta.fecha}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <div className={cn("grid gap-6", selected && detail ? "lg:grid-cols-[1fr_380px]" : "")}>
          <Card className="overflow-hidden rounded-2xl border-border/50 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
              <p className="text-sm font-semibold">Acuerdos y actividades</p>
              <Button size="sm" className="rounded-xl bg-gradient-primary" onClick={openNewAcuerdo}>
                <Plus className="mr-2 h-4 w-4" /> Nueva actividad
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-12 pl-5">#</TableHead>
                  <TableHead>Actividad / Acuerdo</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Fecha compromiso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cumplimiento</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acuerdos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Sin acuerdos registrados en esta minuta.
                    </TableCell>
                  </TableRow>
                ) : acuerdos.map((a) => {
                  const Icon = statusIcons[a.estado];
                  return (
                    <TableRow
                      key={a.id}
                      onClick={() => setSelected(a.id)}
                      className={cn(
                        "cursor-pointer border-border/40 transition-smooth hover:bg-secondary/40",
                        selected === a.id && "bg-primary/5 hover:bg-primary/5"
                      )}
                    >
                      <TableCell className="pl-5 text-sm font-semibold text-muted-foreground">{a.id}</TableCell>
                      <TableCell className="font-medium">{a.actividad}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                              {a.iniciales}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{a.responsable}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.fecha}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1 rounded-lg font-medium", statusStyles[a.estado])}>
                          <Icon className="h-3 w-3" />
                          {a.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.cumplimiento}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setEditing(a)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingId(a.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {detail && (
            <Card className="animate-slide-in-right rounded-2xl border-border/50 bg-gradient-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border/40 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acuerdo #{detail.id}</p>
                  <h3 className="font-display text-base font-bold">{detail.actividad}</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-5 p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                      {detail.iniciales}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{detail.responsable}</p>
                    <p className="text-xs text-muted-foreground">{detail.fecha}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Imágenes</p>
                  {detail.imagenes && detail.imagenes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {detail.imagenes.map((src, i) => (
                        <button key={i} type="button" onClick={() => setLightbox(src)} className="block">
                          <img src={src} alt="" className="aspect-video w-full rounded-lg object-cover ring-1 ring-border transition-transform hover:scale-[1.02]" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">Sin imágenes. Edita la actividad para agregar.</p>
                  )}
                </div>

                {(() => {
                  const key = `${selectedMinutaId}:${detail.id}`;
                  const comentarios = comentariosByAcuerdo[key] ?? [];
                  const handleSend = () => {
                    const texto = nuevoComentario.trim();
                    if (!texto) return;
                    const fecha = new Date().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
                    setComentariosByAcuerdo((prev) => ({
                      ...prev,
                      [key]: [...(prev[key] ?? []), { id: Date.now(), texto, fecha }],
                    }));
                    setNuevoComentario("");
                  };
                  return (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comentarios</p>
                      {comentarios.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
                          Sin comentarios.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {comentarios.map((c) => (
                            <li key={c.id} className="rounded-xl border border-border/60 bg-background p-3">
                              <p className="text-sm">{c.texto}</p>
                              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{c.fecha}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="relative">
                        <Input
                          placeholder="Escribe un comentario…"
                          value={nuevoComentario}
                          onChange={(e) => setNuevoComentario(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                          className="h-11 rounded-xl border-border/60 bg-background pr-12 text-sm"
                        />
                        <Button
                          size="icon"
                          onClick={handleSend}
                          className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg bg-gradient-primary"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Editar acuerdo */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar acuerdo</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="actividad">Actividad / Acuerdo</Label>
                <Input
                  id="actividad"
                  value={editing.actividad}
                  onChange={(e) => setEditing({ ...editing, actividad: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="responsable">Responsable</Label>
                  <Input
                    id="responsable"
                    value={editing.responsable}
                    onChange={(e) => setEditing({ ...editing, responsable: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha compromiso</Label>
                  <Input
                    id="fecha"
                    value={editing.fecha}
                    onChange={(e) => setEditing({ ...editing, fecha: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fecha de cumplimiento</Label>
                  <Input
                    type="date"
                    value={editing.fechaCumplimiento ?? ""}
                    onChange={(e) => setEditing({ ...editing, fechaCumplimiento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cumplimiento">Cumplimiento (texto)</Label>
                  <Input
                    id="cumplimiento"
                    value={editing.cumplimiento}
                    onChange={(e) => setEditing({ ...editing, cumplimiento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora de inicio</Label>
                  <Input
                    type="time"
                    value={editing.horaInicio ?? ""}
                    onChange={(e) => setEditing({ ...editing, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora final</Label>
                  <Input
                    type="time"
                    value={editing.horaFin ?? ""}
                    onChange={(e) => setEditing({ ...editing, horaFin: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={editing.estado}
                    onValueChange={(v: Status) => setEditing({ ...editing, estado: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cumplido">Cumplido</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Reprogramado">Pendiente / Reprogramado</SelectItem>
                      <SelectItem value="No cumplido">No cumplido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imágenes</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length || !editing) return;
                    const oversize = files.find((f) => f.size > 20 * 1024 * 1024);
                    if (oversize) {
                      toast({ title: "Archivo demasiado grande", description: `"${oversize.name}" supera el tamaño máximo de 20 MB.` });
                      e.target.value = "";
                      return;
                    }
                    const urls = await Promise.all(files.map((f) => new Promise<string>((res) => {
                      const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f);
                    })));
                    setEditing({ ...editing, imagenes: [...(editing.imagenes ?? []), ...urls] });
                    e.target.value = "";
                  }}
                />
                <p className="text-[11px] text-muted-foreground">Tamaño máximo por imagen: 20 MB.</p>
                {editing.imagenes && editing.imagenes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editing.imagenes.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        <button type="button" onClick={() => setEditing({ ...editing, imagenes: editing.imagenes!.filter((_, j) => j !== i) })} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={handleSaveEdit}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nueva actividad */}
      <Dialog open={!!creatingAcuerdo} onOpenChange={(open) => !open && setCreatingAcuerdo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva actividad / acuerdo</DialogTitle>
          </DialogHeader>
          {creatingAcuerdo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Actividad / Acuerdo</Label>
                <Input
                  value={creatingAcuerdo.actividad}
                  onChange={(e) => setCreatingAcuerdo({ ...creatingAcuerdo, actividad: e.target.value })}
                  placeholder="Ej. Constitución de la Comisión"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input
                    value={creatingAcuerdo.responsable}
                    onChange={(e) => setCreatingAcuerdo({ ...creatingAcuerdo, responsable: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha compromiso</Label>
                  <Input
                    value={creatingAcuerdo.fecha}
                    onChange={(e) => setCreatingAcuerdo({ ...creatingAcuerdo, fecha: e.target.value })}
                    placeholder="16 marzo, 2026"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={creatingAcuerdo.estado}
                    onValueChange={(v: Status) => setCreatingAcuerdo({ ...creatingAcuerdo, estado: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cumplido">Cumplido</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="No cumplido">No cumplido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cumplimiento</Label>
                  <Input
                    value={creatingAcuerdo.cumplimiento}
                    onChange={(e) => setCreatingAcuerdo({ ...creatingAcuerdo, cumplimiento: e.target.value })}
                    placeholder="—"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imágenes</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length || !creatingAcuerdo) return;
                    const urls = await Promise.all(files.map((f) => new Promise<string>((res) => {
                      const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f);
                    })));
                    setCreatingAcuerdo({ ...creatingAcuerdo, imagenes: [...(creatingAcuerdo.imagenes ?? []), ...urls] });
                    e.target.value = "";
                  }}
                />
                {creatingAcuerdo.imagenes && creatingAcuerdo.imagenes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {creatingAcuerdo.imagenes.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        <button type="button" onClick={() => setCreatingAcuerdo({ ...creatingAcuerdo, imagenes: creatingAcuerdo.imagenes!.filter((_, j) => j !== i) })} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingAcuerdo(null)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={handleCreateAcuerdo}>Agregar actividad</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Eliminar acuerdo */}
      <AlertDialog open={deletingId != null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este acuerdo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El acuerdo será removido de la minuta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Editar minuta (sin año) */}
      <Dialog open={!!editingMinuta} onOpenChange={(open) => !open && setEditingMinuta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar minuta</DialogTitle>
          </DialogHeader>
          {editingMinuta && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editingMinuta.titulo}
                  onChange={(e) => setEditingMinuta({ ...editingMinuta, titulo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Coordinador</Label>
                <Input
                  value={editingMinuta.coordinador}
                  onChange={(e) => setEditingMinuta({ ...editingMinuta, coordinador: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fecha de inicio</Label>
                  <Input
                    value={editingMinuta.fecha}
                    onChange={(e) => setEditingMinuta({ ...editingMinuta, fecha: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de terminación</Label>
                  <Input
                    value={editingMinuta.fechaFin ?? ""}
                    onChange={(e) => setEditingMinuta({ ...editingMinuta, fechaFin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora de inicio</Label>
                  <Input
                    type="time"
                    value={editingMinuta.horaInicio ?? ""}
                    onChange={(e) => setEditingMinuta({ ...editingMinuta, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora final</Label>
                  <Input
                    type="time"
                    value={editingMinuta.horaFin ?? ""}
                    onChange={(e) => setEditingMinuta({ ...editingMinuta, horaFin: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={editingMinuta.estado}
                    onValueChange={(v) => setEditingMinuta({ ...editingMinuta, estado: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En proceso">En proceso</SelectItem>
                      <SelectItem value="Cerrada">Cerrada</SelectItem>
                      <SelectItem value="Borrador">Borrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMinuta(null)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={handleSaveMinuta}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nueva minuta */}
      {renderNewMinutaDialog()}

      {/* Estadísticas */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Estadísticas de la minuta</DialogTitle>
          </DialogHeader>
          <div ref={chartRef} className="grid gap-6 py-4 md:grid-cols-2">
            <div className="h-64">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Distribución</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comparativa</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 border-t border-border/40 pt-4 text-center text-xs">
            <div><p className="font-display text-xl font-bold">{acuerdos.length}</p><p className="text-muted-foreground">Total</p></div>
            <div><p className="font-display text-xl font-bold text-success">{cumplidos}</p><p className="text-muted-foreground">Cumplidos</p></div>
            <div><p className="font-display text-xl font-bold text-warning">{pendientesCount}</p><p className="text-muted-foreground">Pendientes</p></div>
            <div><p className="font-display text-xl font-bold text-destructive">{noCumplidos}</p><p className="text-muted-foreground">No cumplidos</p></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsOpen(false)}>Cerrar</Button>
            <Button className="bg-gradient-primary" onClick={downloadPDF}>
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

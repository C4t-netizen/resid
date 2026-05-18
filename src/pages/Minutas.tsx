import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Settings2,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
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

type Status = "Cumplido" | "Pendiente" | "No cumplido";

type Acuerdo = {
  id: number;
  actividad: string;
  responsable: string;
  iniciales: string;
  fecha: string;
  estado: Status;
  cumplimiento: string;
};

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
};

const statusIcons: Record<Status, typeof CheckCircle2> = {
  Cumplido: CheckCircle2,
  Pendiente: Clock,
  "No cumplido": XCircle,
};

const getIniciales = (nombre: string) =>
  nombre
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "??";

interface MinutaInfo {
  titulo: string;
  coordinador: string;
  iniciales: string;
  fecha: string;
  estado: string;
  anio: string;
}

const initialMinuta: MinutaInfo = {
  titulo: "FT-Minuta 10457",
  coordinador: "Antonio T.",
  iniciales: "AT",
  fecha: "15 marzo, 2026",
  estado: "En proceso",
  anio: "2026",
};

const AÑOS_DISPONIBLES = ["2024", "2025", "2026", "2027", "2028"];

export default function Minutas() {
  const [acuerdos, setAcuerdos] = useState<Acuerdo[]>(initialAcuerdos);
  const [minuta, setMinuta] = useState<MinutaInfo>(initialMinuta);
  const [editingMinuta, setEditingMinuta] = useState<MinutaInfo | null>(null);
  const [selected, setSelected] = useState<number | null>(6);
  const [editing, setEditing] = useState<Acuerdo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const cumplidos = acuerdos.filter((a) => a.estado === "Cumplido").length;
  const pendientes = acuerdos.filter((a) => a.estado !== "Cumplido").length;
  const progreso = acuerdos.length ? Math.round((cumplidos / acuerdos.length) * 100) : 0;
  const detail = acuerdos.find((a) => a.id === selected);

  const handleSaveEdit = () => {
    if (!editing) return;
    setAcuerdos((prev) =>
      prev.map((a) =>
        a.id === editing.id ? { ...editing, iniciales: getIniciales(editing.responsable) } : a
      )
    );
    toast({ title: "Acuerdo actualizado", description: `“${editing.actividad}” se guardó correctamente.` });
    setEditing(null);
  };

  const handleSaveMinuta = () => {
    if (!editingMinuta) return;
    setMinuta({ ...editingMinuta, iniciales: getIniciales(editingMinuta.coordinador) });
    toast({ title: "Minuta actualizada", description: "Los datos de la minuta se guardaron correctamente." });
    setEditingMinuta(null);
  };

  const handleConfirmDelete = () => {
    if (deletingId == null) return;
    setAcuerdos((prev) => prev.filter((a) => a.id !== deletingId));
    if (selected === deletingId) setSelected(null);
    toast({ title: "Acuerdo eliminado", description: "El acuerdo se eliminó de la minuta." });
    setDeletingId(null);
  };

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
            <Button variant="outline" className="rounded-xl">
              <Settings2 className="mr-2 h-4 w-4" /> Acciones
            </Button>
            <Button className="rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> Nuevo acuerdo
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8">
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
                    AT
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold leading-tight">Antonio T.</p>
                  <p className="text-xs text-muted-foreground">15 marzo, 2026</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabla + Panel */}
        <div className={cn("grid gap-6", selected ? "lg:grid-cols-[1fr_380px]" : "")}>
          <Card className="overflow-hidden rounded-2xl border-border/50 bg-card shadow-soft">
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
                {acuerdos.map((a) => {
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
            <div className="flex items-center justify-between border-t border-border/40 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Mostrando {acuerdos.length} de {acuerdos.length} acuerdos
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg p-0">‹</Button>
                <Button size="sm" className="h-8 w-8 rounded-lg bg-gradient-primary p-0">1</Button>
                <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg p-0">›</Button>
              </div>
            </div>
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
                    <p className="text-xs text-muted-foreground">{detail.fecha} · 2:05 PM</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidencia</p>
                  <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs">
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">ejemplo_señalizacion.png</span>
                      <span className="ml-auto text-muted-foreground">2.1 MB</span>
                    </div>
                    <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-warning/20 to-destructive/10 ring-1 ring-warning/20">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning shadow-elegant">
                          <ImageIcon className="h-6 w-6 text-warning-foreground" />
                        </div>
                        <p className="font-display text-sm font-bold text-warning">PELIGRO</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Zona de riesgo</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comentario</p>
                  <p className="rounded-xl bg-secondary/40 p-3 text-sm leading-relaxed">
                    Se colocarán señales de peligro e instrucciones en las zonas peligrosas de la planta antes del próximo recorrido.
                  </p>
                </div>

                <div className="relative">
                  <Input
                    placeholder="Escribe un comentario…"
                    className="h-11 rounded-xl border-border/60 bg-background pr-12 text-sm"
                  />
                  <Button size="icon" className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg bg-gradient-primary">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
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
                      <SelectItem value="No cumplido">No cumplido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cumplimiento">Cumplimiento</Label>
                  <Input
                    id="cumplimiento"
                    value={editing.cumplimiento}
                    onChange={(e) => setEditing({ ...editing, cumplimiento: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={handleSaveEdit}>Guardar cambios</Button>
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
    </>
  );
}

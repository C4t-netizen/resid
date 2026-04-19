import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const stats = [
  { label: "Comisiones activas", value: "3", icon: Users, trend: "+1", color: "text-primary" },
  { label: "Acuerdos cumplidos", value: "47", icon: CheckCircle2, trend: "+12%", color: "text-success" },
  { label: "Acuerdos pendientes", value: "12", icon: Clock, trend: "-3", color: "text-warning" },
  { label: "Incidentes del mes", value: "2", icon: AlertTriangle, trend: "0", color: "text-destructive" },
];

const progressCards = [
  {
    title: "Verificación de la Comisión",
    subtitle: "Recorridos y revisiones de seguridad",
    progress: 58,
    status: "En curso",
    accent: "primary",
    icon: ShieldCheck,
  },
  {
    title: "Capacitación de la Comisión",
    subtitle: "Formación continua del personal CSH",
    progress: 34,
    status: "En curso",
    accent: "success",
    icon: Users,
  },
  {
    title: "Verificación de Cumplimiento",
    subtitle: "Última verificación: 15 de abril, 2026",
    progress: 100,
    status: "Pendiente",
    accent: "warning",
    icon: CheckCircle2,
  },
];

const accentMap = {
  primary: "bg-gradient-primary",
  success: "bg-gradient-success",
  warning: "bg-gradient-warning",
};

const Index = () => {
  const [csh, setCsh] = useState("CSH001");

  return (
    <>
      <PageHeader
        title="NOM-019-STPS-2011"
        subtitle="Constitución, integración, organización y funcionamiento de las comisiones de seguridad e higiene."
        badge={
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/15">
            Sistema activo
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" className="rounded-xl">
              <FileText className="mr-2 h-4 w-4" /> Exportar reporte
            </Button>
            <Button className="rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
              <ClipboardList className="mr-2 h-4 w-4" /> Nueva minuta
            </Button>
          </>
        }
      />

      <div className="space-y-8 px-4 py-8 md:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {stats.map((s, i) => (
            <Card
              key={s.label}
              className="group animate-fade-in rounded-2xl border-border/50 bg-gradient-card p-5 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-floating"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  <TrendingUp className="h-3 w-3" /> {s.trend}
                </span>
              </div>
              <p className="mt-4 font-display text-3xl font-bold tracking-tight">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Progress modules */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">Avance de comisiones</h2>
              <p className="text-sm text-muted-foreground">Estado actual de las actividades de la CSH seleccionada</p>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {progressCards.map((c, i) => (
              <Card
                key={c.title}
                className="group relative overflow-hidden rounded-2xl border-border/50 bg-gradient-card p-0 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-floating animate-scale-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`relative h-32 ${accentMap[c.accent as keyof typeof accentMap]} overflow-hidden`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
                  <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-background/20 backdrop-blur-md ring-1 ring-white/30">
                    <c.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-3xl font-bold text-white">{c.progress}%</span>
                      <Badge className="border-0 bg-white/20 text-white backdrop-blur-md hover:bg-white/30">
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base font-bold leading-tight">{c.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{c.subtitle}</p>
                  <Progress value={c.progress} className="mt-4 h-1.5" />
                  <Button
                    variant="ghost"
                    className="mt-4 w-full justify-between rounded-xl bg-secondary/50 hover:bg-secondary"
                    asChild
                  >
                    <Link to="/minutas">
                      Ver detalles <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Área de ingreso */}
        <Card className="rounded-2xl border-border/50 bg-gradient-card p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">Área de ingreso de información</h3>
              <p className="text-sm text-muted-foreground">
                Indica los datos que deseas llenar de la CSH seleccionada.
              </p>
            </div>
            <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary">
              {csh}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Select defaultValue="una">
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="una">Usar solo una CSH</SelectItem>
                <SelectItem value="varias">Usar más de una CSH</SelectItem>
              </SelectContent>
            </Select>
            <Select value={csh} onValueChange={setCsh}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSH001">CSH001 — Planta principal</SelectItem>
                <SelectItem value="CSH002">CSH002 — Almacén</SelectItem>
                <SelectItem value="CSH003">CSH003 — Oficinas</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="minuta">
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Seleccionar documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minuta">Minuta</SelectItem>
                <SelectItem value="recorrido">Recorrido</SelectItem>
                <SelectItem value="acta">Acta constitutiva</SelectItem>
                <SelectItem value="programa">Programa anual</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-11 rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow">
              Ingresar datos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Index;

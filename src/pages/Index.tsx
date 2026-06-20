import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Binoculars,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Settings2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CshOption {
  id: string;
  nombre_centro: string | null;
  razon_social: string | null;
}

const accentMap = {
  primary: "bg-gradient-primary",
  success: "bg-gradient-success",
  warning: "bg-gradient-warning",
} as const;

const SELECTED_KEY = "nom019-selected-csh";
const MODE_KEY = "nom019-csh-mode";

const Index = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cshList, setCshList] = useState<CshOption[]>([]);
  const [mode, setMode] = useState<"single" | "multi">(
    () => (localStorage.getItem(MODE_KEY) as "single" | "multi") || "single"
  );
  const [selectedId, setSelectedId] = useState<string>(
    () => localStorage.getItem(SELECTED_KEY) || ""
  );
  const [newRef, setNewRef] = useState("");
  const [counts, setCounts] = useState({
    miembrosActivos: 0,
    accionesCerradas: 0,
    accionesPendientes: 0,
    incidentesMes: 0,
    recorridosTotal: 0,
    recorridosCompletos: 0,
    miembrosTotal: 0,
    capacitados: 0,
    verifPromedio: 0,
    ultimaVerificacion: null as string | null,
  });

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

      const [csh, miembros, acciones, incidentes, recorridos, verificaciones] = await Promise.all([
        supabase.from("csh_config").select("id,nombre_centro,razon_social").order("created_at", { ascending: false }),
        supabase.from("comite_miembros").select("id,activo"),
        supabase.from("acciones_correctivas").select("id,estatus"),
        supabase.from("incidentes").select("id,fecha").gte("fecha", firstDay),
        supabase.from("recorridos").select("id,estatus"),
        supabase.from("verificaciones").select("id,fecha,porcentaje_cumplimiento").order("fecha", { ascending: false }),
      ]);

      setCshList((csh.data ?? []) as CshOption[]);

      const miembrosTotal = miembros.data?.length ?? 0;
      const miembrosActivos = (miembros.data ?? []).filter((m: any) => m.activo).length;

      const accionesList = acciones.data ?? [];
      const accionesCerradas = accionesList.filter((a: any) => a.estatus === "cerrada").length;
      const accionesPendientes = accionesList.filter((a: any) => a.estatus !== "cerrada").length;

      const recorridosTotal = recorridos.data?.length ?? 0;
      const recorridosCompletos = (recorridos.data ?? []).filter((r: any) => r.estatus === "completado" || r.estatus === "cerrado").length;

      const verifList = verificaciones.data ?? [];
      const verifPromedio = verifList.length
        ? Math.round(verifList.reduce((s, v: any) => s + Number(v.porcentaje_cumplimiento ?? 0), 0) / verifList.length)
        : 0;

      setCounts({
        miembrosActivos,
        accionesCerradas,
        accionesPendientes,
        incidentesMes: incidentes.data?.length ?? 0,
        recorridosTotal,
        recorridosCompletos,
        miembrosTotal,
        capacitados: miembrosActivos,
        verifPromedio,
        ultimaVerificacion: verifList[0]?.fecha ?? null,
      });
      setLoading(false);
    };
    load();
  }, []);

  const selectedCsh = cshList[0];

  const stats = [
    { label: "Miembros activos CSH", value: counts.miembrosActivos.toString(), icon: Users, color: "text-primary" },
    { label: "Acciones cerradas", value: counts.accionesCerradas.toString(), icon: CheckCircle2, color: "text-success" },
    { label: "Acciones pendientes", value: counts.accionesPendientes.toString(), icon: Clock, color: "text-warning" },
    { label: "Incidentes del mes", value: counts.incidentesMes.toString(), icon: AlertTriangle, color: "text-destructive" },
  ];

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
  const verifProgress = counts.verifPromedio;
  const recorridosProgress = pct(counts.recorridosCompletos, counts.recorridosTotal);
  const capacitacionProgress = pct(counts.capacitados, counts.miembrosTotal);

  const progressCards = [
    {
      title: "Recorridos de seguridad",
      subtitle: `${counts.recorridosCompletos} de ${counts.recorridosTotal} cerrados`,
      progress: recorridosProgress,
      status: recorridosProgress >= 100 ? "Al día" : "En curso",
      accent: "primary" as const,
      icon: ShieldCheck,
      to: "/recorridos",
    },
    {
      title: "Integración de la Comisión",
      subtitle: `${counts.miembrosActivos} de ${counts.miembrosTotal || 0} miembros activos`,
      progress: capacitacionProgress,
      status: capacitacionProgress >= 100 ? "Completa" : "En curso",
      accent: "success" as const,
      icon: Users,
      to: "/eleccion",
    },
    {
      title: "Cumplimiento normativo",
      subtitle: counts.ultimaVerificacion
        ? `Última verificación: ${new Date(counts.ultimaVerificacion).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`
        : "Sin verificaciones registradas",
      progress: verifProgress,
      status: verifProgress >= 80 ? "Cumple" : verifProgress > 0 ? "Pendiente" : "Sin datos",
      accent: "warning" as const,
      icon: CheckCircle2,
      to: "/verificaciones",
    },
  ];

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
      />

      <div className="space-y-8 px-4 py-8 md:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
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
                      <TrendingUp className="h-3 w-3" /> en vivo
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
                  <h2 className="font-display text-xl font-bold">Avance de la CSH</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedCsh
                      ? `Estado actual de ${selectedCsh.nombre_centro ?? selectedCsh.razon_social ?? "la comisión"}`
                      : "Configura tu CSH para ver el avance"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary" asChild>
                  <Link to="/informes">
                    Ver informes <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {progressCards.map((c, i) => (
                  <Card
                    key={c.title}
                    className="group relative overflow-hidden rounded-2xl border-border/50 bg-gradient-card p-0 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-floating animate-scale-in"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className={`relative h-32 ${accentMap[c.accent]} overflow-hidden`}>
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
                        <Link to={c.to}>
                          Ver detalles <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Accesos rápidos */}
            <Card className="rounded-2xl border-border/50 bg-gradient-card p-6 shadow-soft">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">Accesos rápidos</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCsh
                      ? `Trabajando sobre: ${selectedCsh.nombre_centro ?? selectedCsh.razon_social}`
                      : "Aún no has configurado una CSH"}
                  </p>
                </div>
                {selectedCsh && (
                  <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary">
                    {selectedCsh.nombre_centro ?? selectedCsh.razon_social}
                  </Badge>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Button variant="outline" className="h-11 rounded-xl justify-between" asChild>
                  <Link to="/minutas">Nueva minuta <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" className="h-11 rounded-xl justify-between" asChild>
                  <Link to="/recorridos">Nuevo recorrido <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" className="h-11 rounded-xl justify-between" asChild>
                  <Link to="/acta">Acta constitutiva <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button className="h-11 rounded-xl bg-gradient-primary shadow-elegant hover:shadow-glow justify-between" asChild>
                  <Link to={selectedCsh ? "/configuracion" : "/configuracion"}>
                    {selectedCsh ? "Configurar CSH" : "Crear CSH"} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default Index;

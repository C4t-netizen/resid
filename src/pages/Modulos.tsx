import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileSignature,
  HeartPulse,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

const modules = [
  { title: "Configuración del sistema", desc: "Parámetros generales y CSH", icon: Settings, to: "/configuracion", color: "from-slate-500 to-slate-700" },
  { title: "Elección del comité", desc: "Acta de elección de representantes", icon: Users, to: "/eleccion", color: "from-amber-400 to-orange-500" },
  { title: "Acta de constitución", desc: "Constitución formal de la CSH", icon: FileSignature, to: "/acta", color: "from-emerald-400 to-teal-600" },
  { title: "Programa anual", desc: "Calendario de actividades CSH", icon: CalendarCheck, to: "/programa", color: "from-sky-400 to-blue-600" },
  { title: "Minutas", desc: "Acuerdos y seguimiento", icon: ClipboardList, to: "/minutas", color: "from-indigo-400 to-purple-600" },
  { title: "Recorridos", desc: "Inspecciones de áreas de trabajo", icon: Search, to: "/recorridos", color: "from-cyan-400 to-blue-500" },
  { title: "Verificaciones", desc: "Cumplimiento normativo", icon: ShieldCheck, to: "/verificaciones", color: "from-teal-400 to-emerald-600" },
  { title: "Registro de incidentes", desc: "Eventos sin lesión", icon: AlertTriangle, to: "/incidentes", color: "from-yellow-400 to-amber-600" },
  { title: "Registro de accidentes", desc: "Reportes con afectación", icon: HeartPulse, to: "/accidentes", color: "from-rose-400 to-red-600" },
  { title: "Informes", desc: "Reportes y estadísticas", icon: BarChart3, to: "/informes", color: "from-violet-400 to-fuchsia-600" },
  { title: "Acciones correctivas", desc: "Plan ACR y seguimiento", icon: ShieldAlert, to: "/acciones", color: "from-red-400 to-pink-600" },
  { title: "Guías / Formatos", desc: "Documentación de referencia", icon: BookOpen, to: "/guias", color: "from-blue-400 to-indigo-600" },
];

export default function Modulos() {
  return (
    <>
      <PageHeader
        title="Módulos del sistema"
        subtitle="Accede a todas las funcionalidades para la gestión integral de la NOM-019-STPS-2011."
        breadcrumbs={[{ label: "Módulos" }]}
      />
      <div className="px-4 py-8 md:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {modules.map((m, i) => (
            <Link key={m.title} to={m.to} className="group block animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <Card className="relative h-full overflow-hidden rounded-2xl border-border/50 bg-gradient-card p-5 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-floating">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${m.color} shadow-elegant transition-smooth group-hover:scale-110`}>
                  <m.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-display text-sm font-bold leading-tight md:text-base">{m.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                <div className="mt-4 h-0.5 w-8 rounded-full bg-gradient-primary transition-smooth group-hover:w-16" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

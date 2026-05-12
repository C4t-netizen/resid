import {
  LayoutGrid,
  Settings,
  Users,
  FileSignature,
  CalendarCheck,
  ClipboardList,
  Search,
  ShieldCheck as _ShieldCheck,
  AlertTriangle,
  HeartPulse,
  BarChart3,
  Wrench,
  BookOpen,
  ShieldAlert,
  UserCog,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import sgiLogo from "@/assets/sgi-logo.png";

const mainItems = [
  { title: "Índice", url: "/", icon: LayoutGrid },
  { title: "Módulos", url: "/modulos", icon: Wrench },
];

const operationItems = [
  { title: "Configuración", url: "/configuracion", icon: Settings },
  { title: "Elección comité", url: "/eleccion", icon: Users },
  { title: "Acta constitución", url: "/acta", icon: FileSignature },
  { title: "Programa anual", url: "/programa", icon: CalendarCheck },
  { title: "Minutas", url: "/minutas", icon: ClipboardList },
  { title: "Recorridos", url: "/recorridos", icon: Search },
  { title: "Verificaciones", url: "/verificaciones", icon: ShieldCheck },
];

const incidentItems = [
  { title: "Incidentes", url: "/incidentes", icon: AlertTriangle },
  { title: "Accidentes", url: "/accidentes", icon: HeartPulse },
  { title: "Acciones correctivas", url: "/acciones", icon: ShieldAlert },
];

const reportItems = [
  { title: "Informes", url: "/informes", icon: BarChart3 },
  { title: "Guías / Formatos", url: "/guias", icon: BookOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { isSuperAdmin } = useAuth();
  const collapsed = state === "collapsed";

  const adminItems = isSuperAdmin
    ? [{ title: "Usuarios", url: "/usuarios", icon: UserCog }]
    : [];

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="!bg-gradient-primary !text-primary-foreground shadow-elegant"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">
            <img src={sgiLogo} alt="SGI" className="h-11 w-11 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-sm font-bold leading-tight text-sidebar-foreground">
                Gestión NOM-019
              </p>
              <p className="text-[11px] text-muted-foreground">STPS · Seguridad e Higiene</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        {renderGroup("General", mainItems)}
        {renderGroup("Operación CSH", operationItems)}
        {renderGroup("Eventos", incidentItems)}
        {renderGroup("Reportes", reportItems)}
        {adminItems.length > 0 && renderGroup("Administración", adminItems)}
      </SidebarContent>
    </Sidebar>
  );
}

import { Outlet } from "react-router-dom";
import { Eye, LogOut, Plus, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_BADGE_COLORS, ROLE_LABELS, useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

export default function AppLayout() {
  const { profile, role, signOut } = useAuth();
  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "Usuario";
  const initials = displayName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-mesh bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="rounded-lg" />
            <div className="relative hidden flex-1 max-w-md md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar minutas, recorridos, acuerdos…"
                className="h-10 rounded-xl border-border/60 bg-secondary/50 pl-10 text-sm focus-visible:ring-primary/30"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden h-8 w-px bg-border md:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-smooth hover:bg-secondary">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left md:block">
                      <p className="text-sm font-semibold leading-tight">{displayName}</p>
                      <p className="text-[11px] text-muted-foreground">{role ? ROLE_LABELS[role] : "—"}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl">
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{displayName}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">{profile?.email}</span>
                    {role && <Badge className={`${ROLE_BADGE_COLORS[role]} mt-1 w-fit`}>{ROLE_LABELS[role]}</Badge>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {role === "viewer" && (
            <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs font-medium text-warning-foreground md:px-6">
              <Eye className="h-3.5 w-3.5 text-warning" />
              <span className="text-warning">Modo solo lectura</span>
              <span className="hidden text-muted-foreground md:inline">— puedes consultar la información, pero no crear, editar ni eliminar registros.</span>
            </div>
          )}

          <main className={`flex-1 overflow-x-hidden ${role === "viewer" ? "[&_form]:pointer-events-auto" : ""}`}>
            <Outlet />
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}

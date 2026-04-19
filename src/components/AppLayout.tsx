import { Outlet } from "react-router-dom";
import { Bell, Plus, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AppLayout() {
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
              <Button variant="ghost" size="icon" className="relative rounded-xl">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
              </Button>
              <div className="hidden h-8 w-px bg-border md:block" />
              <div className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-smooth hover:bg-secondary">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                    JP
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-semibold leading-tight">Juan Pérez</p>
                  <p className="text-[11px] text-muted-foreground">Coordinador CSH</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            <Outlet />
          </main>

          {/* FAB */}
          <button
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-fab transition-smooth hover:scale-105 hover:shadow-glow"
            aria-label="Registrar nuevo"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>
    </SidebarProvider>
  );
}

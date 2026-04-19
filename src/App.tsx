import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import Modulos from "./pages/Modulos";
import Minutas from "./pages/Minutas";
import Accidentes from "./pages/Accidentes";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/modulos" element={<Modulos />} />
            <Route path="/minutas" element={<Minutas />} />
            <Route path="/accidentes" element={<Accidentes />} />
            <Route path="/configuracion" element={<Placeholder title="Configuración del sistema" />} />
            <Route path="/eleccion" element={<Placeholder title="Elección del comité" />} />
            <Route path="/acta" element={<Placeholder title="Acta de constitución" />} />
            <Route path="/programa" element={<Placeholder title="Programa anual" />} />
            <Route path="/recorridos" element={<Placeholder title="Recorridos" />} />
            <Route path="/verificaciones" element={<Placeholder title="Verificaciones" />} />
            <Route path="/incidentes" element={<Placeholder title="Registro de incidentes" />} />
            <Route path="/acciones" element={<Placeholder title="Acciones correctivas" />} />
            <Route path="/informes" element={<Placeholder title="Informes" />} />
            <Route path="/guias" element={<Placeholder title="Guías / Formatos" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

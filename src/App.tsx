import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Modulos from "./pages/Modulos";
import Minutas from "./pages/Minutas";
import Accidentes from "./pages/Accidentes";
import Configuracion from "./pages/Configuracion";
import Usuarios from "./pages/Usuarios";
import Comite from "./pages/Comite";
import Acta from "./pages/Acta";
import Programa from "./pages/Programa";
import Recorridos from "./pages/Recorridos";
import Verificaciones from "./pages/Verificaciones";
import Incidentes from "./pages/Incidentes";
import Acciones from "./pages/Acciones";
import Informes from "./pages/Informes";
import Guias from "./pages/Guias";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Index />} />
              <Route path="/modulos" element={<Modulos />} />
              <Route path="/minutas" element={<Minutas />} />
              <Route path="/accidentes" element={<Accidentes />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute requireRoles={["super_admin"]}>
                    <Usuarios />
                  </ProtectedRoute>
                }
              />
              <Route path="/eleccion" element={<Comite />} />
              <Route path="/acta" element={<Acta />} />
              <Route path="/programa" element={<Programa />} />
              <Route path="/recorridos" element={<Recorridos />} />
              <Route path="/verificaciones" element={<Verificaciones />} />
              <Route path="/incidentes" element={<Incidentes />} />
              <Route path="/acciones" element={<Acciones />} />
              <Route path="/informes" element={<Informes />} />
              <Route path="/guias" element={<Placeholder title="Guías / Formatos" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

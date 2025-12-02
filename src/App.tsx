import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginProvider } from "./contexts/LoginContext";
import { AuthProvider } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Overview from "./pages/Overview";
import LiveMap from "./pages/LiveMap";
import Inventory from "./pages/Inventory";
import Alerts from "./pages/Alerts";
import Playback from "./pages/Playback";
import Dashboards from "./pages/Dashboards";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Patients from "./pages/Patients";
import Login from "./pages/Login";

const queryClient = new QueryClient();

// derive basename from Vite so you don't hardcode it
const basename = import.meta.env.BASE_URL.replace(/\/$/, ""); // '/rtls-viz'

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LoginProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={basename}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Overview />} />
                <Route path="map" element={<LiveMap />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="playback" element={<Playback />} />
                <Route path="dashboards" element={<Dashboards />} />
                <Route path="admin" element={<Admin />} />
                <Route path="patients" element={<Patients />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LoginProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

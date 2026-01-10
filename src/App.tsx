import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Visits from "./pages/Visits";
import Messages from "./pages/Messages";
import Journal from "./pages/Journal";
import Children from "./pages/Children";
import Moderator from "./pages/Moderator";
import NotFound from "./pages/NotFound";
import { ProtectedRoute, RoleProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />

          {/* Client (parent-only) pages */}
          <Route path="/dashboard" element={ <RoleProtectedRoute allowedRoles={["parent"]}> <Dashboard /> </RoleProtectedRoute> } />
          <Route path="/visits" element={ <RoleProtectedRoute allowedRoles={["parent"]}> <Visits /> </RoleProtectedRoute> } /> 
          <Route path="/messages" element={ <RoleProtectedRoute allowedRoles={["parent"]}> <Messages /> </RoleProtectedRoute> } /> 
          <Route path="/journal" element={ <RoleProtectedRoute allowedRoles={["parent"]}> <Journal /> </RoleProtectedRoute> } />
          <Route path="/children" element={ <RoleProtectedRoute allowedRoles={["parent"]}> <Children /> </RoleProtectedRoute> } /> 
          {/* Mediator / Admin page */}
          <Route path="/moderator" element={ <RoleProtectedRoute allowedRoles={["mediator", "admin"]}> <Moderator /> </RoleProtectedRoute> } />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

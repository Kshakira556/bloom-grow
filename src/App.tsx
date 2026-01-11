import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

// Public pages
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";

// Client pages
import Dashboard from "./pages/Dashboard";
import Visits from "./pages/Visits";
import Messages from "./pages/Messages";
import Journal from "./pages/Journal";
import Children from "./pages/Children";
import Admin from "./pages/admin/System";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClients from "./pages/admin/Clients";
import AdminChildren from "./pages/admin/Children";
import AdminPlans from "./pages/admin/Plans";
import AdminMessages from "./pages/admin/Messages";
import AdminProposals from "./pages/admin/Proposals";
import AdminAudit from "./pages/admin/Audit";
import Moderator from "./pages/admin/Moderator";

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
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />

          {/* Client (parent-only) pages */}
          <Route path="/dashboard" element={
            <RoleProtectedRoute allowedRoles={["parent"]}>
              <Dashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/visits" element={
            <RoleProtectedRoute allowedRoles={["parent"]}>
              <Visits />
            </RoleProtectedRoute>
          } /> 
          <Route path="/messages" element={
            <RoleProtectedRoute allowedRoles={["parent"]}>
              <Messages />
            </RoleProtectedRoute>
          } /> 
          <Route path="/journal" element={
            <RoleProtectedRoute allowedRoles={["parent"]}>
              <Journal />
            </RoleProtectedRoute>
          } />
          <Route path="/children" element={
            <RoleProtectedRoute allowedRoles={["parent"]}>
              <Children />
            </RoleProtectedRoute>
          } /> 

          {/* Admin / Moderator protected routes */}
          <Route path="/admin/dashboard" element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/clients" element={
            <RoleProtectedRoute allowedRoles={["mediator"]}>
              <AdminClients />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/children" element={
            <RoleProtectedRoute allowedRoles={["mediator"]}>
              <AdminChildren />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/plans" element={
            <RoleProtectedRoute allowedRoles={["mediator"]}>
              <AdminPlans />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/messages" element={
            <RoleProtectedRoute allowedRoles={["mediator"]}>
              <AdminMessages />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/proposals" element={
            <RoleProtectedRoute allowedRoles={["mediator"]}>
              <AdminProposals />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <RoleProtectedRoute allowedRoles={["mediator"]}>
              <AdminAudit />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/moderator" element={
            <RoleProtectedRoute allowedRoles={["mediator"]}>
              <Moderator />
            </RoleProtectedRoute>
          } />
          <Route
            path="/admin/system"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </RoleProtectedRoute>
            }
          />

          {/* Legacy / short route for moderator (optional redirect) */}
          <Route path="/moderator" element={<Navigate to="/admin/moderator" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

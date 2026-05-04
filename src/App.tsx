import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute, RoleProtectedRoute } from "./components/auth/ProtectedRoute";

// Public pages
const Index = lazy(() => import("./pages/Index"));
const SignIn = lazy(() => import("./pages/SignIn"));
const Register = lazy(() => import("./pages/Register"));
const Paywall = lazy(() => import("./pages/Paywall"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PrivacyRequests = lazy(() => import("./pages/PrivacyRequests"));

// Client pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Visits = lazy(() => import("./pages/Visits"));
const Messages = lazy(() => import("./pages/Messages"));
const Journal = lazy(() => import("./pages/Journal"));
const Children = lazy(() => import("./pages/Children"));
const Admin = lazy(() => import("./pages/admin/System"));
const CreatePlan = lazy(() => import("./pages/CreatePlan"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminClients = lazy(() => import("./pages/admin/Clients"));
const AdminChildren = lazy(() => import("./pages/admin/Children"));
const AdminPlans = lazy(() => import("./pages/admin/Plans"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminProposals = lazy(() => import("./pages/admin/Proposals"));
const AdminAudit = lazy(() => import("./pages/admin/Audit"));
const Moderator = lazy(() => import("./pages/admin/Moderator"));

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/privacy-requests" element={<PrivacyRequests />} />
            <Route
              path="/paywall"
              element={
                <ProtectedRoute>
                  <Paywall />
                </ProtectedRoute>
              }
            />

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
            <Route path="/create-plan" element={
              <RoleProtectedRoute allowedRoles={["parent"]}>
                <CreatePlan />
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

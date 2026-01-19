import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import EveningStudy from "./pages/EveningStudy";
import Boarding from "./pages/Boarding";
import Meals from "./pages/Meals";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import MobileMenu from "./pages/MobileMenu";
import DutySchedule from "./pages/DutySchedule";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/install" element={<Install />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Dashboard />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Students />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/evening-study"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <EveningStudy />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/boarding"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Boarding />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meals"
                  element={
                    <ProtectedRoute requireClassTeacher>
                      <MainLayout>
                        <Meals />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/statistics"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Statistics />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/duty-schedule"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <DutySchedule />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Settings />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requiredRoles={['admin']}>
                      <MainLayout>
                        <UserManagement />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/menu"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <MobileMenu />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

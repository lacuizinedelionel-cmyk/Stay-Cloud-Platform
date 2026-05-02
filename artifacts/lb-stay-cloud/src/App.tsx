import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import SuperAdminDashboard from "@/pages/superadmin/dashboard";
import RestaurantDashboard from "@/pages/restaurant/dashboard";
import RestaurantPOS from "@/pages/restaurant/pos";
import HotelDashboard from "@/pages/hotel/dashboard";
import BeautyDashboard from "@/pages/beauty/dashboard";
import GroceryDashboard from "@/pages/grocery/dashboard";
import PharmacyDashboard from "@/pages/pharmacy/dashboard";
import GarageDashboard from "@/pages/garage/dashboard";
import FitnessDashboard from "@/pages/fitness/dashboard";
import EducationDashboard from "@/pages/education/dashboard";

import ClientsPage from "@/pages/clients";
import AnalyticsPage from "@/pages/analytics";
import NotificationsPage from "@/pages/notifications";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return <Redirect to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/dashboard" />;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 md:ml-64 overflow-y-auto custom-scrollbar">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/superadmin">
        {() => <ProtectedRoute component={SuperAdminDashboard} allowedRoles={['SUPER_ADMIN']} />}
      </Route>
      
      {/* Sector Dashboards */}
      <Route path="/restaurant/dashboard">{() => <ProtectedRoute component={RestaurantDashboard} />}</Route>
      <Route path="/restaurant/pos">{() => <ProtectedRoute component={RestaurantPOS} />}</Route>
      <Route path="/hotel/dashboard">{() => <ProtectedRoute component={HotelDashboard} />}</Route>
      <Route path="/beauty/dashboard">{() => <ProtectedRoute component={BeautyDashboard} />}</Route>
      <Route path="/grocery/dashboard">{() => <ProtectedRoute component={GroceryDashboard} />}</Route>
      <Route path="/pharmacy/dashboard">{() => <ProtectedRoute component={PharmacyDashboard} />}</Route>
      <Route path="/garage/dashboard">{() => <ProtectedRoute component={GarageDashboard} />}</Route>
      <Route path="/fitness/dashboard">{() => <ProtectedRoute component={FitnessDashboard} />}</Route>
      <Route path="/education/dashboard">{() => <ProtectedRoute component={EducationDashboard} />}</Route>
      
      {/* Shared Pages */}
      <Route path="/clients">{() => <ProtectedRoute component={ClientsPage} />}</Route>
      <Route path="/analytics">{() => <ProtectedRoute component={AnalyticsPage} />}</Route>
      <Route path="/notifications">{() => <ProtectedRoute component={NotificationsPage} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={SettingsPage} />}</Route>

      <Route path="/dashboard">
        {() => {
          // Dynamic redirect based on user business sector
          const { business } = useAuth();
          if (business) {
            return <Redirect to={`/${business.sector.toLowerCase()}/dashboard`} />;
          }
          return <ProtectedRoute component={NotFound} />;
        }}
      </Route>
      
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

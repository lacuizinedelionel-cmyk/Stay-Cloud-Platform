import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import ActivatePage from "@/pages/activate";
import SignupPage from "@/pages/signup";
import SuperAdminDashboard from "@/pages/superadmin/dashboard";
import SuperAdminAnalyticsPage from "@/pages/superadmin/analytics";
import SuperAdminBillingPage from "@/pages/superadmin/billing";

import RestaurantDashboard from "@/pages/restaurant/dashboard";
import RestaurantOrdersPage from "@/pages/restaurant/orders";
import POSPage from "@/pages/restaurant/pos";
import CaissePage from "@/pages/restaurant/caisse";

import HotelDashboard from "@/pages/hotel/dashboard";
import HotelRoomsPage from "@/pages/hotel/rooms";
import HotelReservationsPage from "@/pages/hotel/reservations";

import BeautyDashboard from "@/pages/beauty/dashboard";
import GroceryDashboard from "@/pages/grocery/dashboard";
import GroceryStockPage from "@/pages/grocery/stock";
import GroceryProductsPage from "@/pages/grocery/products";
import GroceryCreditsPage from "@/pages/grocery/credits";
import PharmacyDashboard from "@/pages/pharmacy/dashboard";
import PharmacyMedicationsPage from "@/pages/pharmacy/medications";
import PharmacyPrescriptionsPage from "@/pages/pharmacy/prescriptions";
import GarageDashboard from "@/pages/garage/dashboard";
import GarageVehiclesPage from "@/pages/garage/vehicles";
import GarageQuotesPage from "@/pages/garage/quotes";
import FitnessDashboard from "@/pages/fitness/dashboard";
import EducationDashboard from "@/pages/education/dashboard";

import { LanguageProvider } from "@/context/LanguageContext";
import ClientsPage from "@/pages/clients";
import AnalyticsPage from "@/pages/analytics";
import NotificationsPage from "@/pages/notifications";
import SettingsPage from "@/pages/settings";
import BillingPage from "@/pages/billing";
import AuditPage from "@/pages/audit";
import MessagesPage from "@/pages/messages";
import SuperAdminMessagesPage from "@/pages/superadmin/messages";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRoles }: { component: any; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
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

function SuperAdminGuard({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return <Redirect to="/login" />;
  if (user.email !== 'admin@lbstay.com') return <Redirect to="/login" />;

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
      <Route path="/activate" component={ActivatePage} />
      <Route path="/signup" component={SignupPage} />

      <Route path="/superadmin">
        {() => <SuperAdminGuard component={SuperAdminDashboard} />}
      </Route>

      {/* Restaurant */}
      <Route path="/restaurant/dashboard">{() => <ProtectedRoute component={RestaurantDashboard} />}</Route>
      <Route path="/restaurant/orders">{() => <ProtectedRoute component={RestaurantOrdersPage} />}</Route>
      <Route path="/restaurant/pos">{() => <ProtectedRoute component={POSPage} />}</Route>
      <Route path="/restaurant/caisse">{() => <ProtectedRoute component={CaissePage} />}</Route>

      {/* Hôtel */}
      <Route path="/hotel/dashboard">{() => <ProtectedRoute component={HotelDashboard} />}</Route>
      <Route path="/hotel/rooms">{() => <ProtectedRoute component={HotelRoomsPage} />}</Route>
      <Route path="/hotel/reservations">{() => <ProtectedRoute component={HotelReservationsPage} />}</Route>

      {/* Autres secteurs */}
      <Route path="/beauty/dashboard">{() => <ProtectedRoute component={BeautyDashboard} />}</Route>
      <Route path="/grocery/dashboard">{() => <ProtectedRoute component={GroceryDashboard} />}</Route>
      <Route path="/grocery/stock">{() => <ProtectedRoute component={GroceryStockPage} />}</Route>
      <Route path="/grocery/products">{() => <ProtectedRoute component={GroceryProductsPage} />}</Route>
      <Route path="/grocery/credits">{() => <ProtectedRoute component={GroceryCreditsPage} />}</Route>
      <Route path="/pharmacy/dashboard">{() => <ProtectedRoute component={PharmacyDashboard} />}</Route>
      <Route path="/pharmacy/medications">{() => <ProtectedRoute component={PharmacyMedicationsPage} />}</Route>
      <Route path="/pharmacy/prescriptions">{() => <ProtectedRoute component={PharmacyPrescriptionsPage} />}</Route>
      <Route path="/garage/dashboard">{() => <ProtectedRoute component={GarageDashboard} />}</Route>
      <Route path="/garage/vehicles">{() => <ProtectedRoute component={GarageVehiclesPage} />}</Route>
      <Route path="/garage/quotes">{() => <ProtectedRoute component={GarageQuotesPage} />}</Route>
      <Route path="/fitness/dashboard">{() => <ProtectedRoute component={FitnessDashboard} />}</Route>
      <Route path="/education/dashboard">{() => <ProtectedRoute component={EducationDashboard} />}</Route>

      {/* Partagées */}
      <Route path="/clients">{() => <ProtectedRoute component={ClientsPage} />}</Route>
      <Route path="/analytics">{() => <ProtectedRoute component={AnalyticsPage} />}</Route>
      <Route path="/notifications">{() => <ProtectedRoute component={NotificationsPage} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={SettingsPage} />}</Route>
      <Route path="/billing">{() => <ProtectedRoute component={BillingPage} />}</Route>
      <Route path="/audit">{() => <ProtectedRoute component={AuditPage} />}</Route>
      <Route path="/messages">{() => <ProtectedRoute component={MessagesPage} />}</Route>
      <Route path="/superadmin/messages">{() => <SuperAdminGuard component={SuperAdminMessagesPage} />}</Route>
      <Route path="/superadmin/analytics">{() => <SuperAdminGuard component={SuperAdminAnalyticsPage} />}</Route>
      <Route path="/superadmin/billing">{() => <SuperAdminGuard component={SuperAdminBillingPage} />}</Route>

      <Route path="/dashboard">{() => <ProtectedRoute component={NotFound} />}</Route>

      <Route path="/"><Redirect to="/login" /></Route>
      <Route component={() => <ProtectedRoute component={NotFound} />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <LanguageProvider>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </LanguageProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

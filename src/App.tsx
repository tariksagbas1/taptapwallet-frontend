import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Overview from "./pages/dashboard/Overview";
import Programs from "./pages/dashboard/Programs";
import ProgramEditor from "./pages/dashboard/ProgramEditor";
import ProgramDetail from "./pages/dashboard/ProgramDetail";
import Members from "./pages/dashboard/Members";
import MemberDetail from "./pages/dashboard/MemberDetail";
import Locations from "./pages/dashboard/Locations";
import Team from "./pages/dashboard/Team";
import SettingsPage from "./pages/dashboard/Settings";
import AuditLogs from "./pages/dashboard/AuditLogs";
import Insights from "./pages/dashboard/Insights";
import InsightsCustomers from "./pages/dashboard/InsightsCustomers";
import InsightsCustomerDetail from "./pages/dashboard/InsightsCustomerDetail";
import NotFound from "./pages/NotFound";
import PublicJoin from "./pages/PublicJoin";
import PublicPassView from "./pages/PublicPassView";
import InviteAccept from "./pages/InviteAccept";
import StaffLayout from "./pages/staff/StaffLayout";
import StaffScan from "./pages/staff/Scan";
import StaffSearch from "./pages/staff/Search";
import StaffCustomerCard from "./pages/staff/CustomerCard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminMerchants from "./pages/admin/Merchants";
import NewMerchant from "./pages/admin/NewMerchant";
import AdminInvites from "./pages/admin/Invites";
import SalesLayout from "./pages/sales/SalesLayout";
import Sales from "./pages/sales/Sales";
import StartOnboardingMerchant from "./pages/sales/StartOnboardingMerchant";
import QrPosterDesigner from "./pages/sales/QrPosterDesigner";
import Unsubscribe from "./pages/Unsubscribe";
import UserAgreement from "./pages/UserAgreement";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Support from "./pages/Support";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={routerBasename || undefined}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/join/:merchantSlug/:programSlug" element={<PublicJoin />} />
            <Route path="/pass/:passId" element={<PublicPassView />} />
            <Route path="/invite/accept" element={<InviteAccept />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
            <Route path="/dashboard/programs" element={<DashboardLayout><Programs /></DashboardLayout>} />
            <Route path="/dashboard/programs/new" element={<DashboardLayout><ProgramEditor /></DashboardLayout>} />
            <Route path="/dashboard/programs/:id" element={<DashboardLayout><ProgramDetail /></DashboardLayout>} />
            <Route path="/dashboard/programs/:id/edit" element={<DashboardLayout><ProgramEditor /></DashboardLayout>} />
            <Route path="/dashboard/members" element={<DashboardLayout><Members /></DashboardLayout>} />
            <Route path="/dashboard/members/:id" element={<DashboardLayout><MemberDetail /></DashboardLayout>} />
            <Route path="/dashboard/locations" element={<DashboardLayout><Locations /></DashboardLayout>} />
            <Route path="/dashboard/team" element={<DashboardLayout><Team /></DashboardLayout>} />
            <Route path="/dashboard/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
            <Route path="/dashboard/audit" element={<DashboardLayout><AuditLogs /></DashboardLayout>} />
            <Route path="/dashboard/insights" element={<DashboardLayout><Insights /></DashboardLayout>} />
            <Route path="/dashboard/insights/customers" element={<DashboardLayout><InsightsCustomers /></DashboardLayout>} />
            <Route path="/dashboard/insights/customers/:id" element={<DashboardLayout><InsightsCustomerDetail /></DashboardLayout>} />
            <Route path="/staff" element={<Navigate to="/staff/scan" replace />} />
            <Route path="/staff/scan" element={<StaffLayout><StaffScan /></StaffLayout>} />
            <Route path="/staff/search" element={<StaffLayout><StaffSearch /></StaffLayout>} />
            <Route path="/staff/customer/:passId" element={<StaffLayout><StaffCustomerCard /></StaffLayout>} />
            <Route path="/admin" element={<Navigate to="/admin/merchants" replace />} />
            <Route path="/admin/merchants" element={<AdminLayout><AdminMerchants /></AdminLayout>} />
            <Route path="/admin/merchants/new" element={<AdminLayout><NewMerchant /></AdminLayout>} />
            <Route path="/admin/invites" element={<AdminLayout><AdminInvites /></AdminLayout>} />
            <Route path="/sales" element={<SalesLayout><Sales /></SalesLayout>} />
            <Route path="/sales/onboarding/new" element={<SalesLayout><StartOnboardingMerchant /></SalesLayout>} />
            <Route path="/sales/poster" element={<SalesLayout><QrPosterDesigner /></SalesLayout>} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/user-agreement" element={<UserAgreement />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

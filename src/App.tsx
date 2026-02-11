import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DevModeProvider } from "@/contexts/DevModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthRoute from "@/components/AuthRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Today from "./pages/Today";
import PlanNew from "./pages/PlanNew";
import Plan from "./pages/Plan";
import PlanReset from "./pages/PlanReset";
import SharedReview from "./pages/SharedReview";
import AdvisorView from "./pages/AdvisorView";
import Review from "./pages/Review";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import RefundPolicy from "./pages/RefundPolicy";
import ServicePolicy from "./pages/ServicePolicy";
import Contact from "./pages/Contact";
import Ownership from "./pages/Ownership";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DevModeProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/auth" 
              element={
                <AuthRoute>
                  <Auth />
                </AuthRoute>
              } 
            />
            {/* Email Verification - for email/password signups */}
            <Route 
              path="/verify-email" 
              element={
                <ProtectedRoute requireEmailVerification={false}>
                  <VerifyEmail />
                </ProtectedRoute>
              } 
            />
            {/* Onboarding - only accessible if no profile exists and email is verified */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute redirectIfProfile="/home" requireEmailVerification>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            {/* Home - stable entry point for users with profile */}
            <Route 
              path="/home" 
              element={
                <ProtectedRoute requireProfile>
                  <Home />
                </ProtectedRoute>
              } 
            />
            {/* Today View - primary daily execution view */}
            <Route 
              path="/today" 
              element={
                <ProtectedRoute requireProfile>
                  <Today />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plan/new" 
              element={
                <ProtectedRoute requireProfile>
                  <PlanNew />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plan" 
              element={
                <ProtectedRoute requireProfile>
                  <Plan />
                </ProtectedRoute>
              } 
            />
            {/* Plan Reset - for users with profile but no active plan */}
            <Route 
              path="/plan/reset" 
              element={
                <ProtectedRoute requireProfile>
                  <PlanReset />
                </ProtectedRoute>
              } 
            />
            {/* Plan Review - dedicated insights page */}
            <Route 
              path="/review" 
              element={
                <ProtectedRoute requireProfile>
                  <Review />
                </ProtectedRoute>
              } 
            />
            {/* Pricing page - public */}
            <Route path="/pricing" element={<Pricing />} />
            {/* Legal & Trust Pages - public */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/service-policy" element={<ServicePolicy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/ownership" element={<Ownership />} />
            {/* Public shared review - no auth required */}
            <Route path="/shared-review/:token" element={<SharedReview />} />
            {/* Professional advisor view - no auth required, enhanced content */}
            <Route path="/advisor/:shareId" element={<AdvisorView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </DevModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

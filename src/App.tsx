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
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Today from "./pages/Today";
import PlanNew from "./pages/PlanNew";
import Plan from "./pages/Plan";
import PlanReset from "./pages/PlanReset";
import SharedReview from "./pages/SharedReview";
import Review from "./pages/Review";
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
            {/* Onboarding - only accessible if no profile exists */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute redirectIfProfile="/home">
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
            {/* Public shared review - no auth required */}
            <Route path="/shared-review/:token" element={<SharedReview />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </DevModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

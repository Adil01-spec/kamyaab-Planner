import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { DevModeProvider } from "@/contexts/DevModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthRoute from "@/components/AuthRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Today from "./pages/Today";
import PlanNew from "./pages/PlanNew";
import Plan from "./pages/Plan";
import PlanReset from "./pages/PlanReset";
import SharedReview from "./pages/SharedReview";
import AdvisorView from "./pages/AdvisorView";
import Review from "./pages/Review";
import InviteAccept from "./pages/InviteAccept";
import SoftCollabReview from "./pages/SoftCollabReview";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import RefundPolicy from "./pages/RefundPolicy";
import ServicePolicy from "./pages/ServicePolicy";
import Contact from "./pages/Contact";
import Ownership from "./pages/Ownership";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import CalendarPage from "./pages/Calendar";
import AdminPayments from "./pages/AdminPayments";
import AdminDashboard from "./pages/AdminDashboard";
import Learn from "./pages/Learn";
import ArticlePage from "./pages/ArticlePage";
import AdminCreateArticle from "./pages/AdminCreateArticle";
import AdminArticles from "./pages/AdminArticles";
import StayConsistent from "./pages/articles/StayConsistent";
import ExecuteWithoutBurnout from "./pages/articles/ExecuteWithoutBurnout";
import WhyPeopleFail from "./pages/articles/WhyPeopleFail";
import Templates from "./pages/Templates";
import TemplatePage from "./pages/TemplatePage";
import NotFound from "./pages/NotFound";
import { useReminderCheck } from "@/hooks/useReminderCheck";
import { AdsenseLoader } from "@/components/AdsenseLoader";

import { Outlet } from "react-router-dom";
import type { RouteRecord } from "vite-react-ssg";
import { ThemeProvider } from "./components/ThemeProvider";

const queryClient = new QueryClient();

function ReminderChecker() {
  useReminderCheck();
  return null;
}

function Layout() {
  return (
    <ThemeProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DevModeProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner position="top-center" />
                <AdsenseLoader />
                <ReminderChecker />
                <Outlet />
              </TooltipProvider>
            </DevModeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ThemeProvider>
  );
}

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Index /> },
      { 
        path: "/auth", 
        element: (
          <AuthRoute>
            <Auth />
          </AuthRoute>
        ) 
      },
      { path: "/reset-password", element: <ResetPassword /> },
      { 
        path: "/verify-email", 
        element: (
          <ProtectedRoute requireEmailVerification={false}>
            <VerifyEmail />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/onboarding", 
        element: (
          <ProtectedRoute redirectIfProfile="/home" requireEmailVerification>
            <Onboarding />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/home", 
        element: (
          <ProtectedRoute requireProfile>
            <Home />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/today", 
        element: (
          <ProtectedRoute requireProfile>
            <Today />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/plan/new", 
        element: (
          <ProtectedRoute requireProfile>
            <PlanNew />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/plan", 
        element: (
          <ProtectedRoute requireProfile>
            <Plan />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/plan/reset", 
        element: (
          <ProtectedRoute requireProfile>
            <PlanReset />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/review", 
        element: (
          <ProtectedRoute requireProfile>
            <Review />
          </ProtectedRoute>
        ) 
      },
      { path: "/pricing", element: <Pricing /> },
      { path: "/learn", element: <Learn /> },
      { path: "/learn/stay-consistent-with-goals", element: <StayConsistent /> },
      { path: "/learn/execute-plans-without-burnout", element: <ExecuteWithoutBurnout /> },
      { path: "/learn/why-people-fail-at-execution", element: <WhyPeopleFail /> },
      { 
        path: "/learn/:slug", 
        element: <ArticlePage />,
        getStaticPaths: async () => {
          try {
            // Import dynamically so it's not trying to execute during client load if not needed
            // But getStaticPaths only runs in node anyway.
            const { supabase } = await import('@/integrations/supabase/client');
            const { data } = await supabase
              .from('articles')
              .select('slug')
              .eq('status', 'published');
            return data ? data.filter(a => a.slug).map(a => `/learn/${a.slug}`) : [];
          } catch (error) {
            console.error("Failed to fetch article paths for SSG:", error);
            return [];
          }
        }
      },
      { path: "/admin/create-article", element: <ProtectedRoute requireProfile><AdminCreateArticle /></ProtectedRoute> },
      { path: "/admin/articles", element: <ProtectedRoute requireProfile><AdminArticles /></ProtectedRoute> },
      { path: "/terms", element: <Terms /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/refund-policy", element: <RefundPolicy /> },
      { path: "/service-policy", element: <ServicePolicy /> },
      { path: "/contact", element: <Contact /> },
      { path: "/ownership", element: <Ownership /> },
      { path: "/help", element: <Help /> },
      { 
        path: "/profile", 
        element: (
          <ProtectedRoute requireProfile>
            <Profile />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/calendar", 
        element: (
          <ProtectedRoute requireProfile>
            <CalendarPage />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/ctrl-9x7k/payments", 
        element: (
          <ProtectedRoute requireProfile>
            <AdminPayments />
          </ProtectedRoute>
        ) 
      },
      { 
        path: "/ctrl-9x7k", 
        element: (
          <ProtectedRoute requireProfile>
            <AdminDashboard />
          </ProtectedRoute>
        ) 
      },
      { path: "/shared-review/:token", element: <SharedReview /> },
      { path: "/advisor/:shareId", element: <AdvisorView /> },
      { path: "/invite/:token", element: <InviteAccept /> },
      { path: "/plan/:planId/review", element: <SoftCollabReview /> },
      { path: "/templates", element: <Templates /> },
      { path: "/templates/:slug", element: <TemplatePage /> },
      { path: "*", element: <NotFound /> }
    ]
  }
];

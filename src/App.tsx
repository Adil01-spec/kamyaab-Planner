import { lazy, Suspense } from "react";
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
const Index = lazy(() => import('./pages/Index'));
const Auth = lazy(() => import('./pages/Auth'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Home = lazy(() => import('./pages/Home'));
const Today = lazy(() => import('./pages/Today'));
const PlanNew = lazy(() => import('./pages/PlanNew'));
const Plan = lazy(() => import('./pages/Plan'));
const PlanReset = lazy(() => import('./pages/PlanReset'));
const SharedReview = lazy(() => import('./pages/SharedReview'));
const AdvisorView = lazy(() => import('./pages/AdvisorView'));
const Review = lazy(() => import('./pages/Review'));
const InviteAccept = lazy(() => import('./pages/InviteAccept'));
const SoftCollabReview = lazy(() => import('./pages/SoftCollabReview'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const ServicePolicy = lazy(() => import('./pages/ServicePolicy'));
const Contact = lazy(() => import('./pages/Contact'));
const Ownership = lazy(() => import('./pages/Ownership'));
const Help = lazy(() => import('./pages/Help'));
const Profile = lazy(() => import('./pages/Profile'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Learn = lazy(() => import('./pages/Learn'));
import { prefetchLearnArticles } from './pages/Learn';
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
import { prefetchArticle } from './pages/ArticlePage';
const AdminCreateArticle = lazy(() => import('./pages/AdminCreateArticle'));
const AdminArticles = lazy(() => import('./pages/AdminArticles'));
const StayConsistent = lazy(() => import('./pages/articles/StayConsistent'));
const ExecuteWithoutBurnout = lazy(() => import('./pages/articles/ExecuteWithoutBurnout'));
const WhyPeopleFail = lazy(() => import('./pages/articles/WhyPeopleFail'));
const Templates = lazy(() => import('./pages/Templates'));
const TemplatePage = lazy(() => import('./pages/TemplatePage'));
const NotFound = lazy(() => import('./pages/NotFound'));
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
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}><Outlet /></Suspense>
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
      { 
        path: "/learn", 
        element: <Learn />,
        loader: async () => {
          // Populate module-level SSR cache so Learn renders with data during SSG
          await prefetchLearnArticles();
          return null;
        },
      },
      { path: "/learn/stay-consistent-with-goals", element: <StayConsistent /> },
      { path: "/learn/execute-plans-without-burnout", element: <ExecuteWithoutBurnout /> },
      { path: "/learn/why-people-fail-at-execution", element: <WhyPeopleFail /> },
      { 
        path: "/learn/:slug", 
        element: <ArticlePage />,
        loader: async ({ params }) => {
          if (params.slug) {
            await prefetchArticle(params.slug);
          }
          return null;
        },
        getStaticPaths: async () => {
          // Always include the /learn hub itself
          const basePaths = ['/learn'];
          try {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data } = await supabase
              .from('articles')
              .select('slug')
              .eq('status', 'published');
            const slugPaths = data
              ? data.filter(a => a.slug).map(a => `/learn/${a.slug}`)
              : [];
            return [...basePaths, ...slugPaths];
          } catch (error) {
            console.error('Failed to fetch article paths for SSG:', error);
            return basePaths;
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



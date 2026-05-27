import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { PersonProvider } from "@/contexts/person-context";
import { AuthWrapper } from "@/components/auth-wrapper";
import { BottomNav } from "@/components/bottom-nav";
import { restoreSession } from "@/lib/supabase";

// Restore JWT from localStorage on app load (synchronous, runs before first render)
restoreSession();
import { PushPrompt } from "@/components/push-prompt";
import { NameSetup } from "@/components/name-setup";
import { InstallGuide } from "@/components/install-guide";

// Lazy-load all pages — each becomes its own JS chunk, cutting initial bundle by ~160 KiB
const PinPage      = lazy(() => import("@/pages/pin"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const FeedingPage  = lazy(() => import("@/pages/feeding"));
const SleepPage    = lazy(() => import("@/pages/sleep"));
const DiaperPage   = lazy(() => import("@/pages/diaper"));
const BathPage     = lazy(() => import("@/pages/bath"));
const HistoryPage  = lazy(() => import("@/pages/history"));
const SchedulePage = lazy(() => import("@/pages/schedule"));
const GuidePage    = lazy(() => import("@/pages/guide"));
const NotFound     = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NameSetup />
      <InstallGuide />
      {children}
      <PushPrompt />
      <BottomNav />
    </>
  );
}

function Router() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location !== "/pin") setLocation("/");
  }, []);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground text-sm text-muted-foreground">טוען...</div>}>
      <Switch>
        <Route path="/pin" component={PinPage} />
        <Route path="/">
          <AuthWrapper><MainLayout><DashboardPage /></MainLayout></AuthWrapper>
        </Route>
        <Route path="/history">
          <AuthWrapper><MainLayout><HistoryPage /></MainLayout></AuthWrapper>
        </Route>
        <Route path="/feeding">
          <AuthWrapper><MainLayout><FeedingPage /></MainLayout></AuthWrapper>
        </Route>
        <Route path="/sleep">
          <AuthWrapper><MainLayout><SleepPage /></MainLayout></AuthWrapper>
        </Route>
        <Route path="/diaper">
          <AuthWrapper><MainLayout><DiaperPage /></MainLayout></AuthWrapper>
        </Route>
        <Route path="/bath">
          <AuthWrapper><MainLayout><BathPage /></MainLayout></AuthWrapper>
        </Route>
        <Route path="/schedule">
          <AuthWrapper><MainLayout><SchedulePage /></MainLayout></AuthWrapper>
        </Route>
        <Route path="/guide">
          <AuthWrapper><MainLayout><GuidePage /></MainLayout></AuthWrapper>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="auto" storageKey="newborn-tracker-theme">
      <LanguageProvider>
      <PersonProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </PersonProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

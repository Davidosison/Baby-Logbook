import { useEffect } from "react";
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

import PinPage from "@/pages/pin";
import DashboardPage from "@/pages/dashboard";
import FeedingPage from "@/pages/feeding";
import SleepPage from "@/pages/sleep";
import DiaperPage from "@/pages/diaper";
import BathPage from "@/pages/bath";
import HistoryPage from "@/pages/history";
import SchedulePage from "@/pages/schedule";
import NotFound from "@/pages/not-found";

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
      <Route component={NotFound} />
    </Switch>
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

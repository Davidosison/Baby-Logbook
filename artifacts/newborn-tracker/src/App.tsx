import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { AuthWrapper } from "@/components/auth-wrapper";
import { BottomNav } from "@/components/bottom-nav";
import { PushPrompt } from "@/components/push-prompt";

import PinPage from "@/pages/pin";
import DashboardPage from "@/pages/dashboard";
import FeedingPage from "@/pages/feeding";
import SleepPage from "@/pages/sleep";
import DiaperPage from "@/pages/diaper";
import HistoryPage from "@/pages/history";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PushPrompt />
      <BottomNav />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/pin" component={PinPage} />
      <Route path="/">
        <AuthWrapper>
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        </AuthWrapper>
      </Route>
      <Route path="/history">
        <AuthWrapper>
          <MainLayout>
            <HistoryPage />
          </MainLayout>
        </AuthWrapper>
      </Route>
      <Route path="/feeding">
        <AuthWrapper>
          <FeedingPage />
        </AuthWrapper>
      </Route>
      <Route path="/sleep">
        <AuthWrapper>
          <SleepPage />
        </AuthWrapper>
      </Route>
      <Route path="/diaper">
        <AuthWrapper>
          <DiaperPage />
        </AuthWrapper>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="newborn-tracker-theme">
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

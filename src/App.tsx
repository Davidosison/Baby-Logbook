import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { PersonProvider } from "@/contexts/person-context";
import { AuthWrapper } from "@/components/auth-wrapper";
import { BottomNav } from "@/components/bottom-nav";
import { restoreSession } from "@/lib/supabase";
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
import GuidePage from "@/pages/guide";
import NotFound from "@/pages/not-found";

// Restore JWT from localStorage on app load (synchronous, runs before first render)
restoreSession();

/** Three softly-animated colour blobs that sit behind every page */
function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Top-right: blue/primary */}
      <div
        className="absolute rounded-full opacity-[0.18] dark:opacity-[0.32] blur-[90px]"
        style={{
          width: 400, height: 400,
          background: "radial-gradient(circle, hsl(224 38% 62%), transparent 70%)",
          top: -130, right: -70,
          animation: "orb-float 22s ease-in-out infinite",
        }}
      />
      {/* Left-middle: purple */}
      <div
        className="absolute rounded-full opacity-[0.13] dark:opacity-[0.26] blur-[80px]"
        style={{
          width: 300, height: 300,
          background: "radial-gradient(circle, hsl(278 45% 65%), transparent 70%)",
          top: "42%", left: -90,
          animation: "orb-float 28s ease-in-out infinite reverse",
          animationDelay: "-9s",
        }}
      />
      {/* Bottom-centre: sky */}
      <div
        className="absolute rounded-full opacity-[0.10] dark:opacity-[0.22] blur-[70px]"
        style={{
          width: 260, height: 260,
          background: "radial-gradient(circle, hsl(192 60% 55%), transparent 70%)",
          bottom: -60, right: "22%",
          animation: "orb-float 24s ease-in-out infinite",
          animationDelay: "-14s",
        }}
      />
    </div>
  );
}

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
  return (
    <>
      <GradientBackground />
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
    </>
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

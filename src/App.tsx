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
import { initGlassMode, useGlassMode } from "@/hooks/use-glass-mode";
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

// Restore JWT and glass mode from localStorage before first render (synchronous)
restoreSession();
initGlassMode();

/** Vivid animated colour blobs — the "wallpaper" that glass panels blur */
function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Top-right: vivid blue */}
      <div
        className="absolute rounded-full opacity-[0.35] dark:opacity-[0.60] blur-[80px]"
        style={{
          width: 480, height: 480,
          background: "radial-gradient(circle, hsl(224 80% 65%), hsl(240 70% 50%), transparent 68%)",
          top: -160, right: -100,
          animation: "orb-float 22s ease-in-out infinite",
        }}
      />
      {/* Left-middle: vivid purple/magenta */}
      <div
        className="absolute rounded-full opacity-[0.28] dark:opacity-[0.50] blur-[70px]"
        style={{
          width: 380, height: 380,
          background: "radial-gradient(circle, hsl(290 80% 68%), hsl(315 70% 60%), transparent 68%)",
          top: "38%", left: -100,
          animation: "orb-float 28s ease-in-out infinite reverse",
          animationDelay: "-9s",
        }}
      />
      {/* Bottom-centre: cyan/teal */}
      <div
        className="absolute rounded-full opacity-[0.22] dark:opacity-[0.42] blur-[75px]"
        style={{
          width: 340, height: 340,
          background: "radial-gradient(circle, hsl(180 90% 55%), hsl(200 80% 55%), transparent 68%)",
          bottom: -80, right: "18%",
          animation: "orb-float 24s ease-in-out infinite",
          animationDelay: "-14s",
        }}
      />
      {/* Extra: warm amber — lower right */}
      <div
        className="absolute rounded-full opacity-[0.18] dark:opacity-[0.32] blur-[90px]"
        style={{
          width: 280, height: 280,
          background: "radial-gradient(circle, hsl(35 100% 65%), transparent 68%)",
          bottom: "25%", right: -60,
          animation: "orb-float 32s ease-in-out infinite reverse",
          animationDelay: "-5s",
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
  const { glassMode } = useGlassMode();
  return (
    <>
      {glassMode && <GradientBackground />}
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

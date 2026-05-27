import { isAuthenticated } from "@/lib/queries";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  // Synchronous check — reads the in-memory JWT, no async round-trip.
  // This prevents the stale-cache flash that caused the PIN page to show twice.
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!authenticated && location !== "/pin") {
      setLocation("/pin");
    }
  }, [authenticated, location, setLocation]);

  if (!authenticated) return null;

  return <>{children}</>;
}
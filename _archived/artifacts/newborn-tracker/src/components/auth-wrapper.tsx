import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: authStatus, isLoading } = useGetAuthStatus({
    query: {
      queryKey: getGetAuthStatusQueryKey()
    }
  });

  useEffect(() => {
    if (!isLoading && authStatus && !authStatus.authenticated && location !== "/pin") {
      setLocation("/pin");
    }
  }, [authStatus, isLoading, location, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  // If not authenticated and we are not on /pin, we shouldn't render children yet.
  if (!authStatus?.authenticated && location !== "/pin") {
    return null; 
  }

  return <>{children}</>;
}
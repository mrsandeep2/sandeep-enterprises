import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppRole = "admin" | "user";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = "/auth",
}: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin, hasRole } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check for required role
  if (requiredRole) {
    const hasRequiredRole = requiredRole === "admin" ? isAdmin : hasRole(requiredRole);

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6 px-4">
            <div className="flex justify-center">
              <div className="p-4 bg-destructive/10 rounded-full">
                <ShieldX className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground max-w-sm">
                You don't have permission to access this page.
                {requiredRole === "admin" && " Admin privileges are required."}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button onClick={() => (window.location.href = "/")}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required role (if any)
  return <>{children}</>;
};

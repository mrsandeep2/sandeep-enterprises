import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SEO 
        title="Page Not Found - Sandeep Enterprises"
        description="The page you're looking for doesn't exist. Return to Sandeep Enterprises homepage."
        keywords="404, page not found, sandeep enterprises"
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/80">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

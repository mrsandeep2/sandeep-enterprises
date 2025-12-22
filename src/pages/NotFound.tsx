import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Store, Home, ShoppingBag, Search, ArrowLeft, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4">
      <SEO 
        title="Page Not Found - Sandeep Enterprises"
        description="The page you're looking for doesn't exist. Return to Sandeep Enterprises homepage."
        keywords="404, page not found, sandeep enterprises"
      />
      
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg mx-auto animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent shadow-xl">
              <Store className="w-12 h-12 text-primary-foreground" />
            </div>
            <Wheat className="absolute -top-1 -right-3 w-6 h-6 text-primary/60 rotate-45" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
          Page Not Found
        </h2>
        
        <p className="text-muted-foreground mb-8 text-base md:text-lg">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Quick Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/cart">
              <ShoppingBag className="w-4 h-4" />
              View Cart
            </Link>
          </Button>
        </div>

        {/* Helpful links */}
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
          <p className="text-sm text-muted-foreground mb-4">You might be looking for:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Browse Products
            </Link>
            <Link 
              to="/compare" 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/10 text-accent-foreground text-sm font-medium hover:bg-accent/20 transition-colors"
            >
              Compare Products
            </Link>
            <Link 
              to="/auth" 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Login / Sign Up
            </Link>
          </div>
        </div>

        {/* Back button */}
        <button 
          onClick={() => window.history.back()} 
          className="inline-flex items-center gap-2 mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
};

export default NotFound;

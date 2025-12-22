import { useState, useEffect } from "react";
import { Store, Wheat } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-300" />
      </div>

      {/* Logo container */}
      <div className="relative flex flex-col items-center gap-6 animate-fade-in">
        {/* Store icon with animated ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-20 blur-xl animate-pulse" />
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl">
            <Store className="w-14 h-14 text-primary-foreground" />
          </div>
          {/* Decorative wheat icons */}
          <Wheat className="absolute -top-2 -right-4 w-8 h-8 text-primary/60 rotate-45 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <Wheat className="absolute -bottom-2 -left-4 w-8 h-8 text-accent/60 -rotate-45 animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
            Sandeep Enterprises
          </h1>
          <p className="mt-2 text-muted-foreground text-sm md:text-base">
            Premium Quality Rice, Atta & Kapila Feed
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-1.5 mt-4">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

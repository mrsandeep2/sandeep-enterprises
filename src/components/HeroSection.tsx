import { ArrowDown, Leaf, Truck, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onScrollToProducts: () => void;
}

export const HeroSection = ({ onScrollToProducts }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden py-12 sm:py-20 lg:py-28">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-secondary/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main Hero Content */}
        <div className="text-center max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm font-medium text-primary animate-fade-in">
            <Leaf className="h-4 w-4" />
            <span>Premium Quality Since Generations</span>
            <Star className="h-4 w-4 fill-accent text-accent" />
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text">Sandeep</span>
            <br />
            <span className="text-foreground">Enterprises</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Your trusted partner for premium quality <span className="text-primary font-semibold">Chawal</span>, 
            <span className="text-primary font-semibold"> Atta</span>, 
            <span className="text-primary font-semibold"> Kapila Feed</span> and more
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              onClick={onScrollToProducts}
              className="rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
            >
              Shop Now
              <ArrowDown className="ml-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
            </Button>
            <a 
              href="tel:+919431411224"
              className="glass-card glass-card-hover px-8 py-3 rounded-full font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Call: +91 94314 11224
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-4xl mx-auto">
          <div className="glass-card glass-card-hover rounded-2xl p-6 text-center group animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">100% Quality</h3>
            <p className="text-sm text-muted-foreground">Premium grade products with quality assurance</p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6 text-center group animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="h-7 w-7 text-accent" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Fast Delivery</h3>
            <p className="text-sm text-muted-foreground">Quick and reliable delivery to your doorstep</p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6 text-center group animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Leaf className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Fresh Products</h3>
            <p className="text-sm text-muted-foreground">Farm fresh products sourced directly</p>
          </div>
        </div>
      </div>
    </section>
  );
};

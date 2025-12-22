import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Footer from "./components/Footer";
import SplashScreen from "./components/SplashScreen";
import { Skeleton } from "./components/ui/skeleton";
import { NotificationProvider } from "./contexts/NotificationContext";
// Lazy load pages for better code splitting
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Cart = lazy(() => import("./pages/Cart"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const Profile = lazy(() => import("./pages/Profile"));
const ProductComparison = lazy(() => import("./pages/ProductComparison"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load AI Chatbot (non-critical)
const AIChatbot = lazy(() => import("./components/AIChatbot").then(m => ({ default: m.AIChatbot })));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  useEffect(() => {
    // Check if user has already seen splash screen in this session
    const seen = sessionStorage.getItem("splashSeen");
    if (seen) {
      setShowSplash(false);
      setHasSeenSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasSeenSplash(true);
    sessionStorage.setItem("splashSeen", "true");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationProvider>
          <Toaster />
          <Sonner />
          {showSplash && !hasSeenSplash && (
            <SplashScreen onComplete={handleSplashComplete} />
          )}
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/compare" element={<ProductComparison />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation" element={<OrderConfirmation />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Footer />
              <Suspense fallback={null}>
                <AIChatbot />
              </Suspense>
              <SpeedInsights />
            </div>
          </BrowserRouter>
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

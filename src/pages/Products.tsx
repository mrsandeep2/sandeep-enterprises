import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { SEO } from "@/components/SEO";
import { AISearch } from "@/components/AISearch";
import { ProductFilters } from "@/components/ProductFilters";
import { Loader2, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number | null;
  category: string | null;
}

const CHAWAL_VARIETIES = [
  "Parmal Polished Rice",
  "Sona Mansoori Rice",
  "Katarani Rice",
  "Basmati Rice",
  "Biryani Chawal",
];

const KAPILA_VARIETIES = [
  "Kapila Dairy Special (By Pass)",
  "Kapila Super Pellet",
  "Kapila Balanced Feed",
];

const ATTA_VARIETIES = [
  "Atta 5kg",
  "Atta 10kg",
  "Atta 15kg",
  "Atta 25kg",
];

const CHOKAR_VARIETIES = [
  "Chokar 48kg",
  "Chokar 44kg",
  "Chokar 35kg",
];

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedChawalVariety, setSelectedChawalVariety] = useState<string | null>(null);
  const [selectedKapilaVariety, setSelectedKapilaVariety] = useState<string | null>(null);
  const [selectedAttaVariety, setSelectedAttaVariety] = useState<string | null>(null);
  const [selectedChokarVariety, setSelectedChokarVariety] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  
  const [aiSearchResults, setAiSearchResults] = useState<Product[] | null>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!roleData);
      }
    };
    checkAdminStatus();
  }, []);

  // Calculate max price from products
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    return Math.ceil(Math.max(...products.map(p => p.price)) / 100) * 100;
  }, [products]);

  // Initialize price range when products load
  useEffect(() => {
    if (products.length > 0 && priceRange[1] === 10000) {
      setPriceRange([0, maxPrice]);
    }
  }, [products, maxPrice]);

  useEffect(() => {
    fetchProducts();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [payload.new as Product, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts(prev => prev.map(p => 
              p.id === (payload.new as Product).id ? payload.new as Product : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];
  
  // Check if any filters are active
  const hasActiveFilters = selectedCategory !== "All" || priceRange[0] > 0 || priceRange[1] < maxPrice;
  
  // Use AI search results if available, otherwise use regular filtering
  const filteredProducts = useMemo(() => {
    if (aiSearchResults !== null) {
      // Apply price filter to AI results too
      return aiSearchResults.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    }
    
    let filtered = products;
    
    // Apply price filter
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    // Then apply category filter
    if (selectedCategory === "All") return filtered;
    if (selectedCategory === "Chawal" && selectedChawalVariety) {
      return filtered.filter((p) => p.name === selectedChawalVariety);
    }
    if (selectedCategory === "Kapila" && selectedKapilaVariety) {
      return filtered.filter((p) => p.name === selectedKapilaVariety);
    }
    if (selectedCategory === "Atta" && selectedAttaVariety) {
      return filtered.filter((p) => p.name === selectedAttaVariety);
    }
    if (selectedCategory === "Chokar" && selectedChokarVariety) {
      return filtered.filter((p) => p.name === selectedChokarVariety);
    }
    return filtered.filter((p) => p.category === selectedCategory);
  }, [products, aiSearchResults, selectedCategory, selectedChawalVariety, selectedKapilaVariety, selectedAttaVariety, selectedChokarVariety, priceRange]);

  const handleAISearchResults = (results: Product[] | null) => {
    setAiSearchResults(results);
    setSelectedCategory("All");
  };

  const handleClearAISearch = () => {
    setAiSearchResults(null);
  };

  const handleCategoryClick = (category: string) => {
    if (category !== "Chawal") setSelectedChawalVariety(null);
    if (category !== "Kapila") setSelectedKapilaVariety(null);
    if (category !== "Atta") setSelectedAttaVariety(null);
    if (category !== "Chokar") setSelectedChokarVariety(null);
    setSelectedCategory(category);
  };

  const handleChawalVarietyClick = (variety: string) => {
    setSelectedCategory("Chawal");
    setSelectedChawalVariety(variety);
  };

  const handleKapilaVarietyClick = (variety: string) => {
    setSelectedCategory("Kapila");
    setSelectedKapilaVariety(variety);
  };

  const handleAttaVarietyClick = (variety: string) => {
    setSelectedCategory("Atta");
    setSelectedAttaVariety(variety);
  };

  const handleChokarVarietyClick = (variety: string) => {
    setSelectedCategory("Chokar");
    setSelectedChokarVariety(variety);
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedChawalVariety(null);
    setSelectedKapilaVariety(null);
    setSelectedAttaVariety(null);
    setSelectedChokarVariety(null);
    setPriceRange([0, maxPrice]);
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title="Sandeep Enterprises - Premium Rice, Atta, Kapila Feed | Wholesale Prices"
        description="Buy premium quality Basmati Rice, Sona Masoori, Parmal Rice, Wheat Atta, Kapila Cattle Feed at wholesale prices. Trusted supplier with fast delivery. Call +91 94314 11224"
        keywords="basmati rice, sona masoori rice, parmal rice, wheat atta, kapila feed, cattle feed, rice wholesale, sandeep enterprises"
      />
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection onScrollToProducts={scrollToProducts} />
      
      {/* Products Section */}
      <main ref={productsRef} className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="text-center mb-6 sm:mb-10 space-y-2 sm:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Our Products
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Browse our wide range of premium quality products
          </p>
        </div>

        {/* AI Search */}
        <AISearch onResults={handleAISearchResults} onClear={handleClearAISearch} />

        {/* Show filters and results info only after search */}
        {aiSearchResults !== null && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{filteredProducts.length}</span> products
              </span>
              
              {/* Product Filters - Dropdown style */}
              <ProductFilters
                categories={categories as string[]}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryClick}
                priceRange={priceRange}
                maxPrice={maxPrice}
                onPriceRangeChange={handlePriceRangeChange}
                onReset={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center glass-card rounded-2xl p-8 sm:p-12">
            <p className="text-lg sm:text-xl text-muted-foreground">
              No products found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} hideCartActions={isAdmin} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;

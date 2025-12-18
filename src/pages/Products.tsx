import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { SEO } from "@/components/SEO";
import { Loader2, ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedChawalVariety, setSelectedChawalVariety] = useState<string | null>(null);
  const [selectedKapilaVariety, setSelectedKapilaVariety] = useState<string | null>(null);
  const [selectedAttaVariety, setSelectedAttaVariety] = useState<string | null>(null);
  const [selectedChokarVariety, setSelectedChokarVariety] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
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
  
  const filteredProducts = (() => {
    let filtered = products;
    
    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }
    
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
  })();

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

  const clearSearch = () => {
    setSearchQuery("");
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

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 glass-input rounded-full h-10 sm:h-11"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6 sm:mb-10 px-1">
          {categories.map((category) => {
            if (category === "Chawal") {
              return (
                <DropdownMenu key={category}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${
                        selectedCategory === "Chawal"
                          ? "glass-card text-primary font-semibold scale-105"
                          : "glass-card text-muted-foreground hover:text-primary hover:scale-105"
                      }`}
                    >
                      Chawal
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border border-border shadow-lg z-50">
                    <DropdownMenuItem
                      onClick={() => { setSelectedCategory("Chawal"); setSelectedChawalVariety(null); }}
                      className="cursor-pointer hover:bg-muted"
                    >
                      All Chawal
                    </DropdownMenuItem>
                    {CHAWAL_VARIETIES.map((variety) => (
                      <DropdownMenuItem
                        key={variety}
                        onClick={() => handleChawalVarietyClick(variety)}
                        className={`cursor-pointer hover:bg-muted ${selectedChawalVariety === variety ? "bg-muted text-primary font-semibold" : ""}`}
                      >
                        {variety}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            if (category === "Kapila") {
              return (
                <DropdownMenu key={category}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${
                        selectedCategory === "Kapila"
                          ? "glass-card text-primary font-semibold scale-105"
                          : "glass-card text-muted-foreground hover:text-primary hover:scale-105"
                      }`}
                    >
                      Kapila
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border border-border shadow-lg z-50">
                    <DropdownMenuItem
                      onClick={() => { setSelectedCategory("Kapila"); setSelectedKapilaVariety(null); }}
                      className="cursor-pointer hover:bg-muted"
                    >
                      All Kapila
                    </DropdownMenuItem>
                    {KAPILA_VARIETIES.map((variety) => (
                      <DropdownMenuItem
                        key={variety}
                        onClick={() => handleKapilaVarietyClick(variety)}
                        className={`cursor-pointer hover:bg-muted ${selectedKapilaVariety === variety ? "bg-muted text-primary font-semibold" : ""}`}
                      >
                        {variety}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            if (category === "Atta") {
              return (
                <DropdownMenu key={category}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${
                        selectedCategory === "Atta"
                          ? "glass-card text-primary font-semibold scale-105"
                          : "glass-card text-muted-foreground hover:text-primary hover:scale-105"
                      }`}
                    >
                      Atta
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border border-border shadow-lg z-50">
                    <DropdownMenuItem
                      onClick={() => { setSelectedCategory("Atta"); setSelectedAttaVariety(null); }}
                      className="cursor-pointer hover:bg-muted"
                    >
                      All Atta
                    </DropdownMenuItem>
                    {ATTA_VARIETIES.map((variety) => (
                      <DropdownMenuItem
                        key={variety}
                        onClick={() => handleAttaVarietyClick(variety)}
                        className={`cursor-pointer hover:bg-muted ${selectedAttaVariety === variety ? "bg-muted text-primary font-semibold" : ""}`}
                      >
                        {variety}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            if (category === "Chokar") {
              return (
                <DropdownMenu key={category}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-6 py-2 rounded-full transition-all flex items-center gap-2 ${
                        selectedCategory === "Chokar"
                          ? "glass-card text-primary font-semibold scale-105"
                          : "glass-card text-muted-foreground hover:text-primary hover:scale-105"
                      }`}
                    >
                      Chokar
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border border-border shadow-lg z-50">
                    <DropdownMenuItem
                      onClick={() => { setSelectedCategory("Chokar"); setSelectedChokarVariety(null); }}
                      className="cursor-pointer hover:bg-muted"
                    >
                      All Chokar
                    </DropdownMenuItem>
                    {CHOKAR_VARIETIES.map((variety) => (
                      <DropdownMenuItem
                        key={variety}
                        onClick={() => handleChokarVarietyClick(variety)}
                        className={`cursor-pointer hover:bg-muted ${selectedChokarVariety === variety ? "bg-muted text-primary font-semibold" : ""}`}
                      >
                        {variety}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            return (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-6 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? "glass-card text-primary font-semibold scale-105"
                    : "glass-card text-muted-foreground hover:text-primary hover:scale-105"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center glass-card rounded-2xl p-8 sm:p-12">
            <p className="text-lg sm:text-xl text-muted-foreground">
              {searchQuery ? `No products found for "${searchQuery}"` : "No products found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;

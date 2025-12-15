import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
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

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedChawalVariety, setSelectedChawalVariety] = useState<string | null>(null);
  const [selectedKapilaVariety, setSelectedKapilaVariety] = useState<string | null>(null);

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
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];
  
  const filteredProducts = (() => {
    if (selectedCategory === "All") return products;
    if (selectedCategory === "Chawal" && selectedChawalVariety) {
      return products.filter((p) => p.name === selectedChawalVariety);
    }
    if (selectedCategory === "Kapila" && selectedKapilaVariety) {
      return products.filter((p) => p.name === selectedKapilaVariety);
    }
    return products.filter((p) => p.category === selectedCategory);
  })();

  const handleCategoryClick = (category: string) => {
    if (category !== "Chawal") {
      setSelectedChawalVariety(null);
    }
    if (category !== "Kapila") {
      setSelectedKapilaVariety(null);
    }
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

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-float">
            Sandeep Enterprises
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Quality Chawal, Atta, Kapila and more for your daily needs
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            category === "Chawal" ? (
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
                <DropdownMenuContent className="bg-background border border-border shadow-lg z-50">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCategory("Chawal");
                      setSelectedChawalVariety(null);
                    }}
                    className="cursor-pointer hover:bg-accent"
                  >
                    All Chawal
                  </DropdownMenuItem>
                  {CHAWAL_VARIETIES.map((variety) => (
                    <DropdownMenuItem
                      key={variety}
                      onClick={() => handleChawalVarietyClick(variety)}
                      className={`cursor-pointer hover:bg-accent ${
                        selectedChawalVariety === variety ? "bg-accent text-primary font-semibold" : ""
                      }`}
                    >
                      {variety}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : category === "Kapila" ? (
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
                <DropdownMenuContent className="bg-background border border-border shadow-lg z-50">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCategory("Kapila");
                      setSelectedKapilaVariety(null);
                    }}
                    className="cursor-pointer hover:bg-accent"
                  >
                    All Kapila
                  </DropdownMenuItem>
                  {KAPILA_VARIETIES.map((variety) => (
                    <DropdownMenuItem
                      key={variety}
                      onClick={() => handleKapilaVarietyClick(variety)}
                      className={`cursor-pointer hover:bg-accent ${
                        selectedKapilaVariety === variety ? "bg-accent text-primary font-semibold" : ""
                      }`}
                    >
                      {variety}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-6 py-2 rounded-full transition-all ${
                  selectedCategory === category && category !== "Chawal" && category !== "Kapila"
                    ? "glass-card text-primary font-semibold scale-105"
                    : "glass-card text-muted-foreground hover:text-primary hover:scale-105"
                }`}
              >
                {category}
              </button>
            )
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center glass-card rounded-2xl p-12">
            <p className="text-xl text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

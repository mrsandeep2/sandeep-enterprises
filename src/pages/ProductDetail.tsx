import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, GitCompare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number | null;
  category: string | null;
  specifications: Record<string, any> | null;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProduct(data as Product);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item: any) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const addToComparison = () => {
    if (!product) return;

    const comparison = JSON.parse(localStorage.getItem("comparison") || "[]");
    
    if (comparison.find((item: any) => item.id === product.id)) {
      toast({
        title: "Already in comparison",
        description: "This product is already in your comparison list",
        variant: "destructive",
      });
      return;
    }

    if (comparison.length >= 4) {
      toast({
        title: "Comparison limit reached",
        description: "You can only compare up to 4 products at once",
        variant: "destructive",
      });
      return;
    }

    comparison.push(product);
    localStorage.setItem("comparison", JSON.stringify(comparison));

    toast({
      title: "Added to comparison",
      description: `${product.name} has been added to comparison list`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-xl text-muted-foreground">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="glass-card rounded-3xl overflow-hidden p-4">
            <img
              src={product.image_url || "https://via.placeholder.com/600"}
              alt={product.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>

          <div className="space-y-6">
            {product.category && (
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                {product.category}
              </span>
            )}
            
            <h1 className="text-4xl font-bold text-card-foreground">
              {product.name}
            </h1>

            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ${product.price}
            </p>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || "No description available"}
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Availability</h3>
                      <p className="text-muted-foreground">
                        {product.stock !== null && product.stock > 0
                          ? `${product.stock} in stock`
                          : "Out of stock"}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="space-y-4">
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-semibold mb-4">Product Specifications</h2>
                  {product.specifications && Object.keys(product.specifications).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No specifications available for this product</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button
                onClick={addToCart}
                disabled={product.stock === 0}
                size="lg"
                className="flex-1 gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                onClick={addToComparison}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <GitCompare className="h-5 w-5" />
                Compare
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { X, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const ProductComparison = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = () => {
    const comparison = JSON.parse(localStorage.getItem("comparison") || "[]");
    setProducts(comparison);
  };

  const removeFromComparison = (id: string) => {
    const comparison = products.filter((p) => p.id !== id);
    setProducts(comparison);
    localStorage.setItem("comparison", JSON.stringify(comparison));
    toast({
      title: "Removed from comparison",
      description: "Product has been removed from comparison list",
    });
  };

  const clearComparison = () => {
    setProducts([]);
    localStorage.setItem("comparison", JSON.stringify([]));
    toast({
      title: "Comparison cleared",
      description: "All products have been removed from comparison",
    });
  };

  const addToCart = (product: Product) => {
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

  // Get all unique specification keys across all products
  const allSpecKeys = Array.from(
    new Set(
      products.flatMap((p) =>
        p.specifications ? Object.keys(p.specifications) : []
      )
    )
  );

  if (products.length === 0) {
    return (
      <div className="min-h-screen">
        <SEO 
          title="Compare Products - Sandeep Enterprises"
          description="Compare rice, atta, and cattle feed products side by side. Find the best product for your needs."
          keywords="compare products, product comparison, rice comparison, sandeep enterprises"
        />
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Product Comparison</h1>
          <p className="text-muted-foreground mb-6">
            No products to compare. Add products from the product detail pages.
          </p>
          <Button onClick={() => navigate("/")}>Browse Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEO 
        title="Compare Products - Sandeep Enterprises"
        description="Compare rice, atta, and cattle feed products side by side. Find the best product for your needs."
        keywords="compare products, product comparison, rice comparison, sandeep enterprises"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Compare Products</h1>
          <Button variant="outline" onClick={clearComparison}>
            Clear All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-max">
            {products.map((product) => (
              <div key={product.id} className="glass-card rounded-2xl p-6 space-y-4 min-w-[280px]">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                    onClick={() => removeFromComparison(product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <img
                    src={product.image_url || "https://via.placeholder.com/300"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-2xl font-bold text-primary mb-4">
                    ${product.price}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="border-t border-border pt-3">
                    <p className="text-sm font-semibold mb-2">Category</p>
                    <p className="text-muted-foreground">
                      {product.category || "N/A"}
                    </p>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-sm font-semibold mb-2">Stock</p>
                    <p className="text-muted-foreground">
                      {product.stock !== null && product.stock > 0
                        ? `${product.stock} available`
                        : "Out of stock"}
                    </p>
                  </div>

                  {allSpecKeys.map((key) => (
                    <div key={key} className="border-t border-border pt-3">
                      <p className="text-sm font-semibold mb-2 capitalize">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-muted-foreground">
                        {product.specifications?.[key]
                          ? String(product.specifications[key])
                          : "N/A"}
                      </p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full gap-2 mt-4"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductComparison;

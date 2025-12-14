import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number | null;
  category: string | null;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { toast } = useToast();

  const addToCart = () => {
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

  return (
    <div className="glass-card glass-card-hover rounded-2xl overflow-hidden group">
      <div className="relative h-64 overflow-hidden">
        <img
          src={product.image_url || "https://via.placeholder.com/400"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {product.stock !== null && product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-4 right-4 bg-accent/90 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            Only {product.stock} left!
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-4 right-4 bg-destructive/90 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            Out of Stock
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div>
          {product.category && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {product.category}
            </span>
          )}
          <h3 className="text-xl font-bold text-card-foreground mt-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ${product.price}
          </span>

          <div className="flex gap-2">
            <Link to={`/product/${product.id}`}>
              <Button variant="outline" size="icon" className="rounded-full">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              onClick={addToCart}
              disabled={product.stock === 0}
              className="rounded-full gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

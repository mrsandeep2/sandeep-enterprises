import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="glass-card glass-card-hover rounded-2xl overflow-hidden group cursor-pointer"
    >
      <div className="relative h-40 sm:h-52 lg:h-64 overflow-hidden">
        <img
          src={product.image_url || "https://via.placeholder.com/400"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {product.stock !== null && product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-accent/90 text-accent-foreground px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-sm">
            Only {product.stock} left!
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-destructive/90 text-destructive-foreground px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-sm">
            Out of Stock
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-4">
        <div>
          {product.category && (
            <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wide">
              {product.category}
            </span>
          )}
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-card-foreground mt-1 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ₹{product.price}
          </span>

          <Button
            onClick={addToCart}
            disabled={product.stock === 0}
            size="sm"
            className="rounded-full gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Add</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

const Cart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    
    const handleCartUpdate = () => loadCart();
    window.addEventListener("cartUpdated", handleCartUpdate);
    
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);
  };

  const updateCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const updateQuantity = (id: string, delta: number) => {
    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    updateCart(updatedCart);
  };

  const removeItem = (id: string) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    updateCart(updatedCart);
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart",
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-xl text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="glass-card rounded-2xl p-6 flex gap-4">
                  <img
                    src={item.image_url || "https://via.placeholder.com/150"}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-primary font-bold mt-1">₹{item.price}</p>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-8 w-8 rounded-full"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <span className="font-semibold w-8 text-center">{item.quantity}</span>
                      
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-8 w-8 rounded-full"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 rounded-full ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-6 h-fit space-y-4">
              <h2 className="text-xl font-bold">Order Summary</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">Free</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate("/checkout")}
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;

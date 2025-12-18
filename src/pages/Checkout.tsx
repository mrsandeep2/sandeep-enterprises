import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { z } from "zod";

// Validation schema for checkout form
const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters").regex(/^[\d\s\-+()]+$/, "Please enter a valid phone number"),
  address: z.string().trim().max(200, "Address must be less than 200 characters").optional(),
  city: z.string().trim().max(100, "City must be less than 100 characters").optional(),
  pinCode: z.string().trim().max(10, "Pin code must be less than 10 characters").optional(),
  landmark: z.string().trim().max(200, "Landmark must be less than 200 characters").optional(),
  notes: z.string().trim().max(500, "Notes must be less than 500 characters").optional(),
});

const shippingSchema = z.object({
  address: z.string().trim().min(1, "Street address is required").max(200, "Address must be less than 200 characters"),
  city: z.string().trim().min(1, "City is required").max(100, "City must be less than 100 characters"),
  pinCode: z.string().trim().min(1, "Pin code is required").max(10, "Pin code must be less than 10 characters"),
  landmark: z.string().trim().max(200, "Landmark must be less than 200 characters").optional(),
});

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const Checkout = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pinCode: "",
    landmark: "",
    notes: "",
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(cartData);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  };

  const calculateDeliveryFee = () => {
    switch (deliveryMethod) {
      case "express":
        return 150.0;
      case "standard":
        return 50.0;
      case "pickup":
        return 0.0;
      default:
        return 50.0;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data with zod
    const validationResult = checkoutSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    const validatedData = validationResult.data;

    // Validate shipping address if delivery method requires it
    if (deliveryMethod !== "pickup") {
      const shippingValidation = shippingSchema.safeParse({
        address: formData.address,
        city: formData.city,
        pinCode: formData.pinCode,
        landmark: formData.landmark,
      });
      
      if (!shippingValidation.success) {
        const firstError = shippingValidation.error.errors[0];
        toast({
          title: "Missing address",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }
    }

    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to place an order",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // SERVER-SIDE PRICE VERIFICATION: Fetch current prices from database
      const productIds = cart.map(item => item.id);
      const { data: currentProducts, error: productsError } = await supabase
        .from("products")
        .select("id, price, name, stock")
        .in("id", productIds);

      if (productsError) {
        throw new Error("Failed to verify product prices");
      }

      if (!currentProducts || currentProducts.length !== cart.length) {
        toast({
          title: "Product unavailable",
          description: "Some products in your cart are no longer available. Please refresh and try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verify stock availability and build verified order items with server prices
      const verifiedItems: { product_id: string; quantity: number; price: number }[] = [];
      let verifiedSubtotal = 0;

      for (const cartItem of cart) {
        const currentProduct = currentProducts.find(p => p.id === cartItem.id);
        if (!currentProduct) {
          toast({
            title: "Product not found",
            description: `${cartItem.name} is no longer available.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Check stock availability
        if (currentProduct.stock !== null && currentProduct.stock < cartItem.quantity) {
          toast({
            title: "Insufficient stock",
            description: `Only ${currentProduct.stock} units of ${currentProduct.name} are available.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Use server-side price, NOT client-supplied price
        verifiedItems.push({
          product_id: cartItem.id,
          quantity: cartItem.quantity,
          price: currentProduct.price,
        });
        verifiedSubtotal += currentProduct.price * cartItem.quantity;
      }

      const deliveryFee = calculateDeliveryFee();
      const total = verifiedSubtotal + deliveryFee;

      const shippingAddress = deliveryMethod === "pickup" ? null : {
        fullName: validatedData.fullName,
        address: formData.address?.trim(),
        city: formData.city?.trim(),
        pinCode: formData.pinCode?.trim(),
        landmark: formData.landmark?.trim(),
      };

      // Create order with server-verified total
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total,
          status: "pending",
          shipping_address: shippingAddress,
          delivery_method: deliveryMethod,
          phone: validatedData.phone,
          notes: validatedData.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with server-verified prices
      const orderItems = verifiedItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      localStorage.setItem("cart", JSON.stringify([]));
      window.dispatchEvent(new Event("cartUpdated"));

      toast({
        title: "Order placed successfully",
        description: "Your order has been placed and is being processed",
      });

      navigate(`/order-confirmation?orderId=${order.id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Checkout</h1>
          <p className="text-muted-foreground mb-6">Your cart is empty</p>
          <Button onClick={() => navigate("/")}>Browse Products</Button>
        </div>
      </div>
    );
  }

  const deliveryFee = calculateDeliveryFee();
  const grandTotal = (parseFloat(calculateTotal()) + deliveryFee).toFixed(2);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Method */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Method</h2>
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <span>Standard Delivery (5-7 days)</span>
                        <span className="font-semibold">₹50</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                    <RadioGroupItem value="express" id="express" />
                    <Label htmlFor="express" className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <span>Express Delivery (2-3 days)</span>
                        <span className="font-semibold">₹150</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <div>
                          <span>Store Pickup</span>
                          <p className="text-xs text-muted-foreground">123 Store Street, Downtown</p>
                        </div>
                        <span className="font-semibold">Free</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Shipping Address */}
              {deliveryMethod !== "pickup" && (
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="pinCode">Pin Code *</Label>
                        <Input
                          id="pinCode"
                          name="pinCode"
                          value={formData.pinCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="landmark">Landmark</Label>
                      <Input
                        id="landmark"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        placeholder="Near temple, opposite school, etc."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any special instructions or notes..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Place Order
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{calculateTotal()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;

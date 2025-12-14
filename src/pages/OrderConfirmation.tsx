import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Truck, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  total: number;
  status: string;
  delivery_method: string;
  created_at: string;
  shipping_address: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  } | null;
}

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      
      setOrder({
        ...data,
        shipping_address: data.shipping_address as Order["shipping_address"]
      });
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryInfo = (method: string) => {
    switch (method) {
      case "express":
        return { label: "Express Delivery", time: "2-3 business days", icon: Truck };
      case "standard":
        return { label: "Standard Delivery", time: "5-7 business days", icon: Truck };
      case "pickup":
        return { label: "Store Pickup", time: "Ready in 24 hours", icon: MapPin };
      default:
        return { label: "Delivery", time: "", icon: Package };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const deliveryInfo = getDeliveryInfo(order.delivery_method);
  const DeliveryIcon = deliveryInfo.icon;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase. Your order has been received.
          </p>

          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">Order ID</p>
            <p className="font-mono text-lg font-semibold">{order.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="grid gap-4 text-left mb-8">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <DeliveryIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{deliveryInfo.label}</p>
                <p className="text-sm text-muted-foreground">{deliveryInfo.time}</p>
              </div>
            </div>

            {order.delivery_method === "pickup" ? (
              <div className="p-4 rounded-xl border border-border">
                <p className="font-semibold mb-1">Pickup Location</p>
                <p className="text-sm text-muted-foreground">
                  123 Store Street, Downtown
                </p>
                <p className="text-sm text-muted-foreground">
                  Mon-Sat: 9AM - 8PM, Sun: 10AM - 6PM
                </p>
              </div>
            ) : order.shipping_address && (
              <div className="p-4 rounded-xl border border-border">
                <p className="font-semibold mb-1">Shipping To</p>
                <p className="text-sm text-muted-foreground">
                  {order.shipping_address.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shipping_address.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shipping_address.city}, {order.shipping_address.postalCode}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shipping_address.country}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center p-4 rounded-xl border border-border">
              <span className="font-semibold">Total Paid</span>
              <span className="text-xl font-bold">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => navigate("/")} className="flex-1">
              Continue Shopping
            </Button>
            <Button variant="outline" onClick={() => navigate("/products")} className="flex-1">
              View Products
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  User,
  Mail,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  IndianRupee,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    category: string | null;
    weight: string | null;
    image_url: string | null;
  };
}

interface Order {
  id: string;
  total: number;
  status: string | null;
  created_at: string | null;
  shipping_address: any;
  delivery_method: string | null;
  phone: string | null;
  notes: string | null;
  order_items?: OrderItem[];
}

interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  created_at: string | null;
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-500", textColor: "text-yellow-600" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "bg-blue-500", textColor: "text-blue-600" },
  { value: "shipped", label: "Shipped", icon: Truck, color: "bg-purple-500", textColor: "text-purple-600" },
  { value: "delivered", label: "Delivered", icon: Package, color: "bg-green-500", textColor: "text-green-600" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-500", textColor: "text-red-600" },
];

const getStatusConfig = (status: string | null) => {
  return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
};

const getStatusIndex = (status: string | null) => {
  const index = ORDER_STATUSES.findIndex(s => s.value === status);
  return index >= 0 ? index : 0;
};

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    // Subscribe to real-time order status updates
    const channel = supabase
      .channel('user-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders(prev => {
            const updated = prev.map(order => 
              order.id === updatedOrder.id 
                ? { ...order, status: updatedOrder.status }
                : order
            );
            
            // Show toast for status update
            const existingOrder = prev.find(o => o.id === updatedOrder.id);
            if (existingOrder && existingOrder.status !== updatedOrder.status) {
              const statusConfig = getStatusConfig(updatedOrder.status);
              toast({
                title: "Order Status Updated!",
                description: `Your order is now: ${statusConfig.label}`,
              });
            }
            
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch orders with items
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price,
            product:products (
              name,
              category,
              weight,
              image_url
            )
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (address: any) => {
    if (!address) return "N/A";
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    return parts.join(", ") || "N/A";
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">My Profile</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{profile?.username || "User"}</p>
                    <p className="text-sm text-muted-foreground">Customer</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{orders.length} orders placed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  My Orders
                </CardTitle>
                <CardDescription>
                  Track your orders in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Button 
                      variant="default" 
                      className="mt-4"
                      onClick={() => navigate("/")}
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const statusIndex = getStatusIndex(order.status);
                      const isExpanded = expandedOrders.has(order.id);
                      const isCancelled = order.status === "cancelled";

                      return (
                        <Collapsible
                          key={order.id}
                          open={isExpanded}
                          onOpenChange={() => toggleOrderExpanded(order.id)}
                        >
                          <div className="border rounded-lg overflow-hidden">
                            {/* Order Header */}
                            <CollapsibleTrigger asChild>
                              <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-muted-foreground">
                                        #{order.id.slice(0, 8)}
                                      </span>
                                      <Badge className={`${statusConfig.color} text-white`}>
                                        <statusConfig.icon className="h-3 w-3 mr-1" />
                                        {statusConfig.label}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(order.created_at)}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="font-semibold flex items-center">
                                        <IndianRupee className="h-4 w-4" />
                                        {order.total}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {order.order_items?.length || 0} items
                                      </p>
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>

                                {/* Status Progress Bar */}
                                {!isCancelled && (
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                      {ORDER_STATUSES.filter(s => s.value !== "cancelled").map((status, index) => {
                                        const isActive = index <= statusIndex;
                                        const isCurrent = index === statusIndex;
                                        return (
                                          <div 
                                            key={status.value} 
                                            className="flex flex-col items-center flex-1"
                                          >
                                            <div 
                                              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                                                isActive 
                                                  ? `${status.color} text-white` 
                                                  : "bg-muted text-muted-foreground"
                                              } ${isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                                            >
                                              <status.icon className="h-4 w-4" />
                                            </div>
                                            <span className={`text-[10px] sm:text-xs mt-1 ${isActive ? status.textColor : "text-muted-foreground"}`}>
                                              {status.label}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="relative h-1 bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
                                        style={{ width: `${(statusIndex / 3) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CollapsibleTrigger>

                            {/* Order Details */}
                            <CollapsibleContent>
                              <div className="border-t p-4 bg-muted/30 space-y-4">
                                {/* Shipping Info */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="font-medium">Delivery Address</p>
                                      <p className="text-muted-foreground">{formatAddress(order.shipping_address)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="font-medium">Phone</p>
                                      <p className="text-muted-foreground">{order.phone || "N/A"}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                  <p className="font-medium mb-2">Order Items</p>
                                  <div className="space-y-2">
                                    {order.order_items?.map((item) => (
                                      <div 
                                        key={item.id} 
                                        className="flex items-center gap-3 p-2 bg-background rounded-lg"
                                      >
                                        <img
                                          src={item.product?.image_url || "https://via.placeholder.com/50"}
                                          alt={item.product?.name || "Product"}
                                          className="w-12 h-12 object-cover rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">
                                            {item.product?.name || "Unknown Product"}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {item.product?.category} {item.product?.weight && `• ${item.product.weight}`}
                                          </p>
                                        </div>
                                        <div className="text-right text-sm">
                                          <p>₹{item.price} × {item.quantity}</p>
                                          <p className="font-medium">₹{item.price * item.quantity}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Order Notes */}
                                {order.notes && (
                                  <div className="text-sm">
                                    <p className="font-medium">Notes</p>
                                    <p className="text-muted-foreground">{order.notes}</p>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;

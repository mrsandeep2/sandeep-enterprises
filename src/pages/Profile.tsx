import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
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
  LogOut,
  Bell,
  Edit,
  Plus,
  Trash2,
  Save,
  X,
  History,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  admin_notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  order_items?: OrderItem[];
}

interface SavedAddress {
  id: string;
  label: string;
  landmark: string;
  village: string;
  pincode: string;
  isDefault?: boolean;
}

interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  saved_addresses: SavedAddress[] | null;
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
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  
  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Address management state
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    landmark: "",
    village: "",
    pincode: "",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  
  // Cancel order state
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  
  const CANCEL_REASONS = [
    "Changed my mind",
    "Found better price elsewhere",
    "Ordered by mistake",
    "Delivery time too long",
    "Financial reasons",
    "Other",
  ];

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    // Subscribe to real-time order status updates
    const orderChannel = supabase
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
                ? { 
                    ...order, 
                    status: updatedOrder.status,
                    cancellation_reason: updatedOrder.cancellation_reason,
                    cancelled_by: updatedOrder.cancelled_by,
                    admin_notes: updatedOrder.admin_notes,
                  }
                : order
            );
            
            const existingOrder = prev.find(o => o.id === updatedOrder.id);
            if (existingOrder && existingOrder.status !== updatedOrder.status) {
              const statusConfig = getStatusConfig(updatedOrder.status);
              
              // If admin cancelled the order, show detailed message
              if (updatedOrder.status === 'cancelled' && updatedOrder.cancelled_by === 'admin') {
                toast({
                  title: "Order Cancelled by Admin",
                  description: updatedOrder.cancellation_reason || "Your order has been cancelled by the admin.",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Order Status Updated!",
                  description: `Your order is now: ${statusConfig.label}`,
                });
              }
            }
            
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [toast]);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin - redirect them to admin page
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });
      
      if (isAdmin) {
        navigate("/admin");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        const savedAddresses = Array.isArray(profileData.saved_addresses) 
          ? (profileData.saved_addresses as unknown as SavedAddress[])
          : [];
        const parsedProfile: Profile = {
          ...profileData,
          saved_addresses: savedAddresses,
        };
        setProfile(parsedProfile);
        setEditUsername(parsedProfile.username || "");
        setEditPhone(parsedProfile.phone || "");
      }

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      // Ignore errors
    }
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    window.location.href = '/';
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        username: editUsername.trim(),
        phone: editPhone.trim() || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      setProfile(prev => prev ? { ...prev, username: editUsername, phone: editPhone } : null);
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    }
    setSavingProfile(false);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ label: "", landmark: "", village: "", pincode: "", isDefault: false });
    setIsAddressDialogOpen(true);
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label,
      landmark: address.landmark,
      village: address.village,
      pincode: address.pincode,
      isDefault: address.isDefault || false,
    });
    setIsAddressDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!profile) return;
    setSavingAddress(true);

    const currentAddresses: SavedAddress[] = profile.saved_addresses || [];
    let newAddresses: SavedAddress[];

    if (editingAddress) {
      newAddresses = currentAddresses.map(addr => 
        addr.id === editingAddress.id 
          ? { ...addressForm, id: editingAddress.id }
          : addressForm.isDefault ? { ...addr, isDefault: false } : addr
      );
    } else {
      const newAddress: SavedAddress = {
        id: crypto.randomUUID(),
        ...addressForm,
      };
      if (addressForm.isDefault) {
        newAddresses = currentAddresses.map(addr => ({ ...addr, isDefault: false }));
        newAddresses.push(newAddress);
      } else {
        newAddresses = [...currentAddresses, newAddress];
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ saved_addresses: newAddresses as unknown as null })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    } else {
      setProfile(prev => prev ? { ...prev, saved_addresses: newAddresses } : null);
      setIsAddressDialogOpen(false);
      toast({
        title: editingAddress ? "Address Updated" : "Address Added",
        description: "Your address has been saved successfully.",
      });
    }
    setSavingAddress(false);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!profile) return;
    
    const newAddresses = (profile.saved_addresses || []).filter(addr => addr.id !== addressId);
    
    const { error } = await supabase
      .from("profiles")
      .update({ saved_addresses: newAddresses as unknown as null })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    } else {
      setProfile(prev => prev ? { ...prev, saved_addresses: newAddresses } : null);
      toast({
        title: "Address Deleted",
        description: "The address has been removed.",
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    
    // Validate reason
    const finalReason = selectedCancelReason === "Other" 
      ? cancelReason.trim() 
      : selectedCancelReason;
      
    if (!finalReason) {
      toast({
        title: "Reason Required",
        description: "Please select or enter a reason for cancellation",
        variant: "destructive",
      });
      return;
    }
    
    setCancellingOrder(true);

    const order = orders.find(o => o.id === cancelOrderId);
    if (!order) {
      setCancellingOrder(false);
      setCancelOrderId(null);
      return;
    }

    // Update order status with reason
    const { error: orderError } = await supabase
      .from("orders")
      .update({ 
        status: "cancelled",
        cancellation_reason: finalReason,
        cancelled_by: "user"
      })
      .eq("id", cancelOrderId);

    if (orderError) {
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
      setCancellingOrder(false);
      setCancelOrderId(null);
      return;
    }

    // Restore stock for cancelled order items
    if (order.order_items) {
      for (const item of order.order_items) {
        try {
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          
          if (product) {
            await supabase
              .from("products")
              .update({ stock: (product.stock || 0) + item.quantity })
              .eq("id", item.product_id);
          }
        } catch (err) {
          console.error("Error restoring stock:", err);
        }
      }
    }

    setOrders(prev => prev.map(o => 
      o.id === cancelOrderId ? { ...o, status: "cancelled", cancellation_reason: finalReason, cancelled_by: "user" } : o
    ));

    toast({
      title: "Order Cancelled",
      description: "Your order has been cancelled successfully.",
    });
    
    setCancellingOrder(false);
    setCancelOrderId(null);
    setCancelReason("");
    setSelectedCancelReason("");
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

  const canCancelOrder = (status: string | null) => {
    return status === "pending" || status === "confirmed";
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4 hidden sm:block" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4 hidden sm:block" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <MapPin className="h-4 w-4 hidden sm:block" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 relative">
              <Bell className="h-4 w-4 hidden sm:block" />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-6">
              {/* Ongoing Orders Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Ongoing Orders
                  </CardTitle>
                  <CardDescription>
                    Track your active orders in real-time. You can cancel orders before they are shipped.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No ongoing orders</p>
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
                      {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        const statusIndex = getStatusIndex(order.status);
                        const isExpanded = expandedOrders.has(order.id);
                        const canCancel = canCancelOrder(order.status);

                        return (
                          <Collapsible
                            key={order.id}
                            open={isExpanded}
                            onOpenChange={() => toggleOrderExpanded(order.id)}
                          >
                            <div className="border rounded-lg overflow-hidden">
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
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <div className="border-t p-4 bg-muted/30 space-y-4">
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

                                  {order.notes && (
                                    <div className="text-sm">
                                      <p className="font-medium">Notes</p>
                                      <p className="text-muted-foreground">{order.notes}</p>
                                    </div>
                                  )}

                                  {canCancel && (
                                    <div className="pt-2">
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCancelOrderId(order.id);
                                        }}
                                        className="gap-2"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Cancel Order
                                      </Button>
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

              {/* Order History Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Order History
                  </CardTitle>
                  <CardDescription>
                    View your completed and cancelled orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').length === 0 ? (
                    <div className="text-center py-8">
                      <History className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No order history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        const isExpanded = expandedOrders.has(order.id);
                        const isCancelled = order.status === "cancelled";

                        return (
                          <Collapsible
                            key={order.id}
                            open={isExpanded}
                            onOpenChange={() => toggleOrderExpanded(order.id)}
                          >
                            <div className="border rounded-lg overflow-hidden">
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
                                </div>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <div className="border-t p-4 bg-muted/30 space-y-4">
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

                                  {order.notes && (
                                    <div className="text-sm">
                                      <p className="font-medium">Notes</p>
                                      <p className="text-muted-foreground">{order.notes}</p>
                                    </div>
                                  )}

                                  {/* Show cancellation reason if cancelled */}
                                  {isCancelled && order.cancellation_reason && (
                                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                                      <p className="font-medium text-destructive text-sm flex items-center gap-2">
                                        <XCircle className="h-4 w-4" />
                                        Cancellation Reason ({order.cancelled_by === 'admin' ? 'by Admin' : 'by You'})
                                      </p>
                                      <p className="text-sm text-muted-foreground mt-1">{order.cancellation_reason}</p>
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
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Manage your account details</CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-xl">{profile?.username || "User"}</p>
                    <p className="text-sm text-muted-foreground">Customer</p>
                  </div>
                </div>
                
                <Separator />
                
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="Enter your username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                        {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingProfile(false)} className="gap-2">
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{profile?.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{profile?.phone || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">
                          {profile?.created_at 
                            ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) 
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="font-medium">{orders.length}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Saved Addresses
                    </CardTitle>
                    <CardDescription>Manage your delivery addresses</CardDescription>
                  </div>
                  <Button onClick={handleAddAddress} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Address
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(!profile?.saved_addresses || profile.saved_addresses.length === 0) ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No saved addresses</p>
                    <Button onClick={handleAddAddress} className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {profile.saved_addresses.map((address) => (
                      <div 
                        key={address.id} 
                        className={`p-4 border rounded-lg ${address.isDefault ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{address.label}</span>
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEditAddress(address)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {address.landmark}, {address.village} - {address.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notifications
                    </CardTitle>
                    <CardDescription>Stay updated with new products</CardDescription>
                  </div>
                  {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                      Mark all as read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No notifications yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      You'll be notified when new products are added!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 border rounded-lg flex items-start gap-3 ${!notification.read ? 'bg-primary/5 border-primary/20' : ''}`}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${!notification.read ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.timestamp.toLocaleString("en-IN")}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            <DialogDescription>
              {editingAddress ? "Update your address details" : "Add a new delivery address"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Address Label</Label>
              <Input
                id="label"
                placeholder="e.g., Home, Office, etc."
                value={addressForm.label}
                onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark</Label>
              <Input
                id="landmark"
                placeholder="Enter landmark"
                value={addressForm.landmark}
                onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="village">Village</Label>
              <Input
                id="village"
                placeholder="Enter village"
                value={addressForm.village}
                onChange={(e) => setAddressForm(prev => ({ ...prev, village: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                placeholder="Enter pincode"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">Set as default address</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress} disabled={savingAddress}>
              {savingAddress ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingAddress ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog with Reason */}
      <Dialog open={!!cancelOrderId} onOpenChange={(open) => {
        if (!open) {
          setCancelOrderId(null);
          setCancelReason("");
          setSelectedCancelReason("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Please tell us why you want to cancel this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <RadioGroup value={selectedCancelReason} onValueChange={setSelectedCancelReason}>
              {CANCEL_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="font-normal cursor-pointer">{reason}</Label>
                </div>
              ))}
            </RadioGroup>
            
            {selectedCancelReason === "Other" && (
              <Textarea
                placeholder="Please describe your reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setCancelOrderId(null);
                setCancelReason("");
                setSelectedCancelReason("");
              }}
              disabled={cancellingOrder}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancellingOrder || !selectedCancelReason || (selectedCancelReason === "Other" && !cancelReason.trim())}
            >
              {cancellingOrder && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

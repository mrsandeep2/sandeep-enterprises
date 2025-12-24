import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  MessageSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

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
  user_id: string;
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
  profile?: {
    username: string | null;
    email: string | null;
  };
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "bg-blue-500" },
  { value: "shipped", label: "Shipped", icon: Truck, color: "bg-purple-500" },
  { value: "delivered", label: "Delivered", icon: Package, color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-500" },
];

const getStatusConfig = (status: string | null) => {
  return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
};

const AdminOrders = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Order Detail Dialog
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  
  // Cancel dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(false);
  
  const ADMIN_CANCEL_REASONS = [
    "Out of stock",
    "Payment issue",
    "Customer request",
    "Delivery not possible to location",
    "Order details incorrect",
    "Other",
  ];
  
  // Delete order state
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState(false);

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;
    setDeletingOrder(true);
    
    try {
      // Delete order items first
      await supabase.from("order_items").delete().eq("order_id", deleteOrderId);
      // Then delete order
      const { error } = await supabase.from("orders").delete().eq("id", deleteOrderId);
      
      if (error) throw error;
      
      setOrders(prev => prev.filter(o => o.id !== deleteOrderId));
      toast({ title: "Order Deleted", description: "Order has been removed from history" });
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
    } finally {
      setDeletingOrder(false);
      setDeleteOrderId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  // Real-time subscription for orders
  useEffect(() => {
    const orderChannel = supabase
      .channel('admin-orders-realtime')
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
            const existing = prev.find(o => o.id === updatedOrder.id);
            if (existing && existing.status !== updatedOrder.status && updatedOrder.cancelled_by === 'user') {
              toast({
                title: "Order Cancelled by Customer",
                description: `Order #${updatedOrder.id.slice(0, 8)} was cancelled. Reason: ${updatedOrder.cancellation_reason || 'Not provided'}`,
                variant: "destructive",
              });
            }
            
            return prev.map(order => 
              order.id === updatedOrder.id 
                ? { 
                    ...order, 
                    status: updatedOrder.status,
                    cancellation_reason: updatedOrder.cancellation_reason,
                    cancelled_by: updatedOrder.cancelled_by,
                  }
                : order
            );
          });
          
          // Update selected order if viewing
          if (selectedOrder?.id === updatedOrder.id) {
            setSelectedOrder(prev => prev ? {
              ...prev,
              status: updatedOrder.status,
              cancellation_reason: updatedOrder.cancellation_reason,
              cancelled_by: updatedOrder.cancelled_by,
            } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [selectedOrder?.id, toast]);


  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders with order items and product details
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
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        return;
      }

      // Fetch profile information for each order
      const ordersWithProfiles = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, email")
            .eq("id", order.user_id)
            .maybeSingle();
          
          return {
            ...order,
            profile: profileData,
          };
        })
      );

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.phone?.toLowerCase().includes(query) ||
        order.profile?.username?.toLowerCase().includes(query) ||
        order.profile?.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!selectedOrder) return;
    
    const currentStatus = selectedOrder.status;
    
    // Prevent changes to delivered orders
    if (currentStatus === "delivered") {
      toast({
        title: "Cannot Update",
        description: "Delivered orders cannot be modified",
        variant: "destructive",
      });
      return;
    }
    
    // For cancellation, show reason dialog
    if (newStatus === "cancelled") {
      setShowCancelDialog(true);
      return;
    }

    setUpdatingStatus(true);
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Handle stock updates
      if (newStatus === "confirmed" && currentStatus === "pending") {
        // Reduce stock when order is confirmed
        await updateStock(orderId, "reduce");
      } else if (newStatus === "cancelled" && currentStatus !== "pending") {
        // Restore stock when order is cancelled (if it was confirmed/shipped)
        await updateStock(orderId, "restore");
      }

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);

      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateStock = async (orderId: string, action: "reduce" | "restore") => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order?.order_items) return;

      for (const item of order.order_items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          const newStock = action === "reduce" 
            ? Math.max(0, (product.stock || 0) - item.quantity)
            : (product.stock || 0) + item.quantity;

          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", item.product_id);
        }
      }
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const saveAdminNotes = async () => {
    if (!selectedOrder) return;
    
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ admin_notes: adminNotes })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id ? { ...o, admin_notes: adminNotes } : o
      ));
      setSelectedOrder(prev => prev ? { ...prev, admin_notes: adminNotes } : null);

      toast({
        title: "Notes Saved",
        description: "Admin notes have been saved",
      });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAdminCancelOrder = async () => {
    if (!selectedOrder) return;
    
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
    
    try {
      const currentStatus = selectedOrder.status;
      
      // Update order status with reason
      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          status: "cancelled",
          cancellation_reason: finalReason,
          cancelled_by: "admin"
        })
        .eq("id", selectedOrder.id);

      if (updateError) throw updateError;

      // Handle stock restoration if order was confirmed/shipped
      if (currentStatus !== "pending") {
        await updateStock(selectedOrder.id, "restore");
      }

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id 
          ? { ...o, status: "cancelled", cancellation_reason: finalReason, cancelled_by: "admin" } 
          : o
      ));
      setSelectedOrder(prev => prev ? { 
        ...prev, 
        status: "cancelled", 
        cancellation_reason: finalReason, 
        cancelled_by: "admin" 
      } : null);

      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled and customer will be notified",
      });
      
      setShowCancelDialog(false);
      setCancelReason("");
      setSelectedCancelReason("");
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setCancellingOrder(false);
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || "");
    setDetailDialogOpen(true);
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
    if (address.landmark) parts.push(`(Near: ${address.landmark})`);
    return parts.join(", ") || "N/A";
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all";

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">
              {filteredOrders.length} of {orders.length} orders
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by Order ID, Phone, or Customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ORDER_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">
                            {order.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.profile?.username || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{order.profile?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{order.phone || "N/A"}</TableCell>
                          <TableCell className="text-sm">{formatDate(order.created_at)}</TableCell>
                          <TableCell className="font-semibold">₹{order.total}</TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig.color} text-white`}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openOrderDetail(order)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Order ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status Management */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ORDER_STATUSES.map((status) => {
                      const isActive = selectedOrder.status === status.value;
                      const isDelivered = selectedOrder.status === "delivered";
                      return (
                        <Button
                          key={status.value}
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          disabled={isDelivered || updatingStatus}
                          onClick={() => updateOrderStatus(selectedOrder.id, status.value)}
                          className={isActive ? status.color : ""}
                        >
                          <status.icon className="h-4 w-4 mr-1" />
                          {status.label}
                        </Button>
                      );
                    })}
                  </div>
                  {selectedOrder.status === "delivered" && (
                    <p className="text-sm text-muted-foreground mt-2">
                      This order is delivered and cannot be modified.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Customer Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedOrder.profile?.username || "Unknown"}</span>
                    <span className="text-muted-foreground">({selectedOrder.profile?.email})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedOrder.phone || "N/A"}
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{formatAddress(selectedOrder.shipping_address)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(selectedOrder.created_at)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    Delivery: {selectedOrder.delivery_method || "Standard"}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ordered Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <img
                          src={item.product?.image_url || "https://via.placeholder.com/60"}
                          alt={item.product?.name || "Product"}
                          className="w-14 h-14 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name || "Unknown Product"}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.product?.category} {item.product?.weight && `• ${item.product.weight}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{item.price} × {item.quantity}</p>
                          <p className="text-sm text-muted-foreground">= ₹{item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {selectedOrder.total}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Notes */}
              {selectedOrder.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Customer Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Cancellation Reason (if cancelled) */}
              {selectedOrder.status === "cancelled" && selectedOrder.cancellation_reason && (
                <Card className="border-destructive/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      Cancellation Reason ({selectedOrder.cancelled_by === 'admin' ? 'by Admin' : 'by Customer'})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.cancellation_reason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Admin Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Admin Notes (Private)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Add private notes about this order..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={saveAdminNotes} 
                    disabled={savingNotes}
                    size="sm"
                  >
                    {savingNotes && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Notes
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCancelDialog(false);
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
              Please provide a reason for cancelling this order. The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <RadioGroup value={selectedCancelReason} onValueChange={setSelectedCancelReason}>
              {ADMIN_CANCEL_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={`admin-${reason}`} />
                  <Label htmlFor={`admin-${reason}`} className="font-normal cursor-pointer">{reason}</Label>
                </div>
              ))}
            </RadioGroup>
            
            {selectedCancelReason === "Other" && (
              <Textarea
                placeholder="Please describe the reason..."
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
                setShowCancelDialog(false);
                setCancelReason("");
                setSelectedCancelReason("");
              }}
              disabled={cancellingOrder}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleAdminCancelOrder}
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

export default AdminOrders;

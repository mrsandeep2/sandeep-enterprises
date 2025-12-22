import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, Trash2, Plus, ShieldX, Eye, EyeOff, Package, X, Image as ImageIcon } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PRODUCT_CATEGORIES,
  getCategoryByValue,
  getSubCategoryByValue,
  getWeightOptions,
  generateProductName,
} from "@/config/productCategories";

// Validation schema for product form
const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional().or(z.literal("")),
  price: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  sub_category: z.string().optional().or(z.literal("")),
  weight: z.string().optional().or(z.literal("")),
  discount: z.string().refine((val) => {
    if (val === "") return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Discount must be between 0 and 100").optional().or(z.literal("")),
  stock: z.string().refine((val) => {
    if (val === "") return true;
    const num = parseInt(val);
    return !isNaN(num) && num >= 0 && Number.isInteger(num);
  }, "Stock must be a non-negative integer").optional().or(z.literal("")),
  image_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
});

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images: string[] | null;
  stock: number | null;
  category: string | null;
  sub_category: string | null;
  weight: string | null;
  discount: number | null;
  is_active: boolean | null;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  image_url: string;
  images: string[];
  stock: string;
  category: string;
  sub_category: string;
  weight: string;
  discount: string;
  is_active: boolean;
}

const initialFormData: FormData = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  images: [],
  stock: "",
  category: "",
  sub_category: "",
  weight: "",
  discount: "",
  is_active: true,
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    checkAuthAndRole();
  }, []);

  // Auto-generate product name when category/subcategory/weight changes
  useEffect(() => {
    if (formData.category && !editingProduct) {
      const generatedName = generateProductName(
        formData.category,
        formData.sub_category,
        formData.weight
      );
      if (generatedName) {
        setFormData((prev) => ({ ...prev, name: generatedName }));
      }
    }
  }, [formData.category, formData.sub_category, formData.weight, editingProduct]);

  const checkAuthAndRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        if (import.meta.env.DEV) console.error("Error checking role:", roleError);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (roleData) {
        setIsAdmin(true);
        fetchProducts();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error checking auth:", error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
      sub_category: "",
      weight: "",
    });
  };

  const handleSubCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      sub_category: value,
      weight: "",
    });
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      try {
        new URL(newImageUrl.trim());
        setFormData({
          ...formData,
          images: [...formData.images, newImageUrl.trim()],
        });
        setNewImageUrl("");
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid image URL",
          variant: "destructive",
        });
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const validation = productSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the form errors",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price),
        image_url: formData.image_url?.trim() || formData.images[0] || null,
        images: formData.images.length > 0 ? formData.images : null,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        category: formData.category || null,
        sub_category: formData.sub_category || null,
        weight: formData.weight || null,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        is_active: formData.is_active,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast({ title: "Success", description: "Product updated" });
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);

        if (error) throw error;
        toast({ title: "Success", description: "Product created" });
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      
      toast({ title: "Success", description: "Product deleted" });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleVisibility = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);

      if (error) throw error;
      
      toast({ 
        title: "Success", 
        description: `Product ${!product.is_active ? "activated" : "deactivated"}` 
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      image_url: product.image_url || "",
      images: product.images || [],
      stock: product.stock?.toString() || "",
      category: product.category || "",
      sub_category: product.sub_category || "",
      weight: product.weight || "",
      discount: product.discount?.toString() || "",
      is_active: product.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormErrors({});
    setFormData(initialFormData);
    setNewImageUrl("");
  };

  const selectedCategory = getCategoryByValue(formData.category);
  const selectedSubCategory = formData.sub_category
    ? getSubCategoryByValue(formData.category, formData.sub_category)
    : null;
  const weightOptions = getWeightOptions(formData.category, formData.sub_category);
  const showSubCategory = selectedCategory?.subCategories && selectedCategory.subCategories.length > 0;
  const showWeight = weightOptions.length > 0;

  const getDisplayPrice = () => {
    if (!formData.price) return "₹0";
    const price = parseFloat(formData.price);
    const discount = formData.discount ? parseFloat(formData.discount) : 0;
    const discountedPrice = price - (price * discount / 100);
    return `₹${discountedPrice.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="glass-card rounded-2xl p-12 text-center max-w-lg mx-auto">
            <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page. Admin privileges are required.
            </p>
            <Button onClick={() => navigate("/")}>
              Go to Products
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Product Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your products, categories, and inventory
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the product details below. Fields marked with * are required.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="text-sm text-destructive">{formErrors.category}</p>
                    )}
                  </div>

                  {showSubCategory && (
                    <div className="space-y-2">
                      <Label htmlFor="sub_category">Variety / Type</Label>
                      <Select
                        value={formData.sub_category}
                        onValueChange={handleSubCategoryChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select variety" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCategory?.subCategories?.map((sub) => (
                            <SelectItem key={sub.value} value={sub.value}>
                              {sub.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {showWeight && (
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight / Pack Size</Label>
                      <Select
                        value={formData.weight}
                        onValueChange={(value) =>
                          setFormData({ ...formData, weight: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select weight" />
                        </SelectTrigger>
                        <SelectContent>
                          {weightOptions.map((w) => (
                            <SelectItem key={w.value} value={w.value}>
                              {w.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    maxLength={200}
                    placeholder="Auto-generated or enter manually"
                    required
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive">{formErrors.name}</p>
                  )}
                </div>

                {/* Price, Discount, Stock */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                    {formErrors.price && (
                      <p className="text-sm text-destructive">{formErrors.price}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData({ ...formData, discount: e.target.value })
                      }
                      placeholder="0"
                    />
                    {formErrors.discount && (
                      <p className="text-sm text-destructive">{formErrors.discount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      placeholder="0"
                    />
                    {formErrors.stock && (
                      <p className="text-sm text-destructive">{formErrors.stock}</p>
                    )}
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <Label>Product Images</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Enter image URL"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={addImageUrl}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Product ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="image_url">Primary Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                    {formErrors.image_url && (
                      <p className="text-sm text-destructive">{formErrors.image_url}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    maxLength={2000}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    placeholder="Enter product description..."
                  />
                  {formErrors.description && (
                    <p className="text-sm text-destructive">{formErrors.description}</p>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label htmlFor="is_active" className="text-base font-medium">
                      Product Visibility
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.is_active ? "Product is visible to customers" : "Product is hidden from customers"}
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>

                {/* Product Preview */}
                <Card className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Product Preview
                    </CardTitle>
                    <CardDescription>
                      Preview how your product will appear
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-32 h-32 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {formData.image_url || formData.images[0] ? (
                          <img
                            src={formData.image_url || formData.images[0]}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-lg">
                          {formData.name || "Product Name"}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.category && (
                            <Badge variant="secondary">
                              {getCategoryByValue(formData.category)?.label}
                            </Badge>
                          )}
                          {formData.sub_category && (
                            <Badge variant="outline">
                              {selectedSubCategory?.label}
                            </Badge>
                          )}
                          {formData.weight && (
                            <Badge variant="outline">
                              {formData.weight.toUpperCase().replace("KG", " KG")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-primary">
                            {getDisplayPrice()}
                          </span>
                          {formData.discount && parseFloat(formData.discount) > 0 && (
                            <>
                              <span className="text-muted-foreground line-through">
                                ₹{formData.price}
                              </span>
                              <Badge className="bg-green-500 text-white">
                                {formData.discount}% OFF
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.is_active ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                          {formData.stock && parseInt(formData.stock) > 0 ? (
                            <Badge variant="outline" className="text-green-600">
                              In Stock ({formData.stock})
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Out of Stock</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProduct ? "Update Product" : "Create Product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Product</th>
                  <th className="text-left p-4 font-semibold hidden md:table-cell">Category</th>
                  <th className="text-left p-4 font-semibold hidden lg:table-cell">Weight</th>
                  <th className="text-left p-4 font-semibold">Price</th>
                  <th className="text-left p-4 font-semibold hidden md:table-cell">Stock</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No products found</p>
                      <p className="text-sm text-muted-foreground">
                        Click "Add Product" to create your first product
                      </p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url || "https://via.placeholder.com/50"}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-muted-foreground md:hidden">
                              {getCategoryByValue(product.category || "")?.label || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="w-fit">
                            {getCategoryByValue(product.category || "")?.label || "-"}
                          </Badge>
                          {product.sub_category && (
                            <span className="text-sm text-muted-foreground">
                              {getSubCategoryByValue(product.category || "", product.sub_category)?.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {product.weight ? (
                          <Badge variant="outline">
                            {product.weight.toUpperCase().replace("KG", " KG")}
                          </Badge>
                        ) : "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-primary font-semibold">
                            ₹{product.discount && product.discount > 0
                              ? (product.price - (product.price * product.discount / 100)).toFixed(2)
                              : product.price}
                          </span>
                          {product.discount && product.discount > 0 && (
                            <span className="text-xs text-muted-foreground line-through">
                              ₹{product.price}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {product.stock && product.stock > 0 ? (
                          <Badge variant="outline" className="text-green-600">
                            {product.stock}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Out</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleVisibility(product)}
                          className="cursor-pointer"
                        >
                          {product.is_active ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="hover:bg-muted">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
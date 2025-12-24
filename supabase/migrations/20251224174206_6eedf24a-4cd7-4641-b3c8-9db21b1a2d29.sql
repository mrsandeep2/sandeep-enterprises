-- Allow admins to delete delivered or cancelled orders
CREATE POLICY "Admins can delete delivered or cancelled orders" 
ON public.orders 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND (status = 'delivered' OR status = 'cancelled')
);

-- Allow admins to delete order items for delivered or cancelled orders
CREATE POLICY "Admins can delete order items for completed orders" 
ON public.order_items 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.status = 'delivered' OR orders.status = 'cancelled')
  )
);
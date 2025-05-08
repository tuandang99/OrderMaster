import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, FileText, Truck, Info } from 'lucide-react';

// Định nghĩa schema cho form chỉnh sửa đơn hàng
const orderSchema = z.object({
  status: z.string({
    required_error: "Vui lòng chọn trạng thái đơn hàng",
  }),
  notes: z.string().optional(),
  shipping: z.object({
    carrier: z.string({
      required_error: "Vui lòng chọn đơn vị vận chuyển",
    }),
    trackingNumber: z.string().optional(),
    status: z.string().optional(),
  }),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function EditOrderPage() {
  const { id } = useParams();
  const orderId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch order statuses
  const { data: orderStatuses = [] } = useQuery({
    queryKey: ['/api/order-statuses'],
  });

  // Fetch shipping carriers
  const { data: shippingCarriers = [] } = useQuery({
    queryKey: ['/api/shipping-carriers'],
  });

  // Fetch order details
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useQuery({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId && !isNaN(orderId),
  });

  // Fetch shipping details
  const {
    data: shipping,
    isLoading: shippingLoading,
  } = useQuery({
    queryKey: ['/api/shipping', orderId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/shipping/${orderId}`);
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        console.error("Error fetching shipping data:", error);
        return null;
      }
    },
    enabled: !!orderId && !isNaN(orderId),
  });

  // Setup the form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      status: '',
      notes: '',
      shipping: {
        carrier: '',
        trackingNumber: '',
        status: '',
      },
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (order && shipping) {
      form.reset({
        status: order.status,
        notes: order.notes || '',
        shipping: {
          carrier: shipping.carrier,
          trackingNumber: shipping.trackingNumber || '',
          status: shipping.status || '',
        },
      });
    } else if (order) {
      form.reset({
        status: order.status,
        notes: order.notes || '',
        shipping: {
          carrier: 'ghn', // Default value
          trackingNumber: '',
          status: 'pending',
        },
      });
    }
  }, [order, shipping, form]);

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async (data: { status: string, notes: string }) => {
      return await apiRequest('PATCH', `/api/orders/${orderId}/status`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
      toast({
        title: 'Cập nhật trạng thái thành công',
        description: 'Trạng thái đơn hàng đã được cập nhật',
      });
    },
    onError: (error) => {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái đơn hàng',
        variant: 'destructive',
      });
    },
  });

  // Update shipping info mutation
  const updateShippingMutation = useMutation({
    mutationFn: async (data: { carrier: string, trackingNumber: string, status: string }) => {
      if (shipping) {
        return await apiRequest('PATCH', `/api/shipping/${shipping.id}`, data);
      } else {
        return await apiRequest('POST', `/api/shipping`, {
          ...data,
          orderId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping', orderId] });
      toast({
        title: 'Cập nhật thông tin vận chuyển thành công',
        description: 'Thông tin vận chuyển đã được cập nhật',
      });
    },
    onError: (error) => {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật thông tin vận chuyển',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  async function onSubmit(data: OrderFormValues) {
    try {
      // Update order status
      await updateOrderStatusMutation.mutateAsync({
        status: data.status,
        notes: data.notes || '',
      });

      // Update shipping info
      await updateShippingMutation.mutateAsync({
        carrier: data.shipping.carrier,
        trackingNumber: data.shipping.trackingNumber || '',
        status: data.shipping.status || 'pending',
      });

      // Navigate back to order detail page
      navigate(`/orders/${orderId}`);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  }

  if (orderLoading || shippingLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>Không thể tải thông tin đơn hàng</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/orders')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Translate status to Vietnamese
  const statusTranslations: Record<string, string> = {
    'pending': 'Chờ xử lý',
    'confirmed': 'Đã xác nhận',
    'shipping': 'Đang giao hàng',
    'completed': 'Hoàn tất',
    'cancelled': 'Đã hủy',
  };

  // Translate carrier to Vietnamese
  const carrierTranslations: Record<string, string> = {
    'ghn': 'Giao Hàng Nhanh',
    'ghtk': 'Giao Hàng Tiết Kiệm',
    'viettel_post': 'Viettel Post',
    'jt_express': 'J&T Express',
    'other': 'Khác',
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => navigate(`/orders/${orderId}`)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chỉnh sửa đơn hàng</h1>
            <p className="text-sm text-muted-foreground">
              {order?.orderNumber} {order?.customer?.name ? `- ${order.customer.name}` : ''}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">Thông tin đơn hàng</CardTitle>
                  <CardDescription>Cập nhật thông tin đơn hàng</CardDescription>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái đơn hàng</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orderStatuses.map((status: string) => (
                            <SelectItem key={status} value={status}>
                              {statusTranslations[status] || status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ghi chú đơn hàng</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập ghi chú cho đơn hàng"
                          className="resize-none"
                          rows={4}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">Thông tin vận chuyển</CardTitle>
                  <CardDescription>Cập nhật thông tin vận chuyển</CardDescription>
                </div>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="shipping.carrier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Đơn vị vận chuyển</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn đơn vị vận chuyển" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingCarriers.map((carrier: string) => (
                            <SelectItem key={carrier} value={carrier}>
                              {carrierTranslations[carrier] || carrier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shipping.trackingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã vận đơn</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập mã vận đơn"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Mã vận đơn để theo dõi trạng thái giao hàng
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shipping.status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái vận chuyển</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || 'pending'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái vận chuyển" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Chờ xử lý</SelectItem>
                          <SelectItem value="processing">Đang xử lý</SelectItem>
                          <SelectItem value="shipped">Đã giao cho đơn vị vận chuyển</SelectItem>
                          <SelectItem value="delivering">Đang giao hàng</SelectItem>
                          <SelectItem value="delivered">Đã giao hàng</SelectItem>
                          <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="gap-2"
              disabled={updateOrderStatusMutation.isPending || updateShippingMutation.isPending}
            >
              {(updateOrderStatusMutation.isPending || updateShippingMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
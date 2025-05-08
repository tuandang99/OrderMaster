import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

// Schema for product form
const productSchema = z.object({
  name: z.string().min(2, {
    message: 'Tên sản phẩm phải có ít nhất 2 ký tự',
  }),
  sku: z.string().min(3, {
    message: 'Mã SKU phải có ít nhất 3 ký tự',
  }),
  price: z.coerce.number().min(0, {
    message: 'Giá sản phẩm không được âm',
  }),
  cost: z.coerce.number().min(0, {
    message: 'Giá vốn không được âm',
  }).optional(),
  stock: z.coerce.number().min(0, {
    message: 'Số lượng tồn kho không được âm',
  }).optional(),
  weight: z.coerce.number().min(0, {
    message: 'Khối lượng không được âm',
  }).optional(),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProduct() {
  const [, navigate] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const productId = parseInt(id);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['/api/products', productId],
    enabled: !!productId && !isNaN(productId),
  });

  // Form setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      cost: 0,
      stock: 0,
      weight: 0,
      description: '',
    },
    mode: 'onChange',
  });

  // Update form when product data is loaded
  useState(() => {
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        price: product.price,
        cost: product.cost || 0,
        stock: product.stock || 0,
        weight: product.weight || 0,
        description: product.description || '',
      });
    }
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      return await apiRequest('PATCH', `/api/products/${productId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      toast({
        title: 'Cập nhật thành công',
        description: 'Thông tin sản phẩm đã được cập nhật',
      });
      navigate(`/products/${productId}`);
    },
    onError: (error) => {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật thông tin sản phẩm',
        variant: 'destructive',
      });
    },
  });

  // Submit handler
  function onSubmit(data: ProductFormValues) {
    updateMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>Không thể tải thông tin sản phẩm</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => navigate(`/products/${productId}`)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <h1 className="text-2xl font-bold">Chỉnh sửa sản phẩm</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>
              Thông tin chính của sản phẩm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên sản phẩm</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên sản phẩm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập mã SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập mô tả sản phẩm" 
                          className="min-h-[120px]" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Giá và kho</CardTitle>
              <CardDescription>
                Thông tin về giá và tình trạng kho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giá bán</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Nhập giá bán" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giá vốn</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Nhập giá vốn" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Separator className="my-2" />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tồn kho</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Nhập số lượng tồn kho" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Khối lượng (gram)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Nhập khối lượng" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/products/${productId}`)}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              form="product-form" 
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
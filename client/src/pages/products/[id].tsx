import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  ArrowLeft,
  Package2,
  Tag,
  DollarSign,
  ShoppingCart,
  ClipboardEdit,
  Archive,
  Loader2
} from 'lucide-react';

// Schema cho form quản lý kho
const inventoryFormSchema = z.object({
  type: z.enum(['add', 'subtract', 'set'], {
    required_error: "Vui lòng chọn loại thao tác",
  }),
  quantity: z.number({
    required_error: "Vui lòng nhập số lượng",
    invalid_type_error: "Giá trị phải là số",
  }).min(1, {
    message: "Số lượng phải lớn hơn 0",
  }),
  note: z.string().optional(),
});

export default function ProductDetailsPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const productId = parseInt(id);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  
  // Lấy thông tin sản phẩm
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['/api/products', productId],
    enabled: !!productId && !isNaN(productId),
  });
  
  // Lấy lịch sử nhập xuất kho
  const { data: inventoryHistory = [] } = useQuery({
    queryKey: ['/api/products', productId, 'inventory-history'],
    enabled: !!productId && !isNaN(productId),
  });
  
  // Form quản lý kho
  const inventoryForm = useForm<z.infer<typeof inventoryFormSchema>>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      type: 'add',
      quantity: 1,
      note: '',
    },
  });
  
  // Mutation cập nhật kho
  const updateInventoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inventoryFormSchema>) => {
      return await apiRequest(`/api/products/${productId}/inventory`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin kho",
      });
      setIsInventoryDialogOpen(false);
      inventoryForm.reset({
        type: 'add',
        quantity: 1,
        note: '',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId, 'inventory-history'] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: `Không thể cập nhật kho: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });
  
  // Xử lý submit form
  const handleInventorySubmit = (values: z.infer<typeof inventoryFormSchema>) => {
    updateInventoryMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-2 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/products')}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="h-64 bg-gray-200 rounded animate-pulse"></CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="h-32 bg-gray-200 rounded animate-pulse"></CardContent>
            </Card>
          </div>
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
            <CardDescription>
              {error ? `Lỗi: ${(error as Error).message}` : 'Không thể tải thông tin sản phẩm'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/products')}>
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
            onClick={() => setLocation('/products')}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết sản phẩm</h1>
        </div>
        <Button onClick={() => setLocation(`/products/edit/${product.id}`)}>
          <ClipboardEdit className="mr-2 h-4 w-4" />
          Chỉnh sửa sản phẩm
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <Badge variant="outline" className="mt-2">SKU: {product.sku}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description || 'Chưa có mô tả sản phẩm'}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Giá bán</span>
                  <span className="text-2xl font-semibold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Giá vốn</span>
                  <span className="text-xl font-medium">
                    {product.cost ? formatCurrency(product.cost) : 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Package2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Tồn kho</span>
                    <p className={`font-medium ${product.stock <= 10 ? 'text-destructive' : ''}`}>
                      {product.stock} sản phẩm
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Khối lượng</span>
                    <p className="font-medium">{product.weight ? `${product.weight}g` : 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              className="w-full mr-2"
              onClick={() => setIsInventoryDialogOpen(true)}
            >
              <Archive className="mr-2 h-4 w-4" />
              Quản lý kho
            </Button>

            <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Quản lý tồn kho</DialogTitle>
                  <DialogDescription>
                    Cập nhật số lượng tồn kho cho sản phẩm
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tồn kho hiện tại</p>
                      <p className="text-2xl font-bold">{product.stock || 0}</p>
                    </div>
                    {product.stock <= (product.lowStockAlert || 10) && (
                      <Badge variant="destructive">
                        Sắp hết hàng
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <Form {...inventoryForm}>
                    <form onSubmit={inventoryForm.handleSubmit(handleInventorySubmit)} className="space-y-4">
                      <FormField
                        control={inventoryForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loại thao tác</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại thao tác" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="add">Nhập kho</SelectItem>
                                <SelectItem value="subtract">Xuất kho</SelectItem>
                                <SelectItem value="set">Đặt số lượng</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={inventoryForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số lượng</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={inventoryForm.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ghi chú</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>

                  <div className="space-y-4">
                    <h4 className="font-medium">Lịch sử nhập xuất kho</h4>
                    <div className="max-h-[200px] overflow-y-auto">
                      {inventoryHistory.length > 0 ? (
                        <div className="space-y-2">
                          {inventoryHistory.map((record) => (
                            <div key={record.id} className="flex items-start justify-between p-2 bg-muted rounded">
                              <div>
                                <p className="font-medium">
                                  {record.type === 'add' ? 'Nhập kho' : 
                                   record.type === 'subtract' ? 'Xuất kho' : 'Điều chỉnh'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {record.note || 'Không có ghi chú'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={cn(
                                  "font-medium",
                                  record.type === 'add' ? 'text-green-600' :
                                  record.type === 'subtract' ? 'text-red-600' : ''
                                )}>
                                  {record.type === 'add' ? '+' : record.type === 'subtract' ? '-' : ''}{record.quantity}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(record.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          Chưa có lịch sử nhập xuất kho
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInventoryDialogOpen(false)}>
                    Đóng
                  </Button>
                  <Button 
                    type="submit"
                    onClick={inventoryForm.handleSubmit(handleInventorySubmit)}
                    disabled={updateInventoryMutation.isPending}
                  >
                    {updateInventoryMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Cập nhật'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button className="w-full" onClick={() => setLocation('/orders/new')}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Tạo đơn hàng
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Đã bán</h4>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Doanh thu</h4>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(0)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Đơn hàng gần đây</h4>
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Chưa có đơn hàng nào</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setLocation('/orders')}>
                Xem tất cả đơn hàng
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biến thể sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                <p>Sản phẩm này không có biến thể</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlusCircle, Trash2, ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, carrierTranslations } from "@/lib/utils";

// Define form validation schema
const OrderFormSchema = z.object({
  customer: z.object({
    name: z.string().min(2, { message: "Tên khách hàng phải có ít nhất 2 ký tự" }),
    phone: z.string().min(10, { message: "Số điện thoại không hợp lệ" }),
    address: z.string().min(5, { message: "Địa chỉ không được để trống" }),
    email: z.string().email({ message: "Email không hợp lệ" }).optional().or(z.literal("")),
  }),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1, { message: "Số lượng phải lớn hơn 0" }),
      price: z.number().min(0, { message: "Giá phải lớn hơn hoặc bằng 0" }),
    })
  ).min(1, { message: "Đơn hàng phải có ít nhất một sản phẩm" }),
  shipping: z.object({
    cost: z.number().min(0, { message: "Phí vận chuyển phải lớn hơn hoặc bằng 0" }),
    carrier: z.string().min(1, { message: "Vui lòng chọn đơn vị vận chuyển" }),
  }),
  notes: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof OrderFormSchema>;

export default function NewOrderPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch products for dropdown
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  // Fetch shipping carriers
  const { data: shippingCarriers, isLoading: carriersLoading } = useQuery({
    queryKey: ["/api/shipping-carriers"],
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      return await apiRequest("POST", "/api/orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Đơn hàng đã được tạo",
        description: "Đơn hàng mới đã được tạo thành công",
      });
      navigate("/orders");
    },
    onError: (error) => {
      console.error("Error creating order:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Form initialization
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: {
      customer: {
        name: "",
        phone: "",
        address: "",
        email: "",
      },
      items: [
        {
          productId: 0, // Đảm bảo là số nguyên
          quantity: 1,
          price: 0,
        },
      ],
      shipping: {
        cost: 30000, // Default shipping cost
        carrier: "",
      },
      notes: "",
    },
  });

  // Field array for managing order items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch for changes in form values to calculate totals
  const watchItems = form.watch("items");
  const watchShippingCost = form.watch("shipping.cost");

  // Calculate totals when item quantities or prices change
  useEffect(() => {
    const newSubtotal = watchItems.reduce(
      (sum, item) => sum + (item.quantity * item.price),
      0
    );
    setSubtotal(newSubtotal);
    setTotal(newSubtotal + (watchShippingCost || 0));
  }, [watchItems, watchShippingCost]);

  // Handle product selection
  const handleProductSelect = (value: string, index: number) => {
    // Đảm bảo chuyển đổi thành số nguyên
    const productId = Number(value);
    const selectedProduct = products?.data?.find((p: any) => p.id === productId);
    
    if (selectedProduct) {
      const updatedItems = [...form.getValues("items")];
      updatedItems[index] = {
        ...updatedItems[index],
        productId: Number(productId), // Đảm bảo là số nguyên
        price: selectedProduct.price,
      };
      form.setValue("items", updatedItems);
    }
  };

  // Submit form
  const onSubmit = (data: OrderFormValues) => {
    // Đảm bảo dữ liệu được chuyển đổi đúng kiểu trước khi gửi
    const formattedData = {
      ...data,
      items: data.items.map(item => ({
        ...item,
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        price: Number(item.price)
      })),
      shipping: {
        ...data.shipping,
        cost: Number(data.shipping.cost)
      }
    };
    createOrderMutation.mutate(formattedData);
  };

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4"
          onClick={() => navigate("/orders")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo đơn hàng mới</h1>
          <p className="text-sm font-medium text-gray-500">Điền thông tin để tạo đơn hàng</p>
        </div>
      </div>

      {(productsLoading || carriersLoading) ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customer.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên khách hàng <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên khách hàng" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập số điện thoại" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập email (không bắt buộc)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customer.address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Địa chỉ giao hàng <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Nhập địa chỉ giao hàng" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Sản phẩm</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => append({ productId: Number(0), quantity: Number(1), price: Number(0) })}
                    className="gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Thêm sản phẩm
                  </Button>
                </div>

                <div className="overflow-hidden border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn giá
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thành tiền
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Hành động</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fields.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Select
                              onValueChange={(value) => handleProductSelect(value, index)}
                              value={form.getValues(`items.${index}.productId`).toString()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn sản phẩm" />
                              </SelectTrigger>
                              <SelectContent>
                                {products?.data?.map((product: any) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.items?.[index]?.productId && (
                              <p className="text-xs text-red-500 mt-1">
                                {form.formState.errors.items[index]?.productId?.message}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Input
                              type="number"
                              min="0"
                              {...form.register(`items.${index}.price`, { valueAsNumber: true })}
                              readOnly
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Input
                              type="number"
                              min="1"
                              {...form.register(`items.${index}.quantity`, { 
                                valueAsNumber: true,
                                onChange: (e) => {
                                  // Đảm bảo là số
                                  const quantity = parseInt(e.target.value) || 0;
                                  // Cập nhật giá trị
                                  const updatedItems = [...form.getValues("items")];
                                  updatedItems[index] = {
                                    ...updatedItems[index],
                                    quantity: quantity
                                  };
                                  form.setValue("items", updatedItems, { shouldValidate: true });
                                }
                              })}
                              className="w-20"
                            />
                            {form.formState.errors.items?.[index]?.quantity && (
                              <p className="text-xs text-red-500 mt-1">
                                {form.formState.errors.items[index]?.quantity?.message}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatCurrency(
                              form.getValues(`items.${index}.price`) *
                                form.getValues(`items.${index}.quantity`)
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => fields.length > 1 && remove(index)}
                              disabled={fields.length <= 1}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết vận chuyển & thanh toán</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="shipping.carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đơn vị vận chuyển <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn đơn vị vận chuyển" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shippingCarriers?.map((carrier: string) => (
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
                    name="shipping.cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phí vận chuyển <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Nhập phí vận chuyển"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel>Ghi chú đơn hàng</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Thêm ghi chú về đơn hàng (tùy chọn)"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-6 space-y-2">
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tạm tính:</span>
                    <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phí vận chuyển:</span>
                    <span className="text-sm font-medium">{formatCurrency(watchShippingCost || 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold">Tổng cộng:</span>
                    <span className="text-base font-bold">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/orders")}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={createOrderMutation.isPending}
                className="gap-2"
              >
                {createOrderMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Calculator className="w-4 h-4" />
                )}
                Tạo đơn hàng
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

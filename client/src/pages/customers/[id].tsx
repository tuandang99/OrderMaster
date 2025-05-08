import { useParams, Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  ClipboardEdit,
  ShoppingCart,
  Package,
  Calendar
} from 'lucide-react';

export default function CustomerDetailsPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const customerId = parseInt(id);

  // Fetch customer details
  const { data: customer, isLoading: customerLoading, error: customerError } = useQuery({
    queryKey: ['/api/customers', customerId],
    enabled: !!customerId && !isNaN(customerId),
  });

  // Fetch customer's orders
  const { data: customerOrders, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ['/api/orders', { customerId }],
    queryFn: async () => {
      const response = await fetch(`/api/orders?customerId=${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!customerId && !isNaN(customerId),
  });

  if (customerLoading || ordersLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-2 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/customers')}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
              ))}
            </CardContent>
          </Card>
          <div className="md:col-span-2">
            <div className="h-10 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="container py-6">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>
              Không tìm thấy khách hàng hoặc có lỗi khi tải dữ liệu
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/customers')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách khách hàng
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Calculate customer stats
  const orders = customerOrders?.orders || [];
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
  const lastOrderDate = orders.length > 0 
    ? new Date(orders[0].orderDate) 
    : null;

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/customers')}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết khách hàng</h1>
        </div>
        <Button onClick={() => setLocation(`/customers/edit/${customer.id}`)}>
          <ClipboardEdit className="mr-2 h-4 w-4" />
          Chỉnh sửa thông tin
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Thông tin khách hàng */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tên khách hàng</p>
                <p className="font-medium">{customer.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>
            {customer.email && (
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Địa chỉ</p>
                <p className="font-medium whitespace-pre-wrap">
                  {customer.address}
                  {customer.ward && `, ${customer.ward}`}
                  {customer.district && `, ${customer.district}`}
                  {customer.province && `, ${customer.province}`}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-medium">Tổng quan mua hàng</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                  <p className="text-xl font-bold">{totalOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng chi tiêu</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lần mua gần nhất</p>
                <p className="font-medium">
                  {lastOrderDate ? formatDate(lastOrderDate) : 'Chưa có đơn hàng'}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setLocation('/orders/new')}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Tạo đơn hàng mới
            </Button>
          </CardFooter>
        </Card>

        {/* Tab lịch sử đơn hàng và chi tiết */}
        <div className="md:col-span-2">
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Lịch sử đơn hàng</TabsTrigger>
              <TabsTrigger value="stats">Thống kê chi tiết</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử đơn hàng</CardTitle>
                  <CardDescription>
                    {totalOrders > 0 
                      ? `Khách hàng có ${totalOrders} đơn hàng`
                      : 'Khách hàng chưa có đơn hàng nào'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between border-b pb-4">
                          <div className="flex items-start space-x-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium hover:text-primary">
                                <Link href={`/orders/${order.id}`}>
                                  {order.orderNumber}
                                </Link>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(order.orderDate)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(order.total)}</div>
                            <Badge 
                              className={
                                order.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                order.status === 'shipping' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                'bg-gray-100 text-gray-800 hover:bg-gray-100'
                              }
                              variant="outline"
                            >
                              {order.status === 'pending' ? 'Chờ xử lý' : 
                               order.status === 'confirmed' ? 'Đã xác nhận' :
                               order.status === 'shipping' ? 'Đang giao' :
                               order.status === 'completed' ? 'Hoàn tất' : 'Đã hủy'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>Khách hàng chưa có đơn hàng nào</p>
                      <Button className="mt-4" onClick={() => setLocation('/orders/new')}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Tạo đơn hàng mới
                      </Button>
                    </div>
                  )}
                </CardContent>
                {orders.length > 0 && (
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => setLocation('/orders')}>
                      Xem tất cả đơn hàng
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê chi tiết</CardTitle>
                  <CardDescription>
                    Phân tích chi tiết hành vi mua hàng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm font-medium">
                            Giá trị đơn hàng trung bình
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold">
                            {totalOrders > 0
                              ? formatCurrency(totalSpent / totalOrders)
                              : formatCurrency(0)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm font-medium">
                            Sản phẩm đã mua
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold">
                            {orders.reduce((count: number, order: any) => {
                              return count + (order.items?.length || 0);
                            }, 0)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Sản phẩm mua nhiều nhất</h3>
                      {orders.length > 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <p>Tính năng đang được phát triển</p>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <p>Khách hàng chưa có đơn hàng nào</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
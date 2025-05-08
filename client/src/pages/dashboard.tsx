import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Package, Users, Truck, Store, ShoppingCart, BarChart as BarChartIcon, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Link } from "wouter";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  shippingOrdersCount: number;
  newCustomersCount: number;
  salesByDay: { name: string; total: number }[];
  ordersByStatus: { name: string; value: number }[];
  topProducts: { id: number; name: string; quantity: number }[];
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  recentOrders: any[];
}

export default function DashboardPage() {
  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  // Hiển thị skeleton khi đang tải
  if (statsLoading) {
    return (
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="h-10 w-36 rounded-md bg-gray-200 animate-pulse"></div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/orders/new">
          <a className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Tạo đơn hàng mới
          </a>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.recentOrders.length || 0} đơn trong 7 ngày qua
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardStats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Tổng doanh thu từ tất cả đơn hàng
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang giao hàng</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.shippingOrdersCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Đơn hàng đang trong quá trình vận chuyển
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng mới</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{dashboardStats?.newCustomersCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Khách hàng mới trong 30 ngày qua
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-7">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Doanh thu theo ngày</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dashboardStats?.salesByDay || []}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value / 1000000}tr`}
                    />
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Bar
                      dataKey="total"
                      fill="#4F46E5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Đơn hàng theo trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart layout="vertical" data={dashboardStats?.ordersByStatus || []}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0EA5E9" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Đơn hàng gần đây</CardTitle>
                <CardDescription>
                  {dashboardStats?.recentOrders.length || 0} đơn hàng được tạo trong 7 ngày qua
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardStats?.recentOrders.length ? (
                  <div className="space-y-3">
                    {dashboardStats.recentOrders.slice(0, 3).map(order => (
                      <div key={order.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(order.orderDate)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.total)}</div>
                          <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {order.status === 'pending' ? 'Chờ xử lý' : 
                             order.status === 'confirmed' ? 'Đã xác nhận' :
                             order.status === 'shipping' ? 'Đang giao' :
                             order.status === 'completed' ? 'Hoàn tất' : 'Đã hủy'}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Link href="/orders">
                      <a className="text-sm text-primary hover:underline block pt-2">Xem tất cả đơn hàng →</a>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Chưa có đơn hàng nào trong 7 ngày qua
                    <div className="mt-2">
                      <Link href="/orders">
                        <a className="text-sm text-primary hover:underline">Xem tất cả đơn hàng →</a>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Sản phẩm bán chạy</CardTitle>
                <CardDescription>
                  Top sản phẩm bán chạy
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardStats?.topProducts && dashboardStats.topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardStats.topProducts.map(product => (
                      <div key={product.id} className="flex justify-between items-center border-b pb-2">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Đã bán: {product.quantity}
                        </div>
                      </div>
                    ))}
                    <Link href="/products">
                      <a className="text-sm text-primary hover:underline block pt-2">Xem tất cả sản phẩm →</a>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Chưa có dữ liệu sản phẩm bán chạy
                    <div className="mt-2">
                      <Link href="/products">
                        <a className="text-sm text-primary hover:underline">Xem tất cả sản phẩm →</a>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Phân tích Chi tiết</CardTitle>
              <CardDescription>
                Phân tích chi tiết về doanh thu và đơn hàng theo thời gian
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={dashboardStats?.revenueByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" />
                  <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === "revenue") return formatCurrency(value as number);
                      return value;
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F46E5"
                    name="Doanh thu"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#F59E0B"
                    name="Đơn hàng"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

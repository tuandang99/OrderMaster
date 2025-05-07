import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Package, Users, Truck, Store, ShoppingCart, BarChart as BarChartIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";

export default function DashboardPage() {
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Sample data for charts
  const salesData = [
    { name: "T2", total: 8500000 },
    { name: "T3", total: 12000000 },
    { name: "T4", total: 6700000 },
    { name: "T5", total: 9300000 },
    { name: "T6", total: 14200000 },
    { name: "T7", total: 21500000 },
    { name: "CN", total: 10900000 },
  ];

  const statusData = [
    { name: "Chờ xử lý", value: 15 },
    { name: "Đã xác nhận", value: 24 },
    { name: "Đang giao", value: 18 },
    { name: "Hoàn tất", value: 42 },
    { name: "Đã hủy", value: 3 },
  ];

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
            <div className="text-2xl font-bold">{ordersLoading ? "..." : orders?.total || 124}</div>
            <p className="text-xs text-muted-foreground">
              +8% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(165400000)}</div>
            <p className="text-xs text-muted-foreground">
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang giao hàng</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              5 đơn giao hôm nay
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng mới</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+32</div>
            <p className="text-xs text-muted-foreground">
              +18% so với tháng trước
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
                  <BarChart data={salesData}>
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
                  <BarChart layout="vertical" data={statusData}>
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
                  {ordersLoading ? "Đang tải..." : `${orders?.total || 5} đơn hàng được tạo trong tuần này`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/orders">
                  <a className="text-sm text-primary hover:underline">Xem tất cả đơn hàng →</a>
                </Link>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Sản phẩm bán chạy</CardTitle>
                <CardDescription>
                  Top sản phẩm bán chạy trong tháng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/products">
                  <a className="text-sm text-primary hover:underline">Xem tất cả sản phẩm →</a>
                </Link>
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
                  data={[
                    { month: "Tháng 1", revenue: 120000000, orders: 60 },
                    { month: "Tháng 2", revenue: 145000000, orders: 85 },
                    { month: "Tháng 3", revenue: 135000000, orders: 70 },
                    { month: "Tháng 4", revenue: 180000000, orders: 90 },
                    { month: "Tháng 5", revenue: 165000000, orders: 82 },
                  ]}
                >
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

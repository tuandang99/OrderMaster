import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, Calendar, BarChart2, PieChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { formatCurrency, exportToExcel, orderStatusTranslations } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ReportsIndex() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  // Fetch orders for reports, filtered by date range
  const { data: ordersData, isLoading } = useQuery({
    queryKey: [
      "/api/orders",
      {
        dateFrom: dateRange.from?.toISOString(),
        dateTo: dateRange.to?.toISOString(),
        limit: 1000, // Get a large number for reporting
      },
    ],
  });

  // Prepare data for charts
  const prepareStatusData = () => {
    if (!ordersData?.orders) return [];
    
    const statusCounts: Record<string, number> = {};
    
    ordersData.orders.forEach((order: any) => {
      if (statusCounts[order.status]) {
        statusCounts[order.status]++;
      } else {
        statusCounts[order.status] = 1;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: orderStatusTranslations[status] || status,
      value: count,
    }));
  };

  const prepareRevenueByDateData = () => {
    if (!ordersData?.orders) return [];
    
    const revenueByDate: Record<string, number> = {};
    
    ordersData.orders.forEach((order: any) => {
      const date = new Date(order.orderDate).toISOString().split('T')[0];
      if (revenueByDate[date]) {
        revenueByDate[date] += order.total;
      } else {
        revenueByDate[date] = order.total;
      }
    });
    
    // Sort dates chronologically
    return Object.entries(revenueByDate)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('vi-VN'),
        revenue: amount,
      }));
  };

  const prepareCarrierData = () => {
    if (!ordersData?.orders) return [];
    
    const carrierCounts: Record<string, number> = {};
    
    ordersData.orders.forEach((order: any) => {
      if (order.shipping?.carrier) {
        if (carrierCounts[order.shipping.carrier]) {
          carrierCounts[order.shipping.carrier]++;
        } else {
          carrierCounts[order.shipping.carrier] = 1;
        }
      }
    });
    
    return Object.entries(carrierCounts).map(([carrier, count]) => ({
      name: carrier,
      value: count,
    }));
  };

  const calculateTotalRevenue = () => {
    if (!ordersData?.orders) return 0;
    
    return ordersData.orders.reduce((sum: number, order: any) => {
      // Only count completed and shipping orders
      if (order.status === 'completed' || order.status === 'shipping') {
        return sum + order.total;
      }
      return sum;
    }, 0);
  };

  const calculateTotalOrders = () => {
    return ordersData?.orders?.length || 0;
  };

  const calculateAverageOrderValue = () => {
    if (!ordersData?.orders || !ordersData.orders.length) return 0;
    
    const totalRevenue = calculateTotalRevenue();
    const completedOrShippingOrders = ordersData.orders.filter(
      (order: any) => order.status === 'completed' || order.status === 'shipping'
    ).length;
    
    return completedOrShippingOrders ? totalRevenue / completedOrShippingOrders : 0;
  };

  const calculateCancellationRate = () => {
    if (!ordersData?.orders || !ordersData.orders.length) return 0;
    
    const cancelledOrders = ordersData.orders.filter(
      (order: any) => order.status === 'cancelled'
    ).length;
    
    return (cancelledOrders / ordersData.orders.length) * 100;
  };

  // Export reports to Excel
  const handleExportSalesReport = () => {
    if (!ordersData?.orders) return;
    
    const exportData = ordersData.orders.map((order: any) => ({
      'Mã đơn hàng': order.orderNumber,
      'Khách hàng': order.customer.name,
      'Ngày đặt hàng': new Date(order.orderDate).toLocaleDateString('vi-VN'),
      'Trạng thái': orderStatusTranslations[order.status] || order.status,
      'Tạm tính': formatCurrency(order.subtotal),
      'Phí vận chuyển': formatCurrency(order.shippingCost),
      'Tổng tiền': formatCurrency(order.total),
      'Đơn vị vận chuyển': order.shipping?.carrier || "Chưa có",
      'Mã vận đơn': order.shipping?.trackingNumber || "Chưa có",
    }));
    
    exportToExcel(exportData, `Bao_cao_doanh_thu_${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Xuất file thành công",
      description: "Báo cáo doanh thu đã được xuất ra file Excel",
    });
  };

  // Colors for charts
  const COLORS = ['#4F46E5', '#0EA5E9', '#EAB308', '#10B981', '#EF4444', '#6366F1'];
  const statusData = prepareStatusData();
  const revenueData = prepareRevenueByDateData();
  const carrierData = prepareCarrierData();

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
      <div className="md:flex md:items-center md:justify-between md:space-x-5">
        <div className="flex items-start space-x-5">
          <div className="pt-1.5">
            <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
            <p className="text-sm font-medium text-gray-500">Phân tích doanh thu và đơn hàng</p>
          </div>
        </div>
        <div className="flex mt-6 space-x-3 md:mt-0 md:ml-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportSalesReport}
            disabled={isLoading || !ordersData?.orders?.length}
          >
            <FileDown className="w-4 h-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-700">Khoảng thời gian</h3>
              </div>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                className="w-auto min-w-[300px]"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(calculateTotalRevenue())}</div>
                  <p className="text-xs text-muted-foreground">
                    Trong khoảng thời gian đã chọn
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateTotalOrders()}</div>
                  <p className="text-xs text-muted-foreground">
                    Trong khoảng thời gian đã chọn
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Giá trị đơn trung bình</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(calculateAverageOrderValue())}</div>
                  <p className="text-xs text-muted-foreground">
                    Dựa trên đơn đã hoàn thành/đang giao
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tỷ lệ hủy đơn</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculateCancellationRate().toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Tỷ lệ đơn hàng bị hủy
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="revenue" className="space-y-6">
              <TabsList>
                <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
                <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
                <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
              </TabsList>
              
              <TabsContent value="revenue" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Doanh thu theo ngày</CardTitle>
                    <CardDescription>
                      Biểu đồ doanh thu theo từng ngày trong khoảng thời gian đã chọn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={revenueData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 50,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            angle={-45} 
                            textAnchor="end"
                            height={70}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}tr`}
                          />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Doanh thu"
                            stroke="#4F46E5"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="orders" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Đơn hàng theo trạng thái</CardTitle>
                    <CardDescription>
                      Phân bổ đơn hàng theo trạng thái trong khoảng thời gian đã chọn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <div className="flex flex-col md:flex-row items-center justify-center w-full h-full">
                          <RechartsPieChart width={300} height={300}>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} đơn hàng`, 'Số lượng']} />
                          </RechartsPieChart>
                          <div className="mt-4 md:mt-0 md:ml-10">
                            <h4 className="text-sm font-semibold mb-2">Chi tiết</h4>
                            <ul className="space-y-2">
                              {statusData.map((entry, index) => (
                                <li key={index} className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded-full mr-2"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  ></div>
                                  <span>{entry.name}: {entry.value} đơn hàng</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="shipping" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Đơn hàng theo đơn vị vận chuyển</CardTitle>
                    <CardDescription>
                      Phân bổ đơn hàng theo đơn vị vận chuyển
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={carrierData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} đơn hàng`, 'Số lượng']} />
                          <Legend />
                          <Bar dataKey="value" name="Số đơn hàng" fill="#0EA5E9" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

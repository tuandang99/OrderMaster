import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Truck, RefreshCw, FileDown, Search } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency, formatDate, orderStatusColors, orderStatusTranslations, carrierTranslations, exportToExcel } from "@/lib/utils";

export default function ShippingIndex() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    search: "",
    status: "shipping",
    carrier: "all",
    page: 1,
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
  });

  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: searchParams.dateFrom,
    to: searchParams.dateTo,
  });

  // Fetch orders with shipping status
  const {
    data: ordersData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "/api/orders",
      {
        status: searchParams.status,
        carrier: searchParams.carrier !== "all" ? searchParams.carrier : undefined,
        dateFrom: dateRange.from?.toISOString(),
        dateTo: dateRange.to?.toISOString(),
        search: searchParams.search,
        page: searchParams.page,
      },
    ],
  });

  // Fetch shipping carriers for dropdown
  const { data: carriersData } = useQuery({
    queryKey: ["/api/shipping-carriers"],
  });

  // Update shipping status mutation
  const updateShippingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PATCH", `/api/shipping/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin vận chuyển đã được cập nhật.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin vận chuyển.",
        variant: "destructive",
      });
    },
  });

  const handleFilterChange = (field: string, value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      [field]: value,
      page: 1, // Reset page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    setSearchParams((prev) => ({
      ...prev,
      page: 1, // Reset page when date range changes
    }));
  };

  const handleExportExcel = () => {
    if (!ordersData?.orders) return;
    
    const exportData = ordersData.orders.map((order) => ({
      'Mã đơn hàng': order.orderNumber,
      'Khách hàng': order.customer.name,
      'SĐT': order.customer.phone,
      'Địa chỉ': order.customer.address,
      'Ngày đặt hàng': formatDate(order.orderDate),
      'Đơn vị vận chuyển': carrierTranslations[order.shipping?.carrier] || "Chưa có",
      'Mã vận đơn': order.shipping?.trackingNumber || "Chưa có",
      'Trạng thái': orderStatusTranslations[order.status] || order.status,
      'Tổng tiền': formatCurrency(order.total),
    }));
    
    exportToExcel(exportData, 'Danh_sach_van_chuyen');
    
    toast({
      title: "Xuất file thành công",
      description: "Danh sách vận chuyển đã được xuất ra file Excel",
    });
  };

  const handleTrackingStatus = (orderId: number, shippingId: number) => {
    // In a real application, this would call the shipping API to get the latest status
    // For this example, we'll just update with a mock status
    updateShippingMutation.mutate({
      id: shippingId,
      data: {
        status: "Đang vận chuyển",
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const columns = [
    {
      accessorKey: "orderNumber",
      header: "Mã đơn hàng",
      cell: ({ row }) => (
        <Button
          variant="link"
          onClick={() => navigate(`/orders/${row.original.id}`)}
          className="p-0 font-medium text-primary"
        >
          {row.original.orderNumber}
        </Button>
      ),
    },
    {
      accessorKey: "customer.name",
      header: "Khách hàng",
    },
    {
      accessorKey: "orderDate",
      header: "Ngày đặt",
      cell: ({ row }) => formatDate(row.original.orderDate),
    },
    {
      accessorKey: "shipping.carrier",
      header: "Đơn vị vận chuyển",
      cell: ({ row }) => 
        row.original.shipping?.carrier 
          ? carrierTranslations[row.original.shipping.carrier] 
          : "Chưa gán",
    },
    {
      accessorKey: "shipping.trackingNumber",
      header: "Mã vận đơn",
      cell: ({ row }) => row.original.shipping?.trackingNumber || "Chưa có",
    },
    {
      accessorKey: "shipping.status",
      header: "Trạng thái vận chuyển",
      cell: ({ row }) => (
        <Badge className={cn("text-xs font-semibold", orderStatusColors[row.original.status])}>
          {row.original.shipping?.status || "Chờ xử lý"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => navigate(`/orders/${row.original.id}`)}
          >
            Xem
          </Button>
          {row.original.shipping && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => handleTrackingStatus(row.original.id, row.original.shipping.id)}
            >
              <RefreshCw className="w-3 h-3" />
              Cập nhật
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
      <div className="md:flex md:items-center md:justify-between md:space-x-5">
        <div className="flex items-start space-x-5">
          <div className="pt-1.5">
            <h1 className="text-2xl font-bold text-gray-900">Quản lý vận chuyển</h1>
            <p className="text-sm font-medium text-gray-500">Theo dõi và cập nhật thông tin vận chuyển</p>
          </div>
        </div>
        <div className="flex mt-6 space-x-3 md:mt-0 md:ml-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportExcel}
            disabled={isLoading || !ordersData?.orders?.length}
          >
            <FileDown className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Button className="gap-2" onClick={() => navigate("/orders/new")}>
            <Truck className="w-4 h-4" />
            Tạo vận đơn
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
                  Đơn vị vận chuyển
                </label>
                <Select
                  value={searchParams.carrier}
                  onValueChange={(value) => handleFilterChange("carrier", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả đơn vị</SelectItem>
                    {carriersData?.map((carrier: string) => (
                      <SelectItem key={carrier} value={carrier}>
                        {carrierTranslations[carrier] || carrier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khoảng thời gian
                </label>
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                />
              </div>
              <div className="flex items-end">
                <div className="w-full">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Mã đơn hàng, khách hàng..."
                      className="pl-10"
                      value={searchParams.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={ordersData?.orders || []}
              noDataMessage="Không có đơn hàng vận chuyển nào"
            />
            <div className="flex items-center justify-between mt-6 px-2">
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{ordersData?.orders?.length || 0}</span> trong{" "}
                <span className="font-medium">{ordersData?.total || 0}</span> kết quả
              </p>
              <Pagination
                totalItems={ordersData?.total || 0}
                itemsPerPage={10}
                currentPage={searchParams.page}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

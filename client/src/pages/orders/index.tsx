import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BarChart, FileDown, Filter, PlusCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn, formatCurrency, formatDate, orderStatusColors, orderStatusTranslations, carrierTranslations, exportToExcel } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function OrdersIndex() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        search: urlParams.get("search") || "",
        status: urlParams.get("status") || "all",
        page: parseInt(urlParams.get("page") || "1", 10),
        dateFrom: urlParams.get("dateFrom") ? new Date(urlParams.get("dateFrom")!) : undefined,
        dateTo: urlParams.get("dateTo") ? new Date(urlParams.get("dateTo")!) : undefined,
      };
    }
    return {
      search: "",
      status: "all",
      page: 1,
      dateFrom: undefined,
      dateTo: undefined,
    };
  });

  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: searchParams.dateFrom,
    to: searchParams.dateTo,
  });

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (searchParams.search) params.append("search", searchParams.search);
    if (searchParams.status !== "all") params.append("status", searchParams.status);
    if (searchParams.page > 1) params.append("page", searchParams.page.toString());
    if (dateRange.from) params.append("dateFrom", dateRange.from.toISOString());
    if (dateRange.to) params.append("dateTo", dateRange.to.toISOString());
    return params.toString();
  };

  // Update URL when filters change
  useEffect(() => {
    const queryString = buildQueryString();
    window.history.replaceState(null, "", queryString ? `?${queryString}` : window.location.pathname);
  }, [searchParams, dateRange]);

  // Fetch orders with filters
  const {
    data: ordersData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "/api/orders",
      {
        status: searchParams.status !== "all" ? searchParams.status : undefined,
        dateFrom: dateRange.from?.toISOString(),
        dateTo: dateRange.to?.toISOString(),
        search: searchParams.search,
        page: searchParams.page,
      },
    ],
  });

  // Fetch order statuses for dropdown
  const { data: statusesData } = useQuery({
    queryKey: ["/api/order-statuses"],
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Trạng thái đã cập nhật",
        description: "Đơn hàng đã được cập nhật thành công.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

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
    
    // Tạo mảng các đơn hàng với các sản phẩm được trải phẳng
    let exportData = [];
    
    // Duyệt qua từng đơn hàng
    ordersData.orders.forEach((order) => {
      // Nếu đơn hàng không có sản phẩm, thêm một dòng cơ bản
      if (!order.items || order.items.length === 0) {
        exportData.push({
          'Mã đơn hàng': order.orderNumber,
          'Khách hàng': order.customer.name,
          'SĐT': order.customer.phone,
          'Địa chỉ': order.customer.address,
          'Ngày đặt hàng': formatDate(order.orderDate),
          'Số lượng SP': 0,
          'Tổng tiền': formatCurrency(order.total),
          'Trạng thái': orderStatusTranslations[order.status] || order.status,
          'Đơn vị vận chuyển': carrierTranslations[order.shipping?.carrier] || order.shipping?.carrier || 'Chưa có',
          'Mã vận đơn': order.shipping?.trackingNumber || 'Chưa có',
          'Mã sản phẩm': '',
          'Tên sản phẩm': '',
          'Đơn giá': '',
          'Số lượng': '',
          'Thành tiền': '',
        });
      } else {
        // Nếu đơn hàng có sản phẩm, thêm mỗi sản phẩm như một dòng riêng
        order.items.forEach((item, index) => {
          exportData.push({
            'Mã đơn hàng': order.orderNumber,
            'Khách hàng': order.customer.name,
            'SĐT': order.customer.phone,
            'Địa chỉ': order.customer.address,
            'Ngày đặt hàng': formatDate(order.orderDate),
            'Số lượng SP': order.items.reduce((total, item) => total + item.quantity, 0),
            'Tổng tiền': formatCurrency(order.total),
            'Trạng thái': orderStatusTranslations[order.status] || order.status,
            'Đơn vị vận chuyển': order.shipping?.carrier || 'Chưa có',
            'Mã vận đơn': order.shipping?.trackingNumber || 'Chưa có',
            'Mã sản phẩm': item.product.sku,
            'Tên sản phẩm': item.product.name,
            'Đơn giá': formatCurrency(item.price),
            'Số lượng': item.quantity,
            'Thành tiền': formatCurrency(item.subtotal),
          });
        });
      }
    });
    
    exportToExcel(exportData, 'Danh_sach_don_hang_chi_tiet');
    
    toast({
      title: "Xuất file thành công",
      description: "Danh sách đơn hàng và chi tiết sản phẩm đã được xuất ra file Excel",
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
      accessorKey: "items",
      header: "Số sản phẩm",
      cell: ({ row }) => {
        // Tính tổng số lượng sản phẩm từ tất cả các mục trong đơn hàng
        return row.original.items.reduce((total, item) => total + item.quantity, 0);
      },
    },
    {
      accessorKey: "total",
      header: "Tổng tiền",
      cell: ({ row }) => formatCurrency(row.original.total),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge className={cn("text-xs font-semibold", orderStatusColors[row.original.status])}>
          {orderStatusTranslations[row.original.status] || row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "shipping",
      header: "Vận chuyển",
      cell: ({ row }) => {
        const shipping = row.original.shipping;
        return shipping
          ? `${shipping.carrier} ${shipping.trackingNumber ? `#${shipping.trackingNumber}` : ""}`
          : "Chưa gán";
      },
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
          <Select
            value={row.original.status}
            onValueChange={(value) => handleStatusChange(row.original.id, value)}
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Cập nhật" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statusesData?.map((status: string) => (
                  <SelectItem key={status} value={status}>
                    {orderStatusTranslations[status] || status}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
      <div className="md:flex md:items-center md:justify-between md:space-x-5">
        <div className="flex items-start space-x-5">
          <div className="pt-1.5">
            <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
            <p className="text-sm font-medium text-gray-500">Quản lý và theo dõi đơn hàng khách hàng</p>
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
            <PlusCircle className="w-4 h-4" />
            Tạo đơn hàng
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <label htmlFor="order-status" className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <Select
                  value={searchParams.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    {statusesData?.map((status: string) => (
                      <SelectItem key={status} value={status}>
                        {orderStatusTranslations[status] || status}
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
                <Button 
                  className="w-full gap-2" 
                  variant="secondary"
                  onClick={() => {
                    setSearchParams({
                      search: "",
                      status: "all",
                      page: 1,
                      dateFrom: undefined,
                      dateTo: undefined,
                    });
                    setDateRange({});
                  }}
                >
                  <Filter className="w-4 h-4" />
                  Đặt lại bộ lọc
                </Button>
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
              searchable
              searchColumn="orderNumber"
              placeholderText="Tìm theo mã đơn hàng, tên khách hàng..."
              noDataMessage="Không có đơn hàng nào"
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

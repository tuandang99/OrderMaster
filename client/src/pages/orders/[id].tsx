import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Printer, Download, FileDown, AlertCircle, Check, Truck, Clock, XCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  orderStatusColors, 
  orderStatusTranslations, 
  carrierTranslations,
  downloadPdf 
} from "@/lib/utils";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [printRef, setPrintRef] = useState<HTMLDivElement | null>(null);

  // Fetch order details
  const { data: order, isLoading, isError } = useQuery({
    queryKey: [`/api/orders/${id}`],
  });

  // Fetch order statuses for dropdown
  const { data: statusesData } = useQuery({
    queryKey: ["/api/order-statuses"],
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
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

  // Update shipping info mutation
  const updateShippingMutation = useMutation({
    mutationFn: async (data: { trackingNumber: string }) => {
      return await apiRequest("PATCH", `/api/shipping/${order.shipping.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
      setIsShippingDialogOpen(false);
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

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  const handleShippingUpdate = () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Cảnh báo",
        description: "Vui lòng nhập mã vận đơn",
        variant: "destructive",
      });
      return;
    }
    updateShippingMutation.mutate({ trackingNumber });
  };

  const handlePrintOrder = () => {
    if (printRef) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Đơn hàng #${order?.orderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                h1 { color: #4F46E5; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                .columns { display: flex; justify-content: space-between; margin: 15px 0; }
                .column { width: 48%; }
                .footer { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
                .total { font-weight: bold; text-align: right; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Đơn hàng #${order?.orderNumber}</h1>
                <div>
                  <p>Ngày đặt: ${formatDate(order?.orderDate)}</p>
                  <p>Trạng thái: ${orderStatusTranslations[order?.status] || order?.status}</p>
                </div>
              </div>
              
              <div class="columns">
                <div class="column">
                  <h2>Thông tin khách hàng</h2>
                  <p>Tên: ${order?.customer.name}</p>
                  <p>SĐT: ${order?.customer.phone}</p>
                  <p>Email: ${order?.customer.email || "Không có"}</p>
                  <p>Địa chỉ: ${order?.customer.address}</p>
                </div>
                <div class="column">
                  <h2>Thông tin vận chuyển</h2>
                  <p>Đơn vị vận chuyển: ${carrierTranslations[order?.shipping?.carrier] || "Chưa có"}</p>
                  <p>Mã vận đơn: ${order?.shipping?.trackingNumber || "Chưa có"}</p>
                </div>
              </div>
              
              <h2>Sản phẩm</h2>
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Mã SP</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${order?.items.map(item => `
                    <tr>
                      <td>${item.product.name}</td>
                      <td>${item.product.sku}</td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrency(item.price)}</td>
                      <td>${formatCurrency(item.subtotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="footer">
                <p class="total">Tạm tính: ${formatCurrency(order?.subtotal)}</p>
                <p class="total">Phí vận chuyển: ${formatCurrency(order?.shippingCost)}</p>
                <p class="total">Tổng cộng: ${formatCurrency(order?.total)}</p>
              </div>
              
              <p>Ghi chú: ${order?.notes || "Không có"}</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleExportPdf = () => {
    if (printRef) {
      downloadPdf(printRef, `don-hang-${order?.orderNumber}`);
      toast({
        title: "Xuất PDF thành công",
        description: "Đơn hàng đã được xuất ra file PDF",
      });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/orders/${order.id}`);
    },
    onSuccess: () => {
      // Refresh orders list and dashboard stats
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Xóa đơn hàng thành công",
        description: "Đơn hàng đã được xóa khỏi hệ thống",
      });
      navigate("/orders");
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa đơn hàng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteOrder = () => {
    deleteMutation.mutate();
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Không thể tải thông tin đơn hàng</h2>
          <p className="text-gray-500 mb-4">Đã xảy ra lỗi khi tải thông tin đơn hàng. Vui lòng thử lại sau.</p>
          <Button onClick={() => navigate("/orders")}>Quay lại danh sách đơn hàng</Button>
        </div>
      </div>
    );
  }

  // Render the status icon based on order status
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-8 h-8 text-gray-400" />;
      case "confirmed":
        return <Check className="w-8 h-8 text-blue-500" />;
      case "shipping":
        return <Truck className="w-8 h-8 text-amber-500" />;
      case "completed":
        return <Check className="w-8 h-8 text-emerald-500" />;
      case "cancelled":
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Chi tiết đơn hàng #{order.orderNumber}
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Tạo ngày {formatDate(order.orderDate)}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="gap-2" onClick={handlePrintOrder}>
            <Printer className="w-4 h-4" />
            In đơn
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportPdf}>
            <FileDown className="w-4 h-4" />
            Xuất PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/orders/edit/${order.id}`)}>
            <ArrowLeft className="w-4 h-4" />
            Chỉnh sửa đơn hàng
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Xóa đơn hàng
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa đơn hàng</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa đơn hàng #{order.orderNumber}? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteOrder}>Xóa</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Select
            value={order.status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cập nhật trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {statusesData?.map((status: string) => (
                <SelectItem key={status} value={status}>
                  {orderStatusTranslations[status] || status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div ref={setPrintRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Thông tin đơn hàng</CardTitle>
            <Badge className={orderStatusColors[order.status]}>
              {orderStatusTranslations[order.status] || order.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Thông tin khách hàng</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">{order.customer.name}</p>
                  <p>{order.customer.phone}</p>
                  {order.customer.email && <p>{order.customer.email}</p>}
                  <p className="mt-1">{order.customer.address}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Thông tin vận chuyển</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Đơn vị vận chuyển: <span className="font-medium">{carrierTranslations[order.shipping?.carrier] || "Chưa có"}</span></p>
                  <p>Mã vận đơn: <span className="font-medium">{order.shipping?.trackingNumber || "Chưa có"}</span></p>
                  {order.shipping?.trackingNumber ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 text-primary hover:text-primary/80 h-auto mt-1"
                      onClick={() => {
                        setTrackingNumber(order.shipping?.trackingNumber || "");
                        setIsShippingDialogOpen(true);
                      }}
                    >
                      Cập nhật mã vận đơn
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 text-primary hover:text-primary/80 h-auto mt-1"
                      onClick={() => setIsShippingDialogOpen(true)}
                    >
                      Thêm mã vận đơn
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-2">Sản phẩm</h3>
            <div className="overflow-hidden border rounded-md mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã SP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đơn giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {order.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Ghi chú đơn hàng</h3>
                <p className="text-sm text-gray-600 border rounded-md p-4 bg-gray-50">
                  {order.notes}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tạm tính:</span>
                <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Phí vận chuyển:</span>
                <span className="text-sm font-medium">{formatCurrency(order.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-base font-bold">Tổng cộng:</span>
                <span className="text-base font-bold">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trạng thái đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                {renderStatusIcon(order.status)}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {orderStatusTranslations[order.status] || order.status}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Cập nhật lần cuối: {formatDateTime(order.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === "pending" || order.status === "confirmed" || order.status === "shipping" || order.status === "completed" ? "bg-green-100 text-green-500" : "bg-gray-100 text-gray-400"}`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Đơn hàng đã đặt</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.orderDate)}</p>
                  </div>
                </div>
                
                <div className="w-0.5 h-6 bg-gray-200 ml-4"></div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === "confirmed" || order.status === "shipping" || order.status === "completed" ? "bg-blue-100 text-blue-500" : "bg-gray-100 text-gray-400"}`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Đơn hàng xác nhận</p>
                    <p className="text-xs text-gray-500">
                      {order.status === "confirmed" || order.status === "shipping" || order.status === "completed" 
                        ? "Đã xác nhận" 
                        : "Đang chờ"}
                    </p>
                  </div>
                </div>
                
                <div className="w-0.5 h-6 bg-gray-200 ml-4"></div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === "shipping" || order.status === "completed" ? "bg-amber-100 text-amber-500" : "bg-gray-100 text-gray-400"}`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Đang giao hàng</p>
                    <p className="text-xs text-gray-500">
                      {order.status === "shipping" ? "Đang vận chuyển" : 
                       order.status === "completed" ? "Đã giao" : "Đang chờ"}
                    </p>
                  </div>
                </div>
                
                <div className="w-0.5 h-6 bg-gray-200 ml-4"></div>
                
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === "completed" ? "bg-emerald-100 text-emerald-500" : "bg-gray-100 text-gray-400"}`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Hoàn thành</p>
                    <p className="text-xs text-gray-500">
                      {order.status === "completed" ? "Đã hoàn thành" : "Đang chờ"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin vận chuyển</DialogTitle>
            <DialogDescription>
              Cập nhật mã vận đơn cho đơn hàng #{order.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="trackingNumber">Mã vận đơn</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Nhập mã vận đơn"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShippingDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleShippingUpdate} disabled={updateShippingMutation.isPending}>
              {updateShippingMutation.isPending ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { UserPlus, FileDown, Search, Pencil, AlertCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, exportToExcel } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define customer form schema
const customerFormSchema = z.object({
  name: z.string().min(2, { message: "Tên khách hàng phải có ít nhất 2 ký tự" }),
  phone: z.string().min(10, { message: "Số điện thoại không hợp lệ" }),
  address: z.string().min(5, { message: "Địa chỉ không được để trống" }),
  email: z.string().email({ message: "Email không hợp lệ" }).optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function CustomersIndex() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // Fetch customers
  const {
    data: customersData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/customers", { search: searchValue, page, limit: 10 }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchValue) params.append("search", searchValue);
      if (page) params.append("page", page.toString());
      params.append("limit", "10");
      
      const url = `/api/customers${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    }
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      return await apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Thành công",
        description: "Khách hàng mới đã được tạo.",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo khách hàng mới.",
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CustomerFormValues }) => {
      return await apiRequest("PATCH", `/api/customers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Thành công",
        description: "Thông tin khách hàng đã được cập nhật.",
      });
      setIsDialogOpen(false);
      setEditingCustomer(null);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin khách hàng.",
        variant: "destructive",
      });
    },
  });

  // Set up form with react-hook-form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      email: "",
    },
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setPage(1); // Reset to first page on search
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  // Open dialog for creating new customer
  const handleOpenNewCustomerDialog = () => {
    form.reset({
      name: "",
      phone: "",
      address: "",
      email: "",
    });
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing existing customer
  const handleOpenEditCustomerDialog = (customer: any) => {
    form.reset({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      email: customer.email || "",
    });
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  // Submit form
  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  // Export customers to Excel
  const handleExportExcel = () => {
    if (!customersData?.data) return;
    
    const exportData = customersData.data.map((customer: any) => ({
      'Tên khách hàng': customer.name,
      'Số điện thoại': customer.phone,
      'Email': customer.email || "",
      'Địa chỉ': customer.address,
      'Ngày tạo': formatDate(customer.createdAt),
    }));
    
    exportToExcel(exportData, 'Danh_sach_khach_hang');
    
    toast({
      title: "Xuất file thành công",
      description: "Danh sách khách hàng đã được xuất ra file Excel",
    });
  };

  // Get customers and pagination info from server
  const customers = customersData?.data || [];
  const totalItems = customersData?.total || 0;
  const itemsPerPage = 10;

  const columns = [
    {
      accessorKey: "name",
      header: "Tên khách hàng",
    },
    {
      accessorKey: "phone",
      header: "Số điện thoại",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "-",
    },
    {
      accessorKey: "address",
      header: "Địa chỉ",
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.original.address}>
          {row.original.address}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditCustomerDialog(row.original)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => navigate(`/customers/${row.original.id}`)}
          >
            Xem chi tiết
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
      <div className="md:flex md:items-center md:justify-between md:space-x-5">
        <div className="flex items-start space-x-5">
          <div className="pt-1.5">
            <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
            <p className="text-sm font-medium text-gray-500">Quản lý thông tin khách hàng</p>
          </div>
        </div>
        <div className="flex mt-6 space-x-3 md:mt-0 md:ml-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportExcel}
            disabled={isLoading || !customers?.length}
          >
            <FileDown className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Button className="gap-2" onClick={handleOpenNewCustomerDialog}>
            <UserPlus className="w-4 h-4" />
            Thêm khách hàng
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại, email..."
                className="pl-10"
                value={searchValue}
                onChange={handleSearchChange}
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-500">Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={customers}
              noDataMessage={searchValue ? "Không tìm thấy khách hàng phù hợp" : "Chưa có khách hàng nào"}
            />
            {customers.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-2">
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{Math.min(itemsPerPage, customers.length)}</span> trong{" "}
                  <span className="font-medium">{totalItems}</span> khách hàng
                </p>
                <Pagination
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  currentPage={page}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Cập nhật thông tin khách hàng" : "Thêm khách hàng mới"}</DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Cập nhật thông tin của khách hàng."
                : "Điền thông tin để thêm khách hàng mới."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
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
                name="phone"
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
                name="email"
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Nhập địa chỉ khách hàng" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                >
                  {(createCustomerMutation.isPending || updateCustomerMutation.isPending) ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    editingCustomer ? "Cập nhật" : "Thêm mới"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PackagePlus, FileDown, Search, Pencil, AlertCircle } from "lucide-react";
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
import { formatCurrency, formatDate, exportToExcel } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define product form schema
const productFormSchema = z.object({
  name: z.string().min(2, { message: "Tên sản phẩm phải có ít nhất 2 ký tự" }),
  sku: z.string().min(3, { message: "Mã SKU phải có ít nhất 3 ký tự" }),
  price: z.number().min(0, { message: "Giá phải lớn hơn hoặc bằng 0" }),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsIndex() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Fetch products
  const {
    data: productsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/products", { search: searchValue, page, limit: 10 }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchValue) params.append("search", searchValue);
      if (page) params.append("page", page.toString());
      params.append("limit", "10");
      
      const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    }
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Thành công",
        description: "Sản phẩm mới đã được tạo.",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo sản phẩm mới.",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductFormValues }) => {
      return await apiRequest("PATCH", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Thành công",
        description: "Thông tin sản phẩm đã được cập nhật.",
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin sản phẩm.",
        variant: "destructive",
      });
    },
  });

  // Set up form with react-hook-form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      price: 0,
      description: "",
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

  // Open dialog for creating new product
  const handleOpenNewProductDialog = () => {
    form.reset({
      name: "",
      sku: "",
      price: 0,
      description: "",
    });
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing existing product
  const handleOpenEditProductDialog = (product: any) => {
    form.reset({
      name: product.name,
      sku: product.sku,
      price: product.price,
      description: product.description || "",
    });
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  // Submit form
  const onSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  // Export products to Excel
  const handleExportExcel = () => {
    if (!productsData?.data) return;
    
    const exportData = productsData.data.map((product: any) => ({
      'Tên sản phẩm': product.name,
      'Mã SKU': product.sku,
      'Giá': formatCurrency(product.price),
      'Mô tả': product.description || "",
      'Ngày tạo': formatDate(product.createdAt),
    }));
    
    exportToExcel(exportData, 'Danh_sach_san_pham');
    
    toast({
      title: "Xuất file thành công",
      description: "Danh sách sản phẩm đã được xuất ra file Excel",
    });
  };

  // Get products and pagination info from server
  const products = productsData?.data || [];
  const totalItems = productsData?.total || 0;
  const itemsPerPage = 10;

  const columns = [
    {
      accessorKey: "name",
      header: "Tên sản phẩm",
    },
    {
      accessorKey: "sku",
      header: "Mã SKU",
    },
    {
      accessorKey: "price",
      header: "Giá",
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      accessorKey: "stock",
      header: "Tồn kho",
      cell: ({ row }) => (
        <div className={row.original.stock <= 10 ? "text-destructive font-medium" : ""}>
          {row.original.stock || 0} sản phẩm
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.original.description}>
          {row.original.description || "-"}
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
            onClick={() => handleOpenEditProductDialog(row.original)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => navigate(`/products/${row.original.id}`)}
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
            <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
            <p className="text-sm font-medium text-gray-500">Quản lý danh sách sản phẩm</p>
          </div>
        </div>
        <div className="flex mt-6 space-x-3 md:mt-0 md:ml-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportExcel}
            disabled={isLoading || !products.length}
          >
            <FileDown className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Button className="gap-2" onClick={handleOpenNewProductDialog}>
            <PackagePlus className="w-4 h-4" />
            Thêm sản phẩm
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
                placeholder="Tìm kiếm theo tên, mã SKU..."
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
              data={products}
              noDataMessage={searchValue ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm nào"}
            />
            {products.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-2">
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{Math.min(itemsPerPage, products.length)}</span> trong{" "}
                  <span className="font-medium">{totalItems}</span> sản phẩm
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
            <DialogTitle>{editingProduct ? "Cập nhật thông tin sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Cập nhật thông tin của sản phẩm."
                : "Điền thông tin để thêm sản phẩm mới."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên sản phẩm <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên sản phẩm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã SKU <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập mã SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Nhập giá sản phẩm" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Nhập mô tả sản phẩm" 
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
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    editingProduct ? "Cập nhật" : "Thêm mới"
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

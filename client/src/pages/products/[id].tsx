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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Package2,
  Tag,
  DollarSign,
  ShoppingCart,
  ClipboardEdit,
  Archive
} from 'lucide-react';

export default function ProductDetailsPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const productId = parseInt(id);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['/api/products', productId],
    enabled: !!productId && !isNaN(productId),
  });

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-2 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/products')}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="h-64 bg-gray-200 rounded animate-pulse"></CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="h-32 bg-gray-200 rounded animate-pulse"></CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-6">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>
              Không tìm thấy sản phẩm hoặc có lỗi khi tải dữ liệu
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách sản phẩm
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/products')}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết sản phẩm</h1>
        </div>
        <Button onClick={() => setLocation(`/products/edit/${product.id}`)}>
          <ClipboardEdit className="mr-2 h-4 w-4" />
          Chỉnh sửa sản phẩm
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <Badge variant="outline" className="mt-2">SKU: {product.sku}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description || 'Chưa có mô tả sản phẩm'}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Giá bán</span>
                  <span className="text-2xl font-semibold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Giá vốn</span>
                  <span className="text-xl font-medium">
                    {product.cost ? formatCurrency(product.cost) : 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Package2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Tồn kho</span>
                    <p className={`font-medium ${product.stock <= 10 ? 'text-destructive' : ''}`}>
                      {product.stock} sản phẩm
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Khối lượng</span>
                    <p className="font-medium">{product.weight ? `${product.weight}g` : 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" className="w-full mr-2" onClick={() => setLocation('/products')}>
              <Archive className="mr-2 h-4 w-4" />
              Quản lý kho
            </Button>
            <Button className="w-full" onClick={() => setLocation('/orders/new')}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Tạo đơn hàng
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Đã bán</h4>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Doanh thu</h4>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(0)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Đơn hàng gần đây</h4>
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Chưa có đơn hàng nào</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setLocation('/orders')}>
                Xem tất cả đơn hàng
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Biến thể sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                <p>Sản phẩm này không có biến thể</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
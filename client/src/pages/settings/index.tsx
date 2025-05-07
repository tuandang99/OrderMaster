import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ShippingCarrier {
  id: string;
  name: string;
  apiConnected: boolean;
}

interface ShippingSettings {
  defaultCarrier: string;
  apiKeys: Record<string, string>;
  defaultSettings: {
    insurance: boolean;
    requireSignature: boolean;
    autoCreateShipments: boolean;
  };
}

interface GeneralSettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  notifyCustomers: boolean;
  autoConfirmOrders: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  
  // Lấy danh sách đơn vị vận chuyển
  const { data: carriers } = useQuery<ShippingCarrier[]>({
    queryKey: ['/api/shipping-carriers/info'],
    refetchOnWindowFocus: false,
  });

  // ======================= GENERAL SETTINGS =======================
  const generalForm = useForm<GeneralSettings>({
    defaultValues: {
      companyName: '',
      address: '',
      phone: '',
      email: '',
      taxId: '',
      notifyCustomers: true,
      autoConfirmOrders: false,
    }
  });

  // Load general settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('generalSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      generalForm.reset(parsedSettings);
    }
  }, [generalForm]);

  // Save general settings
  const onSaveGeneralSettings = (data: GeneralSettings) => {
    localStorage.setItem('generalSettings', JSON.stringify(data));
    toast({
      title: "Cài đặt đã được lưu",
      description: "Thông tin cơ bản đã được cập nhật thành công",
    });
  };

  // ======================= SHIPPING SETTINGS =======================
  const shippingForm = useForm<ShippingSettings>({
    defaultValues: {
      defaultCarrier: '',
      apiKeys: {
        ghn: '',
        ghtk: '',
        viettel_post: '',
        jt_express: '',
      },
      defaultSettings: {
        insurance: true,
        requireSignature: false,
        autoCreateShipments: false,
      }
    }
  });

  // Load shipping settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('shippingSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      shippingForm.reset(parsedSettings);
    }
  }, [shippingForm]);

  // Save shipping settings
  const onSaveShippingSettings = async (data: ShippingSettings) => {
    localStorage.setItem('shippingSettings', JSON.stringify(data));
    
    // Hiển thị thông báo
    toast({
      title: "Cài đặt vận chuyển đã được lưu",
      description: "Thông tin đơn vị vận chuyển đã được cập nhật thành công",
    });
  };

  // Test shipping API connection
  const testApiConnection = async (carrier: string) => {
    try {
      // Giả lập kết nối API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Kết nối thành công",
        description: `Đã kết nối thành công với API của ${carrier}`,
      });
    } catch (error) {
      toast({
        title: "Lỗi kết nối",
        description: `Không thể kết nối với API của ${carrier}. Vui lòng kiểm tra API key.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground">Quản lý cài đặt và tùy chỉnh hệ thống</p>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">Thông tin cơ bản</TabsTrigger>
          <TabsTrigger value="shipping">Cài đặt vận chuyển</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
        </TabsList>

        {/* Thông tin cơ bản */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin doanh nghiệp</CardTitle>
              <CardDescription>Cấu hình thông tin cơ bản của doanh nghiệp</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onSaveGeneralSettings)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={generalForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên doanh nghiệp</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập tên doanh nghiệp" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã số thuế</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập mã số thuế" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={generalForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa chỉ</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập địa chỉ" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={generalForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập số điện thoại" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập địa chỉ email" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 mt-8">
                    <h3 className="text-lg font-medium">Tùy chọn đơn hàng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={generalForm.control}
                        name="notifyCustomers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Thông báo cho khách hàng</FormLabel>
                              <CardDescription>Tự động gửi email thông báo khi trạng thái đơn hàng thay đổi</CardDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={generalForm.control}
                        name="autoConfirmOrders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Tự động xác nhận đơn hàng</FormLabel>
                              <CardDescription>Tự động chuyển trạng thái đơn hàng mới sang xác nhận</CardDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="submit">Lưu cài đặt</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cài đặt vận chuyển */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt vận chuyển</CardTitle>
              <CardDescription>Quản lý cài đặt vận chuyển và liên kết với đơn vị giao hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...shippingForm}>
                <form onSubmit={shippingForm.handleSubmit(onSaveShippingSettings)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Đơn vị vận chuyển mặc định</h3>
                    <FormField
                      control={shippingForm.control}
                      name="defaultCarrier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Đơn vị vận chuyển</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn đơn vị vận chuyển mặc định" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {carriers?.map(carrier => (
                                <SelectItem key={carrier.id} value={carrier.id}>
                                  {carrier.name} {carrier.apiConnected && "✓"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 mt-8">
                    <h3 className="text-lg font-medium">API Keys</h3>
                    <p className="text-sm text-muted-foreground">Thêm khóa API để kết nối với các đơn vị vận chuyển</p>
                    <div className="space-y-4">
                      {carriers?.map(carrier => (
                        <div key={carrier.id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 p-4 border rounded-lg">
                          <div className="lg:col-span-3 flex items-center">
                            <span className="font-medium">{carrier.name}</span>
                            {carrier.apiConnected && (
                              <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                Đã kết nối
                              </span>
                            )}
                          </div>
                          <div className="lg:col-span-7">
                            <FormField
                              control={shippingForm.control}
                              name={`apiKeys.${carrier.id}` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      placeholder="Nhập API key"
                                      type="password"
                                      {...field} 
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="lg:col-span-2 flex items-center justify-end">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => testApiConnection(carrier.name)}
                            >
                              Kiểm tra
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 mt-8">
                    <h3 className="text-lg font-medium">Cài đặt vận chuyển mặc định</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={shippingForm.control}
                        name="defaultSettings.insurance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Bảo hiểm hàng hóa</FormLabel>
                              <CardDescription>Tự động thêm bảo hiểm cho đơn hàng</CardDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={shippingForm.control}
                        name="defaultSettings.requireSignature"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Yêu cầu chữ ký</FormLabel>
                              <CardDescription>Yêu cầu chữ ký khi giao hàng</CardDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={shippingForm.control}
                        name="defaultSettings.autoCreateShipments"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Tự động tạo vận đơn</FormLabel>
                              <CardDescription>Tự động tạo vận đơn khi xác nhận đơn hàng</CardDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="submit">Lưu cài đặt</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cài đặt thông báo */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thông báo</CardTitle>
              <CardDescription>Quản lý cài đặt thông báo qua email và SMS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Tính năng đang được phát triển. Vui lòng quay lại sau.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quản lý người dùng */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý người dùng</CardTitle>
              <CardDescription>Quản lý tài khoản và quyền truy cập hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Tính năng đang được phát triển. Vui lòng quay lại sau.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
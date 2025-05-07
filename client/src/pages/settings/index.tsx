import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("general");
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "Order Manager",
    email: "contact@ordermanager.vn",
    phone: "+84 123 456 789",
    address: "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh",
    currency: "VND",
    dateFormat: "DD/MM/YYYY",
  });

  // Shipping settings state
  const [shippingSettings, setShippingSettings] = useState({
    defaultShippingCost: 30000,
    defaultCarrier: "ghn",
    autoTrackingEnabled: true,
    apiKeys: {
      ghn: "",
      ghtk: "",
      viettelPost: "",
      jtExpress: ""
    }
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotificationsEnabled: true,
    orderCreatedTemplate: "Đơn hàng #{order_number} đã được tạo thành công. Cảm ơn quý khách đã mua hàng.",
    orderShippedTemplate: "Đơn hàng #{order_number} đã được giao cho đơn vị vận chuyển. Mã vận đơn: {tracking_number}.",
    orderCompletedTemplate: "Đơn hàng #{order_number} đã được giao thành công. Cảm ơn quý khách đã mua hàng.",
  });

  // Handlers for form changes
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleGeneralSelectChange = (field: string, value: string) => {
    setGeneralSettings({
      ...generalSettings,
      [field]: value
    });
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name.startsWith("apiKeys.")) {
      const key = e.target.name.split(".")[1];
      setShippingSettings({
        ...shippingSettings,
        apiKeys: {
          ...shippingSettings.apiKeys,
          [key]: e.target.value
        }
      });
    } else {
      setShippingSettings({
        ...shippingSettings,
        [e.target.name]: e.target.name === "defaultShippingCost" 
          ? parseFloat(e.target.value) 
          : e.target.value
      });
    }
  };

  const handleShippingSelectChange = (field: string, value: string) => {
    setShippingSettings({
      ...shippingSettings,
      [field]: value
    });
  };

  const handleShippingSwitchChange = (field: string, checked: boolean) => {
    setShippingSettings({
      ...shippingSettings,
      [field]: checked
    });
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNotificationSettings({
      ...notificationSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationSwitchChange = (field: string, checked: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [field]: checked
    });
  };

  // Mock save settings mutation (would connect to backend in real app)
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      // This would call the API in a real app
      // return await apiRequest("POST", "/api/settings", settings);
      
      // For now, just return a success after a delay to simulate API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Cài đặt đã được lưu",
        description: "Các thay đổi đã được áp dụng thành công.",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    const settings = {
      general: generalSettings,
      shipping: shippingSettings,
      notification: notificationSettings,
    };
    
    saveSettingsMutation.mutate(settings);
  };

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="text-sm font-medium text-gray-500">Quản lý cấu hình của hệ thống</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending} className="gap-2">
          {saveSettingsMutation.isPending ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lưu cài đặt
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt chung</CardTitle>
              <CardDescription>
                Quản lý thông tin cơ bản của hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Tên công ty</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={generalSettings.companyName}
                    onChange={handleGeneralChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email liên hệ</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={generalSettings.email}
                    onChange={handleGeneralChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={generalSettings.phone}
                    onChange={handleGeneralChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                  <Select
                    value={generalSettings.currency}
                    onValueChange={(value) => handleGeneralSelectChange("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị tiền tệ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND - Việt Nam Đồng</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Định dạng ngày tháng</Label>
                  <Select
                    value={generalSettings.dateFormat}
                    onValueChange={(value) => handleGeneralSelectChange("dateFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn định dạng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={generalSettings.address}
                    onChange={handleGeneralChange}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt vận chuyển</CardTitle>
              <CardDescription>
                Cấu hình thông tin vận chuyển và API đơn vị vận chuyển
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultShippingCost">Phí vận chuyển mặc định</Label>
                  <Input
                    id="defaultShippingCost"
                    name="defaultShippingCost"
                    type="number"
                    value={shippingSettings.defaultShippingCost}
                    onChange={handleShippingChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCarrier">Đơn vị vận chuyển mặc định</Label>
                  <Select
                    value={shippingSettings.defaultCarrier}
                    onValueChange={(value) => handleShippingSelectChange("defaultCarrier", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị vận chuyển" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ghn">Giao Hàng Nhanh</SelectItem>
                      <SelectItem value="ghtk">Giao Hàng Tiết Kiệm</SelectItem>
                      <SelectItem value="viettel_post">Viettel Post</SelectItem>
                      <SelectItem value="jt_express">J&T Express</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 sm:col-span-2">
                  <Switch
                    id="autoTrackingEnabled"
                    checked={shippingSettings.autoTrackingEnabled}
                    onCheckedChange={(checked) => handleShippingSwitchChange("autoTrackingEnabled", checked)}
                  />
                  <Label htmlFor="autoTrackingEnabled">Tự động cập nhật trạng thái vận chuyển</Label>
                </div>
                
                <div className="space-y-4 sm:col-span-2">
                  <h3 className="text-lg font-medium">API Keys đơn vị vận chuyển</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="apiKeyGhn">Giao Hàng Nhanh API Key</Label>
                      <Input
                        id="apiKeyGhn"
                        name="apiKeys.ghn"
                        value={shippingSettings.apiKeys.ghn}
                        onChange={handleShippingChange}
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKeyGhtk">Giao Hàng Tiết Kiệm API Key</Label>
                      <Input
                        id="apiKeyGhtk"
                        name="apiKeys.ghtk"
                        value={shippingSettings.apiKeys.ghtk}
                        onChange={handleShippingChange}
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKeyViettelPost">Viettel Post API Key</Label>
                      <Input
                        id="apiKeyViettelPost"
                        name="apiKeys.viettelPost"
                        value={shippingSettings.apiKeys.viettelPost}
                        onChange={handleShippingChange}
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKeyJtExpress">J&T Express API Key</Label>
                      <Input
                        id="apiKeyJtExpress"
                        name="apiKeys.jtExpress"
                        value={shippingSettings.apiKeys.jtExpress}
                        onChange={handleShippingChange}
                        type="password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thông báo</CardTitle>
              <CardDescription>
                Cấu hình mẫu thông báo cho khách hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailNotificationsEnabled"
                  checked={notificationSettings.emailNotificationsEnabled}
                  onCheckedChange={(checked) => handleNotificationSwitchChange("emailNotificationsEnabled", checked)}
                />
                <Label htmlFor="emailNotificationsEnabled">Kích hoạt thông báo qua email</Label>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Mẫu thông báo</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="orderCreatedTemplate">Thông báo tạo đơn hàng</Label>
                    <Textarea
                      id="orderCreatedTemplate"
                      name="orderCreatedTemplate"
                      value={notificationSettings.orderCreatedTemplate}
                      onChange={handleNotificationChange}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Sử dụng {"{order_number}"} để thay thế bằng mã đơn hàng.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderShippedTemplate">Thông báo giao cho đơn vị vận chuyển</Label>
                    <Textarea
                      id="orderShippedTemplate"
                      name="orderShippedTemplate"
                      value={notificationSettings.orderShippedTemplate}
                      onChange={handleNotificationChange}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Sử dụng {"{order_number}"} và {"{tracking_number}"} để thay thế bằng thông tin tương ứng.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderCompletedTemplate">Thông báo hoàn thành đơn hàng</Label>
                    <Textarea
                      id="orderCompletedTemplate"
                      name="orderCompletedTemplate"
                      value={notificationSettings.orderCompletedTemplate}
                      onChange={handleNotificationChange}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Sử dụng {"{order_number}"} để thay thế bằng mã đơn hàng.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
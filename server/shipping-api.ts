import fetch from 'node-fetch';
import { log } from './vite';
import { createAfterShipService } from './aftership-service';

// Các cài đặt cho các API vận chuyển
type ShippingApiConfig = {
  baseUrl: string;
  apiKey?: string; 
  defaultHeaders: Record<string, string>;
};

type ShippingApiResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

// Cấu hình cho từng đơn vị vận chuyển
const apiConfigs: Record<string, ShippingApiConfig> = {
  ghn: {
    baseUrl: 'https://online-gateway.ghn.vn/shiip/public-api',
    defaultHeaders: {
      'Content-Type': 'application/json',
    }
  },
  ghtk: {
    baseUrl: 'https://services.giaohangtietkiem.vn',
    defaultHeaders: {
      'Content-Type': 'application/json',
    }
  },
  viettel_post: {
    baseUrl: 'https://partner.viettelpost.vn/v2',
    defaultHeaders: {
      'Content-Type': 'application/json',
    }
  },
  jt_express: {
    baseUrl: 'https://api.jtexpress.vn',
    defaultHeaders: {
      'Content-Type': 'application/json',
    }
  },
};

/**
 * Lớp đại diện cho API của các đơn vị vận chuyển
 * Cung cấp các phương thức chung để tích hợp với các đơn vị giao hàng
 */
class ShippingCarrierApi {
  private config: ShippingApiConfig;
  private carrier: string;
  
  /**
   * Khởi tạo API cho đơn vị vận chuyển
   * @param carrier Tên đơn vị vận chuyển ('ghn', 'ghtk', 'viettel_post', 'jt_express')
   * @param apiKey Khóa API của đơn vị vận chuyển
   */
  constructor(carrier: string, apiKey?: string) {
    if (!apiConfigs[carrier]) {
      throw new Error(`Không hỗ trợ đơn vị vận chuyển: ${carrier}`);
    }
    
    this.carrier = carrier;
    this.config = {
      ...apiConfigs[carrier],
      apiKey
    };
    
    // Thêm API key vào header nếu được cung cấp
    if (apiKey) {
      if (carrier === 'ghn') {
        this.config.defaultHeaders['Token'] = apiKey;
      } else if (carrier === 'ghtk') {
        this.config.defaultHeaders['X-API-Key'] = apiKey;
      } else if (carrier === 'viettel_post') {
        this.config.defaultHeaders['Token'] = apiKey;
      } else if (carrier === 'jt_express') {
        this.config.defaultHeaders['Authorization'] = `Bearer ${apiKey}`;
      }
    }
  }

  /**
   * Gửi yêu cầu API tới đơn vị vận chuyển
   * @param endpoint Đường dẫn API endpoint
   * @param method Phương thức HTTP
   * @param body Dữ liệu gửi đi (nếu có)
   * @returns Kết quả từ API
   */
  private async request(endpoint: string, method: string = 'GET', body?: any): Promise<ShippingApiResponse> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const options: any = {
        method,
        headers: this.config.defaultHeaders,
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }
      
      log(`Gửi yêu cầu đến ${this.carrier.toUpperCase()}: ${url}`, 'shipping-api');
      
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        log(`Lỗi từ ${this.carrier.toUpperCase()}: ${response.status} - ${JSON.stringify(data)}`, 'shipping-api');
        return {
          success: false,
          message: `Lỗi từ API ${this.carrier}: ${response.statusText}`,
          error: data
        };
      }
      
      return {
        success: true,
        message: 'Yêu cầu thành công',
        data
      };
    } catch (error: any) {
      log(`Lỗi kết nối đến ${this.carrier.toUpperCase()}: ${error.message}`, 'shipping-api');
      return {
        success: false,
        message: `Lỗi kết nối đến API ${this.carrier}: ${error.message}`,
        error
      };
    }
  }

  /**
   * Tạo đơn vận chuyển mới
   * @param orderData Thông tin đơn hàng
   */
  async createShipment(orderData: any): Promise<ShippingApiResponse> {
    // Ánh xạ dữ liệu đơn hàng theo định dạng của từng đơn vị vận chuyển
    let endpoint: string;
    let mappedData: any;

    if (this.carrier === 'ghn') {
      endpoint = '/v2/shipping-order/create';
      mappedData = this.mapToGHNFormat(orderData);
    } else if (this.carrier === 'ghtk') {
      endpoint = '/services/shipment/order';
      mappedData = this.mapToGHTKFormat(orderData);
    } else if (this.carrier === 'viettel_post') {
      endpoint = '/order/createOrder';
      mappedData = this.mapToViettelPostFormat(orderData);
    } else if (this.carrier === 'jt_express') {
      endpoint = '/v1/orders';
      mappedData = this.mapToJTExpressFormat(orderData);
    } else {
      return {
        success: false,
        message: `Không hỗ trợ tạo đơn với đơn vị vận chuyển: ${this.carrier}`
      };
    }

    return await this.request(endpoint, 'POST', mappedData);
  }

  /**
   * Kiểm tra trạng thái vận đơn
   * @param trackingNumber Mã vận đơn
   */
  async trackShipment(trackingNumber: string): Promise<ShippingApiResponse> {
    // Sử dụng AfterShip cho J&T Express
    if (this.carrier === 'jt_express') {
      try {
        // Sử dụng API key của AfterShip từ biến môi trường
        const afterShipApiKey = process.env.AFTERSHIP_API_KEY;
        
        if (!afterShipApiKey) {
          return {
            success: false,
            message: "Chưa cấu hình AfterShip API key cho theo dõi đơn hàng J&T Express"
          };
        }
        
        log(`Sử dụng AfterShip để theo dõi mã vận đơn ${trackingNumber} của J&T Express`, 'shipping-api');
        
        const afterShipService = createAfterShipService(afterShipApiKey);
        return await afterShipService.trackShipment(trackingNumber, 'jnt');
      } catch (error: any) {
        log(`Lỗi khi sử dụng AfterShip: ${error.message}`, 'shipping-api');
        return {
          success: false,
          message: `Lỗi khi theo dõi vận đơn qua AfterShip: ${error.message}`
        };
      }
    }
    
    // Sử dụng API của các đơn vị vận chuyển khác
    let endpoint: string;

    if (this.carrier === 'ghn') {
      endpoint = `/v2/shipping-order/detail?order_code=${trackingNumber}`;
    } else if (this.carrier === 'ghtk') {
      endpoint = `/services/shipment/v2/${trackingNumber}`;
    } else if (this.carrier === 'viettel_post') {
      endpoint = `/order/tracking?order_number=${trackingNumber}`;
    } else {
      return {
        success: false,
        message: `Không hỗ trợ theo dõi vận đơn với đơn vị vận chuyển: ${this.carrier}`
      };
    }

    return await this.request(endpoint, 'GET');
  }

  /**
   * Hủy vận đơn
   * @param trackingNumber Mã vận đơn
   */
  async cancelShipment(trackingNumber: string): Promise<ShippingApiResponse> {
    let endpoint: string;
    let method: string = 'POST';
    let body: any = { order_code: trackingNumber };

    if (this.carrier === 'ghn') {
      endpoint = '/v2/shipping-order/cancel';
    } else if (this.carrier === 'ghtk') {
      endpoint = `/services/shipment/cancel/${trackingNumber}`;
      method = 'POST';
      body = {};
    } else if (this.carrier === 'viettel_post') {
      endpoint = '/order/cancelOrder';
      body = { order_number: trackingNumber };
    } else if (this.carrier === 'jt_express') {
      endpoint = `/v1/orders/${trackingNumber}/cancel`;
      method = 'PUT';
      body = { cancel_reason: 'Khách hàng yêu cầu hủy' };
    } else {
      return {
        success: false,
        message: `Không hỗ trợ hủy vận đơn với đơn vị vận chuyển: ${this.carrier}`
      };
    }

    return await this.request(endpoint, method, body);
  }

  /**
   * Lấy danh sách tỉnh thành
   */
  async getProvinces(): Promise<ShippingApiResponse> {
    let endpoint: string;

    if (this.carrier === 'ghn') {
      endpoint = '/master-data/province';
    } else if (this.carrier === 'ghtk') {
      endpoint = '/services/address/provinces';
    } else if (this.carrier === 'viettel_post') {
      endpoint = '/categories/listProvinceById?provinceId=';
    } else if (this.carrier === 'jt_express') {
      endpoint = '/v1/address/provinces';
    } else {
      return {
        success: false,
        message: `Không hỗ trợ lấy danh sách tỉnh thành với đơn vị vận chuyển: ${this.carrier}`
      };
    }

    return await this.request(endpoint, 'GET');
  }

  /**
   * Lấy danh sách dịch vụ vận chuyển
   */
  async getServices(): Promise<ShippingApiResponse> {
    let endpoint: string;

    if (this.carrier === 'ghn') {
      endpoint = '/v2/shipping-order/available-services';
    } else if (this.carrier === 'ghtk') {
      endpoint = '/services/shipment/services';
    } else if (this.carrier === 'viettel_post') {
      endpoint = '/categories/listService';
    } else if (this.carrier === 'jt_express') {
      endpoint = '/v1/services';
    } else {
      return {
        success: false,
        message: `Không hỗ trợ lấy danh sách dịch vụ với đơn vị vận chuyển: ${this.carrier}`
      };
    }

    return await this.request(endpoint, 'GET');
  }

  /**
   * Ước tính phí vận chuyển
   * @param data Thông tin đơn hàng để tính phí
   */
  async calculateFee(data: any): Promise<ShippingApiResponse> {
    let endpoint: string;
    let mappedData: any;

    if (this.carrier === 'ghn') {
      endpoint = '/v2/shipping-order/fee';
      mappedData = this.mapToGHNFeeFormat(data);
    } else if (this.carrier === 'ghtk') {
      endpoint = '/services/shipment/fee';
      mappedData = this.mapToGHTKFeeFormat(data);
    } else if (this.carrier === 'viettel_post') {
      endpoint = '/order/getPriceAll';
      mappedData = this.mapToViettelPostFeeFormat(data);
    } else if (this.carrier === 'jt_express') {
      endpoint = '/v1/orders/shipment-fee';
      mappedData = this.mapToJTExpressFeeFormat(data);
    } else {
      return {
        success: false,
        message: `Không hỗ trợ tính phí với đơn vị vận chuyển: ${this.carrier}`
      };
    }

    return await this.request(endpoint, 'POST', mappedData);
  }

  // Các phương thức ánh xạ dữ liệu sang định dạng của từng đơn vị vận chuyển

  private mapToGHNFormat(orderData: any): any {
    // Chuyển đổi dữ liệu sang định dạng của GHN
    const items = orderData.items.map((item: any) => ({
      name: item.name,
      code: item.sku,
      quantity: item.quantity,
      price: item.price,
      weight: item.weight || 500, // Mặc định 500g nếu không có
    }));

    return {
      payment_type_id: 2, // Người nhận thanh toán
      note: orderData.notes || "",
      required_note: "KHONGCHOXEMHANG", // Mặc định không cho xem hàng
      to_name: orderData.customer.name,
      to_phone: orderData.customer.phone,
      to_address: orderData.customer.address,
      to_ward_name: orderData.customer.ward || "",
      to_district_name: orderData.customer.district || "",
      to_province_name: orderData.customer.province || "",
      cod_amount: orderData.codAmount || 0,
      weight: orderData.weight || 1000, // Mặc định 1kg
      length: orderData.length || 15,
      width: orderData.width || 15,
      height: orderData.height || 15,
      service_id: orderData.serviceId || 0,
      service_type_id: orderData.serviceTypeId || 0,
      items: items,
    };
  }

  private mapToGHTKFormat(orderData: any): any {
    // Chuyển đổi dữ liệu sang định dạng của GHTK
    const products = orderData.items.map((item: any) => ({
      name: item.name,
      weight: item.weight || 0.5,
      quantity: item.quantity,
      price: item.price,
    }));

    return {
      order: {
        id: orderData.orderNumber,
        pick_name: "Người gửi",
        pick_address: "Địa chỉ lấy hàng",
        pick_province: "Hà Nội",
        pick_district: "Quận Cầu Giấy",
        pick_tel: "0987654321",
        name: orderData.customer.name,
        address: orderData.customer.address,
        province: orderData.customer.province || "Hà Nội",
        district: orderData.customer.district || "",
        tel: orderData.customer.phone,
        note: orderData.notes || "",
        value: orderData.total,
        transport: "road",
        pick_money: orderData.codAmount || 0,
        is_freeship: 0,
      },
      products: products,
    };
  }

  private mapToViettelPostFormat(orderData: any): any {
    // Chuyển đổi dữ liệu sang định dạng của Viettel Post
    const productItems = orderData.items.map((item: any) => ({
      PRODUCT_NAME: item.name,
      PRODUCT_PRICE: item.price,
      PRODUCT_WEIGHT: item.weight || 500,
      PRODUCT_QUANTITY: item.quantity,
    }));

    return {
      ORDER_NUMBER: orderData.orderNumber,
      GROUPADDRESS_ID: 0,
      CUS_ID: 0,
      DELIVERY_DATE: new Date().toISOString(),
      SENDER_FULLNAME: "Người gửi",
      SENDER_ADDRESS: "Địa chỉ lấy hàng",
      SENDER_PHONE: "0987654321",
      SENDER_WARD: 0,
      SENDER_DISTRICT: 0,
      SENDER_PROVINCE: 0,
      RECEIVER_FULLNAME: orderData.customer.name,
      RECEIVER_ADDRESS: orderData.customer.address,
      RECEIVER_PHONE: orderData.customer.phone,
      RECEIVER_WARD: 0,
      RECEIVER_DISTRICT: 0,
      RECEIVER_PROVINCE: 0,
      PRODUCT_NAME: "Đơn hàng " + orderData.orderNumber,
      PRODUCT_DESCRIPTION: orderData.notes || "",
      PRODUCT_QUANTITY: 1,
      PRODUCT_PRICE: orderData.total,
      PRODUCT_WEIGHT: orderData.weight || 1000,
      PRODUCT_LENGTH: orderData.length || 15,
      PRODUCT_WIDTH: orderData.width || 15, 
      PRODUCT_HEIGHT: orderData.height || 15,
      ORDER_PAYMENT: 0, // Người gửi trả cước
      ORDER_SERVICE: orderData.serviceId || "",
      ORDER_SERVICE_ADD: "",
      ORDER_VOUCHER: "",
      ORDER_NOTE: orderData.notes || "",
      MONEY_COLLECTION: orderData.codAmount || 0,
      MONEY_TOTALFEE: 0,
      LIST_ITEM: productItems,
    };
  }

  private mapToJTExpressFormat(orderData: any): any {
    // Chuyển đổi dữ liệu sang định dạng của J&T Express
    const goodsDetails = orderData.items.map((item: any) => ({
      goods_name: item.name,
      goods_qty: item.quantity,
      goods_weight: item.weight || 0.5,
    }));

    return {
      customer_order_no: orderData.orderNumber,
      order_status: "REQUEST",
      service_type: "EZ",
      sender: {
        name: "Người gửi",
        phone: "0987654321",
        area: "Hà Nội",
        address: "Địa chỉ lấy hàng",
      },
      receiver: {
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        area: orderData.customer.province || "Hà Nội",
        address: orderData.customer.address,
      },
      items_details: {
        package_description: orderData.notes || "Đơn hàng " + orderData.orderNumber,
        package_weight: orderData.weight || 1,
        actual_weight: orderData.weight || 1,
        package_chargeable_weight: orderData.weight || 1,
        package_length: orderData.length || 15,
        package_width: orderData.width || 15,
        package_height: orderData.height || 15,
        package_content: orderData.notes || "",
        goods_details: goodsDetails,
      },
      transaction_details: {
        cod_value: orderData.codAmount || 0,
        transaction_amount: orderData.total || 0,
      },
    };
  }

  private mapToGHNFeeFormat(data: any): any {
    return {
      from_district_id: data.fromDistrictId || 0,
      to_district_id: data.toDistrictId || 0,
      to_ward_code: data.toWardCode || "",
      service_id: data.serviceId || 0,
      weight: data.weight || 1000,
      length: data.length || 15,
      width: data.width || 15,
      height: data.height || 15,
      insurance_value: data.insuranceValue || 0,
      coupon: data.coupon || "",
    };
  }

  private mapToGHTKFeeFormat(data: any): any {
    return {
      pick_province: data.fromProvince || "Hà Nội",
      pick_district: data.fromDistrict || "Quận Cầu Giấy",
      province: data.toProvince || "Hà Nội",
      district: data.toDistrict || "Quận Cầu Giấy",
      weight: data.weight || 1000,
      value: data.value || 0,
      transport: "road",
    };
  }

  private mapToViettelPostFeeFormat(data: any): any {
    return {
      PRODUCT_WEIGHT: data.weight || 1000,
      PRODUCT_PRICE: data.value || 0,
      MONEY_COLLECTION: data.codAmount || 0,
      SENDER_PROVINCE: data.fromProvinceId || 0,
      SENDER_DISTRICT: data.fromDistrictId || 0,
      RECEIVER_PROVINCE: data.toProvinceId || 0,
      RECEIVER_DISTRICT: data.toDistrictId || 0,
      PRODUCT_LENGTH: data.length || 15,
      PRODUCT_WIDTH: data.width || 15,
      PRODUCT_HEIGHT: data.height || 15,
      PRODUCT_TYPE: "HH",
      NATIONAL_TYPE: 1,
    };
  }

  private mapToJTExpressFeeFormat(data: any): any {
    return {
      service_type: "EZ",
      sender_area: data.fromArea || "Hà Nội",
      receiver_area: data.toArea || "Hà Nội",
      package_weight: data.weight || 1,
      package_length: data.length || 15,
      package_width: data.width || 15,
      package_height: data.height || 15,
      cod_value: data.codAmount || 0,
    };
  }
}

// Factory để tạo instance API cho từng đơn vị vận chuyển
export const createShippingApi = (carrier: string, apiKey?: string): ShippingCarrierApi => {
  return new ShippingCarrierApi(carrier, apiKey);
};

export default ShippingCarrierApi;
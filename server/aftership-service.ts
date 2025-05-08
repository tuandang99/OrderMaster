import fetch from 'node-fetch';
import { log } from './vite';

type AfterShipTrackingResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

/**
 * Dịch vụ theo dõi vận đơn sử dụng AfterShip
 */
export class AfterShipService {
  private apiKey: string;
  private baseUrl = 'https://api.aftership.com/v4';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Theo dõi vận đơn thông qua AfterShip API
   * @param trackingNumber Mã vận đơn
   * @param courier Tên nhà vận chuyển trên AfterShip (ví dụ: 'jt-express')
   */
  async trackShipment(trackingNumber: string, courier: string = 'jnt'): Promise<AfterShipTrackingResponse> {
    try {
      // Kiểm tra xem vận đơn đã được theo dõi chưa
      const checkTracking = await this.checkTracking(trackingNumber, courier);
      
      // Nếu vận đơn chưa được theo dõi, thêm vào hệ thống AfterShip
      if (!checkTracking.success || !checkTracking.data) {
        const createResult = await this.createTracking(trackingNumber, courier);
        if (!createResult.success) {
          return createResult;
        }
      }
      
      // Lấy thông tin chi tiết về vận đơn
      const url = `${this.baseUrl}/trackings/${courier}/${trackingNumber}`;
      
      log(`Đang truy vấn thông tin vận đơn AfterShip: ${url}`, 'aftership');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'aftership-api-key': this.apiKey
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        log(`Lỗi từ AfterShip API: ${response.status} - ${JSON.stringify(data)}`, 'aftership');
        return {
          success: false,
          message: 'Không thể lấy thông tin vận đơn từ AfterShip',
          error: data
        };
      }
      
      return {
        success: true,
        message: 'Lấy thông tin vận đơn thành công',
        data: data.data
      };
    } catch (error: any) {
      log(`Lỗi khi truy vấn AfterShip: ${error.message}`, 'aftership');
      return {
        success: false,
        message: `Lỗi kết nối đến AfterShip: ${error.message}`,
        error
      };
    }
  }
  
  /**
   * Tạo vận đơn theo dõi mới trong AfterShip
   */
  private async createTracking(trackingNumber: string, courier: string): Promise<AfterShipTrackingResponse> {
    try {
      const url = `${this.baseUrl}/trackings`;
      
      log(`Đang tạo theo dõi vận đơn mới trên AfterShip: ${trackingNumber}`, 'aftership');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aftership-api-key': this.apiKey
        },
        body: JSON.stringify({
          tracking: {
            tracking_number: trackingNumber,
            slug: courier,
            title: `Đơn hàng ${trackingNumber}`,
            language: 'vi'
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        log(`Lỗi khi tạo theo dõi vận đơn trên AfterShip: ${response.status} - ${JSON.stringify(data)}`, 'aftership');
        return {
          success: false,
          message: 'Không thể tạo theo dõi vận đơn trên AfterShip',
          error: data
        };
      }
      
      return {
        success: true,
        message: 'Tạo theo dõi vận đơn thành công',
        data: data.data
      };
    } catch (error: any) {
      log(`Lỗi khi tạo theo dõi vận đơn trên AfterShip: ${error.message}`, 'aftership');
      return {
        success: false,
        message: `Lỗi kết nối đến AfterShip: ${error.message}`,
        error
      };
    }
  }
  
  /**
   * Kiểm tra xem vận đơn đã được theo dõi trên AfterShip chưa
   */
  private async checkTracking(trackingNumber: string, courier: string): Promise<AfterShipTrackingResponse> {
    try {
      const url = `${this.baseUrl}/trackings/${courier}/${trackingNumber}`;
      
      log(`Đang kiểm tra vận đơn trên AfterShip: ${trackingNumber}`, 'aftership');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'aftership-api-key': this.apiKey
        }
      });
      
      // Nếu status là 404, vận đơn chưa tồn tại trong hệ thống
      if (response.status === 404) {
        return {
          success: false,
          message: 'Vận đơn chưa được theo dõi trên AfterShip',
        };
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        log(`Lỗi khi kiểm tra vận đơn trên AfterShip: ${response.status} - ${JSON.stringify(data)}`, 'aftership');
        return {
          success: false,
          message: 'Không thể kiểm tra vận đơn trên AfterShip',
          error: data
        };
      }
      
      return {
        success: true,
        message: 'Vận đơn đã tồn tại trên AfterShip',
        data: data.data
      };
    } catch (error: any) {
      log(`Lỗi khi kiểm tra vận đơn trên AfterShip: ${error.message}`, 'aftership');
      return {
        success: false,
        message: `Lỗi kết nối đến AfterShip: ${error.message}`,
        error
      };
    }
  }
}

// Factory để tạo instance AfterShip service
export const createAfterShipService = (apiKey: string): AfterShipService => {
  return new AfterShipService(apiKey);
};

export default AfterShipService;
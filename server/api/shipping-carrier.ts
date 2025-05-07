import { Express, Request, Response } from 'express';
import { createShippingApi } from '../shipping-api';
import { log } from '../vite';

// Cấu hình API key cho các đơn vị vận chuyển (Nên lưu trong biến môi trường)
// Process.env.GHN_API_KEY, Process.env.GHTK_API_KEY, ...
const apiKeys: Record<string, string> = {
  'ghn': process.env.GHN_API_KEY || 'demo_api_key_ghn',
  'ghtk': process.env.GHTK_API_KEY || 'demo_api_key_ghtk',
  'viettel_post': process.env.VIETTEL_POST_API_KEY || 'demo_api_key_viettel',
  'jt_express': process.env.JT_EXPRESS_API_KEY || 'demo_api_key_jt',
};

export function registerShippingCarrierRoutes(app: Express) {
  // Lấy danh sách đơn vị vận chuyển được hỗ trợ
  app.get('/api/shipping-carriers/info', (req: Request, res: Response) => {
    const supportedCarriers = [
      { id: 'ghn', name: 'Giao Hàng Nhanh', apiConnected: !!apiKeys['ghn'] && apiKeys['ghn'] !== 'demo_api_key_ghn' },
      { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm', apiConnected: !!apiKeys['ghtk'] && apiKeys['ghtk'] !== 'demo_api_key_ghtk' },
      { id: 'viettel_post', name: 'Viettel Post', apiConnected: !!apiKeys['viettel_post'] && apiKeys['viettel_post'] !== 'demo_api_key_viettel' },
      { id: 'jt_express', name: 'J&T Express', apiConnected: !!apiKeys['jt_express'] && apiKeys['jt_express'] !== 'demo_api_key_jt' },
    ];
    
    res.json(supportedCarriers);
  });
  
  // Tạo đơn vận chuyển
  app.post('/api/shipping-carriers/:carrier/create-shipment', async (req: Request, res: Response) => {
    try {
      const { carrier } = req.params;
      const orderData = req.body;
      
      if (!carrier || !orderData) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thiếu thông tin đơn vị vận chuyển hoặc dữ liệu đơn hàng' 
        });
      }
      
      if (!apiKeys[carrier]) {
        return res.status(400).json({ 
          success: false, 
          message: `Đơn vị vận chuyển ${carrier} không được hỗ trợ` 
        });
      }
      
      log(`Đang tạo vận đơn với ${carrier}`, 'shipping-carrier');
      
      const shippingApi = createShippingApi(carrier, apiKeys[carrier]);
      const result = await shippingApi.createShipment(orderData);
      
      if (!result.success) {
        log(`Lỗi tạo vận đơn với ${carrier}: ${result.message}`, 'shipping-carrier');
        return res.status(400).json(result);
      }
      
      log(`Tạo vận đơn với ${carrier} thành công`, 'shipping-carrier');
      res.json(result);
    } catch (error: any) {
      log(`Lỗi tạo vận đơn: ${error.message}`, 'shipping-carrier');
      res.status(500).json({
        success: false,
        message: `Lỗi khi tạo vận đơn: ${error.message}`
      });
    }
  });
  
  // Tra cứu trạng thái vận đơn
  app.get('/api/shipping-carriers/:carrier/track/:trackingNumber', async (req: Request, res: Response) => {
    try {
      const { carrier, trackingNumber } = req.params;
      
      if (!carrier || !trackingNumber) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thiếu thông tin đơn vị vận chuyển hoặc mã vận đơn' 
        });
      }
      
      if (!apiKeys[carrier]) {
        return res.status(400).json({ 
          success: false, 
          message: `Đơn vị vận chuyển ${carrier} không được hỗ trợ` 
        });
      }
      
      log(`Đang tra cứu vận đơn ${trackingNumber} với ${carrier}`, 'shipping-carrier');
      
      const shippingApi = createShippingApi(carrier, apiKeys[carrier]);
      const result = await shippingApi.trackShipment(trackingNumber);
      
      if (!result.success) {
        log(`Lỗi tra cứu vận đơn với ${carrier}: ${result.message}`, 'shipping-carrier');
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error: any) {
      log(`Lỗi tra cứu vận đơn: ${error.message}`, 'shipping-carrier');
      res.status(500).json({
        success: false,
        message: `Lỗi khi tra cứu vận đơn: ${error.message}`
      });
    }
  });
  
  // Hủy vận đơn
  app.post('/api/shipping-carriers/:carrier/cancel/:trackingNumber', async (req: Request, res: Response) => {
    try {
      const { carrier, trackingNumber } = req.params;
      
      if (!carrier || !trackingNumber) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thiếu thông tin đơn vị vận chuyển hoặc mã vận đơn' 
        });
      }
      
      if (!apiKeys[carrier]) {
        return res.status(400).json({ 
          success: false, 
          message: `Đơn vị vận chuyển ${carrier} không được hỗ trợ` 
        });
      }
      
      log(`Đang hủy vận đơn ${trackingNumber} với ${carrier}`, 'shipping-carrier');
      
      const shippingApi = createShippingApi(carrier, apiKeys[carrier]);
      const result = await shippingApi.cancelShipment(trackingNumber);
      
      if (!result.success) {
        log(`Lỗi hủy vận đơn với ${carrier}: ${result.message}`, 'shipping-carrier');
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error: any) {
      log(`Lỗi hủy vận đơn: ${error.message}`, 'shipping-carrier');
      res.status(500).json({
        success: false,
        message: `Lỗi khi hủy vận đơn: ${error.message}`
      });
    }
  });
  
  // Lấy danh sách tỉnh/thành phố
  app.get('/api/shipping-carriers/:carrier/provinces', async (req: Request, res: Response) => {
    try {
      const { carrier } = req.params;
      
      if (!carrier) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thiếu thông tin đơn vị vận chuyển' 
        });
      }
      
      if (!apiKeys[carrier]) {
        return res.status(400).json({ 
          success: false, 
          message: `Đơn vị vận chuyển ${carrier} không được hỗ trợ` 
        });
      }
      
      const shippingApi = createShippingApi(carrier, apiKeys[carrier]);
      const result = await shippingApi.getProvinces();
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: `Lỗi khi lấy danh sách tỉnh/thành phố: ${error.message}`
      });
    }
  });
  
  // Lấy danh sách dịch vụ vận chuyển
  app.get('/api/shipping-carriers/:carrier/services', async (req: Request, res: Response) => {
    try {
      const { carrier } = req.params;
      
      if (!carrier) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thiếu thông tin đơn vị vận chuyển' 
        });
      }
      
      if (!apiKeys[carrier]) {
        return res.status(400).json({ 
          success: false, 
          message: `Đơn vị vận chuyển ${carrier} không được hỗ trợ` 
        });
      }
      
      const shippingApi = createShippingApi(carrier, apiKeys[carrier]);
      const result = await shippingApi.getServices();
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: `Lỗi khi lấy danh sách dịch vụ vận chuyển: ${error.message}`
      });
    }
  });
  
  // Tính phí vận chuyển
  app.post('/api/shipping-carriers/:carrier/calculate-fee', async (req: Request, res: Response) => {
    try {
      const { carrier } = req.params;
      const feeData = req.body;
      
      if (!carrier || !feeData) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thiếu thông tin đơn vị vận chuyển hoặc dữ liệu tính phí' 
        });
      }
      
      if (!apiKeys[carrier]) {
        return res.status(400).json({ 
          success: false, 
          message: `Đơn vị vận chuyển ${carrier} không được hỗ trợ` 
        });
      }
      
      const shippingApi = createShippingApi(carrier, apiKeys[carrier]);
      const result = await shippingApi.calculateFee(feeData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: `Lỗi khi tính phí vận chuyển: ${error.message}`
      });
    }
  });
}
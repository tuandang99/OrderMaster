import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { 
  insertCustomerSchema, 
  insertProductSchema, 
  createOrderSchema,
  orderStatusEnum,
  shippingCarrierEnum
} from "@shared/schema";
import { registerShippingCarrierRoutes } from "./api/shipping-carrier";

export async function registerRoutes(app: Express): Promise<Server> {
  // Đăng ký các route cho API đơn vị vận chuyển
  registerShippingCarrierRoutes(app);
  // Customers API
  app.get("/api/customers", async (req: Request, res: Response) => {
    try {
      const { search, page, limit } = req.query;
      
      const options: any = {};
      
      if (search && typeof search === 'string') {
        options.search = search;
      }
      
      if (page && typeof page === 'string') {
        options.page = parseInt(page);
      }
      
      if (limit && typeof limit === 'string') {
        options.limit = parseInt(limit);
      }
      
      const result = await storage.getCustomers(options);
      res.json(result);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      
      const customer = await storage.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req: Request, res: Response) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Products API
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const { search, page, limit } = req.query;
      
      const options: any = {};
      
      if (search && typeof search === 'string') {
        options.search = search;
      }
      
      if (page && typeof page === 'string') {
        options.page = parseInt(page);
      }
      
      if (limit && typeof limit === 'string') {
        options.limit = parseInt(limit);
      }
      
      const result = await storage.getProducts(options);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Quản lý kho
  app.patch("/api/products/:id/inventory", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
      }

      const { quantity, type, note } = req.body;
      if (typeof quantity !== 'number' || quantity < 0 || !['add', 'subtract', 'set'].includes(type)) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ",
          allowedTypes: ['add', 'subtract', 'set']
        });
      }

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      const currentStock = product.stock || 0;
      let newStock = currentStock;
      
      switch (type) {
        case 'add':
          newStock = currentStock + quantity;
          break;
        case 'subtract':
          newStock = Math.max(0, currentStock - quantity);
          break;
        case 'set':
          newStock = Math.max(0, quantity);
          break;
      }

      const updatedProduct = await storage.updateProduct(id, { stock: newStock });
      
      // Lưu lịch sử nhập xuất kho
      await storage.createInventoryHistory({
        productId: id,
        type,
        quantity,
        previousStock: currentStock,
        newStock,
        note
      });
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ message: "Không thể cập nhật tồn kho" });
    }
  });

  // Lịch sử nhập xuất kho
  app.get("/api/products/:id/inventory-history", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
      }

      const history = await storage.getInventoryHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching inventory history:", error);
      res.status(500).json({ message: "Không thể lấy lịch sử tồn kho" });
    }
  });

  // Orders API
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const { status, dateFrom, dateTo, search, page, limit, customerId } = req.query;
      
      const options: any = {};
      
      if (status && typeof status === 'string') {
        options.status = status;
      }
      
      if (dateFrom && typeof dateFrom === 'string') {
        options.dateFrom = new Date(dateFrom);
      }
      
      if (dateTo && typeof dateTo === 'string') {
        options.dateTo = new Date(dateTo);
      }
      
      if (search && typeof search === 'string') {
        options.search = search;
      }
      
      if (page && typeof page === 'string') {
        options.page = parseInt(page);
      }
      
      if (limit && typeof limit === 'string') {
        options.limit = parseInt(limit);
      }
      
      if (customerId && typeof customerId === 'string') {
        options.customerId = parseInt(customerId);
      }
      
      const { orders, total } = await storage.getOrders(options);
      res.json({ orders, total });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const orderData = createOrderSchema.parse(req.body);
      
      // Compute totals
      const subtotal = orderData.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      const shippingCost = orderData.shipping.cost;
      const total = subtotal + shippingCost;
      
      // Create order using storage
      const order = await storage.createOrder({
        customer: orderData.customer,
        order: {
          status: 'pending',
          subtotal,
          shippingCost,
          total,
          notes: orderData.notes || '',
          orderDate: new Date()
        },
        items: orderData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        shippingInfo: {
          carrier: orderData.shipping.carrier as any,
          status: 'pending'
        }
      });
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status } = req.body;
      if (!status || !orderStatusEnum.enumValues.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status",
          allowedValues: orderStatusEnum.enumValues
        });
      }
      
      // Lấy thông tin đơn hàng trước khi cập nhật
      const orderBefore = await storage.getOrderById(id);
      if (!orderBefore) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Cập nhật trạng thái đơn hàng
      const order = await storage.updateOrderStatus(id, status);
      
      // Nếu đơn hàng được cập nhật sang trạng thái "confirmed" và trước đó không phải là "confirmed"
      if (status === 'confirmed' && orderBefore.status !== 'confirmed') {
        // Lấy chi tiết đơn hàng
        const orderItems = orderBefore.items;
        
        // Cập nhật tồn kho cho mỗi sản phẩm trong đơn hàng
        for (const item of orderItems) {
          // Lấy thông tin sản phẩm hiện tại
          const product = await storage.getProductById(item.productId);
          if (product) {
            const previousStock = product.stock;
            const newStock = Math.max(0, previousStock - item.quantity);
            
            // Cập nhật số lượng tồn kho
            await storage.updateProduct(item.productId, { 
              stock: newStock 
            });
            
            // Thêm lịch sử tồn kho
            await storage.createInventoryHistory({
              productId: item.productId,
              type: 'subtract',
              quantity: item.quantity,
              previousStock,
              newStock,
              note: `Trừ kho từ đơn hàng #${orderBefore.orderNumber} (đã xác nhận)`
            });
          }
        }
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Shipping API
  app.get("/api/shipping/:orderId", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const shipping = await storage.getShippingByOrderId(orderId);
      if (!shipping) {
        return res.status(404).json({ message: "Shipping information not found" });
      }
      
      res.json(shipping);
    } catch (error) {
      console.error("Error fetching shipping:", error);
      res.status(500).json({ message: "Failed to fetch shipping information" });
    }
  });

  app.patch("/api/shipping/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid shipping ID" });
      }
      
      const { carrier, trackingNumber, shippingDate, expectedDelivery, status } = req.body;
      
      // Validate carrier if provided
      if (carrier && !shippingCarrierEnum.enumValues.includes(carrier)) {
        return res.status(400).json({ 
          message: "Invalid carrier",
          allowedValues: shippingCarrierEnum.enumValues
        });
      }
      
      const shippingData: any = {};
      
      if (carrier) shippingData.carrier = carrier;
      if (trackingNumber) shippingData.trackingNumber = trackingNumber;
      if (shippingDate) shippingData.shippingDate = new Date(shippingDate);
      if (expectedDelivery) shippingData.expectedDelivery = new Date(expectedDelivery);
      if (status) shippingData.status = status;
      
      const shipping = await storage.updateShipping(id, shippingData);
      if (!shipping) {
        return res.status(404).json({ message: "Shipping information not found" });
      }
      
      res.json(shipping);
    } catch (error) {
      console.error("Error updating shipping:", error);
      res.status(500).json({ message: "Failed to update shipping information" });
    }
  });

  // Utility endpoints
  app.get("/api/order-statuses", (req: Request, res: Response) => {
    res.json(orderStatusEnum.enumValues);
  });

  app.get("/api/shipping-carriers", (req: Request, res: Response) => {
    res.json(shippingCarrierEnum.enumValues);
  });

  // Delete order endpoint
  app.delete("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
      }
      
      await storage.deleteOrder(id);
      res.json({ message: "Đã xóa đơn hàng thành công" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Không thể xóa đơn hàng" });
    }
  });

  // API cho Dashboard
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      // Lấy tổng số đơn hàng
      const { orders: allOrders, total: totalOrders } = await storage.getOrders();
      
      // Lấy tất cả khách hàng
      const { data: customers } = await storage.getCustomers();
      
      // Đơn hàng theo trạng thái
      const pendingOrders = allOrders.filter(order => order.status === 'pending');
      const confirmedOrders = allOrders.filter(order => order.status === 'confirmed');
      const shippingOrders = allOrders.filter(order => order.status === 'shipping');
      const completedOrders = allOrders.filter(order => order.status === 'completed');
      const cancelledOrders = allOrders.filter(order => order.status === 'cancelled');
      
      // Tính tổng doanh thu từ tất cả đơn hàng
      const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
      
      // Đơn hàng trong 7 ngày gần đây
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const recentOrders = allOrders.filter(order => new Date(order.orderDate) >= last7Days);
      
      // Khách hàng mới trong 30 ngày gần đây
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const newCustomers = customers.filter(customer => new Date(customer.createdAt as unknown as string) >= last30Days);
      
      // Tính doanh thu theo ngày trong tuần
      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const salesByDay = dayNames.map(name => ({ name, total: 0 }));
      
      recentOrders.forEach(order => {
        const orderDate = new Date(order.orderDate);
        const dayIndex = orderDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        salesByDay[dayIndex].total += order.total;
      });
      
      // Tạo dữ liệu đơn hàng theo trạng thái
      const ordersByStatus = [
        { name: "Chờ xử lý", value: pendingOrders.length },
        { name: "Đã xác nhận", value: confirmedOrders.length },
        { name: "Đang giao", value: shippingOrders.length },
        { name: "Hoàn tất", value: completedOrders.length },
        { name: "Đã hủy", value: cancelledOrders.length }
      ];
      
      // Lấy sản phẩm bán chạy nhất (tính từ order_items)
      const productCounts = new Map<number, { count: number, name: string }>();
      
      for (const order of allOrders) {
        if (order.items) {
          for (const item of order.items) {
            const productId = item.productId;
            const currentCount = productCounts.get(productId) || { count: 0, name: item.product?.name || "Unknown Product" };
            productCounts.set(productId, { 
              count: currentCount.count + item.quantity,
              name: item.product?.name || "Unknown Product"
            });
          }
        }
      }
      
      // Chuyển Map thành mảng và sắp xếp theo số lượng bán
      const topProducts = Array.from(productCounts.entries())
        .map(([id, data]) => ({ id, name: data.name, quantity: data.count }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5); // Top 5 sản phẩm
      
      // Phân tích doanh thu theo tháng
      const currentYear = new Date().getFullYear();
      const revenueByMonth = Array(12).fill(0).map((_, index) => ({
        month: `Tháng ${index + 1}`,
        revenue: 0,
        orders: 0
      }));
      
      allOrders.forEach(order => {
        const orderDate = new Date(order.orderDate);
        // Chỉ tính các đơn hàng trong năm hiện tại
        if (orderDate.getFullYear() === currentYear) {
          const monthIndex = orderDate.getMonth(); // 0 = January
          revenueByMonth[monthIndex].revenue += order.total;
          revenueByMonth[monthIndex].orders += 1;
        }
      });
      
      // Trả về dữ liệu thống kê
      res.json({
        totalOrders,
        totalRevenue,
        shippingOrdersCount: shippingOrders.length,
        newCustomersCount: newCustomers.length,
        salesByDay,
        ordersByStatus,
        topProducts,
        revenueByMonth,
        recentOrders: recentOrders.slice(0, 5)
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

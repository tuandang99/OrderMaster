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
  // Customers API
  app.get("/api/customers", async (req: Request, res: Response) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
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
      const products = await storage.getProducts();
      res.json(products);
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

  // Orders API
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const { status, dateFrom, dateTo, search, page, limit } = req.query;
      
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
          carrier: orderData.shipping.carrier,
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
      
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
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

  const httpServer = createServer(app);
  return httpServer;
}

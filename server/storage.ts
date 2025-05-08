import { 
  customers, products, orders, orderItems, shipping,
  type Customer, type InsertCustomer,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Shipping, type InsertShipping,
  type OrderWithRelations,
  users, type User, type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, like, between, desc, and, or, sql, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  
  // Order operations
  getOrders(options?: { 
    status?: string; 
    dateFrom?: Date; 
    dateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: OrderWithRelations[]; total: number }>;
  getOrderById(id: number): Promise<OrderWithRelations | undefined>;
  getOrderByNumber(orderNumber: string): Promise<OrderWithRelations | undefined>;
  createOrder(orderData: {
    customer: InsertCustomer;
    order: Omit<InsertOrder, 'customerId' | 'orderNumber'>;
    items: Array<Omit<InsertOrderItem, 'orderId'>>;
    shippingInfo?: Omit<InsertShipping, 'orderId'>;
  }): Promise<OrderWithRelations>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Shipping operations
  getShippingByOrderId(orderId: number): Promise<Shipping | undefined>;
  createShipping(shipping: InsertShipping): Promise<Shipping>;
  updateShipping(id: number, shippingData: Partial<InsertShipping>): Promise<Shipping | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.name));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product;
    } catch (error) {
      console.error('Error fetching product:', error);
      return undefined;
    }
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  // Order operations
  async getOrders(options: { 
    status?: string; 
    dateFrom?: Date; 
    dateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
    customerId?: number;
  } = {}): Promise<{ orders: OrderWithRelations[]; total: number }> {
    const { status, dateFrom, dateTo, search, page = 1, limit = 10, customerId } = options;
    const offset = (page - 1) * limit;
    
    // Build where conditions based on filters
    const whereConditions = [];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(orders.status, status));
    }
    
    if (dateFrom && dateTo) {
      whereConditions.push(between(orders.orderDate, dateFrom, dateTo));
    } else if (dateFrom) {
      whereConditions.push(sql`${orders.orderDate} >= ${dateFrom}`);
    } else if (dateTo) {
      whereConditions.push(sql`${orders.orderDate} <= ${dateTo}`);
    }
    
    if (customerId) {
      whereConditions.push(eq(orders.customerId, customerId));
    }
    
    if (search) {
      whereConditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(customers.name, `%${search}%`),
          like(customers.phone, `%${search}%`)
        )
      );
    }
    
    // Create the where clause
    const whereClause = whereConditions.length > 0 
      ? and(...whereConditions) 
      : undefined;
      
    // Get total count for pagination
    const totalResultQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(whereClause);
      
    const total = totalResultQuery[0]?.count || 0;
    
    // Get orders with relations
    const ordersList = await db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(shipping, eq(orders.id, shipping.orderId))
      .where(whereClause)
      .orderBy(desc(orders.orderDate))
      .limit(limit)
      .offset(offset);
      
    // Get order items with products for each order
    const result: OrderWithRelations[] = await Promise.all(
      ordersList.map(async ({ orders: order, customers: customer, shipping: shippingInfo }) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id))
          .leftJoin(products, eq(orderItems.productId, products.id));
          
        return {
          ...order,
          customer,
          items: items.map(({ order_items, products }) => ({
            ...order_items,
            product: products
          })),
          shipping: shippingInfo
        };
      })
    );
    
    return { orders: result, total };
  }

  async getOrderById(id: number): Promise<OrderWithRelations | undefined> {
    const [orderResult] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(shipping, eq(orders.id, shipping.orderId));
      
    if (!orderResult) return undefined;
    
    const { orders: order, customers: customer, shipping: shippingInfo } = orderResult;
    
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
      .leftJoin(products, eq(orderItems.productId, products.id));
    
    return {
      ...order,
      customer,
      items: items.map(({ order_items, products }) => ({
        ...order_items,
        product: products
      })),
      shipping: shippingInfo
    };
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderWithRelations | undefined> {
    const [orderResult] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(shipping, eq(orders.id, shipping.orderId));
      
    if (!orderResult) return undefined;
    
    const { orders: order, customers: customer, shipping: shippingInfo } = orderResult;
    
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .leftJoin(products, eq(orderItems.productId, products.id));
    
    return {
      ...order,
      customer,
      items: items.map(({ order_items, products }) => ({
        ...order_items,
        product: products
      })),
      shipping: shippingInfo
    };
  }

  async createOrder(orderData: {
    customer: InsertCustomer;
    order: Omit<InsertOrder, 'customerId' | 'orderNumber'>;
    items: Array<Omit<InsertOrderItem, 'orderId'>>;
    shippingInfo?: Omit<InsertShipping, 'orderId'>;
  }): Promise<OrderWithRelations> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Check if customer exists by phone, otherwise create a new one
      let customer = await this.getCustomerByPhone(orderData.customer.phone);
      if (!customer) {
        const [newCustomer] = await tx
          .insert(customers)
          .values(orderData.customer)
          .returning();
        customer = newCustomer;
      }
      
      // Generate order number
      const orderNumber = `ORD-${new Date().getFullYear()}-${nanoid(6)}`;
      
      // Create order
      const [order] = await tx
        .insert(orders)
        .values({
          ...orderData.order,
          customerId: customer.id,
          orderNumber
        })
        .returning();
      
      // Create order items
      const orderItemsData = orderData.items.map(item => ({
        ...item,
        orderId: order.id
      }));
      
      const createdItems = await tx
        .insert(orderItems)
        .values(orderItemsData)
        .returning();
        
      // Create shipping information if provided
      let shippingData;
      if (orderData.shippingInfo) {
        const [newShipping] = await tx
          .insert(shipping)
          .values({
            ...orderData.shippingInfo,
            orderId: order.id
          })
          .returning();
        shippingData = newShipping;
      }
      
      // Get products for the items
      const productIds = createdItems.map(item => item.productId);
      const productList = await tx
        .select()
        .from(products)
        .where(sql`${products.id} IN (${productIds.join(',')})`);
        
      const productMap = new Map(productList.map(p => [p.id, p]));
      
      // Build the full order with relations
      return {
        ...order,
        customer,
        items: createdItems.map(item => ({
          ...item,
          product: productMap.get(item.productId)!
        })),
        shipping: shippingData
      };
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Shipping operations
  async getShippingByOrderId(orderId: number): Promise<Shipping | undefined> {
    const [shippingInfo] = await db
      .select()
      .from(shipping)
      .where(eq(shipping.orderId, orderId));
    return shippingInfo;
  }

  async createShipping(shippingData: InsertShipping): Promise<Shipping> {
    const [newShipping] = await db
      .insert(shipping)
      .values(shippingData)
      .returning();
    return newShipping;
  }

  async updateShipping(id: number, shippingData: Partial<InsertShipping>): Promise<Shipping | undefined> {
    const [updatedShipping] = await db
      .update(shipping)
      .set({
        ...shippingData,
        updatedAt: new Date()
      })
      .where(eq(shipping.id, id))
      .returning();
    return updatedShipping;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete shipping info first due to foreign key constraint
      await tx.delete(shipping).where(eq(shipping.orderId, id));
      // Delete order items
      await tx.delete(orderItems).where(eq(orderItems.orderId, id));
      // Delete the order
      await tx.delete(orders).where(eq(orders.id, id));
    });
  }
}

export const storage = new DatabaseStorage();

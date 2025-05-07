import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'shipping',
  'completed',
  'cancelled'
]);

export const shippingCarrierEnum = pgEnum('shipping_carrier', [
  'ghn',
  'ghtk',
  'viettel_post',
  'jt_express',
  'other'
]);

// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  price: doublePrecision('price').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  orderDate: timestamp('order_date').defaultNow().notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  subtotal: doublePrecision('subtotal').notNull(),
  shippingCost: doublePrecision('shipping_cost').notNull(),
  total: doublePrecision('total').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  shipping: one(shipping, {
    fields: [orders.id],
    references: [shipping.orderId],
  }),
}));

// Order Items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: doublePrecision('price').notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Shipping table
export const shipping = pgTable('shipping', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id).unique(),
  carrier: shippingCarrierEnum('carrier').notNull(),
  trackingNumber: text('tracking_number'),
  shippingDate: timestamp('shipping_date'),
  expectedDelivery: timestamp('expected_delivery'),
  status: text('status'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shippingRelations = relations(shipping, ({ one }) => ({
  order: one(orders, {
    fields: [shipping.orderId],
    references: [orders.id],
  }),
}));

// Schema validation for Customer
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const selectCustomerSchema = createSelectSchema(customers);

// Schema validation for Product
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const selectProductSchema = createSelectSchema(products);

// Schema validation for Order
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const selectOrderSchema = createSelectSchema(orders);

// Schema validation for OrderItem
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const selectOrderItemSchema = createSelectSchema(orderItems);

// Schema validation for Shipping
export const insertShippingSchema = createInsertSchema(shipping).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectShippingSchema = createSelectSchema(shipping);

// Combined Order schema for frontend
export const createOrderSchema = z.object({
  customer: insertCustomerSchema,
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })),
  shipping: z.object({
    cost: z.number().min(0),
    carrier: z.string(),
  }),
  notes: z.string().optional(),
});

// Types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export type Shipping = typeof shipping.$inferSelect;
export type InsertShipping = typeof shipping.$inferInsert;

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type OrderWithRelations = Order & {
  customer: Customer;
  items: (OrderItem & { product: Product })[];
  shipping?: Shipping;
};

// Keep the users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

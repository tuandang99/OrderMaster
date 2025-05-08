import 'dotenv/config'; // Đảm bảo môi trường được tải
import { db } from "../server/db";
import { customers, products, users } from "../shared/schema";
import { nanoid } from "nanoid";

async function seedDatabase() {
  console.log("Bắt đầu khởi tạo dữ liệu mẫu...");

  // Tạo người dùng mẫu
  const [user] = await db
    .insert(users)
    .values({
      username: "admin",
      password: "admin123", // Mật khẩu đơn giản cho mục đích demo 
      name: "Admin User",
    })
    .returning()
    .catch((err) => {
      console.error("Lỗi khi tạo user:", err);
      return [null];
    });

  console.log("Đã tạo user:", user);

  // Tạo khách hàng mẫu
  const customersData = [
    {
      name: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Nguyễn Huệ, Q1, TP.HCM",
      email: "nguyenvana@example.com",
    },
    {
      name: "Trần Thị B",
      phone: "0912345678",
      address: "456 Lê Lợi, Q1, TP.HCM",
      email: "tranthib@example.com",
    },
    {
      name: "Phạm Văn C",
      phone: "0923456789",
      address: "789 Trần Hưng Đạo, Q5, TP.HCM",
      email: "phamvanc@example.com",
    },
  ];

  for (const customerData of customersData) {
    const [customer] = await db
      .insert(customers)
      .values(customerData)
      .returning()
      .catch((err) => {
        console.error("Lỗi khi tạo khách hàng:", err);
        return [null];
      });

    console.log("Đã tạo khách hàng:", customer);
  }

  // Tạo sản phẩm mẫu
  const productsData = [
    {
      name: "Hạt macca Đăk Lăk size trung (23mm-26mm) - 500gr",
      sku: "S001",
      price: 155000,
      description: "Hạt macca chất lượng cao từ Đăk Lăk",
      stock: 100,
    },
    {
      name: "Hạt điều rang muối - 250gr",
      sku: "S002",
      price: 75000,
      description: "Hạt điều rang muối thơm ngon, đóng gói kỹ lưỡng",
      stock: 150,
    },
    {
      name: "Hạt hạnh nhân Mỹ - 300gr",
      sku: "S003",
      price: 110000,
      description: "Hạt hạnh nhân nhập khẩu từ Mỹ, giàu dưỡng chất",
      stock: 80,
    },
  ];

  for (const productData of productsData) {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning()
      .catch((err) => {
        console.error("Lỗi khi tạo sản phẩm:", err);
        return [null];
      });

    console.log("Đã tạo sản phẩm:", product);
  }

  console.log("Đã hoàn thành khởi tạo dữ liệu mẫu!");
}

// Chạy function khởi tạo
seedDatabase()
  .then(() => {
    console.log("Kết thúc khởi tạo dữ liệu");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Lỗi khi khởi tạo dữ liệu:", error);
    process.exit(1);
  });
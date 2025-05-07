import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistance, format } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy");
}

export function formatDateTime(date: string | Date): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: vi });
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: vi });
}

export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}-${randomId}`;
}

export const orderStatusColors: Record<string, string> = {
  pending: "bg-gray-400 text-white",
  confirmed: "bg-blue-500 text-white",
  shipping: "bg-amber-500 text-white",
  completed: "bg-emerald-500 text-white",
  cancelled: "bg-red-500 text-white",
};

export const orderStatusTranslations: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

export const carrierTranslations: Record<string, string> = {
  ghn: "Giao hàng nhanh (GHN)",
  ghtk: "Giao hàng tiết kiệm (GHTK)",
  viettel_post: "Viettel Post",
  jt_express: "J&T Express",
  other: "Khác",
};

export function exportToExcel(data: any[], fileName: string) {
  import("xlsx").then((XLSX) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  });
}

export function downloadPdf(element: HTMLElement, fileName: string) {
  import("html2canvas").then((html2canvas) => {
    import("jspdf").then(({ jsPDF }) => {
      html2canvas.default(element).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        pdf.addImage(imgData, "PNG", imgX, 0, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${fileName}.pdf`);
      });
    });
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

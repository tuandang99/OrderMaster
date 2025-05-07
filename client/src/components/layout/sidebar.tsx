import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import useMobile from "@/hooks/use-mobile";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useMobile();

  const sidebarItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
      href: "/",
    },
    {
      title: "Đơn hàng",
      icon: <ClipboardList className="w-5 h-5 mr-3" />,
      href: "/orders",
    },
    {
      title: "Vận chuyển",
      icon: <Truck className="w-5 h-5 mr-3" />,
      href: "/shipping",
    },
    {
      title: "Khách hàng",
      icon: <Users className="w-5 h-5 mr-3" />,
      href: "/customers",
    },
    {
      title: "Sản phẩm",
      icon: <Package className="w-5 h-5 mr-3" />,
      href: "/products",
    },
    {
      title: "Báo cáo",
      icon: <BarChart3 className="w-5 h-5 mr-3" />,
      href: "/reports",
    },
    {
      title: "Cài đặt",
      icon: <Settings className="w-5 h-5 mr-3" />,
      href: "/settings",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  // Handle mobile overlay click
  const handleOverlayClick = () => {
    if (isMobile && isOpen) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-20 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleOverlayClick}
          aria-hidden="true"
        ></div>
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-white border-r border-gray-200 md:translate-x-0 md:static md:inset-0",
          isOpen ? "translate-x-0 ease-out" : "-translate-x-full ease-in"
        )}
      >
        <div className="flex items-center justify-center h-16 px-4 bg-primary">
          <h1 className="text-xl font-bold text-white">Order Manager</h1>
        </div>
        <nav className="px-2 py-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => isMobile && toggleSidebar()}
            >
              <a
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors group",
                  isActive(item.href)
                    ? "text-white bg-primary"
                    : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                )}
              >
                {React.cloneElement(item.icon, {
                  className: cn(
                    "w-5 h-5 mr-3",
                    isActive(item.href)
                      ? "text-white"
                      : "text-gray-500 group-hover:text-primary"
                  ),
                })}
                {item.title}
              </a>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

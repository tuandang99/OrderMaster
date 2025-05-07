import { useState } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setLocation(`/orders?search=${encodeURIComponent(searchValue)}`);
    }
  };

  return (
    <header className="relative z-10 flex flex-shrink-0 h-16 bg-white shadow">
      <button
        onClick={toggleSidebar}
        className="px-4 text-gray-500 border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex justify-between flex-1 px-4">
        <div className="flex flex-1">
          <form onSubmit={handleSearch} className="flex w-full md:ml-0">
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              <Input
                id="search"
                className="block w-full h-full py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-500 border-transparent focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent"
                placeholder="Tìm kiếm đơn hàng, khách hàng..."
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </form>
        </div>
        <div className="flex items-center ml-4 md:ml-6">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative w-8 h-8 rounded-full ml-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation("/profile")}>Hồ sơ</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/settings")}>Cài đặt</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, BarChart3, DollarSign, LogOut, User, FileText } from "lucide-react";

interface EmployeeSidebarProps {
  userName?: string;
  children?: React.ReactNode;
}

export function EmployeeSidebar({ userName, children }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false); // Default closed

  const menuItems = [
    { label: "Dashboard", href: "/employee/dashboard", icon: BarChart3 },
    { label: "Profile", href: "/employee/profile", icon: User },
    { label: "Policy", href: "/employee/policy", icon: FileText },
    { label: "Payroll", href: "/employee/payroll", icon: DollarSign },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${
        isOpen ? "w-64" : "w-16"
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        
        {/* Header with Toggle */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            {isOpen ? (
              <Image
                src="/logo.png"
                alt="Company Logo"
                width={220}
                height={192}
                className="h-8 object-contain"
              />
            ) : (
              <Image
                src="/smalllogo.jpg"
                alt="Logo"
                width={32}
                height={52}
                className="object-contain"
              />
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isOpen ? "justify-start" : "justify-center p-2.5"
                } ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title={!isOpen ? item.label : ""}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isOpen ? "justify-start" : "justify-center p-2.5"
            } text-gray-700 hover:bg-gray-100 hover:text-red-600`}
            title={!isOpen ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

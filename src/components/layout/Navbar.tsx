"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import NotificationBell from "@/components/notifications/NotificationBell";
import {
  Leaf,
  LogOut,
  Menu,
  X,
  FileText,
  AlertTriangle,
  Users,
  Database,
  PlusCircle,
  Home,
  Shield,
  Tractor,
  Sun,
  Moon,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, setUserProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    setIsDark(dark);
    localStorage.setItem("agricare_theme", dark ? "dark" : "light");
  };

  const role = userProfile?.role || "farmer";

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem("agricare_demo_user");
    setUserProfile(null);
    router.push("/login");
  };

  const getLinks = () => {
    if (role === "admin") {
      return [
        { href: "/admin", label: "Overview", icon: Home },
        { href: "/admin/users", label: "User Approvals", icon: Users },
        { href: "/admin/pests", label: "Pest Database", icon: Database },
        { href: "/admin/advisories", label: "Advisories", icon: AlertTriangle },
      ];
    } else if (role === "agriculturist") {
      return [
        { href: "/agriculturist", label: "Incident Queue", icon: FileText },
        { href: "/farmer/advisories", label: "Advisories", icon: AlertTriangle },
      ];
    } else {
      return [
        { href: "/farmer", label: "Dashboard", icon: Home },
        { href: "/farmer/report", label: "Report Incident", icon: PlusCircle },
        { href: "/farmer/advisories", label: "Advisories", icon: AlertTriangle },
      ];
    }
  };

  const links = getLinks();

  const getRoleBadge = () => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
          <Shield className="w-3 h-3 text-purple-600" /> Admin
        </span>
      );
    }
    if (role === "agriculturist") {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
          <Shield className="w-3 h-3 text-blue-600" /> Agriculturist
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
        <Tractor className="w-3 h-3 text-green-600" /> Farmer
      </span>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-green-600 p-1.5 rounded-lg text-white">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-gray-900 tracking-tight">AgriCare</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              suppressHydrationWarning
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              title="Toggle dark mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile Summary */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-gray-900">
                {userProfile?.fullName || "Active User"}
              </span>
              {getRoleBadge()}
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 border-b border-gray-100 mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">{userProfile?.fullName}</p>
              <p className="text-xs text-gray-500">{userProfile?.email}</p>
            </div>
            {getRoleBadge()}
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-green-50 text-green-700 font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleSignOut();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mt-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}

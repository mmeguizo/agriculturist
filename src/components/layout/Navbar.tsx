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
  Calendar,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, setUserProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("agricare_theme", dark ? "dark" : "light");
  };

  const role = userProfile?.role || "farmer";
  const homeHref = userProfile
    ? role === "admin"
      ? "/admin"
      : role === "agriculturist"
      ? "/agriculturist"
      : "/farmer"
    : "/";

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
        { href: "/admin/outbreak-calendar", label: "Outbreak Calendar", icon: Calendar },
        { href: "/admin/users", label: "User Approvals", icon: Users },
        { href: "/admin/pests", label: "Pest Database", icon: Database },
        { href: "/admin/advisories", label: "Advisories", icon: AlertTriangle },
      ];
    } else if (role === "agriculturist") {
      return [
        { href: "/agriculturist", label: "Incident Queue", icon: FileText },
        { href: "/agriculturist/outbreak-calendar", label: "Outbreak Calendar", icon: Calendar },
        { href: "/farmer/advisories", label: "Advisories", icon: AlertTriangle },
      ];
    } else {
      return [
        { href: "/farmer", label: "Dashboard", icon: Home },
        { href: "/farmer/report", label: "Report Incident", icon: PlusCircle },
        { href: "/farmer/calendar", label: "Outbreak Calendar", icon: Calendar },
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
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href={homeHref} className="flex items-center gap-2">
              <div className="bg-green-600 p-1.5 rounded-lg text-white">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">AgriCare</span>
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
                        ? "bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 font-bold"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
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
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Toggle dark mode"
              aria-label="Toggle dark mode"
            >
              <Sun className="h-5 w-5 theme-icon-sun" aria-hidden="true" />
              <Moon className="h-5 w-5 theme-icon-moon" aria-hidden="true" />
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile Summary */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {userProfile?.fullName || "Active User"}
              </span>
              {getRoleBadge()}
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 p-2 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 border-b border-gray-100 dark:border-gray-800 mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{userProfile?.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile?.email}</p>
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
                    ? "bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-400 font-bold"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
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
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg mt-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}

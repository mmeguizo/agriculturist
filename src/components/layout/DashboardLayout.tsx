"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import Navbar from "./Navbar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function DashboardLayout({
  children,
  allowedRoles,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { userProfile, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!userProfile) {
      router.push("/login");
      return;
    }

    if (userProfile.status === "pending") {
      router.push("/pending-approval");
      return;
    }

    if (userProfile.status === "rejected") {
      router.push("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
      // Redirect to their own dashboard if they don't have permission for this route
      if (userProfile.role === "admin") {
        router.push("/admin");
      } else if (userProfile.role === "agriculturist") {
        router.push("/agriculturist");
      } else {
        router.push("/farmer");
      }
      return;
    }

    setAuthorized(true);
  }, [userProfile, loading, allowedRoles, router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" label="Verifying authorization..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

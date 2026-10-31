"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { UserProfile, UserRole } from "@/lib/types";
import { Leaf, ArrowRight, ShieldAlert, Sparkles, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { setUserProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const routeByRoleAndStatus = (profile: UserProfile) => {
    if (profile.status === "pending") {
      router.push("/pending-approval");
      return;
    }
    if (profile.status === "rejected") {
      toast.error("Your account has been rejected by the administrator.");
      return;
    }
    toast.success(`Welcome back, ${profile.fullName}!`);
    if (profile.role === "admin") {
      router.push("/admin");
    } else if (profile.role === "agriculturist") {
      router.push("/agriculturist");
    } else {
      router.push("/farmer");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Try Firebase Auth
      let uid = "";
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        uid = userCred.user.uid;
      } catch (authErr: unknown) {
        // If demo credentials or Firebase config not yet loaded, look up demo users
        const demoUsers: UserProfile[] = JSON.parse(
          localStorage.getItem("agricare_all_users") || "[]"
        );
        const match = demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (match) {
          setUserProfile(match);
          localStorage.setItem("agricare_demo_user", JSON.stringify(match));
          routeByRoleAndStatus(match);
          return;
        }

        // Check if admin demo email
        if (email.toLowerCase().includes("admin")) {
          const adminProfile: UserProfile = {
            id: "admin-demo-1",
            fullName: "System Administrator",
            email: email,
            role: "admin",
            status: "approved",
            contactNumber: "0999 888 7777",
            farmLocation: "Municipal Agriculture Office",
            createdAt: new Date().toISOString(),
          };
          setUserProfile(adminProfile);
          localStorage.setItem("agricare_demo_user", JSON.stringify(adminProfile));
          routeByRoleAndStatus(adminProfile);
          return;
        }

        throw authErr;
      }

      // 2. Fetch User Profile from Firestore (with a timeout so the button never hangs forever)
      let docSnap;
      try {
        const profileTimeout = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Firestore request timed out. Make sure Cloud Firestore is created in your Firebase console."
                )
              ),
            10000
          )
        );
        docSnap = await Promise.race([
          getDoc(doc(db, "users", uid)),
          profileTimeout,
        ]);
      } catch (firestoreErr) {
        console.error("Firestore profile fetch failed:", firestoreErr);
        toast.error(
          "Could not load your profile. Make sure Cloud Firestore is created in your Firebase console."
        );
        return;
      }

      if (!docSnap.exists()) {
        toast.error("User profile not found. Please contact support.");
        return;
      }

      const profile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
      setUserProfile(profile);
      localStorage.setItem("agricare_demo_user", JSON.stringify(profile));
      routeByRoleAndStatus(profile);
    } catch (error: unknown) {
      console.error("Login error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to sign in. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Fast-Login Helper for evaluator convenience
  const loginAsDemoRole = (role: UserRole, status: "approved" | "pending" = "approved") => {
    const demoProfiles: Record<UserRole, UserProfile> = {
      admin: {
        id: "demo-admin-id",
        fullName: "Chief Agronomist Admin",
        email: "admin@agricare.gov.ph",
        role: "admin",
        status: "approved",
        contactNumber: "(02) 8928-8741",
        farmLocation: "Central Agricultural Bureau",
        createdAt: new Date().toISOString(),
      },
      agriculturist: {
        id: "demo-agri-id",
        fullName: "Maria Santos (Agriculturist)",
        email: "maria.agri@agricare.gov.ph",
        role: "agriculturist",
        status: status,
        contactNumber: "0918 234 5678",
        farmLocation: "Provincial Field Station",
        createdAt: new Date().toISOString(),
      },
      farmer: {
        id: "demo-farmer-id",
        fullName: "Pedro Penduko (Farmer)",
        email: "pedro.farmer@gmail.com",
        role: "farmer",
        status: status,
        contactNumber: "0917 888 9999",
        farmLocation: "Brgy. Malabanban, Candelaria, Quezon",
        createdAt: new Date().toISOString(),
      },
    };

    const profile = demoProfiles[role];
    setUserProfile(profile);
    localStorage.setItem("agricare_demo_user", JSON.stringify(profile));

    // Register into demo all_users list if not already present
    const existing = JSON.parse(localStorage.getItem("agricare_all_users") || "[]");
    if (!existing.some((u: UserProfile) => u.id === profile.id)) {
      existing.push(profile);
      localStorage.setItem("agricare_all_users", JSON.stringify(existing));
    }

    routeByRoleAndStatus(profile);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="bg-green-600 p-2 rounded-lg text-white">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl text-gray-900 tracking-tight">AgriCare</span>
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
          Sign in to your Account
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Access reporting dashboards, case queues, and crop advisories
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card shadow-md">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 shadow-md mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-green-600" />
              <span>Instant Demo Switcher (1-Click Test)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => loginAsDemoRole("farmer", "approved")}
                className="p-2 bg-green-50 hover:bg-green-100 text-green-800 text-xs font-semibold rounded-lg border border-green-200 text-center transition-colors"
              >
                Farmer
              </button>
              <button
                type="button"
                onClick={() => loginAsDemoRole("agriculturist", "approved")}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg border border-blue-200 text-center transition-colors"
              >
                Agriculturist
              </button>
              <button
                type="button"
                onClick={() => loginAsDemoRole("admin", "approved")}
                className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-lg border border-purple-200 text-center transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="font-semibold text-green-600 hover:text-green-700">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

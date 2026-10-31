"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserRole, UserProfile } from "@/lib/types";
import { Leaf, ArrowRight, ShieldCheck, Tractor, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [role, setRole] = useState<UserRole>("farmer");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !contactNumber || !farmLocation) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      let uid = "";
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCred.user.uid;
      } catch (authError) {
        // If API key is dummy or auth fails due to missing Firebase config, generate a mock UID for local demo
        const errObj = authError as { code?: unknown; message?: unknown };
        const code = typeof errObj === "object" && errObj !== null ? String(errObj.code ?? "") : "";
        const message =
          typeof errObj === "object" && errObj !== null
            ? String(errObj.message ?? "")
            : "";
        const isInvalidKey =
          code === "auth/api-key-not-valid" ||
          code === "auth/invalid-api-key" ||
          message.includes("API key not valid");
        if (isInvalidKey) {
          console.warn("Using demo registration fallback due to missing Firebase API key.");
          uid = "demo-" + Math.random().toString(36).substring(2, 9);
        } else {
          throw authError;
        }
      }

      const userProfile: UserProfile = {
        id: uid,
        fullName,
        email,
        role,
        status: "pending", // Critical requirement: always starts as pending!
        contactNumber,
        farmLocation,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, "users", uid), userProfile);
      } catch (dbError) {
        console.warn("Could not write to Firestore directly; storing locally:", dbError);
      }

      // Store in localStorage for instant offline demo session
      localStorage.setItem("agricare_demo_user", JSON.stringify(userProfile));

      // Append to local pending users list so demo Admin can approve them
      const existingPending = JSON.parse(localStorage.getItem("agricare_all_users") || "[]");
      existingPending.push(userProfile);
      localStorage.setItem("agricare_all_users", JSON.stringify(existingPending));

      toast.success("Account created successfully! Please wait for Admin approval.");
      router.push("/pending-approval");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
          Create an Account
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          All accounts undergo administrator verification before activation.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Registering As
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("farmer")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all text-center ${
                    role === "farmer"
                      ? "border-green-600 bg-green-50/70 text-green-900 font-semibold shadow-sm"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <Tractor className={`w-5 h-5 mb-1 ${role === "farmer" ? "text-green-600" : "text-gray-400"}`} />
                  <span className="text-sm font-medium">Farmer</span>
                  <span className="text-[11px] text-gray-500">Report & receive advice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("agriculturist")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all text-center ${
                    role === "agriculturist"
                      ? "border-green-600 bg-green-50/70 text-green-900 font-semibold shadow-sm"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <ShieldCheck className={`w-5 h-5 mb-1 ${role === "agriculturist" ? "text-green-600" : "text-gray-400"}`} />
                  <span className="text-sm font-medium">Agriculturist</span>
                  <span className="text-[11px] text-gray-500">Review cases & recommend</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Dela Cruz"
                className="input-field text-sm"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@example.com"
                className="input-field text-sm"
              />
            </div>

            {/* Contact & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="0912 345 6789"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Farm Location / Address
                </label>
                <input
                  type="text"
                  required
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  placeholder="Brgy. San Jose, Batangas"
                  className="input-field text-sm"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
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
            </div>

            {/* Notice */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
              <span className="font-semibold">Note:</span> After registering, an Administrator must approve your account before you can log in and submit reports.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 shadow-md mt-2"
            >
              {loading ? "Registering account..." : "Submit Registration"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
            Already have an approved account?{" "}
            <Link href="/login" className="font-semibold text-green-600 hover:text-green-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

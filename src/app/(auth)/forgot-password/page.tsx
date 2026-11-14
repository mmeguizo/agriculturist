"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { Leaf, ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [newDemoPassword, setNewDemoPassword] = useState("");
  const [demoPasswordUpdated, setDemoPasswordUpdated] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user exists in local demo store or is a known demo email
      const demoUser = localStore.users.findByEmail(email);
      const isKnownDemo =
        Boolean(demoUser) ||
        email.toLowerCase().includes("admin") ||
        email.toLowerCase().includes("agri") ||
        email.toLowerCase().includes("farmer");

      // 2. Attempt Firebase Auth password reset email
      let firebaseSucceeded = false;
      try {
        await sendPasswordResetEmail(auth, email);
        firebaseSucceeded = true;
      } catch (authErr: unknown) {
        console.warn("Firebase password reset attempt:", authErr);
      }

      if (firebaseSucceeded) {
        toast.success("Password reset email sent! Check your inbox.");
        setSubmitted(true);
      } else if (isKnownDemo) {
        // Offline demo fallback
        setIsDemoMode(true);
        localStore.users.resetPassword(email);
        toast.success("Demo account verified! You can reset your password below.");
        setSubmitted(true);
      } else {
        // Even if neither, for security best practices we show a neutral success message
        toast.success("If an account exists for this email, reset instructions were sent.");
        setSubmitted(true);
      }
    } catch (err: unknown) {
      console.error("Forgot password error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to process password reset. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDemoPassword || newDemoPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    localStore.users.resetPassword(email, newDemoPassword);
    setDemoPasswordUpdated(true);
    toast.success("Password updated successfully! You can now log in.");
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
          Reset Your Password
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          For Farmer, Agriculturist, and Admin accounts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card shadow-md">
          {!submitted ? (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Enter your registered email address below. We will send you instructions
                to securely reset your password.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field text-sm pl-10"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 shadow-md mt-2 flex items-center justify-center gap-2"
              >
                {loading ? "Sending link..." : "Send Reset Instructions"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-900">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Reset Instructions Sent</h4>
                  <p className="text-xs text-green-800 mt-0.5">
                    We sent instructions to <strong className="font-semibold">{email}</strong>.
                    Check your inbox and spam folder.
                  </p>
                </div>
              </div>

              {isDemoMode && !demoPasswordUpdated && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-1">
                    <KeyRound className="w-4 h-4 text-amber-700" /> Demo Mode Quick Reset
                  </div>
                  <p className="text-xs text-amber-800 mb-3">
                    Since this is a demo environment, you can set a new password right now:
                  </p>
                  <form onSubmit={handleDemoPasswordUpdate} className="space-y-2">
                    <input
                      type="password"
                      value={newDemoPassword}
                      onChange={(e) => setNewDemoPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 chars)"
                      className="input-field text-sm bg-white"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-2 px-3 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Update Password Now
                    </button>
                  </form>
                </div>
              )}

              {demoPasswordUpdated && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Your demo password was updated! You may now sign in.
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setIsDemoMode(false);
                    setDemoPasswordUpdated(false);
                  }}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                >
                  Did not receive it? Try a different email
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-green-600 hover:text-green-700 text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact the Municipal Agriculture Office in Negros Occidental.
          </p>
        </div>
      </div>
    </div>
  );
}

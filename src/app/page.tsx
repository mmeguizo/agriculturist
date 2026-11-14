"use client";

import Link from "next/link";
import { Leaf, Bug, ShieldCheck, Sparkles, ArrowRight, Camera, CheckCircle2, LayoutDashboard } from "lucide-react";
import FooterYear from "@/components/ui/FooterYear";
import { useAuth } from "@/lib/auth-context";

export default function LandingPage() {
  const { userProfile } = useAuth();

  const dashboardHref = userProfile
    ? userProfile.role === "admin"
      ? "/admin"
      : userProfile.role === "agriculturist"
      ? "/agriculturist"
      : "/farmer"
    : "/login";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-green-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={userProfile ? dashboardHref : "/"} className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-lg text-white">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">AgriCare</span>
              <span className="hidden sm:inline-block text-xs bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 font-semibold px-2 py-0.5 rounded ml-2">
                Pest &amp; Disease Advisory
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {userProfile ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 hidden sm:inline">
                  Welcome, <strong className="text-gray-900 dark:text-white">{userProfile.fullName}</strong>
                </span>
                <Link
                  href={dashboardHref}
                  className="btn-primary text-sm shadow-sm inline-flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-green-700 px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In 
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm shadow-sm"
                >
                  Register
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-green-100/80 dark:bg-green-950/60 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span>Powered by Google Gemini Plant Vision AI</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight max-w-3xl leading-tight">
          Mobile-Based Pest &amp; Disease <span className="text-green-600">Reporting &amp; Advisory</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
          Empowering farmers with instant AI-assisted diagnosis and direct expert verification from agricultural extension officers. Fast, accurate, and field-ready.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {userProfile ? (
            <Link
              href={dashboardHref}
              className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Go to Your {userProfile.role.toUpperCase()} Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="btn-primary w-full sm:w-auto px-8 py-3 text-base shadow-md hover:shadow-lg"
              >
                Create Farmer / Officer Account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="btn-secondary w-full sm:w-auto px-8 py-3 text-base"
              >
                Existing User Login
              </Link>
            </>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="card hover:shadow-md transition-shadow border-t-4 border-t-green-600 dark:bg-gray-900 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">1. Farmer Incident Report</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Farmers capture and upload at least 4 clear photos of damaged foliage, crops, or pests. Automated GPS and crop details ensure comprehensive documentation.
            </p>
          </div>

          <div className="card hover:shadow-md transition-shadow border-t-4 border-t-blue-600 dark:bg-gray-900 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">2. Instant AI Preliminary Scan</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Google Gemini vision models examine the photos in real-time, detecting disease symptoms, severity levels, and generating a baseline recommendation draft.
            </p>
          </div>

          <div className="card hover:shadow-md transition-shadow border-t-4 border-t-emerald-600 dark:bg-gray-900 dark:border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">3. Agriculturist Validation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Certified agriculturists inspect the incident queue, verify the AI findings, tag the pest from the official database, and transmit verified treatment prescriptions.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>&copy; <FooterYear /> AgriCare. Mobile-Based Pest and Disease Reporting and Advisory System.</p>
        <p className="mt-1">Built for Negros Occidental agricultural communities.</p>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { Leaf, Bug, ShieldCheck, Sparkles, ArrowRight, Camera, CheckCircle2 } from "lucide-react";
import FooterYear from "@/components/ui/FooterYear";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-green-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-lg text-white">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">AgriCare</span>
              <span className="hidden sm:inline-block text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded ml-2">
                Pest & Disease Advisory
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-700 hover:text-green-700 px-3 py-2 rounded-lg transition-colors"
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-green-100/80 border border-green-200 text-green-800 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-green-600" />
          <span>Powered by Google Gemini Plant Vision AI</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight max-w-3xl leading-tight">
          Mobile-Based Pest & Disease <span className="text-green-600">Reporting & Advisory</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
          Empowering farmers with instant AI-assisted diagnosis and direct expert verification from agricultural extension officers. Fast, accurate, and field-ready.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
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
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="card hover:shadow-md transition-shadow border-t-4 border-t-green-600">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">1. Farmer Incident Report</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Farmers capture and upload at least 4 clear photos of damaged foliage, crops, or pests. Automated GPS and crop details ensure comprehensive documentation.
            </p>
          </div>

          <div className="card hover:shadow-md transition-shadow border-t-4 border-t-blue-600">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">2. Instant AI Preliminary Scan</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Google Gemini vision models examine the photos in real-time, detecting disease symptoms, severity levels, and generating a baseline recommendation draft.
            </p>
          </div>

          <div className="card hover:shadow-md transition-shadow border-t-4 border-t-emerald-600">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">3. Agriculturist Validation</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Certified agriculturists inspect the incident queue, verify the AI findings, tag the pest from the official database, and transmit verified treatment prescriptions.
            </p>
          </div>
        </div>

        {/* Roles Banner */}
        <div className="mt-16 w-full card bg-green-900 text-white border-0 p-8 sm:p-12 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-green-300 text-xs uppercase font-bold tracking-wider">Secure Community Ecosystem</span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1">Admin-Approved Registration</h2>
              <p className="text-green-100 text-sm mt-2 max-w-xl">
                Every farmer and agriculturist account is verified by administrators to maintain data integrity and deliver reliable advisories.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <Link href="/register" className="bg-white text-green-900 hover:bg-green-50 font-bold px-6 py-3 rounded-lg text-sm shadow transition-colors">
                Get Started Today
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        <p>
          © <Suspense fallback={null}>
            <FooterYear />
          </Suspense>{" "}
          AgriCare System. Mobile-Based Pest and Disease Reporting and Advisory System.
        </p>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SeasonalOutbreakChart from "@/components/charts/SeasonalOutbreakChart";
import SeasonalCalendarMatrix from "@/components/charts/SeasonalCalendarMatrix";
import {
  MONTHLY_OUTBREAK_SCHEDULE,
  NEGROS_CROPS,
  CropCategory,
  MonthlyOutbreakData,
} from "@/lib/seasonal-data";
import { printSeasonalOutbreakReport } from "@/lib/outbreak-print";
import {
  Calendar,
  Printer,
  BarChart3,
  Layers,
  AlertTriangle,
  Download,
  Info,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export default function AdminOutbreakCalendarPage() {
  const [selectedCrop, setSelectedCrop] = useState<CropCategory>("All Crops");
  const [selectedSeason, setSelectedSeason] = useState<"all" | "Wet Season" | "Dry Season">("all");

  const handlePrint = () => {
    printSeasonalOutbreakReport({
      season: selectedSeason,
      crop: selectedCrop,
    });
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4 text-purple-300" /> Negros Occidental Surveillance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Seasonal Outbreak Calendar &amp; Visual Reports
            </h1>
            <p className="text-sm text-purple-100 mt-1 max-w-2xl">
              Monitor predictable seasonal outbreak patterns for Rice, Corn, Sugarcane, and
              Vegetables to plan proactive barangay advisories and input distribution.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary bg-white text-purple-900 hover:bg-purple-50 hover:text-purple-950 shadow-md font-bold text-sm shrink-0 flex items-center gap-2 py-2.5 px-4"
          >
            <Printer className="w-4 h-4 text-purple-700" />
            Print Outbreak Report {selectedSeason !== "all" ? `(${selectedSeason})` : "(All Seasons)"}
          </button>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
            <div className="p-3 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                Peak Risk Window
              </p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">July &ndash; September</p>
            </div>
          </div>

          <div className="card flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
            <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                Target Crops
              </p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">4 Major Groups</p>
            </div>
          </div>

          <div className="card flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
            <div className="p-3 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                Sugarcane Season
              </p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">Milling &amp; Planting</p>
            </div>
          </div>

          <div className="card flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
            <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                Active Calendar
              </p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">12-Month Coverage</p>
            </div>
          </div>
        </div>

        {/* Section 1: Interactive Visual Chart */}
        <SeasonalOutbreakChart
          selectedCrop={selectedCrop}
          onCropChange={setSelectedCrop}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
        />

        {/* Section 2: Full 12-Month Outbreak Matrix */}
        <SeasonalCalendarMatrix initialCrop={selectedCrop} />
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SeasonalOutbreakChart from "@/components/charts/SeasonalOutbreakChart";
import SeasonalCalendarMatrix from "@/components/charts/SeasonalCalendarMatrix";
import {
  MONTHLY_OUTBREAK_SCHEDULE,
  NEGROS_CROPS,
  CropCategory,
  MonthlyOutbreakData,
} from "@/lib/seasonal-data";
import { printSeasonalOutbreakReport, OutbreakPrintMode } from "@/lib/outbreak-print";
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
  ChevronDown,
  FileText,
} from "lucide-react";

export default function AdminOutbreakCalendarPage() {
  const [selectedCrop, setSelectedCrop] = useState<CropCategory>("All Crops");
  const [selectedSeason, setSelectedSeason] = useState<"all" | "Wet Season" | "Dry Season">("all");
  const [bannerPrintOpen, setBannerPrintOpen] = useState(false);
  const bannerPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bannerPrintRef.current && !bannerPrintRef.current.contains(event.target as Node)) {
        setBannerPrintOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrint = (mode: OutbreakPrintMode = "full") => {
    setBannerPrintOpen(false);
    printSeasonalOutbreakReport({
      season: selectedSeason,
      crop: selectedCrop,
      mode,
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

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint("chart-only")}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 shadow-xs font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 py-2.5 px-3.5 transition-colors"
              title="Print the visual outbreak graph for current season"
            >
              <BarChart3 className="w-4 h-4 text-purple-200" />
              <span>Print Graph</span>
            </button>

            <div className="relative" ref={bannerPrintRef}>
              <button
                type="button"
                onClick={() => setBannerPrintOpen(!bannerPrintOpen)}
                className="btn-primary bg-white text-purple-900 hover:bg-purple-50 hover:text-purple-950 shadow-md font-bold text-xs sm:text-sm flex items-center gap-2 py-2.5 px-4"
              >
                <Printer className="w-4 h-4 text-purple-700" />
                <span>Print Outbreak Report {selectedSeason !== "all" ? `(${selectedSeason})` : ""}</span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-700 ml-0.5" />
              </button>

              {bannerPrintOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-gray-200 py-1.5 z-50 text-left text-gray-900">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Print Surveillance Report
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePrint("full")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex items-start gap-2.5 transition-colors group"
                  >
                    <Printer className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-purple-700">
                        Complete Report (Graph + Table)
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Visual outbreak chart and full mitigation table
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint("chart-only")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex items-start gap-2.5 transition-colors group"
                  >
                    <BarChart3 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-indigo-700">
                        Visual Graph Only
                      </div>
                      <div className="text-[10px] text-gray-500">
                        1-Page landscape chart infographic &amp; KPIs
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint("table-only")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex items-start gap-2.5 transition-colors group"
                  >
                    <FileText className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-emerald-700">
                        Data Table Only
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Original tabular outbreak data report
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
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

"use client";

import { useState } from "react";
import {
  MONTHLY_OUTBREAK_SCHEDULE,
  NEGROS_CROPS,
  CropCategory,
  MonthlyOutbreakData,
} from "@/lib/seasonal-data";
import {
  Calendar,
  CloudRain,
  Sun,
  AlertTriangle,
} from "lucide-react";

interface Props {
  initialCrop?: CropCategory;
}

export default function SeasonalCalendarMatrix({ initialCrop = "All Crops" }: Props) {
  const [selectedCrop, setSelectedCrop] = useState<CropCategory>(initialCrop);
  const [seasonFilter, setSeasonFilter] = useState<"all" | "Wet Season" | "Dry Season">("all");
  const currentMonthIndex = new Date().getMonth() + 1;

  const filteredMonths = MONTHLY_OUTBREAK_SCHEDULE.filter((m) => {
    if (seasonFilter === "all") return true;
    return m.season === seasonFilter;
  });

  return (
    <div className="card shadow-sm space-y-4 dark:bg-gray-900 dark:border-gray-800">
      {/* Matrix Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Monthly Outbreak Calendar Matrix &bull; Negros Occidental
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            12-Month pest and disease vulnerability guide across all major crops
          </p>
        </div>

        {/* Season Filter Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSeasonFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                seasonFilter === "all"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All 12 Months
            </button>
            <button
              type="button"
              onClick={() => setSeasonFilter("Wet Season")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                seasonFilter === "Wet Season"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <CloudRain className="w-3 h-3" /> Wet Season
            </button>
            <button
              type="button"
              onClick={() => setSeasonFilter("Dry Season")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                seasonFilter === "Dry Season"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Sun className="w-3 h-3" /> Dry Season
            </button>
          </div>
        </div>
      </div>

      {/* Crop Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {NEGROS_CROPS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCrop(c.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
              selectedCrop === c.id
                ? "bg-green-700 text-white shadow-xs"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Grid of Months */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMonths.map((m) => {
          const isCurrentMonth = m.monthIndex === currentMonthIndex;
          const isWetSeason = m.season === "Wet Season";

          return (
            <div
              key={m.monthIndex}
              className={`rounded-xl border p-4 transition-all relative ${
                isCurrentMonth
                  ? "border-green-500 bg-green-50/40 dark:bg-green-950/20 ring-2 ring-green-500/20"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/60 hover:border-purple-300 dark:hover:border-purple-700"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                      isCurrentMonth
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {m.shortName}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{m.monthName}</h4>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                      {isWetSeason ? (
                        <>
                          <CloudRain className="w-2.5 h-2.5 text-blue-500" /> Wet Season
                        </>
                      ) : (
                        <>
                          <Sun className="w-2.5 h-2.5 text-amber-500" /> Dry Season
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {isCurrentMonth && (
                    <span className="inline-block text-[9px] font-extrabold bg-green-600 text-white px-2 py-0.5 rounded-full uppercase mb-0.5">
                      Current
                    </span>
                  )}
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        m.overallRiskLevel === "critical"
                          ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300"
                          : m.overallRiskLevel === "high"
                          ? "bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300"
                          : m.overallRiskLevel === "moderate"
                          ? "bg-yellow-100 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300"
                          : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {m.overallRiskLevel} risk
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Targets (from notes.txt) */}
              <div className="mb-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-lg p-2.5">
                <p className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Outbreak Targets:
                </p>
                <div className="flex flex-wrap gap-1">
                  {m.highlightOutbreaks.map((p, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-bold bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-amber-200 dark:border-gray-700 px-2 py-0.5 rounded"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selected Crop Specifics */}
              {selectedCrop === "All Crops" ? (
                <div className="space-y-1.5 text-xs">
                  {(["Rice", "Corn", "Sugarcane", "Vegetables"] as const).map((crop) => {
                    const ct = m.cropThreats[crop];
                    return (
                      <div
                        key={crop}
                        className="flex items-center justify-between py-1 border-t border-gray-100 dark:border-gray-800 first:border-0"
                      >
                        <span className="font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                          {crop}:
                        </span>
                        <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate max-w-[170px] text-right">
                          {ct.pests.map((p) => p.name).join(", ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <p className="font-semibold text-purple-900 dark:text-purple-300 text-[11px]">
                    {selectedCrop} Stage: {m.cropThreats[selectedCrop]?.stage}
                  </p>
                  <ul className="space-y-1">
                    {m.cropThreats[selectedCrop]?.pests.map((p, pIdx) => (
                      <li key={pIdx} className="text-[11px] text-gray-700 dark:text-gray-300 flex items-start gap-1">
                        <span className="text-red-500 font-bold shrink-0">&bull;</span>
                        <span>
                          <strong>{p.name}:</strong> {p.symptoms}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

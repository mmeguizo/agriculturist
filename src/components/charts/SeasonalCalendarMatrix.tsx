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
  Filter,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  Sun,
  Shield,
  Layers,
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
    <div className="card shadow-sm space-y-4">
      {/* Matrix Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-green-100 text-green-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-gray-900 text-base">
              Monthly Outbreak Calendar Matrix &bull; Negros Occidental
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            12-Month pest and disease vulnerability guide across all major crops
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSeasonFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                seasonFilter === "all" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
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
                  : "text-gray-600 hover:text-gray-900"
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
                  : "text-gray-600 hover:text-gray-900"
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
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                  ? "border-green-500 bg-green-50/40 ring-2 ring-green-500/20"
                  : "border-gray-200 bg-white hover:border-purple-300"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                      isCurrentMonth
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {m.shortName}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{m.monthName}</h4>
                    <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
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
                          ? "bg-red-100 text-red-700"
                          : m.overallRiskLevel === "high"
                          ? "bg-orange-100 text-orange-700"
                          : m.overallRiskLevel === "moderate"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {m.overallRiskLevel} risk
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Targets (from notes.txt) */}
              <div className="mb-3 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5">
                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Outbreak Targets:
                </p>
                <div className="flex flex-wrap gap-1">
                  {m.highlightOutbreaks.map((p, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-bold bg-white text-gray-800 border border-amber-200 px-2 py-0.5 rounded"
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
                        className="flex items-center justify-between py-1 border-t border-gray-100 first:border-0"
                      >
                        <span className="font-semibold text-gray-700 text-[11px]">{crop}:</span>
                        <span className="text-[11px] text-gray-600 truncate max-w-[170px] text-right">
                          {ct.pests.map((p) => p.name).join(", ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs space-y-1.5 pt-1 border-t border-gray-100">
                  <p className="font-semibold text-purple-900 text-[11px]">
                    {selectedCrop} Stage: {m.cropThreats[selectedCrop]?.stage}
                  </p>
                  <ul className="space-y-1">
                    {m.cropThreats[selectedCrop]?.pests.map((p, pIdx) => (
                      <li key={pIdx} className="text-[11px] text-gray-700 flex items-start gap-1">
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

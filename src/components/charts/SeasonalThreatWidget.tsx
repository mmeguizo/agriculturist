"use client";

import Link from "next/link";
import { getCurrentMonthOutbreak } from "@/lib/seasonal-data";
import {
  AlertTriangle,
  Calendar,
  ArrowRight,
  ShieldAlert,
  CloudRain,
  Sun,
} from "lucide-react";

interface Props {
  role?: "farmer" | "agriculturist" | "admin";
}

export default function SeasonalThreatWidget({ role = "farmer" }: Props) {
  const current = getCurrentMonthOutbreak();
  const calendarLink =
    role === "admin"
      ? "/admin/outbreak-calendar"
      : role === "agriculturist"
      ? "/agriculturist/outbreak-calendar"
      : "/farmer/calendar";

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
      {/* Background Icon */}
      <div className="absolute -right-3 -bottom-3 text-amber-200/40 pointer-events-none">
        <AlertTriangle className="w-28 h-28" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-amber-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              <AlertTriangle className="w-3 h-3" /> Seasonal Outbreak Alert
            </span>
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              {current.monthName} ({current.season} in Negros Occidental)
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
            Active Outbreak Targets for {current.monthName}:
          </h3>

          {/* Highlights from notes.txt */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {current.highlightOutbreaks.map((pest, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-bold bg-white/90 text-amber-950 border border-amber-300/80 px-2.5 py-1 rounded-lg shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {pest}
              </span>
            ))}
          </div>

          <p className="text-xs text-gray-600 pt-1">
            Affecting <strong className="font-semibold text-gray-800">Rice, Corn, Sugarcane &amp; Vegetables</strong>. Take preventive cultural and biological controls before symptoms spread.
          </p>
        </div>

        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
          <span
            className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase ${
              current.overallRiskLevel === "critical"
                ? "bg-red-600 text-white"
                : current.overallRiskLevel === "high"
                ? "bg-orange-600 text-white"
                : "bg-amber-600 text-white"
            }`}
          >
            {current.overallRiskLevel} Risk
          </span>

          <Link
            href={calendarLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-gray-900 hover:text-green-700 px-3.5 py-2 rounded-xl border border-gray-300 hover:border-green-500 shadow-2xs transition-all group"
          >
            <span>View Full Calendar</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

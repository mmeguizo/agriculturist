"use client";

import { useState } from "react";
import {
  MONTHLY_OUTBREAK_SCHEDULE,
  NEGROS_CROPS,
  CropCategory,
  MonthlyOutbreakData,
  ThreatSeverity,
  getCropThreatScore,
  getCropThreatLevel,
} from "@/lib/seasonal-data";
import {
  AlertTriangle,
  Calendar,
  CloudRain,
  Sun,
  Layers,
  Filter,
  RotateCcw,
  Check,
} from "lucide-react";

interface Props {
  selectedCrop?: CropCategory;
  onCropChange?: (crop: CropCategory) => void;
  onSelectMonth?: (month: MonthlyOutbreakData) => void;
}

const SEVERITY_COLORS: Record<string, { fill: string; stroke: string; bg: string; text: string; darkBg: string; darkText: string }> = {
  critical: {
    fill: "#ef4444",
    stroke: "#b91c1c",
    bg: "bg-red-100",
    text: "text-red-700",
    darkBg: "dark:bg-red-950/80",
    darkText: "dark:text-red-300",
  },
  high: {
    fill: "#f97316",
    stroke: "#c2410c",
    bg: "bg-orange-100",
    text: "text-orange-700",
    darkBg: "dark:bg-orange-950/80",
    darkText: "dark:text-orange-300",
  },
  moderate: {
    fill: "#eab308",
    stroke: "#a16207",
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    darkBg: "dark:bg-yellow-950/80",
    darkText: "dark:text-yellow-300",
  },
  low: {
    fill: "#10b981",
    stroke: "#047857",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    darkBg: "dark:bg-emerald-950/80",
    darkText: "dark:text-emerald-300",
  },
};

export default function SeasonalOutbreakChart({
  selectedCrop: controlledCrop,
  onCropChange,
  onSelectMonth,
}: Props) {
  const [internalCrop, setInternalCrop] = useState<CropCategory>("All Crops");
  const activeCrop = controlledCrop || internalCrop;

  const currentMonthIndex = new Date().getMonth() + 1;
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyOutbreakData | null>(null);
  const [activeMonth, setActiveMonth] = useState<MonthlyOutbreakData>(() => {
    return (
      MONTHLY_OUTBREAK_SCHEDULE.find((m) => m.monthIndex === currentMonthIndex) ||
      MONTHLY_OUTBREAK_SCHEDULE[4] // default May
    );
  });

  // Interactive Filter States
  const [seasonFilter, setSeasonFilter] = useState<"all" | "Wet Season" | "Dry Season">("all");
  const [threatFilter, setThreatFilter] = useState<"all" | ThreatSeverity>("all");

  const handleCropSelect = (crop: CropCategory) => {
    if (onCropChange) onCropChange(crop);
    else setInternalCrop(crop);
  };

  const handleMonthClick = (m: MonthlyOutbreakData) => {
    setActiveMonth(m);
    if (onSelectMonth) onSelectMonth(m);
  };

  const toggleSeasonFilter = (season: "Wet Season" | "Dry Season") => {
    const nextSeason = seasonFilter === season ? "all" : season;
    setSeasonFilter(nextSeason);

    // If active month doesn't match new filter, auto-select first matching month
    if (nextSeason !== "all") {
      const match = MONTHLY_OUTBREAK_SCHEDULE.find((m) => {
        const matchesS = m.season === nextSeason;
        const matchesT = threatFilter === "all" || getCropThreatLevel(m, activeCrop) === threatFilter;
        return matchesS && matchesT;
      });
      if (match) setActiveMonth(match);
    }
  };

  const toggleThreatFilter = (level: ThreatSeverity) => {
    const nextThreat = threatFilter === level ? "all" : level;
    setThreatFilter(nextThreat);

    // If active month doesn't match new filter, auto-select first matching month
    if (nextThreat !== "all") {
      const match = MONTHLY_OUTBREAK_SCHEDULE.find((m) => {
        const matchesS = seasonFilter === "all" || m.season === seasonFilter;
        const matchesT = getCropThreatLevel(m, activeCrop) === nextThreat;
        return matchesS && matchesT;
      });
      if (match) setActiveMonth(match);
    }
  };

  const resetFilters = () => {
    setSeasonFilter("all");
    setThreatFilter("all");
  };

  const isFilterActive = seasonFilter !== "all" || threatFilter !== "all";

  // Dimensions for SVG Bar & Trend Chart
  const svgWidth = 800;
  const svgHeight = 280;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const colWidth = chartWidth / 12;

  // Compute points for trend line
  const points = MONTHLY_OUTBREAK_SCHEDULE.map((m, idx) => {
    const score = getCropThreatScore(m, activeCrop);
    const x = paddingLeft + idx * colWidth + colWidth / 2;
    const y = paddingTop + chartHeight - (score / 10) * chartHeight;
    return { x, y, score, month: m };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Check matching count
  const matchingMonthsCount = MONTHLY_OUTBREAK_SCHEDULE.filter((m) => {
    const sMatch = seasonFilter === "all" || m.season === seasonFilter;
    const tMatch = threatFilter === "all" || getCropThreatLevel(m, activeCrop) === threatFilter;
    return sMatch && tMatch;
  }).length;

  return (
    <div className="card shadow-sm space-y-5 dark:bg-gray-900 dark:border-gray-800">
      {/* Header & Crop Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-lg">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
              Seasonal Pest &amp; Disease Outbreak Visualizer
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Historical outbreak threat intensity and seasonal vulnerability in{" "}
            <strong className="text-gray-700 dark:text-gray-200">Negros Occidental</strong>
          </p>
        </div>

        {/* Crop Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {NEGROS_CROPS.map((c) => {
            const isSelected = activeCrop === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCropSelect(c.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-purple-700 text-white shadow-sm ring-1 ring-purple-600"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Filter Toolbar: Season & Threat Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs bg-gray-50 dark:bg-gray-950/70 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800">
        {/* Season Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Season Filter:
          </span>

          <button
            type="button"
            onClick={() => setSeasonFilter("all")}
            className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
              seasonFilter === "all"
                ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 shadow-2xs"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            }`}
          >
            All Seasons
          </button>

          <button
            type="button"
            onClick={() => toggleSeasonFilter("Wet Season")}
            className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
              seasonFilter === "Wet Season"
                ? "bg-blue-600 text-white ring-2 ring-blue-400 shadow-sm"
                : "bg-blue-50/90 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60"
            }`}
            title="Click to filter wet season months (May - Oct)"
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Wet Season (May – Oct)</span>
            {seasonFilter === "Wet Season" && <Check className="w-3 h-3 stroke-[3]" />}
          </button>

          <button
            type="button"
            onClick={() => toggleSeasonFilter("Dry Season")}
            className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
              seasonFilter === "Dry Season"
                ? "bg-amber-600 text-white ring-2 ring-amber-400 shadow-sm"
                : "bg-amber-50/90 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60"
            }`}
            title="Click to filter dry season months (Nov - Apr)"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Dry Season (Nov – Apr)</span>
            {seasonFilter === "Dry Season" && <Check className="w-3 h-3 stroke-[3]" />}
          </button>
        </div>

        {/* Threat Level Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider mr-1">
            Threat Level:
          </span>

          {(["critical", "high", "moderate", "low"] as const).map((level) => {
            const isSelected = threatFilter === level;
            const meta = SEVERITY_COLORS[level];
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleThreatFilter(level)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-purple-600 shadow-sm scale-105 " + meta.bg + " " + meta.text + " " + meta.darkBg + " " + meta.darkText
                    : meta.bg + " " + meta.text + " " + meta.darkBg + " " + meta.darkText + " opacity-80 hover:opacity-100"
                }`}
                title={`Filter months with ${level} threat level`}
              >
                {isSelected ? `✓ ${level}` : level}
              </button>
            );
          })}

          {isFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors ml-1"
              title="Reset all active filters"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter Active Notification Banner */}
      {isFilterActive && (
        <div className="flex items-center justify-between text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-lg text-purple-900 dark:text-purple-200 font-semibold">
          <span>
            Showing <strong className="font-extrabold">{matchingMonthsCount}</strong> of 12 months &bull;{" "}
            {seasonFilter !== "all" && <span className="capitalize">{seasonFilter} </span>}
            {threatFilter !== "all" && <span className="capitalize">({threatFilter} Threat)</span>}
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] text-purple-700 dark:text-purple-300 underline font-bold hover:text-purple-900"
          >
            Show All 12 Months
          </button>
        </div>
      )}

      {/* Interactive Responsive SVG Chart */}
      <div className="relative overflow-x-auto bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-2 shadow-2xs">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[640px] select-none"
        >
          {/* Background Season Shading */}
          {/* Dry Season 1: Jan to Apr (months 1-4) */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={colWidth * 4}
            height={chartHeight}
            className="fill-amber-50/70 dark:fill-amber-950/20"
          />
          {/* Wet Season: May to Oct (months 5-10) */}
          <rect
            x={paddingLeft + colWidth * 4}
            y={paddingTop}
            width={colWidth * 6}
            height={chartHeight}
            className="fill-blue-50/80 dark:fill-blue-950/30"
          />
          {/* Dry Season 2: Nov to Dec (months 11-12) */}
          <rect
            x={paddingLeft + colWidth * 10}
            y={paddingTop}
            width={colWidth * 2}
            height={chartHeight}
            className="fill-amber-50/70 dark:fill-amber-950/20"
          />

          {/* Grid lines and Y-axis scale */}
          {[0, 2.5, 5, 7.5, 10].map((score) => {
            const y = paddingTop + chartHeight - (score / 10) * chartHeight;
            return (
              <g key={score}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#94a3b8"
                  strokeOpacity="0.25"
                  strokeDasharray={score === 0 ? "none" : "3 3"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="sans-serif"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Trend Area Fill */}
          <polygon
            points={`
              ${points[0].x},${paddingTop + chartHeight}
              ${polylineStr}
              ${points[points.length - 1].x},${paddingTop + chartHeight}
            `}
            fill="url(#trendGradient)"
            opacity="0.25"
          />

          {/* Trend Polyline */}
          <polyline
            points={polylineStr}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Month Columns & Interactive Bars */}
          {MONTHLY_OUTBREAK_SCHEDULE.map((m, idx) => {
            const score = getCropThreatScore(m, activeCrop);
            const severity = getCropThreatLevel(m, activeCrop);
            const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;
            const barHeight = (score / 10) * chartHeight;
            const barWidth = colWidth * 0.55;
            const x = paddingLeft + idx * colWidth + (colWidth - barWidth) / 2;
            const y = paddingTop + chartHeight - barHeight;
            const isHovered = hoveredMonth?.monthIndex === m.monthIndex;
            const isCurrent = m.monthIndex === currentMonthIndex;
            const isSelected = activeMonth.monthIndex === m.monthIndex;

            // Filter match calculation
            const sMatch = seasonFilter === "all" || m.season === seasonFilter;
            const tMatch = threatFilter === "all" || severity === threatFilter;
            const isIncludedByFilter = sMatch && tMatch;

            const barOpacity = isIncludedByFilter
              ? isHovered || isSelected
                ? 1
                : 0.88
              : 0.18;

            return (
              <g
                key={m.monthIndex}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredMonth(m)}
                onMouseLeave={() => setHoveredMonth(null)}
                onClick={() => handleMonthClick(m)}
              >
                {/* Column background hover highlight */}
                <rect
                  x={paddingLeft + idx * colWidth}
                  y={paddingTop}
                  width={colWidth}
                  height={chartHeight}
                  fill="#8b5cf6"
                  opacity={isSelected ? "0.15" : isHovered ? "0.08" : "0"}
                  rx="4"
                />

                {/* Vertical Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color.fill}
                  rx="4"
                  opacity={barOpacity}
                  stroke={isSelected ? "#4c1d95" : isHovered ? "#1f2937" : "none"}
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Score label above bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={isIncludedByFilter ? color.stroke : "#9ca3af"}
                  opacity={isIncludedByFilter ? 1 : 0.4}
                  fontFamily="sans-serif"
                >
                  {score.toFixed(1)}
                </text>

                {/* Trend line node dot */}
                <circle
                  cx={paddingLeft + idx * colWidth + colWidth / 2}
                  cy={paddingTop + chartHeight - (score / 10) * chartHeight}
                  r={isSelected ? 5 : isHovered ? 4 : 3}
                  fill="#ffffff"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  opacity={isIncludedByFilter ? 1 : 0.3}
                />

                {/* Current Month Marker Pill */}
                {isCurrent && (
                  <rect
                    x={paddingLeft + idx * colWidth + 4}
                    y={paddingTop + 4}
                    width={colWidth - 8}
                    height={16}
                    fill="#15803d"
                    rx="8"
                  />
                )}
                {isCurrent && (
                  <text
                    x={paddingLeft + idx * colWidth + colWidth / 2}
                    y={paddingTop + 15}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#ffffff"
                    fontFamily="sans-serif"
                  >
                    NOW
                  </text>
                )}

                {/* Month Name on X-axis */}
                <text
                  x={paddingLeft + idx * colWidth + colWidth / 2}
                  y={paddingTop + chartHeight + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isCurrent || isSelected ? "bold" : "500"}
                  fill={
                    isCurrent
                      ? "#15803d"
                      : isSelected
                      ? "#8b5cf6"
                      : isIncludedByFilter
                      ? "#4b5563"
                      : "#9ca3af"
                  }
                  fontFamily="sans-serif"
                >
                  {m.shortName}
                </text>

                {/* Season icon under month name */}
                <text
                  x={paddingLeft + idx * colWidth + colWidth / 2}
                  y={paddingTop + chartHeight + 32}
                  textAnchor="middle"
                  fontSize="9"
                  opacity={isIncludedByFilter ? 1 : 0.3}
                >
                  {m.season === "Wet Season" ? "🌧️" : "☀️"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Month Detail Card (Proper Dark Mode Contrast) */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-purple-950/40 dark:to-gray-900 border border-purple-200 dark:border-purple-800/60 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-700 dark:bg-purple-600 text-white rounded-lg shrink-0">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-gray-900 dark:text-white text-base sm:text-lg">
                  {activeMonth.monthName} Outbreak Profile
                </h4>
                {activeMonth.monthIndex === currentMonthIndex && (
                  <span className="text-[10px] font-extrabold bg-green-600 text-white px-2 py-0.5 rounded-full uppercase">
                    Current Month
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    SEVERITY_COLORS[getCropThreatLevel(activeMonth, activeCrop)]?.bg
                  } ${
                    SEVERITY_COLORS[getCropThreatLevel(activeMonth, activeCrop)]?.text
                  } ${
                    SEVERITY_COLORS[getCropThreatLevel(activeMonth, activeCrop)]?.darkBg
                  } ${
                    SEVERITY_COLORS[getCropThreatLevel(activeMonth, activeCrop)]?.darkText
                  }`}
                >
                  {getCropThreatLevel(activeMonth, activeCrop)} Risk (Score:{" "}
                  {getCropThreatScore(activeMonth, activeCrop).toFixed(1)}/10)
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                {activeMonth.season} in Negros Occidental &bull; {activeMonth.climateSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Verbatim Notes.txt Outbreaks Highlight */}
        <div className="bg-white dark:bg-gray-800/90 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 mb-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Primary Outbreak Targets for {activeMonth.monthName}:
          </div>
          <div className="flex flex-wrap gap-2">
            {activeMonth.highlightOutbreaks.map((pest, pIdx) => (
              <span
                key={pIdx}
                className="text-xs font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/70 text-amber-900 dark:text-amber-200 px-3 py-1 rounded-lg shadow-2xs"
              >
                ⚠ {pest}
              </span>
            ))}
          </div>
        </div>

        {/* Crop Breakdown */}
        {activeCrop !== "All Crops" ? (
          <div className="bg-white dark:bg-gray-800/90 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-2 flex items-center justify-between">
              <span>{activeCrop} Stage &amp; Pests</span>
              <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
                {activeMonth.cropThreats[activeCrop]?.stage}
              </span>
            </h5>
            <div className="space-y-2 mb-3">
              {activeMonth.cropThreats[activeCrop]?.pests.map((p, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3 bg-gray-50 dark:bg-gray-900/70 rounded-lg border border-gray-200 dark:border-gray-700 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white">
                    <span>{p.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        SEVERITY_COLORS[p.risk]?.bg
                      } ${SEVERITY_COLORS[p.risk]?.text} ${SEVERITY_COLORS[p.risk]?.darkBg} ${
                        SEVERITY_COLORS[p.risk]?.darkText
                      }`}
                    >
                      {p.risk} risk
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-700 dark:text-gray-200">Symptoms:</strong> {p.symptoms}
                  </p>
                  <p className="text-purple-800 dark:text-purple-300">
                    <strong className="text-purple-900 dark:text-purple-200">Advisory Action:</strong>{" "}
                    {p.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">
                Field Management Tips:
              </p>
              <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                {activeMonth.cropThreats[activeCrop]?.managementTips.map((tip, tIdx) => (
                  <li key={tIdx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {(["Rice", "Corn", "Sugarcane", "Vegetables"] as const).map((cropKey) => {
              const cropData = activeMonth.cropThreats[cropKey];
              return (
                <div
                  key={cropKey}
                  className="bg-white dark:bg-gray-800/90 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">{cropKey}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          SEVERITY_COLORS[cropData.riskLevel]?.bg
                        } ${SEVERITY_COLORS[cropData.riskLevel]?.text} ${
                          SEVERITY_COLORS[cropData.riskLevel]?.darkBg
                        } ${SEVERITY_COLORS[cropData.riskLevel]?.darkText}`}
                      >
                        {cropData.riskLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-2">
                      {cropData.stage}
                    </p>
                    <div className="space-y-1">
                      {cropData.pests.map((p, idx) => (
                        <p
                          key={idx}
                          className="text-[11px] text-gray-700 dark:text-gray-300 font-semibold line-clamp-1"
                        >
                          &bull; {p.name}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

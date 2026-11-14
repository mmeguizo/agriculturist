"use client";

import { useState } from "react";
import {
  MONTHLY_OUTBREAK_SCHEDULE,
  NEGROS_CROPS,
  CropCategory,
  MonthlyOutbreakData,
  getCropThreatScore,
  getCropThreatLevel,
} from "@/lib/seasonal-data";
import {
  AlertTriangle,
  Calendar,
  CloudRain,
  Sun,
  ShieldAlert,
  Info,
  Layers,
} from "lucide-react";

interface Props {
  selectedCrop?: CropCategory;
  onCropChange?: (crop: CropCategory) => void;
  onSelectMonth?: (month: MonthlyOutbreakData) => void;
}

const SEVERITY_COLORS: Record<string, { fill: string; stroke: string; bg: string; text: string }> = {
  critical: { fill: "#ef4444", stroke: "#b91c1c", bg: "bg-red-100", text: "text-red-700" },
  high: { fill: "#f97316", stroke: "#c2410c", bg: "bg-orange-100", text: "text-orange-700" },
  moderate: { fill: "#eab308", stroke: "#a16207", bg: "bg-yellow-100", text: "text-yellow-800" },
  low: { fill: "#10b981", stroke: "#047857", bg: "bg-emerald-100", text: "text-emerald-700" },
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

  const handleCropSelect = (crop: CropCategory) => {
    if (onCropChange) onCropChange(crop);
    else setInternalCrop(crop);
  };

  const handleMonthClick = (m: MonthlyOutbreakData) => {
    setActiveMonth(m);
    if (onSelectMonth) onSelectMonth(m);
  };

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

  return (
    <div className="card shadow-sm space-y-5">
      {/* Header & Crop Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">
              Seasonal Pest &amp; Disease Outbreak Visualizer
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Historical outbreak threat intensity and seasonal vulnerability in{" "}
            <strong className="text-gray-700">Negros Occidental</strong>
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
                    ? "bg-purple-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Season Legend & Summary Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300 inline-block" />
            <span className="text-gray-600 font-medium flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-blue-500" /> Wet Season (May – Oct)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 inline-block" />
            <span className="text-gray-600 font-medium flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" /> Dry Season (Nov – Apr)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-semibold">
          <span className="text-gray-500 text-[11px] uppercase tracking-wider">Threat Level:</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">Critical</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700 font-bold">High</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-100 text-yellow-800 font-bold">Moderate</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-bold">Low</span>
        </div>
      </div>

      {/* Interactive Responsive SVG Chart */}
      <div className="relative overflow-x-auto bg-white rounded-xl border border-gray-100 p-2">
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
            fill="#fffbeb"
            opacity="0.6"
          />
          {/* Wet Season: May to Oct (months 5-10) */}
          <rect
            x={paddingLeft + colWidth * 4}
            y={paddingTop}
            width={colWidth * 6}
            height={chartHeight}
            fill="#eff6ff"
            opacity="0.8"
          />
          {/* Dry Season 2: Nov to Dec (months 11-12) */}
          <rect
            x={paddingLeft + colWidth * 10}
            y={paddingTop}
            width={colWidth * 2}
            height={chartHeight}
            fill="#fffbeb"
            opacity="0.6"
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
                  stroke="#e5e7eb"
                  strokeDasharray={score === 0 ? "none" : "3 3"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#9ca3af"
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
            stroke="#7c3aed"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
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
                  fill={isHovered || isSelected ? "#7c3aed" : "transparent"}
                  opacity={isSelected ? "0.12" : isHovered ? "0.08" : "0"}
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
                  opacity={isHovered || isSelected ? 1 : 0.85}
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
                  fill={color.stroke}
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
                  stroke="#7c3aed"
                  strokeWidth="2.5"
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
                  fill={isCurrent ? "#15803d" : isSelected ? "#6d28d9" : "#4b5563"}
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
                  fill="#9ca3af"
                >
                  {m.season === "Wet Season" ? "🌧️" : "☀️"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Month Detail Card */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-700 text-white rounded-lg">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-gray-900 text-base sm:text-lg">
                  {activeMonth.monthName} Outbreak Profile
                </h4>
                {activeMonth.monthIndex === currentMonthIndex && (
                  <span className="text-[10px] font-extrabold bg-green-600 text-white px-2 py-0.5 rounded-full uppercase">
                    Current Month
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    SEVERITY_COLORS[getCropThreatLevel(activeMonth, activeCrop)]?.bg || "bg-gray-100"
                  } ${
                    SEVERITY_COLORS[getCropThreatLevel(activeMonth, activeCrop)]?.text || "text-gray-800"
                  }`}
                >
                  {getCropThreatLevel(activeMonth, activeCrop)} Risk (Score:{" "}
                  {getCropThreatScore(activeMonth, activeCrop).toFixed(1)}/10)
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {activeMonth.season} in Negros Occidental &bull; {activeMonth.climateSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Verbatim Notes.txt Outbreaks Highlight */}
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 mb-3 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Primary Outbreak Targets for {activeMonth.monthName}:
          </div>
          <div className="flex flex-wrap gap-2">
            {activeMonth.highlightOutbreaks.map((pest, pIdx) => (
              <span
                key={pIdx}
                className="text-xs font-bold bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1 rounded-lg shadow-2xs"
              >
                ⚠ {pest}
              </span>
            ))}
          </div>
        </div>

        {/* Crop Breakdown */}
        {activeCrop !== "All Crops" ? (
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <h5 className="font-bold text-gray-900 text-sm mb-2 flex items-center justify-between">
              <span>{activeCrop} Stage &amp; Pests</span>
              <span className="text-xs text-purple-700 font-semibold">
                {activeMonth.cropThreats[activeCrop]?.stage}
              </span>
            </h5>
            <div className="space-y-2 mb-3">
              {activeMonth.cropThreats[activeCrop]?.pests.map((p, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span>{p.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        SEVERITY_COLORS[p.risk]?.bg
                      } ${SEVERITY_COLORS[p.risk]?.text}`}
                    >
                      {p.risk} risk
                    </span>
                  </div>
                  <p className="text-gray-600">
                    <strong className="text-gray-700">Symptoms:</strong> {p.symptoms}
                  </p>
                  <p className="text-purple-800">
                    <strong className="text-purple-900">Advisory Action:</strong>{" "}
                    {p.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 mb-1">Field Management Tips:</p>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
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
                  className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-gray-900">{cropKey}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          SEVERITY_COLORS[cropData.riskLevel]?.bg
                        } ${SEVERITY_COLORS[cropData.riskLevel]?.text}`}
                      >
                        {cropData.riskLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium mb-2">{cropData.stage}</p>
                    <div className="space-y-1">
                      {cropData.pests.map((p, idx) => (
                        <p key={idx} className="text-[11px] text-gray-700 font-semibold line-clamp-1">
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

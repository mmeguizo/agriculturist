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

  const printOutbreakReport = () => {
    const escapeHtml = (val: string) =>
      val
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const rows = MONTHLY_OUTBREAK_SCHEDULE.map(
      (m) => `
      <tr>
        <td style="font-weight: bold; white-space: nowrap;">${m.monthName}</td>
        <td><span class="badge ${m.season === "Wet Season" ? "badge-wet" : "badge-dry"}">${m.season}</span></td>
        <td style="text-transform: capitalize; font-weight: bold; color: ${
          m.overallRiskLevel === "critical"
            ? "#dc2626"
            : m.overallRiskLevel === "high"
            ? "#ea580c"
            : "#ca8a04"
        };">${m.overallRiskLevel} (${m.riskScore}/10)</td>
        <td style="font-weight: 600; color: #1e293b;">${escapeHtml(m.highlightOutbreaks.join(", "))}</td>
        <td>
          <small><strong>Rice:</strong> ${escapeHtml(m.cropThreats.Rice.pests.map((p) => p.name).join(", "))}<br/>
          <strong>Corn:</strong> ${escapeHtml(m.cropThreats.Corn.pests.map((p) => p.name).join(", "))}<br/>
          <strong>Sugarcane:</strong> ${escapeHtml(m.cropThreats.Sugarcane.pests.map((p) => p.name).join(", "))}<br/>
          <strong>Vegetables:</strong> ${escapeHtml(m.cropThreats.Vegetables.pests.map((p) => p.name).join(", "))}</small>
        </td>
      </tr>`
    ).join("");

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Negros Occidental Seasonal Pest & Disease Outbreak Report</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; padding: 32px; line-height: 1.4; }
      .header { border-bottom: 3px solid #16a34a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
      h1 { font-size: 22px; margin: 0 0 4px; color: #0f172a; }
      .subtitle { color: #64748b; font-size: 13px; margin: 0; }
      .meta { font-size: 11px; color: #475569; text-align: right; }
      table { border-collapse: collapse; width: 100%; font-size: 11px; margin-top: 16px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #f8fafc; font-weight: bold; color: #334155; }
      .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
      .badge-wet { background: #dbeafe; color: #1e40af; }
      .badge-dry { background: #fef3c7; color: #92400e; }
      .notes-box { background: #f1f5f9; border-left: 4px solid #16a34a; padding: 12px; margin-top: 20px; font-size: 11px; }
      @media print {
        body { padding: 0; }
        @page { size: A4 landscape; margin: 15mm; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1>AgriCare &bull; Seasonal Crop Outbreak Advisory Calendar</h1>
        <p class="subtitle">Official Agricultural Surveillance Guide for Negros Occidental (Rice, Corn, Sugarcane, Vegetables)</p>
      </div>
      <div class="meta">
        <div><strong>Province:</strong> Negros Occidental, Region VI</div>
        <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <div class="notes-box">
      <strong>Advisory Notice:</strong> This seasonal calendar outlines predictable disease vectors and pest cycles based on local cropping patterns in Negros Occidental. Extension agriculturists and barangay farmer associations (FAs) should implement early preventive controls prior to peak infestation windows.
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 10%;">Month</th>
          <th style="width: 10%;">Season</th>
          <th style="width: 12%;">Threat Level</th>
          <th style="width: 30%;">Primary Outbreak Targets</th>
          <th style="width: 38%;">Crop Breakdown (Rice, Corn, Sugarcane, Vegetables)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </body>
</html>`;

    const printWin = window.open("", "_blank", "width=1100,height=800");
    if (!printWin) return;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    printWin.print();
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
            onClick={printOutbreakReport}
            className="btn-primary bg-white text-purple-900 hover:bg-purple-50 hover:text-purple-950 shadow-md font-bold text-sm shrink-0 flex items-center gap-2 py-2.5 px-4"
          >
            <Printer className="w-4 h-4 text-purple-700" />
            Print Seasonal Outbreak Report
          </button>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Peak Risk Window
              </p>
              <p className="text-lg font-extrabold text-gray-900">July &ndash; September</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Target Crops
              </p>
              <p className="text-lg font-extrabold text-gray-900">4 Major Groups</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="p-3 bg-green-100 text-green-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Sugarcane Season
              </p>
              <p className="text-lg font-extrabold text-gray-900">Milling &amp; Planting</p>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Active Calendar
              </p>
              <p className="text-lg font-extrabold text-gray-900">12-Month Coverage</p>
            </div>
          </div>
        </div>

        {/* Section 1: Interactive Visual Chart */}
        <SeasonalOutbreakChart
          selectedCrop={selectedCrop}
          onCropChange={setSelectedCrop}
        />

        {/* Section 2: Full 12-Month Outbreak Matrix */}
        <SeasonalCalendarMatrix initialCrop={selectedCrop} />
      </div>
    </DashboardLayout>
  );
}

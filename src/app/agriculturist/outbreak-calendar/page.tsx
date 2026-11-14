"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SeasonalOutbreakChart from "@/components/charts/SeasonalOutbreakChart";
import SeasonalCalendarMatrix from "@/components/charts/SeasonalCalendarMatrix";
import SeasonalThreatWidget from "@/components/charts/SeasonalThreatWidget";
import { CropCategory } from "@/lib/seasonal-data";
import { Calendar, Layers, MapPin } from "lucide-react";

export default function AgriculturistOutbreakCalendarPage() {
  const [selectedCrop, setSelectedCrop] = useState<CropCategory>("All Crops");

  return (
    <DashboardLayout allowedRoles={["agriculturist", "admin"]}>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-900 text-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4 text-blue-300" /> Negros Occidental Field Advisory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Field Seasonal Outbreak Reference
          </h1>
          <p className="text-sm text-blue-100 mt-1 max-w-2xl">
            Cross-reference incoming farmer incident cases with historical seasonal outbreak
            expectations across Negros Occidental.
          </p>
        </div>

        {/* Current Month Active Alert Widget */}
        <SeasonalThreatWidget role="agriculturist" />

        {/* Interactive Visual Chart */}
        <SeasonalOutbreakChart
          selectedCrop={selectedCrop}
          onCropChange={setSelectedCrop}
        />

        {/* 12-Month Matrix */}
        <SeasonalCalendarMatrix initialCrop={selectedCrop} />
      </div>
    </DashboardLayout>
  );
}

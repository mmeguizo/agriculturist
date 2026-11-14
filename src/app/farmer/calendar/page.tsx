"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SeasonalOutbreakChart from "@/components/charts/SeasonalOutbreakChart";
import SeasonalCalendarMatrix from "@/components/charts/SeasonalCalendarMatrix";
import SeasonalThreatWidget from "@/components/charts/SeasonalThreatWidget";
import { CropCategory } from "@/lib/seasonal-data";
import { Calendar, ShieldAlert, Sparkles, MapPin } from "lucide-react";

export default function FarmerCalendarPage() {
  const [selectedCrop, setSelectedCrop] = useState<CropCategory>("Rice");

  return (
    <DashboardLayout allowedRoles={["farmer", "agriculturist", "admin"]}>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-green-700 via-emerald-800 to-teal-800 text-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-green-200 text-xs font-bold uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4 text-green-300" /> Negros Occidental Crop Calendar
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Seasonal Pest &amp; Disease Outbreak Guide
          </h1>
          <p className="text-sm text-green-100 mt-1 max-w-2xl">
            Protect your harvest by knowing in advance what pests and diseases emerge during
            the wet and dry seasons across Negros Occidental.
          </p>
        </div>

        {/* Current Month Active Alert Widget */}
        <SeasonalThreatWidget role="farmer" />

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

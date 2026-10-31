"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabaseBucket, uploadImageToSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Incident, AIAnalysisResult } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ImageUploader from "@/components/ui/ImageUploader";
import {
  Leaf,
  MapPin,
  Send,
  Sparkles,
  AlertCircle,
  HelpCircle,
  LocateFixed,
} from "lucide-react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

const CROP_OPTIONS = [
  "Rice (Palay)",
  "Corn (Mais)",
  "Vegetables (Gulayan)",
  "Fruit Trees (Prutas)",
  "Root Crops (Kamote / Cassava)",
  "Banana (Saging)",
  "Coconut (Niyog)",
  "Coffee / Cacao",
  "Other Crops",
];

export default function ReportIncidentPage() {
  const router = useRouter();
  const { userProfile, firebaseUser } = useAuth();

  const [cropType, setCropType] = useState(CROP_OPTIONS[0]);
  const [customCrop, setCustomCrop] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(userProfile?.farmLocation || "");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const activeUserId = firebaseUser?.uid || userProfile?.id || "demo-farmer-id";
  const activeUserName = userProfile?.fullName || "Pedro Penduko";

  const isPhotosRequirementMet = images.length >= 4;
  const isFormValid =
    (cropType !== "Other Crops" || customCrop.trim().length > 0) &&
    description.trim().length > 5 &&
    location.trim().length > 2 &&
    isPhotosRequirementMet;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`;
        setLocation((prev) => (prev ? `${prev} (${coords})` : coords));
        toast.success("GPS Coordinates detected!");
        setLocating(false);
      },
      (err) => {
        toast.error("Could not obtain location. Please enter your barangay manually.");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPhotosRequirementMet) {
      toast.error("You must upload at least 4 photos before submitting.");
      return;
    }

    if (!isFormValid) {
      toast.error("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    const incidentId = uuidv4();
    const finalCrop = cropType === "Other Crops" ? customCrop : cropType;

    try {
      // 1. Call Gemini AI Analysis API
      let aiResult: AIAnalysisResult | null = null;
      try {
        const aiResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: images.slice(0, 4), // pass up to 4 base64 images
            cropType: finalCrop,
            description,
          }),
        });
        if (aiResponse.ok) {
          const data = await aiResponse.json();
          aiResult = {
            diseaseName: data.diseaseName,
            severity: data.severity,
            description: data.description,
            recommendedTreatment: data.recommendedTreatment,
            preventiveMeasures: data.preventiveMeasures,
            confidence: data.confidence,
            analyzedAt: new Date().toISOString(),
          };
        }
      } catch (aiErr) {
        console.warn("AI scan failed or timed out:", aiErr);
      }

      if (!aiResult) {
        aiResult = {
          diseaseName: "Under Review by Agriculturist",
          severity: "Moderate",
          description: "Visual analysis pending extension worker examination.",
          recommendedTreatment: "Awaiting verified treatment instructions.",
          preventiveMeasures: "Maintain field sanitation.",
          confidence: "Low",
          analyzedAt: new Date().toISOString(),
        };
      }

      // 2. Upload images to Supabase Storage and keep the returned URLs as text
      // in Firestore (Firebase is used only for text/data). If Supabase is not
      // configured or the upload fails, preserve the data URL as a fallback.
      const downloadUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        try {
          const url = await uploadImageToSupabase(
            supabaseBucket,
            `${incidentId}/img_${i}.jpg`,
            images[i]
          );
          downloadUrls.push(url);
        } catch (storageErr) {
          console.warn("Supabase upload failed, preserving inline image:", storageErr);
          downloadUrls.push(images[i]);
        }
      }

      const newIncident: Incident = {
        id: incidentId,
        farmerId: activeUserId,
        farmerName: activeUserName,
        cropType: finalCrop,
        description,
        location,
        imageUrls: downloadUrls,
        taggedPestId: null,
        taggedPestName: null,
        status: "pending",
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        aiAnalysis: aiResult,
      };

      // 3. Save to Firestore
      try {
        await setDoc(doc(db, "incidents", incidentId), newIncident);
      } catch (dbErr) {
        console.warn("Could not write directly to Firestore:", dbErr);
      }

      // 4. Save to Local Storage for demo persistence
      const allIncidents: Incident[] = JSON.parse(
        localStorage.getItem("agricare_incidents") || "[]"
      );
      allIncidents.unshift(newIncident);
      localStorage.setItem("agricare_incidents", JSON.stringify(allIncidents));

      // 5. Notify Agriculturists
      const notifId = uuidv4();
      const agriculturistNotif = {
        id: notifId,
        recipientId: "all-agriculturists",
        title: `New Incident Report: ${finalCrop}`,
        message: `${activeUserName} filed a new incident in ${location}. AI flagged ${aiResult.diseaseName}.`,
        link: `/agriculturist/incident/${incidentId}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const existingNotifs = JSON.parse(
        localStorage.getItem("agricare_notifications") || "[]"
      );
      existingNotifs.unshift(agriculturistNotif);
      localStorage.setItem("agricare_notifications", JSON.stringify(existingNotifs));

      toast.success("Incident submitted! AI scan finished and queued for review.");
      router.push(`/farmer/incident/${incidentId}`);
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to submit incident."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Report Pest or Crop Disease
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Provide details and upload at least 4 clear photos for Gemini AI scan and agriculturist verification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 shadow-sm">
          {/* Crop Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Crop Type
            </label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="input-field text-sm font-medium"
            >
              {CROP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {cropType === "Other Crops" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Specify Crop Name
              </label>
              <input
                type="text"
                required
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
                placeholder="e.g. Pineapple, Eggplant, Sugarcane"
                className="input-field text-sm"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Observed Symptoms & Problem Description
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe symptoms clearly: color of spots, curling leaves, holes, presence of larvae/insects, wilting, affected area..."
              className="input-field text-sm leading-relaxed"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Be as specific as possible to assist the diagnostic AI and field officers.
            </p>
          </div>

          {/* Farm Location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Farm Location (Barangay / Municipality)
              </label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="text-xs text-green-700 hover:text-green-800 font-bold flex items-center gap-1"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                {locating ? "Locating..." : "Auto-Detect GPS"}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Purok 4, Brgy. Concepcion, Sariaya, Quezon"
                className="input-field text-sm pl-9"
              />
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Image Uploader Component enforcing minimum 4 photos */}
          <div className="pt-2 border-t border-gray-100">
            <ImageUploader
              images={images}
              onImagesChange={setImages}
              minRequired={4}
              maxAllowed={8}
            />
          </div>

          {/* AI Notice Banner */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Automated Gemini Plant Vision Scan</p>
              <p className="text-blue-800/90 mt-0.5">
                Upon submitting, our AI will automatically identify the pest/disease symptoms across your 4+ photos to draft an immediate preliminary assessment for the agriculturist.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className="btn-primary w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Running AI Analysis & Submitting Report...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {isPhotosRequirementMet
                    ? "Submit Incident Report"
                    : `Upload at least 4 photos (${images.length}/4 uploaded)`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

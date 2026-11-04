"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabaseBucket, uploadImageToSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Incident, AIAnalysisResult } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ImageUploader from "@/components/ui/ImageUploader";
import {
  MapPin,
  Send,
  Sparkles,
  LocateFixed,
  CloudUpload,
  CheckCircle2,
  Loader2,
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
  const [submitStep, setSubmitStep] = useState<"uploading" | "saving" | "redirecting">("uploading");
  const [locating, setLocating] = useState(false);

  // If the browser restores this page from the back/forward cache, clear the form
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setCropType(CROP_OPTIONS[0]);
        setCustomCrop("");
        setDescription("");
        setLocation(userProfile?.farmLocation || "");
        setImages([]);
        setSubmitting(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [userProfile?.farmLocation]);

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
      () => {
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
    setSubmitStep("uploading");
    const incidentId = uuidv4();
    const finalCrop = cropType === "Other Crops" ? customCrop : cropType;

    try {
      // 1. Upload all evidence photos in PARALLEL to Supabase Storage
      const uploadPromises = images.map(async (imageData, index) => {
        try {
          return await uploadImageToSupabase(
            supabaseBucket,
            `${incidentId}/img_${index}.jpg`,
            imageData
          );
        } catch (storageErr) {
          console.warn(`Supabase upload failed for photo ${index}, keeping inline:`, storageErr);
          return imageData;
        }
      });

      const downloadUrls = await Promise.all(uploadPromises);

      // 2. Immediately create Incident with "Pending AI Analysis" status
      setSubmitStep("saving");

      const initialAiResult: AIAnalysisResult = {
        diseaseName: "AI Diagnosis in Progress...",
        severity: "Pending",
        description: "Gemini Vision AI is analyzing your uploaded photos. This diagnosis card will update automatically.",
        recommendedTreatment: "Treatment recommendations will be populated shortly.",
        preventiveMeasures: "Analysis in progress.",
        confidence: "Processing...",
        analyzedAt: new Date().toISOString(),
      };

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
        aiAnalysis: initialAiResult,
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, "incidents", incidentId), newIncident);
      } catch (dbErr) {
        console.warn("Could not write directly to Firestore:", dbErr);
      }

      // Save to Local Storage for instant demo access
      const allIncidents: Incident[] = JSON.parse(
        localStorage.getItem("agricare_incidents") || "[]"
      );
      allIncidents.unshift(newIncident);
      localStorage.setItem("agricare_incidents", JSON.stringify(allIncidents));

      // Notify Agriculturists
      const notifId = uuidv4();
      const agriculturistNotif = {
        id: notifId,
        recipientId: "all-agriculturists",
        title: `New Incident Report: ${finalCrop}`,
        message: `${activeUserName} filed a new incident in ${location}. Photos queued for review.`,
        link: `/agriculturist/incident/${incidentId}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const existingNotifs = JSON.parse(
        localStorage.getItem("agricare_notifications") || "[]"
      );
      existingNotifs.unshift(agriculturistNotif);
      localStorage.setItem("agricare_notifications", JSON.stringify(existingNotifs));

      // 3. Kick off Gemini AI Analysis non-blockingly in the background!
      // This ensures the farmer is never stuck waiting 3-5 minutes on this form.
      const imagesForAi = images.slice(0, 4);
      (async () => {
        try {
          const aiResponse = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              images: imagesForAi,
              cropType: finalCrop,
              description,
            }),
          });
          if (aiResponse.ok) {
            const data = await aiResponse.json();
            const updatedAiResult: AIAnalysisResult = {
              diseaseName: data.diseaseName || "Analysis Completed",
              severity: data.severity || "Moderate",
              description: data.description || "Analysis completed.",
              recommendedTreatment: data.recommendedTreatment || "Consult municipal extension officer.",
              preventiveMeasures: data.preventiveMeasures || "Maintain field hygiene.",
              confidence: data.confidence || "Medium",
              analyzedAt: new Date().toISOString(),
            };

            // Update Firestore
            try {
              await setDoc(
                doc(db, "incidents", incidentId),
                { aiAnalysis: updatedAiResult },
                { merge: true }
              );
            } catch (err) {
              console.warn("Background AI Firestore update error:", err);
            }

            // Update Local Storage
            try {
              const currentIncidents: Incident[] = JSON.parse(
                localStorage.getItem("agricare_incidents") || "[]"
              );
              const target = currentIncidents.find((i) => i.id === incidentId);
              if (target) {
                target.aiAnalysis = updatedAiResult;
                localStorage.setItem(
                  "agricare_incidents",
                  JSON.stringify(currentIncidents)
                );
                window.dispatchEvent(new Event("storage"));
              }
            } catch (err) {
              console.warn("Background AI localStorage update error:", err);
            }
          }
        } catch (bgErr) {
          console.warn("Background AI request error:", bgErr);
        }
      })();

      // 4. Redirect the farmer immediately!
      setSubmitStep("redirecting");
      toast.success("Report submitted successfully! AI scan queued.");

      // Clear the form
      setCropType(CROP_OPTIONS[0]);
      setCustomCrop("");
      setDescription("");
      setLocation(userProfile?.farmLocation || "");
      setImages([]);

      router.push(`/farmer/incident/${incidentId}`);
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to submit incident."
      );
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

        <form onSubmit={handleSubmit} autoComplete="off" className="card space-y-5 shadow-sm relative">
          {/* Submission Modal Overlay */}
          {submitting && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-xl z-30 flex flex-col items-center justify-center p-6 text-center shadow-lg">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-700 mb-4 animate-bounce">
                {submitStep === "uploading" && <CloudUpload className="w-7 h-7" />}
                {submitStep === "saving" && <Loader2 className="w-7 h-7 animate-spin" />}
                {submitStep === "redirecting" && <CheckCircle2 className="w-7 h-7 text-green-600" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {submitStep === "uploading" && "Uploading Evidence Photos..."}
                {submitStep === "saving" && "Recording Incident Report..."}
                {submitStep === "redirecting" && "Report Submitted! Redirecting..."}
              </h3>
              <p className="text-xs text-gray-500 max-w-xs">
                {submitStep === "uploading" && "Uploading compressed photos securely to cloud storage in parallel."}
                {submitStep === "saving" && "Submitting report with pending status. AI analysis will run in the background."}
                {submitStep === "redirecting" && "Taking you to your incident summary page..."}
              </p>
              <div className="w-48 bg-gray-200 h-1.5 rounded-full overflow-hidden mt-4">
                <div
                  className="bg-green-600 h-full transition-all duration-300"
                  style={{
                    width:
                      submitStep === "uploading"
                        ? "45%"
                        : submitStep === "saving"
                        ? "85%"
                        : "100%",
                  }}
                />
              </div>
            </div>
          )}

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
              <p className="font-bold">Fast Submissions & Background Plant Vision Scan</p>
              <p className="text-blue-800/90 mt-0.5">
                Your report will be accepted immediately with pending status. Our plant vision AI and municipal agriculturist will review the evidence without keeping you waiting on this page.
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
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Report...
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

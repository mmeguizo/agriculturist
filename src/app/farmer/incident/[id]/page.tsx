"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, onSnapshot, collection, query, where, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Incident, Recommendation, AIAnalysisResult } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { IncidentStatusBadge } from "@/components/ui/StatusBadge";
import ImageGallery from "@/components/ui/ImageGallery";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Sparkles,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function FarmerIncidentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" label="Loading incident..." />
        </div>
      }
    >
      <IncidentDetailContent />
    </Suspense>
  );
}

function IncidentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { userProfile, firebaseUser } = useAuth();

  // Seed from localStorage in the initializers so demo data paints instantly
  const [incident, setIncident] = useState<Incident | null>(() => {
    if (typeof window === "undefined") return null;
    const allIncidents: Incident[] = JSON.parse(
      localStorage.getItem("agricare_incidents") || "[]"
    );
    return allIncidents.find((i) => i.id === id) || null;
  });
  const [recommendation, setRecommendation] = useState<Recommendation | null>(() => {
    if (typeof window === "undefined") return null;
    const allRecs: Recommendation[] = JSON.parse(
      localStorage.getItem("agricare_recommendations") || "[]"
    );
    return allRecs.find((r) => r.incidentId === id) || null;
  });
  const [loading, setLoading] = useState(() => !incident);

  const [analyzing, setAnalyzing] = useState(false);

  const handleReAnalyze = async () => {
    if (!incident) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: (incident.imageUrls || []).slice(0, 4),
          cropType: incident.cropType,
          description: incident.description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedAi: AIAnalysisResult = {
          diseaseName: data.diseaseName || `${incident.cropType} Crop Disease`,
          severity: data.severity || "Moderate",
          description: data.description || "Analysis completed.",
          recommendedTreatment: data.recommendedTreatment || "Prune affected foliage and apply protective treatment.",
          preventiveMeasures: data.preventiveMeasures || "Maintain field hygiene.",
          confidence: data.confidence || "High",
          analyzedAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, "incidents", incident.id), { aiAnalysis: updatedAi }, { merge: true });
        } catch {}

        try {
          const current = JSON.parse(localStorage.getItem("agricare_incidents") || "[]") as Incident[];
          const target = current.find((i) => i.id === incident.id);
          if (target) {
            target.aiAnalysis = updatedAi;
            localStorage.setItem("agricare_incidents", JSON.stringify(current));
          }
        } catch {}

        setIncident((prev) => (prev ? { ...prev, aiAnalysis: updatedAi } : null));
        toast.success(`Diagnosis updated: ${updatedAi.diseaseName}`);
      }
    } catch {
      toast.error("AI diagnosis attempt failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Self-heal and populate AI analysis immediately if missing or in fallback
  useEffect(() => {
    if (!incident || !incident.id || analyzing) return;
    const needsAi =
      !incident.aiAnalysis ||
      incident.aiAnalysis.confidence === "Processing..." ||
      incident.aiAnalysis.diseaseName?.includes("Progress") ||
      incident.aiAnalysis.diseaseName?.includes("Under Review by Extension Worker");
    if (!needsAi) return;

    handleReAnalyze();
  }, [incident?.id, incident?.aiAnalysis?.diseaseName]);

  useEffect(() => {
    if (!id) return;

    const readLocal = () => {
      const allIncidents: Incident[] = JSON.parse(
        localStorage.getItem("agricare_incidents") || "[]"
      );
      const foundLocal = allIncidents.find((i) => i.id === id);
      const allRecs: Recommendation[] = JSON.parse(
        localStorage.getItem("agricare_recommendations") || "[]"
      );
      const recLocal = allRecs.find((r) => r.incidentId === id);
      return { foundLocal, recLocal };
    };

    const { foundLocal, recLocal } = readLocal();
    if (foundLocal) {
      setIncident(foundLocal);
      setLoading(false);
    }
    if (recLocal) {
      setRecommendation(recLocal);
    }

    // Subscribe to Firestore for realtime updates
    const unsubs: (() => void)[] = [];
    try {
      unsubs.push(
        onSnapshot(
          doc(db, "incidents", id),
          (snap) => {
            if (snap.exists()) {
              setIncident({ id: snap.id, ...snap.data() } as Incident);
            }
            setLoading(false);
          },
          () => {
            setLoading(false);
          }
        )
      );

      const recQuery = query(
        collection(db, "recommendations"),
        where("incidentId", "==", id)
      );
      unsubs.push(
        onSnapshot(
          recQuery,
          (snap) => {
            if (!snap.empty) {
              setRecommendation({
                id: snap.docs[0].id,
                ...snap.docs[0].data(),
              } as Recommendation);
            }
          },
          () => {}
        )
      );
    } catch (err) {
      console.warn("Firestore realtime init failed, using local data:", err);
      queueMicrotask(() => setLoading(false));
    }

    // Listen for cross-tab demo updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "agricare_incidents" || e.key === "agricare_recommendations") {
        const { foundLocal: f, recLocal: r } = readLocal();
        if (f && f.id === id) setIncident(f);
        if (r && r.incidentId === id) setRecommendation(r);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      unsubs.forEach((u) => u());
      window.removeEventListener("storage", handleStorage);
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout allowedRoles={["farmer"]}>
        <LoadingSpinner size="lg" label="Loading incident details..." />
      </DashboardLayout>
    );
  }

  if (!incident) {
    return (
      <DashboardLayout allowedRoles={["farmer"]}>
        <div className="card text-center py-12">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Incident Not Found</h2>
          <p className="text-sm text-gray-500 mt-1">This report may have been removed or does not exist.</p>
          <Link href="/farmer" className="btn-primary mt-4 inline-flex text-sm">
            Return to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isAiProcessing = incident.aiAnalysis?.confidence === "Processing...";

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/farmer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Reports
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Case Status:</span>
            <IncidentStatusBadge status={incident.status} />
          </div>
        </div>

        {/* Top Summary Card */}
        <div className="card space-y-4 shadow-sm border-l-4 border-l-green-600">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded">
                Crop: {incident.cropType}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
                Incident #{incident.id.slice(0, 8)}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(incident.createdAt).toLocaleDateString([], {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {incident.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {incident.location}
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Farmer Description & Symptoms
            </h3>
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-100">
              {incident.description}
            </p>
          </div>

          {/* Uploaded Evidence Photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Uploaded Evidence Photos ({incident.imageUrls?.length || 0} Photos)
              </h3>
              <span className="text-[11px] text-gray-400">Click any photo to zoom</span>
            </div>
            <ImageGallery images={incident.imageUrls} alt={`${incident.cropType} photo`} />
          </div>
        </div>

        {/* OFFICIAL AGRICULTURIST RECOMMENDATION (If Resolved) */}
        {recommendation ? (
          <div className="card bg-emerald-50/70 border-2 border-emerald-500/50 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
              <div className="flex items-center gap-2 text-emerald-900">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Verified Extension Advisory & Prescription</h2>
                  <p className="text-xs text-emerald-700">
                    Prepared by: <strong>{recommendation.agriculturistName}</strong> •{" "}
                    {new Date(recommendation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Official Recommendation
              </span>
            </div>

            <div className="space-y-3 text-sm text-gray-800">
              <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                  Official Diagnosis
                </span>
                <p className="font-semibold text-gray-900 text-base">
                  {recommendation.diagnosis}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                  Treatment & Control Plan
                </span>
                <p className="whitespace-pre-line text-gray-800 leading-relaxed">
                  {recommendation.treatmentPlan}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                  Preventive Guidelines
                </span>
                <p className="whitespace-pre-line text-gray-800 leading-relaxed">
                  {recommendation.preventiveAdvice}
                </p>
              </div>

              {recommendation.purchaseRecommendation && (
                <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    What to Buy
                  </span>
                  <p className="whitespace-pre-line text-gray-800 leading-relaxed">
                    {recommendation.purchaseRecommendation}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card bg-amber-50/70 border border-amber-200 p-5 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Awaiting Agriculturist Review</h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Your incident report has been queued for our local municipal agriculturist. You will receive an in-app notification with the verified prescription and dosage once the inspection is completed.
              </p>
            </div>
          </div>
        )}

        {/* AI PRELIMINARY SCAN (Visible for quick reference) */}
        {incident.aiAnalysis && (
          isAiProcessing ? (
            <div className="card bg-blue-50/70 border-2 border-dashed border-blue-300 p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-blue-900">
                <Sparkles className="w-5 h-5 text-blue-600 animate-spin" />
                <h3 className="font-bold text-sm">Automated Gemini Plant Vision Scan in Progress</h3>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full ml-auto">
                  Analyzing photos...
                </span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Our plant vision AI is currently analyzing your uploaded photos in the background. This card will update automatically with preliminary symptom assessment and potential treatments.
              </p>
            </div>
          ) : (
            <div className="card bg-blue-50/60 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2.5">
                <div className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-sm">Automated Gemini Plant Vision Scan</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReAnalyze}
                    disabled={analyzing}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                    title="Re-scan photos with Gemini"
                  >
                    <RefreshCw className={`w-3 h-3 ${analyzing ? "animate-spin" : ""}`} />
                    {analyzing ? "Scanning..." : "Re-scan AI"}
                  </button>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Confidence: {incident.aiAnalysis.confidence}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-800">
                <div>
                  <span className="font-bold text-blue-900 block mb-0.5">Identified Problem:</span>
                  <span className="font-semibold text-sm text-gray-900">{incident.aiAnalysis.diseaseName}</span>
                </div>
                <div>
                  <span className="font-bold text-blue-900 block mb-0.5">Estimated Severity:</span>
                  <span className="font-bold text-amber-700">{incident.aiAnalysis.severity}</span>
                </div>
              </div>

              <div className="text-xs text-gray-700 space-y-2 pt-1 border-t border-blue-100">
                <div>
                  <span className="font-bold text-blue-900">Symptom Assessment:</span>
                  <p className="mt-0.5 text-gray-600">{incident.aiAnalysis.description}</p>
                </div>
                <div>
                  <span className="font-bold text-blue-900">Suggested Action Draft:</span>
                  <p className="mt-0.5 text-gray-600 whitespace-pre-line">{incident.aiAnalysis.recommendedTreatment}</p>
                </div>
              </div>

              <p className="text-[10px] text-blue-700/80 italic pt-1">
                * Note: The AI analysis serves as a preliminary triage indicator to aid the extension officer in formulating your final treatment plan.
              </p>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}

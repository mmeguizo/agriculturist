"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { useAuth } from "@/lib/auth-context";
import { Incident, PestEntry, Recommendation, AIAnalysisResult } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ImageGallery from "@/components/ui/ImageGallery";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { IncidentStatusBadge } from "@/components/ui/StatusBadge";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

/**
 * Strip the generic "await verified recommendation from extension officer"
 * phrasing from AI treatment drafts. On the agriculturist side this text is
 * redundant because the agriculturist is the one providing the recommendation.
 */
function cleanAiTreatment(text: string): string {
  if (!text) return text;
  return text
    .replace(
      /\s*and\s+await\s+verified\s+recommendation\s+from\s+extension\s+officer\.?/gi,
      ""
    )
    .trim()
    .replace(/\.+\s*$/, "");
}

export default function AgriculturistCaseReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" label="Loading case..." />
        </div>
      }
    >
      <CaseReviewContent />
    </Suspense>
  );
}

function CaseReviewContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { userProfile } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [existingRec, setExistingRec] = useState<Recommendation | null>(null);
  const [pestEntries, setPestEntries] = useState<PestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [preventiveAdvice, setPreventiveAdvice] = useState("");
  const [purchaseRecommendation, setPurchaseRecommendation] = useState("");
  const [basedOnAI, setBasedOnAI] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);

  const handleReAnalyze = async () => {
    if (!incident) return;
    setReanalyzing(true);
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
        const freshAi: AIAnalysisResult = {
          diseaseName: data.diseaseName || `${incident.cropType} Identified Anomaly`,
          severity: data.severity || "Moderate",
          description: data.description || "Analysis completed.",
          recommendedTreatment: data.recommendedTreatment || "Apply recommended protective treatment.",
          preventiveMeasures: data.preventiveMeasures || "Maintain field hygiene.",
          confidence: data.confidence || "High",
          analyzedAt: new Date().toISOString(),
        };
        const updated = { ...incident, aiAnalysis: freshAi };
        setIncident(updated);
        setDiagnosis(freshAi.diseaseName);
        setTreatmentPlan(cleanAiTreatment(freshAi.recommendedTreatment));
        setPreventiveAdvice(freshAi.preventiveMeasures);
        try {
          await setDoc(doc(db, "incidents", incident.id), { aiAnalysis: freshAi }, { merge: true });
          localStore.incidents.upsert(updated);
        } catch {}
        toast.success(`AI diagnosed: ${freshAi.diseaseName} (form prefilled)`);
      }
    } catch {
      toast.error("AI diagnosis attempt failed.");
    } finally {
      setReanalyzing(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);

      const localIncident = localStore.incidents.getAll().find((i) => i.id === id);
      const localRec = localStore.recommendations.getAll().find((r) => r.incidentId === id);
      let pestLocal = localStore.pests.getAll();
      let loadedIncident: Incident | null = localIncident || null;

      try {
        const snap = await getDoc(doc(db, "incidents", id));
        if (snap.exists()) {
          loadedIncident = { id: snap.id, ...snap.data() } as Incident;
        }

        const recSnap = await getDoc(doc(db, "recommendations", `rec_${id}`));
        if (recSnap.exists()) {
          setExistingRec({ id: recSnap.id, ...recSnap.data() } as Recommendation);
        } else if (localRec) {
          setExistingRec(localRec);
        }

        const pestsSnap = await getDocs(collection(db, "pest_database"));
        if (!pestsSnap.empty) {
          pestLocal = pestsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PestEntry));
        }
      } catch (err) {
        console.warn("Firestore case load error, using local data:", err);
        loadedIncident = localIncident || loadedIncident;
        if (localRec) setExistingRec(localRec);
      }

      if (loadedIncident) setIncident(loadedIncident);
      setPestEntries(pestLocal);

      // Pre-fill the recommendation form from the AI analysis when available
      const ai = loadedIncident?.aiAnalysis;
      if (ai && !ai.diseaseName?.includes("Progress") && ai.confidence !== "Processing...") {
        setDiagnosis(ai.diseaseName || "");
        setTreatmentPlan(cleanAiTreatment(ai.recommendedTreatment || ""));
        setPreventiveAdvice(ai.preventiveMeasures || "");
      } else if (loadedIncident) {
        // Fetch AI diagnosis immediately so the agriculturist sees it right away
        try {
          const aiRes = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              images: (loadedIncident.imageUrls || []).slice(0, 4),
              cropType: loadedIncident.cropType,
              description: loadedIncident.description,
            }),
          });
          if (aiRes.ok) {
            const data = await aiRes.json();
            const freshAi: AIAnalysisResult = {
              diseaseName: data.diseaseName || `${loadedIncident.cropType} Anomaly`,
              severity: data.severity || "Moderate",
              description: data.description || "Analysis completed.",
              recommendedTreatment: data.recommendedTreatment || "Apply recommended protective treatment.",
              preventiveMeasures: data.preventiveMeasures || "Maintain field sanitation.",
              confidence: data.confidence || "High",
              analyzedAt: new Date().toISOString(),
            };
            loadedIncident.aiAnalysis = freshAi;
            setIncident({ ...loadedIncident });
            setDiagnosis(freshAi.diseaseName);
            setTreatmentPlan(cleanAiTreatment(freshAi.recommendedTreatment));
            setPreventiveAdvice(freshAi.preventiveMeasures);
            try {
              await setDoc(doc(db, "incidents", id), { aiAnalysis: freshAi }, { merge: true });
              localStore.incidents.upsert(loadedIncident);
            } catch {}
          }
        } catch (aiErr) {
          console.warn("Could not auto-generate AI diagnosis for case review:", aiErr);
        }
      }

      setLoading(false);
    };

    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !diagnosis.trim() || !treatmentPlan.trim()) {
      toast.error("Diagnosis and treatment plan are required.");
      return;
    }

    setSaving(true);
    try {
      const recommendation: Recommendation = {
        id: uuidv4(),
        incidentId: incident.id,
        agriculturistId: userProfile?.id || "agri-user",
        agriculturistName: userProfile?.fullName || "Municipal Agriculturist",
        diagnosis: diagnosis.trim(),
        treatmentPlan: treatmentPlan.trim(),
        preventiveAdvice: preventiveAdvice.trim(),
        purchaseRecommendation: purchaseRecommendation.trim(),
        basedOnAI,
        confidence: incident.aiAnalysis?.confidence || "",
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, "recommendations", recommendation.id), recommendation);
        await updateDoc(doc(db, "incidents", incident.id), {
          status: "resolved",
          resolvedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Firestore recommendation write failed, saving locally:", err);
      }

      localStore.recommendations.upsert(recommendation);
      const updatedIncident: Incident = {
        ...incident,
        status: "resolved",
        resolvedAt: new Date().toISOString(),
      };
      localStore.incidents.upsert(updatedIncident);
      setIncident(updatedIncident);
      setExistingRec(recommendation);

      const notif = {
        id: uuidv4(),
        recipientId: incident.farmerId,
        title: "Official Recommendation Ready",
        message: `Your ${incident.cropType} incident has been reviewed. Diagnosis: ${recommendation.diagnosis}. Tap to view the full treatment plan.`,
        link: `/farmer/incident/${incident.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      localStore.notifications.upsert(notif);
      try {
        await setDoc(doc(db, "notifications", notif.id), notif);
      } catch {}

      toast.success("Recommendation submitted and sent to the farmer.");
      router.push("/agriculturist");
    } catch (error) {
      console.error("Submit recommendation failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit recommendation."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={["agriculturist"]}>
        <LoadingSpinner size="lg" label="Loading case details..." />
      </DashboardLayout>
    );
  }

  if (!incident) {
    return (
      <DashboardLayout allowedRoles={["agriculturist"]}>
        <div className="card text-center py-12">
          <h2 className="text-xl font-bold text-gray-900">Incident Not Found</h2>
          <p className="text-sm text-gray-500 mt-1">This report may have been removed.</p>
          <Link href="/agriculturist" className="btn-primary mt-4 inline-flex text-sm">
            Back to Queue
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isResolved = incident.status === "resolved";
  const isAiProcessing = incident.aiAnalysis?.confidence === "Processing...";

  return (
    <DashboardLayout allowedRoles={["agriculturist"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/agriculturist"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Queue
          </Link>
          <IncidentStatusBadge status={incident.status} />
        </div>

        <div className="card space-y-4 shadow-sm border-l-4 border-l-blue-600">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                Crop: {incident.cropType}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
                {incident.farmerName} — Incident #{incident.id.slice(0, 8)}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(incident.createdAt).toLocaleDateString()}
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
              Farmer Description
            </h3>
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-100">
              {incident.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Evidence Photos ({incident.imageUrls?.length || 0})
            </h3>
            <ImageGallery images={incident.imageUrls} alt={`${incident.cropType} evidence`} />
          </div>

          {incident.aiAnalysis && (
            isAiProcessing ? (
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-spin" />
                  <h3 className="font-bold text-sm">Gemini AI Preliminary Scan in Progress</h3>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full ml-auto">
                    Analyzing photos...
                  </span>
                </div>
                <p className="text-xs text-blue-800">
                  Background plant vision diagnosis is currently analyzing the submitted photos.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-sm">Gemini AI Preliminary Scan</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReAnalyze}
                      disabled={reanalyzing}
                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                      title="Re-scan photos and prefill recommendation form"
                    >
                      <RefreshCw className={`w-3 h-3 ${reanalyzing ? "animate-spin" : ""}`} />
                      {reanalyzing ? "Scanning..." : "Re-scan AI"}
                    </button>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Confidence: {incident.aiAnalysis.confidence}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-800">
                  <strong>Identified:</strong> {incident.aiAnalysis.diseaseName}
                </p>
                <p className="text-xs text-gray-700">{incident.aiAnalysis.description}</p>
                <p className="text-xs text-gray-700 whitespace-pre-line">
                  <strong>Suggested treatment:</strong>{"\n"}
                  {incident.aiAnalysis.recommendedTreatment}
                </p>
              </div>
            )
          )}
        </div>

        {isResolved && existingRec ? (
          <div className="card bg-emerald-50/70 border-2 border-emerald-500/50 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold">Recommendation Submitted</h2>
            </div>
            <p className="text-sm text-gray-800">
              <strong>Diagnosis:</strong> {existingRec.diagnosis}
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-line">
              <strong>Treatment plan:</strong>{"\n"}
              {existingRec.treatmentPlan}
            </p>
            {existingRec.preventiveAdvice && (
              <p className="text-sm text-gray-800 whitespace-pre-line">
                <strong>Preventive advice:</strong>{"\n"}
                {existingRec.preventiveAdvice}
              </p>
            )}
            {existingRec.purchaseRecommendation && (
              <p className="text-sm text-gray-800 whitespace-pre-line">
                <strong>Recommended to buy:</strong>{"\n"}
                {existingRec.purchaseRecommendation}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card border-2 border-blue-100 space-y-4">
            <h2 className="font-bold text-gray-900">Submit Official Recommendation</h2>

            {incident.aiAnalysis && !isAiProcessing && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  AI Confidence Level
                </label>
                <input
                  type="text"
                  value={incident.aiAnalysis.confidence || "Not available"}
                  readOnly
                  aria-label="AI confidence level"
                  className="input-field text-sm bg-gray-50 text-gray-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Tag Diagnosis
              </label>
              <select
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">— Select from pest database (or type below) —</option>
                {pestEntries.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="input-field text-sm mt-2"
                placeholder="Diagnosis (e.g. Rice Blast)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Treatment &amp; Control Plan
              </label>
              <textarea
                required
                rows={4}
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                className="input-field text-sm"
                placeholder="Step-by-step treatment including chemical/organic options and dosage..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Preventive Advice
              </label>
              <textarea
                rows={3}
                value={preventiveAdvice}
                onChange={(e) => setPreventiveAdvice(e.target.value)}
                className="input-field text-sm"
                placeholder="Cultural practices and prevention measures..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Recommend What to Buy
              </label>
              <textarea
                rows={3}
                value={purchaseRecommendation}
                onChange={(e) => setPurchaseRecommendation(e.target.value)}
                className="input-field text-sm"
                placeholder="Products or chemicals to purchase, including brand and dosage if applicable..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={basedOnAI}
                onChange={(e) => setBasedOnAI(e.target.checked)}
                className="w-4 h-4"
              />
              This recommendation was based on the AI preliminary scan
            </label>

            <button type="submit" disabled={saving} className="btn-primary text-sm w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit &amp; Notify Farmer
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

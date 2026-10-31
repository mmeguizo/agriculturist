"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Incident } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { IncidentStatusBadge } from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useResolvedImageUrls } from "@/lib/use-resolved-images";
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Calendar,
  MapPin,
} from "lucide-react";

function IncidentThumbs({ images }: { images: string[] }) {
  const resolved = useResolvedImageUrls(images);

  return (
    <div className="grid grid-cols-4 gap-1.5 my-3">
      {resolved.slice(0, 4).map((img, idx) => (
        <div
          key={idx}
          className="aspect-square rounded-md overflow-hidden bg-gray-100 border border-gray-100 relative"
        >
          <img
            src={img}
            alt="Crop photo"
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export default function FarmerDashboard() {
  const { userProfile, firebaseUser } = useAuth();
  const activeUserId = firebaseUser?.uid || userProfile?.id;

  const [incidents, setIncidents] = useState<Incident[]>(() => {
    if (typeof window === "undefined") return [];
    const localIncidents: Incident[] = JSON.parse(
      localStorage.getItem("agricare_incidents") || "[]"
    );
    return localIncidents
      .filter((inc) => inc.farmerId === activeUserId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeUserId) return;

    const sortDesc = (list: Incident[]) =>
      [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const unsubs: (() => void)[] = [];
    try {
      // Single-field equality query keeps this index-free and realtime.
      unsubs.push(
        onSnapshot(
          query(
            collection(db, "incidents"),
            where("farmerId", "==", activeUserId)
          ),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(
                (d) => ({ id: d.id, ...d.data() } as Incident)
              );
              setIncidents(sortDesc(list));
            }
            setLoading(false);
          },
          () => {
            // Firestore unavailable — fall back to localStorage.
            const localIncidents: Incident[] = JSON.parse(
              localStorage.getItem("agricare_incidents") || "[]"
            );
            setIncidents(
              sortDesc(localIncidents.filter((inc) => inc.farmerId === activeUserId))
            );
            setLoading(false);
          }
        )
      );
    } catch (err) {
      console.warn("Firestore query error, using local data fallback:", err);
      queueMicrotask(() => setLoading(false));
    }

    // Cross-tab demo updates.
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "agricare_incidents") {
        const localIncidents: Incident[] = JSON.parse(
          localStorage.getItem("agricare_incidents") || "[]"
        );
        setIncidents(
          sortDesc(localIncidents.filter((inc) => inc.farmerId === activeUserId))
        );
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      unsubs.forEach((u) => u());
      window.removeEventListener("storage", handleStorage);
    };
  }, [activeUserId]);

  const totalCount = incidents.length;
  const pendingCount = incidents.filter((i) => i.status === "pending" || i.status === "under_review").length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  return (
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-green-700 to-emerald-800 text-white p-6 rounded-2xl shadow-sm">
          <div>
            <span className="text-green-200 text-xs font-semibold uppercase tracking-wider">
              Farmer Reporting Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Kamusta, {userProfile?.fullName || "Ka-Agri"}!
            </h1>
            <p className="text-sm text-green-100 mt-1 max-w-xl">
              Report crop pests or symptoms, receive rapid AI diagnoses, and get official recommendations from extension agriculturists.
            </p>
          </div>
          <Link
            href="/farmer/report"
            className="btn-primary bg-white text-green-800 hover:bg-green-50 shadow-md font-bold px-5 py-3 text-sm shrink-0"
          >
            <PlusCircle className="w-5 h-5 text-green-700" />
            Report New Incident
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-700 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Reports</p>
              <p className="text-2xl font-extrabold text-gray-900">{totalCount}</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Review</p>
              <p className="text-2xl font-extrabold text-amber-700">{pendingCount}</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolved / Advised</p>
              <p className="text-2xl font-extrabold text-emerald-700">{resolvedCount}</p>
            </div>
          </div>
        </div>

        {/* Incident List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Your Incident Reports</h2>
            <Link
              href="/farmer/report"
              className="text-xs font-bold text-green-700 hover:text-green-800 flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" /> File Report
            </Link>
          </div>

          {loading ? (
            <div className="card">
              <LoadingSpinner label="Loading your reports..." />
            </div>
          ) : incidents.length === 0 ? (
            <div className="card text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No incident reports yet</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Spotted pest attacks, yellowing leaves, or fungal blight on your crops? File a report with at least 4 photos for diagnosis.
              </p>
              <Link
                href="/farmer/report"
                className="btn-primary mt-5 text-sm inline-flex shadow"
              >
                <PlusCircle className="w-4 h-4" /> Create First Report
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/farmer/incident/${incident.id}`}
                  className="card hover:shadow-md transition-shadow group border border-gray-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-extrabold text-green-700 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded">
                          {incident.cropType}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-1.5 group-hover:text-green-700 transition-colors">
                          {incident.description.slice(0, 60)}
                          {incident.description.length > 60 ? "..." : ""}
                        </h3>
                      </div>
                      <IncidentStatusBadge status={incident.status} />
                    </div>

                    {/* Image Previews */}
                    <IncidentThumbs images={incident.imageUrls || []} />

                    {/* AI Diagnosis Snippet */}
                    {incident.aiAnalysis && (
                      <div className="bg-blue-50/80 border border-blue-100 rounded-lg p-2.5 my-2 flex items-start gap-2 text-xs text-blue-900">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">AI Diagnosis: </span>
                          <span>{incident.aiAnalysis.diseaseName}</span>
                          <span className="ml-1 text-[10px] text-blue-600 font-semibold">
                            ({incident.aiAnalysis.severity} Severity)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(incident.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {incident.location && (
                        <span className="flex items-center gap-1 line-clamp-1 max-w-[120px]">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {incident.location}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-green-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

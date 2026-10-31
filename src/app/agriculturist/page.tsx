"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { Incident } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { IncidentStatusBadge } from "@/components/ui/StatusBadge";
import { FileText, ArrowRight, Sparkles } from "lucide-react";

type QueueFilter = "pending" | "resolved" | "all";

export default function AgriculturistQueuePage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QueueFilter>("pending");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const local = localStore.incidents.getAll();
      try {
        const snap = await getDocs(collection(db, "incidents"));
        if (!snap.empty) {
          setIncidents(
            snap.docs
              .map((d) => ({ id: d.id, ...d.data() } as Incident))
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          );
        } else {
          setIncidents(local.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        }
      } catch (err) {
        console.warn("Firestore incidents error, using local data:", err);
        setIncidents(local.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = incidents.filter((i) =>
    filter === "all"
      ? true
      : filter === "pending"
      ? i.status === "pending" || i.status === "under_review"
      : i.status === "resolved"
  );

  const counts = {
    pending: incidents.filter((i) => i.status === "pending" || i.status === "under_review").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
    all: incidents.length,
  };

  return (
    <DashboardLayout allowedRoles={["agriculturist"]}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-sm">
          <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">
            Agriculturist Workbench
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Incident Triage Queue
          </h1>
          <p className="text-sm text-blue-100 mt-1">
            Review farmer reports, inspect photos and AI analysis, then submit official recommendations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["pending", "resolved", "all"] as QueueFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                filter === key
                  ? "bg-blue-700 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {key} ({counts[key]})
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner size="lg" label="Loading incident queue..." />
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12 text-gray-500 text-sm">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            No incidents in this queue.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((incident) => (
              <Link
                key={incident.id}
                href={`/agriculturist/incident/${incident.id}`}
                className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm">
                        {incident.cropType} — {incident.farmerName}
                      </h3>
                      <IncidentStatusBadge status={incident.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {incident.description}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {incident.location} • {new Date(incident.createdAt).toLocaleDateString()}
                      {incident.aiAnalysis && (
                        <span className="inline-flex items-center gap-1 ml-2 text-blue-600">
                          <Sparkles className="w-3 h-3" /> AI: {incident.aiAnalysis.diseaseName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 shrink-0">
                  Review Case <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

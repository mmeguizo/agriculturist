"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { useAuth } from "@/lib/auth-context";
import { Advisory, Severity } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AlertTriangle, Info, BellRing } from "lucide-react";

const SEVERITY_STYLE: Record<Severity, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export default function AdvisoriesFeedPage() {
  const { userProfile } = useAuth();
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);

  const role = userProfile?.role || "farmer";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const local = localStore.advisories.getAll();
      try {
        const snap = await getDocs(collection(db, "advisories"));
        if (!snap.empty) {
          setAdvisories(
            snap.docs
              .map((d) => ({ id: d.id, ...d.data() } as Advisory))
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          );
        } else {
          setAdvisories(local.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        }
      } catch (err) {
        console.warn("Firestore advisories error, using local data:", err);
        setAdvisories(local.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }
      setLoading(false);
    };
    load();
  }, []);

  const visible = advisories.filter(
    (a) => a.targetRole === "all" || a.targetRole === role
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Advisories &amp; Announcements
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Agricultural alerts and seasonal outbreak warnings from the municipal agriculture office.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" label="Loading advisories..." />
        ) : visible.length === 0 ? (
          <div className="card text-center py-12 text-gray-500 text-sm">
            <BellRing className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            No advisories have been published for you yet.
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((advisory) => (
              <div
                key={advisory.id}
                className={`card border-l-4 ${
                  advisory.severity === "urgent"
                    ? "border-l-red-500"
                    : advisory.severity === "warning"
                    ? "border-l-amber-500"
                    : "border-l-blue-500"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {advisory.severity === "urgent" ? (
                      <BellRing className="w-5 h-5 text-red-500" />
                    ) : advisory.severity === "warning" ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-500" />
                    )}
                    <h3 className="font-bold text-gray-900">{advisory.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${SEVERITY_STYLE[advisory.severity]}`}>
                    {advisory.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(advisory.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{advisory.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

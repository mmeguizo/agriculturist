"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { useAuth } from "@/lib/auth-context";
import { Advisory, Severity, TargetRole } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AlertTriangle, Plus, Trash2, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

const SEVERITY_STYLE: Record<Severity, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export default function AdminAdvisoriesPage() {
  const { userProfile } = useAuth();
  const [advisories, setAdvisories] = useState<Advisory[]>(() => {
    if (typeof window === "undefined") return [];
    return localStore.advisories.getAll();
  });
  const [loading, setLoading] = useState(() => advisories.length === 0);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    severity: "info" as Severity,
    targetRole: "all" as TargetRole,
  });

  useEffect(() => {
    const loadAdvisories = async () => {
      const local = localStore.advisories.getAll();
      if (local.length > 0) {
        setAdvisories(local);
        setLoading(false);
      }
      try {
        const snap = await getDocs(collection(db, "advisories"));
        if (!snap.empty) {
          setAdvisories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Advisory)));
        } else {
          setAdvisories(local);
        }
      } catch (err) {
        console.warn("Firestore advisories error, using local data:", err);
        setAdvisories(local);
      }
      setLoading(false);
    };

    void loadAdvisories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    setSaving(true);
    const advisory: Advisory = {
      id: uuidv4(),
      title: form.title.trim(),
      content: form.content.trim(),
      severity: form.severity,
      targetRole: form.targetRole,
      authorId: userProfile?.id || "admin",
      authorName: userProfile?.fullName || "Administrator",
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "advisories", advisory.id), advisory);
    } catch (err) {
      console.warn("Firestore advisory write failed, saving locally:", err);
    }

    localStore.advisories.upsert(advisory);
    setAdvisories((prev) => [advisory, ...prev]);
    setForm({ title: "", content: "", severity: "info", targetRole: "all" });
    setShowForm(false);
    setSaving(false);
    toast.success("Advisory published.");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "advisories", id));
    } catch {}
    localStore.advisories.remove(id);
    setAdvisories((prev) => prev.filter((a) => a.id !== id));
    toast.success("Advisory removed.");
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Advisories &amp; Announcements
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Broadcast community-wide or targeted agricultural alerts.
            </p>
          </div>
          <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Close Form" : "New Advisory"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card border-2 border-amber-100 space-y-4">
            <h3 className="font-bold text-gray-900">Publish Advisory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g. Fall Armyworm outbreak advisory"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
                  className="input-field text-sm"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Target Audience</label>
                <select
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value as TargetRole })}
                  className="input-field text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="farmer">Farmers</option>
                  <option value="agriculturist">Agriculturists</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Content</label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Detailed advisory message..."
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-sm w-full sm:w-auto">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Publishing..." : "Publish Advisory"}
            </button>
          </form>
        )}

        {loading ? (
          <LoadingSpinner size="lg" label="Loading advisories..." />
        ) : advisories.length === 0 ? (
          <div className="card text-center py-10 text-gray-500 text-sm">
            <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            No advisories published yet.
          </div>
        ) : (
          <div className="space-y-3">
            {advisories.map((advisory) => (
              <div key={advisory.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900">{advisory.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${SEVERITY_STYLE[advisory.severity]}`}>
                        {advisory.severity}
                      </span>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                        {advisory.targetRole === "all" ? "All users" : advisory.targetRole}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {advisory.authorName} • {new Date(advisory.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(advisory.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{advisory.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

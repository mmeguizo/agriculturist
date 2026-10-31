"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { PestEntry } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Database, Plus, Trash2, Pencil, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

const EMPTY_FORM = {
  name: "",
  scientificName: "",
  type: "disease" as "pest" | "disease",
  affectedCrops: "",
  symptoms: "",
  standardTreatments: "",
  preventiveMeasures: "",
};

export default function AdminPestsPage() {
  const [entries, setEntries] = useState<PestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const loadEntries = async () => {
      const local = localStore.pests.getAll();
      try {
        const snap = await getDocs(collection(db, "pest_database"));
        if (!snap.empty) {
          setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PestEntry)));
        } else {
          setEntries(local);
        }
      } catch (err) {
        console.warn("Firestore pest database error, using local data:", err);
        setEntries(local);
      }
      setLoading(false);
    };

    void loadEntries();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (entry: PestEntry) => {
    setEditingId(entry.id);
    setForm({
      name: entry.name,
      scientificName: entry.scientificName,
      type: entry.type,
      affectedCrops: entry.affectedCrops.join(", "),
      symptoms: entry.symptoms,
      standardTreatments: entry.standardTreatments,
      preventiveMeasures: entry.preventiveMeasures,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.symptoms.trim()) {
      toast.error("Name and symptoms are required.");
      return;
    }

    setSaving(true);
    const entry: PestEntry = {
      id: editingId || uuidv4(),
      name: form.name.trim(),
      scientificName: form.scientificName.trim(),
      type: form.type,
      affectedCrops: form.affectedCrops
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      symptoms: form.symptoms.trim(),
      standardTreatments: form.standardTreatments.trim(),
      preventiveMeasures: form.preventiveMeasures.trim(),
      referenceImages: [],
      createdBy: "admin",
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "pest_database", entry.id), entry);
    } catch (err) {
      console.warn("Firestore pest write failed, saving locally:", err);
    }

    localStore.pests.upsert(entry);
    setEntries((prev) => [entry, ...prev.filter((p) => p.id !== entry.id)]);
    setShowForm(false);
    toast.success(editingId ? "Entry updated." : "Entry added to pest database.");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "pest_database", id));
    } catch {}
    localStore.pests.remove(id);
    setEntries((prev) => prev.filter((p) => p.id !== id));
    toast.success("Entry deleted.");
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Pest &amp; Disease Database
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Encode the official catalog used by agriculturists when tagging cases.
            </p>
          </div>
          <button type="button" onClick={() => (showForm ? setShowForm(false) : openAdd())} className="btn-primary text-sm">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Close Form" : "Add Entry"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card border-2 border-green-100 space-y-4">
            <h3 className="font-bold text-gray-900">
              {editingId ? "Edit Entry" : "New Pest / Disease Entry"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Common Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g. Rice Blast"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Scientific Name</label>
                <input
                  value={form.scientificName}
                  onChange={(e) => setForm({ ...form, scientificName: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g. Pyricularia oryzae"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "pest" | "disease" })}
                  className="input-field text-sm"
                >
                  <option value="disease">Disease</option>
                  <option value="pest">Pest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Affected Crops (comma separated)</label>
                <input
                  value={form.affectedCrops}
                  onChange={(e) => setForm({ ...form, affectedCrops: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Rice, Corn"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Symptoms</label>
                <textarea
                  required
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                  className="input-field text-sm"
                  rows={2}
                  placeholder="Characteristic symptoms visible on the crop"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Standard Treatments</label>
                <textarea
                  value={form.standardTreatments}
                  onChange={(e) => setForm({ ...form, standardTreatments: e.target.value })}
                  className="input-field text-sm"
                  rows={2}
                  placeholder="Chemical and organic treatment options"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Preventive Measures</label>
                <textarea
                  value={form.preventiveMeasures}
                  onChange={(e) => setForm({ ...form, preventiveMeasures: e.target.value })}
                  className="input-field text-sm"
                  rows={2}
                  placeholder="Cultural practices to prevent recurrence"
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-sm w-full sm:w-auto">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving..." : editingId ? "Update Entry" : "Add Entry"}
            </button>
          </form>
        )}

        {loading ? (
          <LoadingSpinner size="lg" label="Loading pest database..." />
        ) : entries.length === 0 ? (
          <div className="card text-center py-10 text-gray-500 text-sm">
            <Database className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            No entries yet. Add your first pest or disease record.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <div key={entry.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{entry.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          entry.type === "pest"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {entry.type}
                      </span>
                    </div>
                    {entry.scientificName && (
                      <p className="text-xs italic text-gray-500">{entry.scientificName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {entry.affectedCrops.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.affectedCrops.map((crop) => (
                      <span key={crop} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {crop}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-600 line-clamp-3">{entry.symptoms}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

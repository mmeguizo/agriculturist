"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { InventoryProduct, ProductCategory } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Package,
  Plus,
  Trash2,
  Pencil,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Bug,
  ShieldAlert,
  Sparkles,
  Layers,
  Leaf,
} from "lucide-react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

const CATEGORIES: ProductCategory[] = [
  "Fungicide",
  "Insecticide",
  "Bactericide",
  "Molluscicide",
  "Rodenticide",
  "Biocontrol / Organic",
  "Fertilizer / Foliar",
];

const CATEGORY_COLORS: Record<ProductCategory, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Fungicide: { bg: "bg-blue-100", text: "text-blue-700", darkBg: "dark:bg-blue-950", darkText: "dark:text-blue-300" },
  Insecticide: { bg: "bg-orange-100", text: "text-orange-700", darkBg: "dark:bg-orange-950", darkText: "dark:text-orange-300" },
  Bactericide: { bg: "bg-cyan-100", text: "text-cyan-700", darkBg: "dark:bg-cyan-950", darkText: "dark:text-cyan-300" },
  Molluscicide: { bg: "bg-rose-100", text: "text-rose-700", darkBg: "dark:bg-rose-950", darkText: "dark:text-rose-300" },
  Rodenticide: { bg: "bg-red-100", text: "text-red-700", darkBg: "dark:bg-red-950", darkText: "dark:text-red-300" },
  "Biocontrol / Organic": { bg: "bg-emerald-100", text: "text-emerald-700", darkBg: "dark:bg-emerald-950", darkText: "dark:text-emerald-300" },
  "Fertilizer / Foliar": { bg: "bg-amber-100", text: "text-amber-800", darkBg: "dark:bg-amber-950", darkText: "dark:text-amber-300" },
};

const EMPTY_FORM = {
  name: "",
  brandName: "",
  category: "Fungicide" as ProductCategory,
  activeIngredient: "",
  targetPests: "",
  targetCrops: "Rice, Corn, Sugarcane, Vegetables",
  recommendedDosage: "",
  safetyPeriodDays: 14,
  description: "",
  inStock: true,
};

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>(() => {
    if (typeof window === "undefined") return [];
    return localStore.inventory.getAll();
  });
  const [loading, setLoading] = useState(() => products.length === 0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<"All" | ProductCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      const local = localStore.inventory.getAll();
      if (local.length > 0) {
        setProducts(local);
        setLoading(false);
      }
      try {
        const snap = await getDocs(collection(db, "product_inventory"));
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryProduct));
          setProducts(list);
          localStore.inventory.setAll(list);
        } else {
          setProducts(local);
        }
      } catch (err) {
        console.warn("Firestore product inventory fetch error, using local:", err);
        setProducts(local);
      }
      setLoading(false);
    };

    void loadProducts();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p: InventoryProduct) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      brandName: p.brandName || "",
      category: p.category,
      activeIngredient: p.activeIngredient || "",
      targetPests: p.targetPests.join(", "),
      targetCrops: (p.targetCrops || []).join(", "),
      recommendedDosage: p.recommendedDosage,
      safetyPeriodDays: p.safetyPeriodDays ?? 14,
      description: p.description || "",
      inStock: p.inStock,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.recommendedDosage.trim()) {
      toast.error("Please fill in product name and recommended dosage.");
      return;
    }

    setSaving(true);
    const id = editingId || uuidv4();
    const newProduct: InventoryProduct = {
      id,
      name: form.name.trim(),
      brandName: form.brandName.trim() || undefined,
      category: form.category,
      activeIngredient: form.activeIngredient.trim() || undefined,
      targetPests: form.targetPests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      targetCrops: form.targetCrops
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      recommendedDosage: form.recommendedDosage.trim(),
      safetyPeriodDays: Number(form.safetyPeriodDays) || 0,
      description: form.description.trim() || undefined,
      inStock: form.inStock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "product_inventory", id), newProduct);
    } catch (err) {
      console.warn("Firestore product write failed, saving locally:", err);
    }

    const updated = localStore.inventory.upsert(newProduct);
    setProducts(updated);
    toast.success(editingId ? "Product updated successfully!" : "New product added to inventory!");
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the inventory list?`)) return;
    try {
      await deleteDoc(doc(db, "product_inventory", id));
    } catch {}
    const updated = localStore.inventory.remove(id);
    setProducts(updated);
    toast.success(`Removed "${name}" from inventory.`);
  };

  const toggleStock = async (p: InventoryProduct) => {
    const updatedProduct = { ...p, inStock: !p.inStock, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, "product_inventory", p.id), updatedProduct, { merge: true });
    } catch {}
    const updated = localStore.inventory.upsert(updatedProduct);
    setProducts(updated);
    toast.success(`Marked "${p.name}" as ${updatedProduct.inStock ? "In Stock" : "Out of Stock"}.`);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = (p.brandName || "").toLowerCase().includes(q);
      const matchIngr = (p.activeIngredient || "").toLowerCase().includes(q);
      const matchPests = p.targetPests.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchBrand && !matchIngr && !matchPests) return false;
    }
    return true;
  });

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-green-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
              <FlaskConical className="w-4 h-4 text-emerald-300" /> Extension Input Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Product &amp; Chemical Inventory List
            </h1>
            <p className="text-sm text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              Maintain the official catalog of chemicals, bio-pesticides, and treatments that
              municipal agriculturists can recommend to farmers across Negros Occidental.
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="btn-primary bg-white text-emerald-900 hover:bg-emerald-50 hover:text-emerald-950 font-bold text-sm shadow-md shrink-0 flex items-center gap-2 py-2.5 px-4"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            Add / Recommend What to Buy Feature
          </button>
        </div>

        {/* Quick Highlights Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                Total Products
              </p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">{products.length}</p>
            </div>
          </div>

          <div className="card flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
            <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                Fungicides &amp; Bactericides
              </p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                {products.filter((p) => p.category === "Fungicide" || p.category === "Bactericide").length}
              </p>
            </div>
          </div>

          <div className="card flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
            <div className="p-3 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded-xl">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                Insecticides &amp; Snails
              </p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                {products.filter((p) => p.category === "Insecticide" || p.category === "Molluscicide").length}
              </p>
            </div>
          </div>

          <div className="card flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
            <div className="p-3 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-xl">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                Organic &amp; Biocontrol
              </p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                {products.filter((p) => p.category === "Biocontrol / Organic").length}
              </p>
            </div>
          </div>
        </div>

        {/* "Add / Recommend What to Buy Feature" Modal / Inline Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="card border-2 border-emerald-500/60 dark:bg-gray-900 dark:border-emerald-600 space-y-4 shadow-lg animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg">
                  <Package className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  {editingId ? "Edit Recommended Product" : "Add / Recommend What to Buy Feature"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Chemical / Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tricyclazole 75% WP"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Commercial Brand Name (Optional)
                </label>
                <input
                  type="text"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                  placeholder="e.g. Beam 75 WP / Blast-Off"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                  className="input-field text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Active Ingredient
                </label>
                <input
                  type="text"
                  value={form.activeIngredient}
                  onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })}
                  placeholder="e.g. Tricyclazole 750 g/kg"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Pre-Harvest Interval (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.safetyPeriodDays}
                  onChange={(e) => setForm({ ...form, safetyPeriodDays: Number(e.target.value) })}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Stock Availability Status
                </label>
                <label className="flex items-center gap-2 mt-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Mark as currently in stock / available</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Target Pests &amp; Diseases * (Comma-separated for AI matching)
              </label>
              <input
                type="text"
                required
                value={form.targetPests}
                onChange={(e) => setForm({ ...form, targetPests: e.target.value })}
                placeholder="e.g. Rice blast, neck blast, panicle blast, fungal diseases"
                className="input-field text-sm"
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                The AI auto-fill engine uses these tags to match detected diagnoses with this product.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Standard Recommended Dosage &amp; Directions *
              </label>
              <textarea
                required
                rows={2}
                value={form.recommendedDosage}
                onChange={(e) => setForm({ ...form, recommendedDosage: e.target.value })}
                placeholder="e.g. 15 to 20 grams per 16-liter knapsack sprayer. Apply at initial lesion onset."
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Description / Technical Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mode of action, protective gear requirements, precautions..."
                className="input-field text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-sm px-5"
              >
                {saving ? "Saving..." : editingId ? "Update Product" : "Save to Inventory"}
              </button>
            </div>
          </form>
        )}

        {/* Filter Toolbar & Search */}
        <div className="card space-y-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chemical, brand name, active ingredient, pest..."
                className="input-field text-xs pl-9 pr-3 py-2 w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
              Showing <strong className="text-gray-900 dark:text-white">{filteredProducts.length}</strong> of{" "}
              {products.length} registered products
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                selectedCategory === "All"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              All Products ({products.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Cards / Table */}
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="md" label="Loading product catalog..." />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
              No products found matching your search. Click &ldquo;Add / Recommend What to Buy Feature&rdquo; to encode a new chemical.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProducts.map((p) => {
                const colors = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.Fungicide;
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/60 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-2xs"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}
                          >
                            {p.category}
                          </span>
                          <h4 className="font-extrabold text-gray-900 dark:text-white text-base mt-1">
                            {p.name}
                          </h4>
                          {p.brandName && (
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                              Brand: {p.brandName}
                            </p>
                          )}
                        </div>

                        {/* Stock toggle */}
                        <button
                          type="button"
                          onClick={() => toggleStock(p)}
                          title="Click to toggle stock availability"
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                            p.inStock
                              ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-200"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? "bg-green-500" : "bg-gray-400"}`} />
                          {p.inStock ? "In Stock" : "Out of Stock"}
                        </button>
                      </div>

                      {/* Active Ingredient */}
                      {p.activeIngredient && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <strong>Active:</strong> {p.activeIngredient}
                        </p>
                      )}

                      {/* Recommended Dosage */}
                      <div className="bg-gray-50 dark:bg-gray-900/80 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 text-xs text-gray-800 dark:text-gray-200 mb-2.5">
                        <strong className="text-gray-900 dark:text-white block mb-0.5">
                          Standard Dosage:
                        </strong>
                        <p>{p.recommendedDosage}</p>
                      </div>

                      {/* Target Pests */}
                      <div className="space-y-1 mb-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                          Target Pests &amp; Diseases:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {p.targetPests.map((pest, pIdx) => (
                            <span
                              key={pIdx}
                              className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded"
                            >
                              {pest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
                      <span className="text-[11px] text-gray-400">
                        PHI: <strong>{p.safetyPeriodDays} days</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                          title="Edit product details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete from catalog"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

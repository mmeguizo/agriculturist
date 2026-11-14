"use client";

import { useEffect, useState, useMemo } from "react";
import { localStore } from "@/lib/demo-store";
import { InventoryProduct, ProductCategory, RecommendedProductItem } from "@/lib/types";
import {
  Sparkles,
  Plus,
  Check,
  Search,
  ChevronDown,
  X,
  Package,
  FlaskConical,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  selectedProducts: RecommendedProductItem[];
  onChange: (products: RecommendedProductItem[], formattedSummary: string) => void;
  diagnosis?: string;
  cropType?: string;
  aiDiseaseName?: string;
  aiRecommendedTreatment?: string;
}

const CATEGORIES: ProductCategory[] = [
  "Fungicide",
  "Insecticide",
  "Bactericide",
  "Molluscicide",
  "Rodenticide",
  "Biocontrol / Organic",
  "Fertilizer / Foliar",
];

const CATEGORY_COLORS: Record<ProductCategory, { bg: string; text: string }> = {
  Fungicide: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300", text: "text-blue-700" },
  Insecticide: { bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300", text: "text-orange-700" },
  Bactericide: { bg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300", text: "text-cyan-700" },
  Molluscicide: { bg: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300", text: "text-rose-700" },
  Rodenticide: { bg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300", text: "text-red-700" },
  "Biocontrol / Organic": { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", text: "text-emerald-700" },
  "Fertilizer / Foliar": { bg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", text: "text-amber-700" },
};

function formatSummary(items: RecommendedProductItem[]): string {
  if (items.length === 0) return "";
  return items
    .map((item, idx) => {
      const dosageText = item.dosage ? ` — Dosage: ${item.dosage}` : "";
      const instText = item.instructions ? ` (${item.instructions})` : "";
      return `${idx + 1}. ${item.name} [${item.category}]${dosageText}${instText}`;
    })
    .join("\n");
}

export default function ProductRecommendationSelector({
  selectedProducts,
  onChange,
  diagnosis = "",
  cropType = "",
  aiDiseaseName = "",
  aiRecommendedTreatment = "",
}: Props) {
  const [inventory, setInventory] = useState<InventoryProduct[]>(() => {
    if (typeof window === "undefined") return [];
    return localStore.inventory.getAll();
  });

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Quick-Add form state
  const [quickName, setQuickName] = useState("");
  const [quickCategory, setQuickCategory] = useState<ProductCategory>("Fungicide");
  const [quickDosage, setQuickDosage] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  // Reload inventory on mount
  useEffect(() => {
    setInventory(localStore.inventory.getAll());
  }, []);

  // Filter products by search
  const filteredInventory = useMemo(() => {
    if (!search.trim()) return inventory;
    const q = search.toLowerCase();
    return inventory.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.brandName || "").toLowerCase().includes(q) ||
        (p.activeIngredient || "").toLowerCase().includes(q) ||
        p.targetPests.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [inventory, search]);

  const isSelected = (productName: string) => {
    return selectedProducts.some((p) => p.name.toLowerCase() === productName.toLowerCase());
  };

  const handleToggleProduct = (product: InventoryProduct) => {
    const exists = isSelected(product.name);
    let updated: RecommendedProductItem[];

    if (exists) {
      updated = selectedProducts.filter(
        (p) => p.name.toLowerCase() !== product.name.toLowerCase()
      );
    } else {
      updated = [
        ...selectedProducts,
        {
          productId: product.id,
          name: product.name + (product.brandName ? ` (${product.brandName})` : ""),
          category: product.category,
          dosage: product.recommendedDosage,
          isAiSuggested: false,
        },
      ];
    }

    onChange(updated, formatSummary(updated));
  };

  const handleRemoveItem = (index: number) => {
    const updated = selectedProducts.filter((_, idx) => idx !== index);
    onChange(updated, formatSummary(updated));
  };

  // AI Auto-Fill Recommendation Matching
  const handleAiAutoFill = () => {
    const textCorpus = `${diagnosis} ${aiDiseaseName} ${aiRecommendedTreatment} ${cropType}`.toLowerCase();
    
    // Find matching products from inventory
    const matches: InventoryProduct[] = inventory.filter((prod) => {
      // Check target pests
      const pestMatch = prod.targetPests.some((pest) =>
        textCorpus.includes(pest.toLowerCase())
      );
      if (pestMatch) return true;

      // Keywords match
      if (textCorpus.includes("blast") && (prod.name.toLowerCase().includes("tricyclazole") || prod.name.toLowerCase().includes("blast") || prod.name.toLowerCase().includes("amistar"))) {
        return true;
      }
      if ((textCorpus.includes("snail") || textCorpus.includes("kuhol")) && prod.category === "Molluscicide") {
        return true;
      }
      if ((textCorpus.includes("borer") || textCorpus.includes("stem borer")) && (prod.name.toLowerCase().includes("chlorantraniliprole") || prod.name.toLowerCase().includes("cartap"))) {
        return true;
      }
      if ((textCorpus.includes("planthopper") || textCorpus.includes("bph") || textCorpus.includes("leafhopper")) && prod.name.toLowerCase().includes("pymetrozine")) {
        return true;
      }
      if ((textCorpus.includes("armyworm") || textCorpus.includes("worm") || textCorpus.includes("moth")) && (prod.name.toLowerCase().includes("chlorantraniliprole") || prod.name.toLowerCase().includes("bt"))) {
        return true;
      }
      if (textCorpus.includes("bacterial") && (prod.category === "Bactericide" || prod.name.toLowerCase().includes("copper") || prod.name.toLowerCase().includes("kasugamycin"))) {
        return true;
      }
      if ((textCorpus.includes("rat") || textCorpus.includes("rodent")) && prod.category === "Rodenticide") {
        return true;
      }
      if ((textCorpus.includes("sheath blight") || textCorpus.includes("rhizoctonia")) && prod.name.toLowerCase().includes("validamycin")) {
        return true;
      }
      if ((textCorpus.includes("rot") || textCorpus.includes("damping")) && (prod.name.toLowerCase().includes("trichoderma") || prod.name.toLowerCase().includes("copper"))) {
        return true;
      }

      return false;
    });

    if (matches.length === 0) {
      toast("No specific catalog match found for current symptoms. Please select from dropdown.", {
        icon: "ℹ️",
      });
      setIsOpen(true);
      return;
    }

    // Merge matches with existing
    const newItems: RecommendedProductItem[] = [...selectedProducts];
    matches.forEach((m) => {
      const alreadyIn = newItems.some((x) => x.name.toLowerCase().includes(m.name.toLowerCase()));
      if (!alreadyIn) {
        newItems.push({
          productId: m.id,
          name: m.name + (m.brandName ? ` (${m.brandName})` : ""),
          category: m.category,
          dosage: m.recommendedDosage,
          isAiSuggested: true,
        });
      }
    });

    onChange(newItems, formatSummary(newItems));
    toast.success(`AI suggested ${matches.length} matching product(s)! You can check or uncheck any below.`);
  };

  // Quick Add new product from inside dropdown
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      toast.error("Please enter a chemical or product name.");
      return;
    }

    setQuickSaving(true);
    const newId = uuidv4();
    const newProd: InventoryProduct = {
      id: newId,
      name: quickName.trim(),
      category: quickCategory,
      targetPests: [diagnosis || "General target"],
      targetCrops: [cropType || "All Crops"],
      recommendedDosage: quickDosage.trim() || "As directed on label",
      inStock: true,
      createdAt: new Date().toISOString(),
    };

    // Save to localStore and firestore
    const updatedInv = localStore.inventory.upsert(newProd);
    setInventory(updatedInv);
    try {
      await setDoc(doc(db, "product_inventory", newId), newProd);
    } catch {}

    // Add to selected products
    const updatedSelected: RecommendedProductItem[] = [
      ...selectedProducts,
      {
        productId: newId,
        name: newProd.name,
        category: newProd.category,
        dosage: newProd.recommendedDosage,
        isAiSuggested: false,
      },
    ];

    onChange(updatedSelected, formatSummary(updatedSelected));
    toast.success(`"${newProd.name}" added to inventory and selected!`);
    setQuickName("");
    setQuickDosage("");
    setShowQuickAdd(false);
    setQuickSaving(false);
  };

  return (
    <div className="space-y-3">
      {/* Label and AI Auto-Fill action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Recommend What to Buy (Chemicals &amp; Products) *
          </label>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Select from catalog or use AI auto-fill to recommend products to the farmer.
          </span>
        </div>

        {/* AI Auto-Fill Button */}
        <button
          type="button"
          onClick={handleAiAutoFill}
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 px-3 py-1.5 rounded-lg transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>AI Auto-fill Recommendations</span>
        </button>
      </div>

      {/* Dropdown Trigger & Search */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="input-field text-sm cursor-pointer flex items-center justify-between min-h-[42px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 flex-wrap py-0.5">
            {selectedProducts.length === 0 ? (
              <span className="text-gray-400 text-xs">
                — Click to select chemicals or products from catalog —
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {selectedProducts.length} product(s) selected
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-30 mt-1 w-full bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 space-y-2 animate-in fade-in max-h-80 overflow-y-auto">
            {/* Search Input Inside Dropdown */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chemical, pest target, or category..."
                className="input-field text-xs pl-8 pr-2 py-1.5 w-full bg-gray-50 dark:bg-gray-800"
                autoFocus
              />
            </div>

            {/* Quick Add Button Header */}
            <div className="flex items-center justify-between pt-1 px-1 text-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Available Catalog ({filteredInventory.length})
              </span>
              <button
                type="button"
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {showQuickAdd ? "Close adder" : "Add new chemical to dropdown"}
              </button>
            </div>

            {/* Inline Quick Add Form */}
            {showQuickAdd && (
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-2">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Add New Product to Catalog:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Product name (e.g. Mefenoxam 240 EC)"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="input-field text-xs py-1.5 bg-white dark:bg-gray-800"
                  />
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as ProductCategory)}
                    className="input-field text-xs py-1.5 bg-white dark:bg-gray-800"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Recommended dosage (e.g. 20ml per 16L water)"
                  value={quickDosage}
                  onChange={(e) => setQuickDosage(e.target.value)}
                  className="input-field text-xs py-1.5 bg-white dark:bg-gray-800"
                />
                <button
                  type="button"
                  disabled={quickSaving}
                  onClick={handleQuickAdd}
                  className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  {quickSaving ? "Adding..." : "+ Add & Select Product"}
                </button>
              </div>
            )}

            {/* Product List with Checkboxes */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-52 overflow-y-auto pr-1">
              {filteredInventory.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-500">
                  No matching chemical found. Click &ldquo;Add new chemical&rdquo; above.
                </div>
              ) : (
                filteredInventory.map((item) => {
                  const checked = isSelected(item.name);
                  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Fungicide;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleProduct(item)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                        checked
                          ? "bg-purple-50 dark:bg-purple-950/40"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="mt-0.5 text-purple-700 dark:text-purple-400">
                        {checked ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-gray-900 dark:text-white">
                            {item.name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${catColor.bg}`}
                          >
                            {item.category}
                          </span>
                          {item.brandName && (
                            <span className="text-[10px] text-gray-400 truncate">
                              ({item.brandName})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {item.recommendedDosage}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:underline px-2 py-1"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Products Cards (Agriculturist can Check / Uncheck / Remove) */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Selected Recommendations ({selectedProducts.length}):
            </span>
            <span className="text-[11px]">Uncheck or remove to adjust</span>
          </div>

          <div className="space-y-2">
            {selectedProducts.map((prod, idx) => {
              const catColor = CATEGORY_COLORS[prod.category] || CATEGORY_COLORS.Fungicide;
              return (
                <div
                  key={idx}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 p-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-gray-900 dark:text-white">
                          {prod.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${catColor.bg}`}
                        >
                          {prod.category}
                        </span>
                        {prod.isAiSuggested && (
                          <span className="text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> AI Suggested
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        <strong className="text-gray-700 dark:text-gray-200">Dosage:</strong>{" "}
                        {prod.dosage}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="self-end sm:self-auto text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    title="Remove product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sm:hidden text-[11px]">Remove</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

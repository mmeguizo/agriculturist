"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { Incident } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { IncidentStatusBadge } from "@/components/ui/StatusBadge";
import { useResolvedImageUrls } from "@/lib/use-resolved-images";
import {
  FileText,
  ArrowRight,
  Sparkles,
  Search,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  Eye,
  ShieldCheck,
} from "lucide-react";

type QueueFilter = "pending" | "resolved" | "all";

function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.dataset.errorHandled) return;
  target.dataset.errorHandled = "true";

  if (target.src.includes("/storage/v1/object/sign/")) {
    target.src = target.src.replace("/storage/v1/object/sign/", "/storage/v1/object/public/").split("?")[0];
  }
}

function IncidentThumbSingle({ url, count }: { url?: string; count: number }) {
  const images = useMemo(() => (url ? [url] : []), [url]);
  const resolved = useResolvedImageUrls(images);
  const displayUrl = resolved[0];

  if (!displayUrl) {
    return (
      <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-400 shrink-0">
        <FileText className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
      <img
        src={displayUrl}
        alt="Evidence thumbnail"
        onError={handleImageError}
        className="w-full h-full object-cover"
      />
      {count > 1 && (
        <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] font-bold px-1 rounded-tl">
          +{count - 1}
        </span>
      )}
    </div>
  );
}

export default function AgriculturistQueuePage() {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    if (typeof window === "undefined") return [];
    return localStore.incidents.getAll();
  });
  const [loading, setLoading] = useState(() => incidents.length === 0);

  // Filters, search, sort, view mode, and pagination
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // desc = newest first, asc = oldest first
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const local = localStore.incidents.getAll();
    const sortDesc = (list: Incident[]) =>
      [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (local.length > 0) {
      setIncidents(sortDesc(local));
      setLoading(false);
    } else {
      setLoading(true);
    }

    let unsub: (() => void) | null = null;
    try {
      // Real-time listener so newly submitted reports appear live
      unsub = onSnapshot(
        collection(db, "incidents"),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map(
              (d) => ({ id: d.id, ...d.data() } as Incident)
            );
            setIncidents(sortDesc(list));
          } else {
            setIncidents(sortDesc(local));
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore realtime incidents error, falling back to local:", err);
          setIncidents(sortDesc(local));
          setLoading(false);
        }
      );
    } catch {
      setIncidents(sortDesc(local));
      setLoading(false);
    }

    // Cross-tab demo sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "agricare_incidents") {
        const updated = localStore.incidents.getAll();
        setIncidents(sortDesc(updated));
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (unsub) unsub();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const counts = {
    pending: incidents.filter((i) => i.status === "pending" || i.status === "under_review").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
    all: incidents.length,
  };

  // Filtered & Sorted incidents
  const processedIncidents = useMemo(() => {
    let result = incidents.filter((incident) => {
      // Status filter
      if (filter === "pending") {
        if (incident.status !== "pending" && incident.status !== "under_review") {
          return false;
        }
      } else if (filter === "resolved") {
        if (incident.status !== "resolved") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFarmer = incident.farmerName?.toLowerCase().includes(q);
        const matchCrop = incident.cropType?.toLowerCase().includes(q);
        const matchDesc = incident.description?.toLowerCase().includes(q);
        const matchLoc = incident.location?.toLowerCase().includes(q);
        const matchId = incident.id?.toLowerCase().includes(q);
        const matchDisease = incident.aiAnalysis?.diseaseName?.toLowerCase().includes(q);
        if (!matchFarmer && !matchCrop && !matchDesc && !matchLoc && !matchId && !matchDisease) {
          return false;
        }
      }

      return true;
    });

    // Sort by createdAt
    result = [...result].sort((a, b) => {
      return sortOrder === "desc"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt);
    });

    return result;
  }, [incidents, filter, searchQuery, sortOrder]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, sortOrder, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(processedIncidents.length / pageSize));
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedIncidents.slice(start, start + pageSize);
  }, [processedIncidents, currentPage, pageSize]);

  const startIndex = processedIncidents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, processedIncidents.length);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  return (
    <DashboardLayout allowedRoles={["agriculturist"]}>
      <div className="space-y-6">
        {/* Workbench Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 sm:p-8 rounded-2xl shadow-sm">
          <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">
            Municipal Agriculturist Workbench
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Incident Triage &amp; Verification Queue
          </h1>
          <p className="text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Review smallholder farmer incident reports, examine high-resolution crop photos and preliminary AI vision indicators, and submit verified prescriptions.
          </p>
        </div>

        {/* Incident Management Section */}
        <div className="card space-y-4 shadow-sm border border-gray-200">
          {/* Controls: Search, Status Tabs, Sort Toggle & View Mode */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search farmer, crop, symptoms, barangay, or ID..."
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

            {/* Status Filter Tabs, Sort & View Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilter("pending")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    filter === "pending"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pending ({counts.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("resolved")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    filter === "resolved"
                      ? "bg-white text-green-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Resolved ({counts.resolved})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    filter === "all"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All ({counts.all})
                </button>
              </div>

              {/* Sort Order Toggle (Newest vs Oldest First) */}
              <button
                type="button"
                onClick={toggleSortOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 shadow-2xs transition-colors"
                title="Toggle Sort Order"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
              </button>

              {/* View Mode Toggle (Table vs Cards) */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "table"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === "cards"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" label="Loading incident triage queue..." />
            </div>
          ) : processedIncidents.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-gray-200 bg-gray-50/50">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-800">No incidents in this queue</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery || filter !== "all"
                  ? "No incident records matched your active filter or search query."
                  : "All incident reports have been reviewed and resolved."}
              </p>
              {(searchQuery || filter !== "pending") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("pending");
                  }}
                  className="btn-secondary mt-3 text-xs inline-flex"
                >
                  Reset to Pending Queue
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            /* Modern Table View */
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold text-[11px]">
                    <th scope="col" className="py-3 px-3 w-14">Photo</th>
                    <th scope="col" className="py-3 px-4">Crop &amp; ID</th>
                    <th scope="col" className="py-3 px-4">Farmer &amp; Location</th>
                    <th scope="col" className="py-3 px-4">Symptoms &amp; AI Indicator</th>
                    <th
                      scope="col"
                      onClick={toggleSortOrder}
                      className="py-3 px-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      title="Click to toggle date sort"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date Filed</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th scope="col" className="py-3 px-3">Status</th>
                    <th scope="col" className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-3">
                        <IncidentThumbSingle
                          url={incident.imageUrls?.[0]}
                          count={incident.imageUrls?.length || 0}
                        />
                      </td>

                      {/* Crop & ID */}
                      <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {incident.cropType}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                          #{incident.id.slice(0, 8)}
                        </div>
                      </td>

                      {/* Farmer & Location */}
                      <td className="py-3 px-4 text-gray-700 max-w-[160px]">
                        <div className="flex items-center gap-1 font-semibold text-gray-900 truncate">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{incident.farmerName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate" title={incident.location}>
                            {incident.location?.split("(")[0]?.trim() || "Local Farm"}
                          </span>
                        </div>
                      </td>

                      {/* Symptoms & AI Indicator */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="line-clamp-2 text-gray-700 leading-relaxed">
                          {incident.description}
                        </p>
                        {incident.aiAnalysis && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-700 font-medium">
                            <Sparkles
                              className={`w-3 h-3 shrink-0 text-blue-600 ${
                                incident.aiAnalysis.confidence === "Processing..."
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                            <span className="truncate">
                              {incident.aiAnalysis.diseaseName}
                            </span>
                            {incident.aiAnalysis.severity && incident.aiAnalysis.confidence !== "Processing..." && (
                              <span className="text-[10px] text-amber-700 font-semibold shrink-0">
                                ({incident.aiAnalysis.severity})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Date Filed */}
                      <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>
                            {new Date(incident.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <IncidentStatusBadge status={incident.status} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/agriculturist/incident/${incident.id}`}
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-md transition-colors ${
                            incident.status === "resolved"
                              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                              : "text-blue-700 bg-blue-50 hover:bg-blue-100"
                          }`}
                        >
                          {incident.status === "resolved" ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" /> View Case
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" /> Review Case
                            </>
                          )}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="space-y-3">
              {paginatedIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/agriculturist/incident/${incident.id}`}
                  className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    <IncidentThumbSingle
                      url={incident.imageUrls?.[0]}
                      count={incident.imageUrls?.length || 0}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                          {incident.cropType}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm">
                          {incident.farmerName}
                        </h3>
                        <span className="text-xs font-mono text-gray-400">
                          #{incident.id.slice(0, 8)}
                        </span>
                        <IncidentStatusBadge status={incident.status} />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {incident.description}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1.5 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {incident.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </span>
                        {incident.aiAnalysis && (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                            <Sparkles className="w-3 h-3" /> AI: {incident.aiAnalysis.diseaseName}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 shrink-0 self-end sm:self-auto">
                    Review Case <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {processedIncidents.length > 0 && (
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-gray-900">{startIndex}</strong> to{" "}
                  <strong className="text-gray-900">{endIndex}</strong> of{" "}
                  <strong className="text-gray-900">{processedIncidents.length}</strong> queue items
                </span>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white text-gray-700"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Navigation with Jump to Oldest/Newest */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
                  title="First Page (Newest if sorted desc)"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2 font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
                  title="Last Page (Oldest if sorted desc)"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

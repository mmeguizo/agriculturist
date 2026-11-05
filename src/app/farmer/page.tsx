"use client";

import { useEffect, useMemo, useState } from "react";
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
  Search,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

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
      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
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

function IncidentThumbsGrid({ images }: { images: string[] }) {
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
            onError={handleImageError}
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
  const [loading, setLoading] = useState(() => incidents.length === 0);

  // Filters, search, sort, and view controls
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // desc = newest first, asc = oldest first
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!activeUserId) return;

    const sortDesc = (list: Incident[]) =>
      [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Instant local paint so user never waits for Firestore network roundtrip
    const localIncidents: Incident[] = JSON.parse(
      localStorage.getItem("agricare_incidents") || "[]"
    );
    const userLocal = localIncidents.filter((inc) => !inc.farmerId || inc.farmerId === activeUserId);
    if (userLocal.length > 0) {
      setIncidents(sortDesc(userLocal));
      setLoading(false);
    }

    const unsubs: (() => void)[] = [];
    try {
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
            } else {
              const localIncidents: Incident[] = JSON.parse(
                localStorage.getItem("agricare_incidents") || "[]"
              );
              setIncidents(
                sortDesc(localIncidents.filter((inc) => inc.farmerId === activeUserId))
              );
            }
            setLoading(false);
          },
          () => {
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
  const pendingCount = incidents.filter(
    (i) => i.status === "pending" || i.status === "under_review"
  ).length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  // Filtered & Sorted incidents
  const processedIncidents = useMemo(() => {
    let result = incidents.filter((incident) => {
      // Status filter
      if (statusFilter === "pending") {
        if (incident.status !== "pending" && incident.status !== "under_review") {
          return false;
        }
      } else if (statusFilter === "resolved") {
        if (incident.status !== "resolved") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCrop = incident.cropType.toLowerCase().includes(q);
        const matchDesc = incident.description.toLowerCase().includes(q);
        const matchLoc = incident.location?.toLowerCase().includes(q);
        const matchId = incident.id.toLowerCase().includes(q);
        const matchDisease = incident.aiAnalysis?.diseaseName?.toLowerCase().includes(q);
        if (!matchCrop && !matchDesc && !matchLoc && !matchId && !matchDisease) {
          return false;
        }
      }

      return true;
    });

    // Sort order (by createdAt)
    result = [...result].sort((a, b) => {
      return sortOrder === "desc"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt);
    });

    return result;
  }, [incidents, statusFilter, searchQuery, sortOrder]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortOrder, pageSize]);

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
    <DashboardLayout allowedRoles={["farmer"]}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="card bg-linear-to-r from-green-700 to-emerald-600 text-white p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-green-200 text-xs font-bold uppercase tracking-wider">
                Farmer Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Welcome back, {userProfile?.fullName || "Farmer"}!
              </h1>
              <p className="text-green-100 text-sm mt-1 max-w-xl">
                Have you observed unusual pests or disease symptoms in your crops? Take clear photos and submit a report for fast diagnostics.
              </p>
            </div>
            <Link
              href="/farmer/report"
              className="btn-accent inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-auto text-sm px-5 py-3 shadow-lg hover:scale-105 transition-transform"
            >
              <PlusCircle className="w-5 h-5" />
              Report Incident
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card border-l-4 border-l-blue-500 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{totalCount}</div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Total Filed Reports
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-l-amber-500 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{pendingCount}</div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Awaiting Review
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-l-green-600 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{resolvedCount}</div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Resolved with Prescription
              </div>
            </div>
          </div>
        </div>

        {/* Incident Management Section */}
        <div className="card space-y-4 shadow-sm border border-gray-200">
          {/* Section Header with Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your Incident Reports</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Browse and review all reported crop symptoms, AI preliminary scans, and verified prescriptions.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Link
                href="/farmer/report"
                className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> File New Report
              </Link>
            </div>
          </div>

          {/* Controls: Search, Filters, View Mode & Sort Toggle */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crop, problem, barangay, or ID..."
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

            {/* Filter Tabs & View Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Chips */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    statusFilter === "all"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    statusFilter === "pending"
                      ? "bg-white text-amber-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("resolved")}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    statusFilter === "resolved"
                      ? "bg-white text-green-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Resolved ({resolvedCount})
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
                      ? "bg-white text-green-700 shadow-xs"
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
                      ? "bg-white text-green-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="py-12">
              <LoadingSpinner label="Loading your reports..." />
            </div>
          ) : processedIncidents.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-gray-200 bg-gray-50/50">
              <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-800">No incident reports found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "No reports match your current filter or search criteria."
                  : "Spotted pest attacks or plant disease? File a report with at least 4 photos for diagnosis."}
              </p>
              {searchQuery || statusFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="btn-secondary mt-3 text-xs inline-flex"
                >
                  Reset Filters
                </button>
              ) : (
                <Link
                  href="/farmer/report"
                  className="btn-primary mt-4 text-xs inline-flex shadow"
                >
                  <PlusCircle className="w-4 h-4" /> Create First Report
                </Link>
              )}
            </div>
          ) : viewMode === "table" ? (
            /* Modern Table Style */
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold text-[11px]">
                    <th scope="col" className="py-3 px-3 w-14">Photo</th>
                    <th scope="col" className="py-3 px-4">Crop &amp; ID</th>
                    <th scope="col" className="py-3 px-4">Symptoms &amp; AI Analysis</th>
                    <th scope="col" className="py-3 px-3">Location</th>
                    <th
                      scope="col"
                      onClick={toggleSortOrder}
                      className="py-3 px-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      title="Click to change date sort"
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
                      className="hover:bg-green-50/40 transition-colors group"
                    >
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-3">
                        <IncidentThumbSingle
                          url={incident.imageUrls?.[0]}
                          count={incident.imageUrls?.length || 0}
                        />
                      </td>

                      {/* Crop & ID */}
                      <td className="py-3 px-4 font-medium text-gray-900">
                        <div className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                          {incident.cropType}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                          #{incident.id.slice(0, 8)}
                        </div>
                      </td>

                      {/* Description & AI Diagnosis */}
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
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[130px]" title={incident.location}>
                            {incident.location?.split("(")[0]?.trim() || "Farm"}
                          </span>
                        </div>
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
                          href={`/farmer/incident/${incident.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedIncidents.map((incident) => (
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

                    <IncidentThumbsGrid images={incident.imageUrls || []} />

                    {incident.aiAnalysis && (
                      <div className="bg-blue-50/80 border border-blue-100 rounded-lg p-2.5 my-2 flex items-start gap-2 text-xs text-blue-900">
                        <Sparkles
                          className={`w-4 h-4 text-blue-600 shrink-0 mt-0.5 ${
                            incident.aiAnalysis.confidence === "Processing..."
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                        <div>
                          <span className="font-bold">AI Diagnosis: </span>
                          <span>{incident.aiAnalysis.diseaseName}</span>
                          {incident.aiAnalysis.confidence !== "Processing..." && (
                            <span className="ml-1 text-[10px] text-blue-600 font-semibold">
                              ({incident.aiAnalysis.severity} Severity)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(incident.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {incident.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {incident.location.split(",")[0]}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-green-700 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
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
                  <strong className="text-gray-900">{processedIncidents.length}</strong> reports
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

              {/* Page Navigation with Jump to Oldest/Newest */}
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { Advisory, Incident, UserProfile } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Users,
  UserCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Database,
  PlusCircle,
  ArrowRight,
  BarChart3,
  Printer,
} from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (typeof window === "undefined") return [];
    return localStore.users.getAll();
  });
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    if (typeof window === "undefined") return [];
    return localStore.incidents.getAll();
  });
  const [advisories, setAdvisories] = useState<Advisory[]>(() => {
    if (typeof window === "undefined") return [];
    return localStore.advisories.getAll();
  });
  const [loading, setLoading] = useState(() => users.length === 0 && incidents.length === 0);
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const localUsers = localStore.users.getAll();
      const localIncidents = localStore.incidents.getAll();
      const localAdvisories = localStore.advisories.getAll();
      if (localUsers.length > 0 || localIncidents.length > 0) {
        setUsers(localUsers);
        setIncidents(localIncidents);
        setAdvisories(localAdvisories);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const [usersSnap, incidentsSnap, advisoriesSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "incidents")),
          getDocs(collection(db, "advisories")),
        ]);

        if (!usersSnap.empty) {
          setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile)));
        } else {
          setUsers(localUsers);
        }

        if (!incidentsSnap.empty) {
          setIncidents(incidentsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Incident)));
        } else {
          setIncidents(localIncidents);
        }

        if (!advisoriesSnap.empty) {
          setAdvisories(advisoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Advisory)));
        } else {
          setAdvisories(localAdvisories);
        }
      } catch (err) {
        console.warn("Firestore fetch error, using local data:", err);
        setUsers(localUsers);
        setIncidents(localIncidents);
        setAdvisories(localAdvisories);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const pendingUsers = users.filter((u) => u.status === "pending").length;
  const approvedUsers = users.filter((u) => u.status === "approved").length;
  const pendingIncidents = incidents.filter(
    (i) => i.status === "pending" || i.status === "under_review"
  ).length;
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved").length;

  // Incidents grouped by crop type for the overview chart
  const cropCounts = incidents.reduce<Record<string, number>>((acc, incident) => {
    const crop = (incident.cropType || "").trim() || "Unknown";
    acc[crop] = (acc[crop] || 0) + 1;
    return acc;
  }, {});
  const cropChart = Object.entries(cropCounts)
    .map(([crop, count]) => ({ crop, count }))
    .sort((a, b) => b.count - a.count);
  const maxCropCount = cropChart.length ? cropChart[0].count : 1;

  // Incidents filtered for the printable date-range report
  const filteredIncidents = incidents
    .filter((incident) => {
      const created = new Date(incident.createdAt).getTime();
      if (reportStart && created < new Date(`${reportStart}T00:00:00`).getTime()) {
        return false;
      }
      if (reportEnd && created > new Date(`${reportEnd}T23:59:59`).getTime()) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const printReport = () => {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const startLabel = reportStart
      ? new Date(`${reportStart}T00:00:00`).toLocaleDateString()
      : "Beginning";
    const endLabel = reportEnd
      ? new Date(`${reportEnd}T23:59:59`).toLocaleDateString()
      : "Today";

    const rows = filteredIncidents
      .map(
        (incident) => `
          <tr>
            <td>${escapeHtml(new Date(incident.createdAt).toLocaleDateString())}</td>
            <td>${escapeHtml(incident.farmerName || "")}</td>
            <td>${escapeHtml(incident.cropType || "")}</td>
            <td>${escapeHtml(incident.status || "")}</td>
            <td>${escapeHtml((incident.description || "").slice(0, 200))}</td>
          </tr>`
      )
      .join("");

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>AgriCare Incident Report</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .sub { color: #555; font-size: 13px; margin: 0 0 16px; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
      .total { margin-top: 12px; font-size: 13px; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>AgriCare Incident Report</h1>
    <p class="sub">Period: ${escapeHtml(startLabel)} &mdash; ${escapeHtml(endLabel)}</p>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Farmer</th>
          <th>Crop Type</th>
          <th>Status</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5">No incidents in the selected date range.</td></tr>'}
      </tbody>
    </table>
    <p class="total">Total incidents: ${filteredIncidents.length}</p>
  </body>
</html>`;

    const printWindow = window.open("", "_blank", "width=1000,height=700");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const stats = [
    { label: "Registered Users", value: users.length, icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: "Pending Approvals", value: pendingUsers, icon: UserCheck, color: "bg-amber-100 text-amber-700" },
    { label: "Incidents Under Review", value: pendingIncidents, icon: FileText, color: "bg-purple-100 text-purple-700" },
    { label: "Resolved Incidents", value: resolvedIncidents, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
  ];

  if (loading) {
    return (
      <DashboardLayout allowedRoles={["admin"]}>
        <LoadingSpinner size="lg" label="Loading admin overview..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 rounded-2xl shadow-sm">
          <span className="text-purple-200 text-xs font-semibold uppercase tracking-wider">
            Administrative Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            System Overview
          </h1>
          <p className="text-sm text-purple-100 mt-1">
            Approve accounts, maintain the pest &amp; disease database, and publish advisories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Incidents by Crop Type</h3>
          </div>
          {cropChart.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No incidents recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {cropChart.map(({ crop, count }) => (
                <div key={crop}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700">{crop}</span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all"
                      style={{ width: `${(count / maxCropCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/users" className="card hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="font-bold text-gray-900 mt-3">User Approvals</h3>
            <p className="text-xs text-gray-500 mt-1">
              Approve or decline farmer and agriculturist registrations ({approvedUsers} approved).
            </p>
          </Link>

          <Link href="/admin/pests" className="card hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-green-100 text-green-700 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-600 transition-colors" />
            </div>
            <h3 className="font-bold text-gray-900 mt-3">Pest &amp; Disease Database</h3>
            <p className="text-xs text-gray-500 mt-1">Encode and maintain the official pest/disease catalog.</p>
          </Link>

          <Link href="/admin/advisories" className="card hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-amber-600 transition-colors" />
            </div>
            <h3 className="font-bold text-gray-900 mt-3">Publish Advisory</h3>
            <p className="text-xs text-gray-500 mt-1">
              Broadcast community-wide or targeted agricultural alerts ({advisories.length} published).
            </p>
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Recent Registrations</h3>
            <Link href="/admin/users" className="text-xs font-bold text-purple-700 hover:underline">
              View all
            </Link>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No registered users yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      user.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : user.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">Printable Incident Report</h3>
            </div>
            <button type="button" onClick={printReport} className="btn-primary text-sm">
              <Printer className="w-4 h-4" /> Print Report
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={reportStart}
                onChange={(e) => setReportStart(e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={reportEnd}
                onChange={(e) => setReportEnd(e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Farmer</th>
                  <th className="py-2 pr-3">Crop</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No incidents in the selected date range.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="text-gray-700">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-3">{incident.farmerName}</td>
                      <td className="py-2 pr-3">{incident.cropType}</td>
                      <td className="py-2 pr-3 capitalize">{incident.status}</td>
                      <td className="py-2">
                        {incident.description.slice(0, 120)}
                        {incident.description.length > 120 ? "…" : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filteredIncidents.length} incident(s) in range
          </p>
        </div>

        <Link
          href="/admin/users"
          className="card border-2 border-dashed border-purple-200 hover:border-purple-400 text-purple-700 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 py-4 font-bold text-sm"
        >
          <PlusCircle className="w-5 h-5" />
          Add a New User (Farmer / Agriculturist)
        </Link>
      </div>
    </DashboardLayout>
  );
}

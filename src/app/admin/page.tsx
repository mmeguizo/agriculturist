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
} from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const localUsers = localStore.users.getAll();
      const localIncidents = localStore.incidents.getAll();
      const localAdvisories = localStore.advisories.getAll();

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

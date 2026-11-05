"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { db, firebaseConfig } from "@/lib/firebase";
import { localStore } from "@/lib/demo-store";
import { UserProfile, UserRole } from "@/lib/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  X,
  Mail,
  ShieldCheck,
  Tractor,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

type StatusFilter = "pending" | "approved" | "all";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  agriculturist: "Agriculturist",
  farmer: "Farmer",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (typeof window === "undefined") return [];
    return localStore.users.getAll();
  });
  const [loading, setLoading] = useState(() => users.length === 0);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "farmer" as UserRole,
    contactNumber: "",
    farmLocation: "",
  });

  useEffect(() => {
    const loadUsers = async () => {
      const localUsers = localStore.users.getAll();
      if (localUsers.length > 0) { setUsers(localUsers); setLoading(false); }
      try {
        const snap = await getDocs(collection(db, "users"));
        if (!snap.empty) {
          setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile)));
        } else {
          setUsers(localUsers);
        }
      } catch (err) {
        console.warn("Firestore users fetch error, using local data:", err);
        setUsers(localUsers);
      }
      setLoading(false);
    };

    void loadUsers();
  }, []);

  const updateUserStatus = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    try {
      await updateDoc(doc(db, "users", id), { status });
    } catch (err) {
      console.warn("Firestore status update failed, updating local only:", err);
    }

    const target = users.find((u) => u.id === id);
    if (target) {
      const updated = { ...target, status };
      localStore.users.upsert(updated);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));

      if (status === "approved") {
        const link =
          target.role === "admin"
            ? "/admin"
            : target.role === "agriculturist"
            ? "/agriculturist"
            : "/farmer";
        const notif = {
          id: uuidv4(),
          recipientId: id,
          title: "Account Approved",
          message: `Your AgriCare account (${ROLE_LABEL[target.role]}) has been approved. You may now sign in.`,
          link,
          read: false,
          createdAt: new Date().toISOString(),
        };
        localStore.notifications.upsert(notif);
        try {
          await setDoc(doc(db, "notifications", notif.id), notif);
        } catch {}
      }

      toast.success(
        status === "approved" ? "Account approved." : "Account declined."
      );
    }
    setBusyId(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || form.password.length < 6) {
      toast.error("Fill in all fields (password must be at least 6 characters).");
      return;
    }

    setSaving(true);
    try {
      // Create the Firebase Auth account via REST so the admin session is NOT replaced.
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            returnSecureToken: true,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to create account.");
      }

      const profile: UserProfile = {
        id: data.localId,
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        status: "approved",
        contactNumber: form.contactNumber,
        farmLocation: form.farmLocation,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, "users", profile.id), profile);
      } catch (err) {
        console.warn("Firestore profile write failed, saving locally:", err);
      }

      localStore.users.upsert(profile);
      setUsers((prev) => [profile, ...prev.filter((u) => u.id !== profile.id)]);
      setShowForm(false);
      setForm({
        fullName: "",
        email: "",
        password: "",
        role: "farmer",
        contactNumber: "",
        farmLocation: "",
      });
      toast.success(`Account created for ${form.fullName}. They can sign in now.`);
    } catch (error) {
      console.error("Add user failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add user.");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => (filter === "all" ? true : u.status === filter));
  const counts = {
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    all: users.length,
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              User Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Approve registrations or add farmer / agriculturist accounts directly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="btn-primary text-sm"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Close Form" : "Add User"}
          </button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <form onSubmit={handleAddUser} autoComplete="off" className="card border-2 border-purple-100 space-y-4">
            <h3 className="font-bold text-gray-900">Add New Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field text-sm"
                  placeholder="juan@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Temporary Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field text-sm pr-10"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="input-field text-sm"
                >
                  <option value="farmer">Farmer</option>
                  <option value="agriculturist">Agriculturist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  className="input-field text-sm"
                  placeholder="09xx xxx xxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Farm / Office Location
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={form.farmLocation}
                  onChange={(e) => setForm({ ...form, farmLocation: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Barangay, Municipality"
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-sm w-full sm:w-auto">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "all"] as StatusFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                filter === key
                  ? "bg-purple-700 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {key} ({counts[key]})
            </button>
          ))}
        </div>

        {/* Users List */}
        {loading ? (
          <LoadingSpinner size="lg" label="Loading users..." />
        ) : filteredUsers.length === 0 ? (
          <div className="card text-center py-10 text-gray-500 text-sm">
            No {filter === "all" ? "" : filter} users found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-gray-100 text-gray-600 rounded-xl shrink-0">
                    {user.role === "agriculturist" ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : user.role === "admin" ? (
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Tractor className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">{user.fullName}</p>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                        {ROLE_LABEL[user.role]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {user.email}
                    </p>
                    {user.farmLocation && (
                      <p className="text-xs text-gray-400 mt-0.5">{user.farmLocation}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                      user.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : user.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {user.status}
                  </span>

                  {user.status !== "approved" && (
                    <button
                      type="button"
                      disabled={busyId === user.id}
                      onClick={() => updateUserStatus(user.id, "approved")}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      <UserCheck className="w-4 h-4" /> Approve
                    </button>
                  )}
                  {user.status !== "rejected" && (
                    <button
                      type="button"
                      disabled={busyId === user.id}
                      onClick={() => updateUserStatus(user.id, "rejected")}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      <UserX className="w-4 h-4" /> Decline
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs">
          <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            Accounts added here are created with <strong>Approved</strong> status so they can
            sign in immediately. New self-registrations appear under <strong>Pending</strong> and
            must be approved or declined here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

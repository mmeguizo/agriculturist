"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { UserProfile } from "@/lib/types";
import { Clock, LogOut, CheckCircle2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { userProfile, setUserProfile } = useAuth();

  useEffect(() => {
    if (userProfile?.status === "approved") {
      toast.success("Your account has been approved!");
      if (userProfile.role === "admin") {
        router.push("/admin");
      } else if (userProfile.role === "agriculturist") {
        router.push("/agriculturist");
      } else {
        router.push("/farmer");
      }
    }
  }, [userProfile, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem("agricare_demo_user");
    setUserProfile(null);
    router.push("/login");
  };

  const simulateApproval = () => {
    if (!userProfile) return;
    const updated: UserProfile = { ...userProfile, status: "approved" };
    setUserProfile(updated);
    localStorage.setItem("agricare_demo_user", JSON.stringify(updated));

    // Update in all_users
    const allUsers: UserProfile[] = JSON.parse(
      localStorage.getItem("agricare_all_users") || "[]"
    );
    const idx = allUsers.findIndex((u) => u.id === userProfile.id);
    if (idx !== -1) {
      allUsers[idx].status = "approved";
      localStorage.setItem("agricare_all_users", JSON.stringify(allUsers));
    }

    toast.success("Account status updated to Approved!");
    if (updated.role === "agriculturist") {
      router.push("/agriculturist");
    } else {
      router.push("/farmer");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card text-center shadow-lg p-8">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Account Pending Approval
          </h2>

          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs text-left space-y-1">
            <p><strong>Name:</strong> {userProfile?.fullName || "Applicant"}</p>
            <p><strong>Email:</strong> {userProfile?.email || "Registered Email"}</p>
            <p className="capitalize"><strong>Role:</strong> {userProfile?.role || "User"}</p>
            <p><strong>Status:</strong> <span className="font-semibold text-amber-700">Pending Review</span></p>
          </div>

          <p className="mt-4 text-sm text-gray-600 leading-relaxed">
            Thank you for registering with AgriCare. For quality control and security, all Farmer and Agriculturist accounts require authorization from the Municipal Agricultural Officer before system access is granted.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleSignOut}
              className="btn-secondary w-full py-2.5 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Return Later
            </button>

            {/* Local testing helper button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={simulateApproval}
                className="w-full text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg py-2 transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Demo: Instant Approve Account & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

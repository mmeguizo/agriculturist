"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, ExternalLink } from "lucide-react";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Notification } from "@/lib/types";

export default function NotificationBell() {
  const { firebaseUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const activeUserId = firebaseUser?.uid || userProfile?.id;

  useEffect(() => {
    if (!activeUserId) return;

    // First load from localStorage if any demo notifications exist
    const loadDemoNotifs = () => {
      const all: Notification[] = JSON.parse(
        localStorage.getItem("agricare_notifications") || "[]"
      );
      const userNotifs = all.filter((n) => n.recipientId === activeUserId);
      if (userNotifs.length > 0) {
        setNotifications(userNotifs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }
    };
    loadDemoNotifs();

    // Firestore listener
    try {
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", activeUserId),
        orderBy("createdAt", "desc")
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const notifs = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() } as Notification)
          );
          if (notifs.length > 0) {
            setNotifications(notifs);
          }
        },
        () => {
          // If firestore permission / missing index / offline, fallback to local storage
          loadDemoNotifs();
        }
      );

      return () => unsub();
    } catch {
      loadDemoNotifs();
    }
  }, [activeUserId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (notifId: string) => {
    // Update local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );

    // Update localStorage
    const all: Notification[] = JSON.parse(
      localStorage.getItem("agricare_notifications") || "[]"
    );
    const updated = all.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    localStorage.setItem("agricare_notifications", JSON.stringify(updated));

    // Try Firestore update
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch {}
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const all: Notification[] = JSON.parse(
      localStorage.getItem("agricare_notifications") || "[]"
    );
    const updated = all.map((n) =>
      n.recipientId === activeUserId ? { ...n, read: true } : n
    );
    localStorage.setItem("agricare_notifications", JSON.stringify(updated));

    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }))
      );
    } catch {}
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-green-700 hover:bg-gray-100 rounded-full transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-bounce shadow">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[30rem] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-green-700 hover:text-green-800 font-semibold hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto divide-y divide-gray-100 flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                No notifications right now.
              </div>
            ) : (
              notifications.slice(0, 15).map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link || "#"}
                  onClick={() => {
                    markAsRead(notif.id);
                    setShowDropdown(false);
                  }}
                  className={`block p-3.5 hover:bg-gray-50 transition-colors ${
                    !notif.read ? "bg-green-50/60 font-medium" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-gray-900">{notif.title}</p>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

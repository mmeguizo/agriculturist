"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile } from "./types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
  setUserProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("agricare_demo_user");
        return saved ? JSON.parse(saved) : null;
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("agricare_demo_user");
    }
    return true;
  });

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    try {
      const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      }
    } catch (e) {
      console.warn("Could not fetch user profile from Firestore:", e);
    }
  };

  useEffect(() => {
    // Check if demo user profile exists in localStorage
    const savedDemoUser = typeof window !== "undefined" ? localStorage.getItem("agricare_demo_user") : null;
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setUserProfile(parsed);
      } catch {}
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        if (!savedDemoUser) {
          setUserProfile(null);
        }
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    try {
      const unsubProfile = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as UserProfile;
            setUserProfile(data);
            if (typeof window !== "undefined") {
              localStorage.setItem("agricare_demo_user", JSON.stringify(data));
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore snapshot error (using fallback state):", error);
          setLoading(false);
        }
      );

      return () => unsubProfile();
    } catch (e) {
      console.warn("Firestore listener init failed:", e);
      setLoading(false);
    }
  }, [firebaseUser]);

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userProfile, loading, refreshProfile, setUserProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

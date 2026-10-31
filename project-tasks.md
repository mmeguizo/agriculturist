# PROJECT TASKS — Mobile-Based Pest and Disease Reporting and Advisory System

> **PURPOSE**: This document is a complete, sequential, step-by-step build guide. An AI agent (or developer) MUST follow every step in order. Do NOT skip steps. Do NOT improvise structure. Every file path, command, and code block is intentional.

---

## TABLE OF CONTENTS

1. [STEP 1 — Initialize Next.js Project](#step-1--initialize-nextjs-project)
2. [STEP 2 — Install All Dependencies](#step-2--install-all-dependencies)
3. [STEP 3 — Create Environment File Template](#step-3--create-environment-file-template)
4. [STEP 4 — Firebase Configuration](#step-4--firebase-configuration)
5. [STEP 5 — Gemini AI Configuration](#step-5--gemini-ai-configuration)
6. [STEP 6 — TypeScript Type Definitions](#step-6--typescript-type-definitions)
7. [STEP 7 — Auth Context Provider](#step-7--auth-context-provider)
8. [STEP 8 — Root Layout and Global Styles](#step-8--root-layout-and-global-styles)
9. [STEP 9 — Reusable UI Components](#step-9--reusable-ui-components)
10. [STEP 10 — Landing Page](#step-10--landing-page)
11. [STEP 11 — Registration Page](#step-11--registration-page)
12. [STEP 12 — Login Page](#step-12--login-page)
13. [STEP 13 — Pending Approval Page](#step-13--pending-approval-page)
14. [STEP 14 — Navigation Components](#step-14--navigation-components)
15. [STEP 15 — Farmer Dashboard](#step-15--farmer-dashboard)
16. [STEP 16 — Farmer Report Incident Page](#step-16--farmer-report-incident-page)
17. [STEP 17 — AI Analysis API Route](#step-17--ai-analysis-api-route)
18. [STEP 18 — Farmer Incident Detail Page](#step-18--farmer-incident-detail-page)
19. [STEP 19 — Farmer Advisories Page](#step-19--farmer-advisories-page)
20. [STEP 20 — Agriculturist Dashboard / Incident Queue](#step-20--agriculturist-dashboard--incident-queue)
21. [STEP 21 — Agriculturist Case Review Page](#step-21--agriculturist-case-review-page)
22. [STEP 22 — Admin Dashboard](#step-22--admin-dashboard)
23. [STEP 23 — Admin User Management Page](#step-23--admin-user-management-page)
24. [STEP 24 — Admin Pest Database Manager](#step-24--admin-pest-database-manager)
25. [STEP 25 — Admin Advisories Publisher](#step-25--admin-advisories-publisher)
26. [STEP 26 — Notification System](#step-26--notification-system)
27. [STEP 27 — Middleware and Route Protection](#step-27--middleware-and-route-protection)
28. [STEP 28 — Seed Admin Account Script](#step-28--seed-admin-account-script)
29. [STEP 29 — Final Verification](#step-29--final-verification)

---

## SYSTEM OVERVIEW (READ FIRST)

### What This App Does
- **Farmers** register, get admin-approved, then submit pest/disease incident reports with **minimum 4 photos**.
- On submission, **Google Gemini AI** automatically analyzes the uploaded photos, identifies the plant disease/pest, and generates a **draft recommendation** (diagnosis + treatment suggestions).
- **Agriculturists** open the incident, see the farmer's photos AND the AI-generated draft recommendation. They **review, approve, or edit** the AI draft, then submit the final recommendation to the farmer.
- **Farmers** receive an **in-app notification** with the final recommendation.
- **Admins** approve/reject user registrations, maintain the Pest & Disease knowledge base, and publish agricultural advisories.

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS 3 + Lucide React icons |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore (text/data only) |
| File Storage | Supabase Storage (incident images; URLs are saved back to Firestore as text) |
| AI | Google Gemini API (`gemini-2.0-flash`) for plant disease image analysis |
| Deployment | Vercel |

### Three User Roles
| Role | Access |
|------|--------|
| `admin` | Approve users, manage pest database, publish advisories, view analytics |
| `agriculturist` | Review incident queue, inspect photos + AI analysis, submit final recommendations |
| `farmer` | Submit incident reports (min 4 photos), track status, view recommendations & advisories |

### Critical Business Rules
1. **ALL users** (farmer + agriculturist) must be **approved by admin** before they can access the system.
2. Every incident report MUST have **at least 4 uploaded photos**. The submit button stays disabled until 4+ photos are staged.
3. AI analysis runs **automatically** when the farmer submits the incident. The AI result is stored and ready when the Agriculturist opens the case.
4. The AI identifies **only the disease/pest** (NOT the plant species — the farmer provides the crop type). The AI provides: disease identification, severity assessment, and treatment recommendations.
5. The Agriculturist sees the AI draft and can **approve as-is, edit, or completely rewrite** the recommendation before sending it to the farmer.
6. Notifications are **in-app only** (Firestore `notifications` collection with real-time listener).

---

## STEP 1 — Initialize Next.js Project

### What to do
Run the following command inside the project directory `C:\Users\mark\Desktop\sir ben`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

> **IMPORTANT**: If the directory is not empty, the CLI may ask to proceed. Answer YES. If it asks about Turbopack, choose NO (use Webpack).

### Expected result
A working Next.js project with:
- `src/app/` directory (App Router)
- `tailwind.config.ts`
- `tsconfig.json`
- `package.json`

### Verify
```bash
npm run dev
```
App should start on `http://localhost:3000`.

---

## STEP 2 — Install All Dependencies

### What to do
Run this single command:

```bash
npm install firebase @google/generative-ai @supabase/supabase-js lucide-react react-hot-toast uuid
```

```bash
npm install -D @types/uuid
```

### Package purposes
| Package | Purpose |
|---------|---------|
| `firebase` | Firebase Auth & Cloud Firestore SDK (text/data only — images are NOT stored here) |
| `@google/generative-ai` | Google Gemini API client for plant disease analysis |
| `@supabase/supabase-js` | Supabase Storage client for uploading incident images and returning public URLs |
| `lucide-react` | Icon library (Bell, Upload, Check, X, Shield, Leaf, Bug, etc.) |
| `react-hot-toast` | Toast notification popups |
| `uuid` | Generate unique IDs for Firestore documents |

---

## STEP 3 — Create Environment File Template

### What to do
Create file: `src/../.env.local` (project root `.env.local`)

```env
# ==============================================
# FIREBASE CONFIGURATION
# Get these from: Firebase Console > Project Settings > Web App
# ==============================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# ==============================================
# GOOGLE GEMINI AI CONFIGURATION
# Get this from: https://aistudio.google.com/apikey
# ==============================================
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# ==============================================
# SUPABASE STORAGE CONFIGURATION (incident images)
# Get these from: Supabase Dashboard > Project Settings > API
# The bucket must allow public insert/read for the anon/publishable key.
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_SUPABASE_BUCKET=incidents
```

> **NOTE TO USER**: Replace every `your_..._here` value with your actual Firebase and Gemini API credentials. The app will NOT work without real values.

Also create `.env.example` with the exact same content (so it can be committed to version control as a template).

---

## STEP 4 — Firebase Configuration

### What to do
Create file: `src/lib/firebase.ts`

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (prevent duplicate initialization in dev hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

### Firebase Console Setup Required (User Action)
The user must do the following in https://console.firebase.google.com:
1. Create a Firebase project (or use existing one).
2. Enable **Authentication** > Sign-in method > **Email/Password** (enable it).
3. Create a **Cloud Firestore** database (start in test mode for development).
4. Register a **Web App** and copy the config values into `.env.local`.
5. Do **NOT** enable Firebase Storage — incident images are uploaded to **Supabase Storage** instead.

---

## STEP 5 — Gemini AI Configuration

### What to do
Create file: `src/lib/gemini.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

/**
 * Analyze plant disease images using Gemini AI.
 * Accepts an array of base64-encoded image strings.
 * Returns a structured analysis with disease identification and recommendations.
 */
export async function analyzePlantDisease(
  base64Images: string[],
  cropType: string,
  farmerDescription: string
): Promise<{
  diseaseName: string;
  severity: string;
  description: string;
  recommendedTreatment: string;
  preventiveMeasures: string;
  confidence: string;
}> {
  const prompt = `You are an expert agricultural plant pathologist AI assistant. Analyze the following images of a ${cropType} plant that a farmer has reported.

The farmer describes the problem as: "${farmerDescription}"

IMPORTANT INSTRUCTIONS:
- Identify ONLY the disease or pest problem visible in the images. Do NOT identify the plant species (the farmer already told you it is ${cropType}).
- If you cannot identify a specific disease, say "Unidentified condition - requires expert inspection" and still provide general care recommendations.
- Be practical and actionable. Recommend treatments available to small-scale farmers.

Respond STRICTLY in this JSON format (no markdown, no code fences, just raw JSON):
{
  "diseaseName": "Name of the identified disease or pest",
  "severity": "Low | Moderate | High | Critical",
  "description": "Brief description of the disease/pest and how it affects the plant",
  "recommendedTreatment": "Step-by-step treatment instructions including chemical and organic options",
  "preventiveMeasures": "Preventive steps the farmer should take to avoid recurrence",
  "confidence": "Low | Medium | High"
}`;

  // Convert base64 images to Gemini-compatible parts
  const imageParts = base64Images.map((base64) => {
    // Extract mime type and data from base64 string
    const match = base64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      return {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      };
    }
    // Fallback: assume JPEG if no prefix
    return {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64,
      },
    };
  });

  try {
    const result = await geminiModel.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response, handling potential markdown code fences
    const cleanedText = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleanedText);

    return {
      diseaseName: parsed.diseaseName || "Unknown",
      severity: parsed.severity || "Unknown",
      description: parsed.description || "No description available",
      recommendedTreatment:
        parsed.recommendedTreatment || "Consult a local agriculturist",
      preventiveMeasures:
        parsed.preventiveMeasures || "Maintain good farming practices",
      confidence: parsed.confidence || "Low",
    };
  } catch (error) {
    console.error("Gemini AI analysis failed:", error);
    return {
      diseaseName: "Analysis Failed",
      severity: "Unknown",
      description:
        "The AI was unable to analyze the images. An agriculturist will manually review your report.",
      recommendedTreatment: "Awaiting manual review by an agriculturist.",
      preventiveMeasures: "N/A",
      confidence: "Low",
    };
  }
}
```

### Key Design Decisions
- The AI analyzes disease/pest ONLY, not plant identification (farmer provides crop type).
- Returns structured JSON so the Agriculturist can review each field.
- Gracefully handles failures — if AI fails, the case still proceeds for manual review.
- Uses up to 4+ images for multi-angle analysis.

---

## STEP 6 — TypeScript Type Definitions

### What to do
Create file: `src/lib/types.ts`

```typescript
export type UserRole = "admin" | "agriculturist" | "farmer";
export type UserStatus = "pending" | "approved" | "rejected";
export type IncidentStatus = "pending" | "under_review" | "resolved";
export type Severity = "info" | "warning" | "urgent";
export type TargetRole = "all" | "farmer" | "agriculturist";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  contactNumber: string;
  farmLocation: string;
  createdAt: string; // ISO string
}

export interface PestEntry {
  id: string;
  name: string;
  scientificName: string;
  type: "pest" | "disease";
  affectedCrops: string[];
  symptoms: string;
  standardTreatments: string;
  preventiveMeasures: string;
  referenceImages: string[];
  createdBy: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  farmerId: string;
  farmerName: string;
  cropType: string;
  description: string;
  location: string;
  imageUrls: string[]; // minimum 4 items enforced
  taggedPestId: string | null;
  taggedPestName: string | null;
  status: IncidentStatus;
  createdAt: string;
  resolvedAt: string | null;
  // AI Analysis fields (auto-populated on submission)
  aiAnalysis: AIAnalysisResult | null;
}

export interface AIAnalysisResult {
  diseaseName: string;
  severity: string;
  description: string;
  recommendedTreatment: string;
  preventiveMeasures: string;
  confidence: string;
  analyzedAt: string;
}

export interface Recommendation {
  id: string;
  incidentId: string;
  agriculturistId: string;
  agriculturistName: string;
  diagnosis: string;
  treatmentPlan: string;
  preventiveAdvice: string;
  // Whether the agriculturist used the AI draft as base
  basedOnAI: boolean;
  createdAt: string;
}

export interface Advisory {
  id: string;
  title: string;
  content: string;
  severity: Severity;
  targetRole: TargetRole;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}
```

---

## STEP 7 — Auth Context Provider

### What to do
Create file: `src/lib/auth-context.tsx`

```typescript
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
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
    if (docSnap.exists()) {
      setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    // Real-time listener on the user's profile document
    const unsubProfile = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubProfile();
  }, [firebaseUser]);

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userProfile, loading, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## STEP 8 — Root Layout and Global Styles

### What to do

#### 8A. Update `src/app/globals.css`
Replace entire file content with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 rounded-lg border border-gray-300 transition-colors duration-200;
  }
  .btn-danger {
    @apply bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200;
  }
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
  }
  .input-field {
    @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all;
  }
  .badge-pending {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800;
  }
  .badge-review {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800;
  }
  .badge-resolved {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800;
  }
}
```

#### 8B. Update `src/app/layout.tsx`
Replace entire file content with:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgriCare - Pest & Disease Reporting System",
  description:
    "Mobile-based pest and disease reporting and advisory system for farmers and agriculturists",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#333",
                color: "#fff",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## STEP 9 — Reusable UI Components

### What to do
Create the following component files:

#### 9A. Create `src/components/ui/LoadingSpinner.tsx`

```typescript
export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-green-600`}
      />
    </div>
  );
}
```

#### 9B. Create `src/components/ui/StatusBadge.tsx`

```typescript
import { IncidentStatus, UserStatus } from "@/lib/types";

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const styles = {
    pending: "badge-pending",
    under_review: "badge-review",
    resolved: "badge-resolved",
  };
  const labels = {
    pending: "Pending Review",
    under_review: "Under Review",
    resolved: "Resolved",
  };
  return <span className={styles[status]}>{labels[status]}</span>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const styles = {
    pending: "badge-pending",
    approved: "badge-resolved",
    rejected: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800",
  };
  const labels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };
  return <span className={styles[status]}>{labels[status]}</span>;
}
```

#### 9C. Create `src/components/ui/ImageUploader.tsx`

This is a CRITICAL component. It enforces the **minimum 4 photos** rule.

```typescript
"use client";

import { useState, useRef } from "react";
import { Upload, X, Camera } from "lucide-react";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  images: string[]; // base64 data URLs
  onImagesChange: (images: string[]) => void;
  minRequired?: number;
  maxAllowed?: number;
}

export default function ImageUploader({
  images,
  onImagesChange,
  minRequired = 4,
  maxAllowed = 10,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > maxAllowed) {
      toast.error(`Maximum ${maxAllowed} photos allowed`);
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onImagesChange([...images, base64]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  const isMinimumMet = images.length >= minRequired;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Upload Photos
        </label>
        <span
          className={`text-sm font-semibold ${
            isMinimumMet ? "text-green-600" : "text-red-500"
          }`}
        >
          {images.length} / {minRequired} minimum {isMinimumMet ? "✓" : "(required)"}
        </span>
      </div>

      {/* Image preview grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={img}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Add photo button */}
        {images.length < maxAllowed && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-green-600 transition-colors"
          >
            <Camera className="h-8 w-8" />
            <span className="text-xs font-medium">Add Photo</span>
          </button>
        )}
      </div>

      {!isMinimumMet && (
        <p className="text-sm text-red-500">
          ⚠ You must upload at least {minRequired} photos to submit your report.
          Take photos from different angles showing the affected areas clearly.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
```

#### 9D. Create `src/components/ui/ImageGallery.tsx`

```typescript
"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  alt?: string;
}

export default function ImageGallery({ images, alt = "Incident photo" }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const navigate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {images.map((url, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-green-500 transition-all group"
          >
            <img src={url} alt={`${alt} ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={() => navigate("prev")}
            className="absolute left-4 text-white hover:text-gray-300"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          <img
            src={images[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />

          <button
            onClick={() => navigate("next")}
            className="absolute right-4 text-white hover:text-gray-300"
          >
            <ChevronRight className="h-10 w-10" />
          </button>

          <div className="absolute bottom-4 text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
```

---

## STEP 10 — Landing Page

### What to do
Create file: `src/app/page.tsx`

Replace the default content entirely. This is the public landing page. It should:
- Show the app name "AgriCare" and a tagline about pest and disease reporting.
- Display an overview of the three user roles (Farmer, Agriculturist, Admin).
- Highlight the AI-powered analysis feature.
- Have two CTA buttons: "Register" → `/register` and "Login" → `/login`.
- Use green/agriculture themed colors, Lucide icons (`Leaf`, `Bug`, `Shield`, `Brain`).
- Be mobile-responsive.

---

## STEP 11 — Registration Page

### What to do
Create file: `src/app/(auth)/register/page.tsx`

This page must:
1. Be a `"use client"` component.
2. Show a registration form with fields:
   - Full Name (text input, required)
   - Email (email input, required)
   - Password (password input, required, min 6 characters)
   - Confirm Password (must match password)
   - Contact Number (text input, required)
   - Farm Location / Address (text input, required)
   - Role Selection: Radio buttons or select for `farmer` or `agriculturist` (NOT admin — admin accounts are seeded separately)
3. On submit:
   - Call `createUserWithEmailAndPassword(auth, email, password)` from Firebase Auth.
   - Create a Firestore document in `users` collection with the UID as document ID:
     ```typescript
     {
       id: user.uid,
       fullName,
       email,
       role: selectedRole, // "farmer" or "agriculturist"
       status: "pending",  // CRITICAL: always starts as pending
       contactNumber,
       farmLocation,
       createdAt: new Date().toISOString(),
     }
     ```
   - Redirect to `/pending-approval` page.
4. Show loading state during submission.
5. Handle and display errors (e.g., email already exists).
6. Include a link: "Already have an account? Login" → `/login`.

---

## STEP 12 — Login Page

### What to do
Create file: `src/app/(auth)/login/page.tsx`

This page must:
1. Be a `"use client"` component.
2. Show a login form with Email and Password fields.
3. On submit:
   - Call `signInWithEmailAndPassword(auth, email, password)`.
   - Fetch the user's profile from Firestore: `getDoc(doc(db, "users", user.uid))`.
   - **CHECK STATUS**:
     - If `status === "pending"` → redirect to `/pending-approval`.
     - If `status === "rejected"` → show error "Your account has been rejected. Contact the administrator."
     - If `status === "approved"`:
       - If `role === "admin"` → redirect to `/admin`
       - If `role === "agriculturist"` → redirect to `/agriculturist`
       - If `role === "farmer"` → redirect to `/farmer`
4. Handle errors (wrong password, user not found, etc.).
5. Include a link: "Don't have an account? Register" → `/register`.

---

## STEP 13 — Pending Approval Page

### What to do
Create file: `src/app/(auth)/pending-approval/page.tsx`

This page must:
1. Be a `"use client"` component.
2. Show a friendly message: "Your account is pending approval. An administrator will review your registration shortly."
3. Display a clock/waiting icon (use Lucide `Clock` or `Hourglass`).
4. Use `useAuth()` hook to listen for real-time profile updates.
5. When `userProfile.status` changes to `"approved"`, automatically redirect to the appropriate dashboard based on role.
6. Include a "Sign Out" button that calls `signOut(auth)` and redirects to `/login`.

---

## STEP 14 — Navigation Components

### What to do

#### 14A. Create `src/components/layout/Navbar.tsx`

A responsive top navigation bar that:
- Shows the app logo/name "AgriCare" on the left.
- Shows the user's name and role on the right.
- Includes a notification bell icon (links to notification system in Step 26).
- Has a mobile hamburger menu.
- Shows navigation links based on user role:
  - **Farmer**: Dashboard, Report Incident, My Incidents, Advisories
  - **Agriculturist**: Dashboard, Incident Queue
  - **Admin**: Dashboard, Users, Pest Database, Advisories
- Has a "Sign Out" button/link.

#### 14B. Create `src/components/layout/DashboardLayout.tsx`

A wrapper layout component that:
- Includes the `Navbar`.
- Accepts `children` and renders them in a container.
- Checks auth state: if not logged in, redirect to `/login`. If not approved, redirect to `/pending-approval`.
- Shows a `LoadingSpinner` while auth state is loading.

---

## STEP 15 — Farmer Dashboard

### What to do
Create file: `src/app/farmer/page.tsx`

This page must:
1. Use the `DashboardLayout` wrapper.
2. Verify `userProfile.role === "farmer"` — if not, redirect away.
3. Show summary stat cards:
   - Total reports submitted (count from Firestore where `farmerId === currentUser.uid`).
   - Pending reports (status === "pending").
   - Resolved reports (status === "resolved").
4. Show a prominent button: "+ Report New Incident" → `/farmer/report`.
5. Show a list/table of the farmer's recent incidents (latest 10) with:
   - Crop type
   - Status badge (use `IncidentStatusBadge`)
   - Date submitted
   - Click → `/farmer/incident/[id]`
6. Query Firestore: `collection(db, "incidents")` where `farmerId == auth.currentUser.uid`, ordered by `createdAt desc`.

---

## STEP 16 — Farmer Report Incident Page

### What to do
Create file: `src/app/farmer/report/page.tsx`

This is a CRITICAL page. It must:

1. Use the `DashboardLayout` wrapper.
2. Show a form with:
   - **Crop Type**: Dropdown/select with options: Rice, Corn, Vegetables, Fruit Trees, Root Crops, Legumes, Other (with text input if Other).
   - **Description**: Textarea — "Describe what you observe: discoloration, spots, wilting, insects, etc."
   - **Location**: Text input for farm location (Barangay, Municipality).
   - **Photo Upload**: Use the `ImageUploader` component from Step 9C. **Minimum 4 photos required.**
3. **Submit button**: MUST be **disabled** until:
   - All required text fields are filled.
   - `images.length >= 4` (the minimum photo rule).
4. On submit:
   - Show a loading overlay with message: "Uploading images and running AI analysis..."
   - Upload each image to **Supabase Storage** under path `incidents/{incidentId}/img_{index}.jpg` (limit each file to **5MB or less**), then store the returned public URL in Firestore.
   - Call the Gemini AI analysis function (from `src/lib/gemini.ts`) passing the base64 images, crop type, and description.
   - Create a Firestore document in `incidents` collection:
     ```typescript
     {
       id: generatedId,
       farmerId: auth.currentUser.uid,
       farmerName: userProfile.fullName,
       cropType,
       description,
       location,
       imageUrls: downloadUrls, // array of Supabase Storage public URLs
       taggedPestId: null,
       taggedPestName: null,
       status: "pending",
       createdAt: new Date().toISOString(),
       resolvedAt: null,
       aiAnalysis: {
         diseaseName: aiResult.diseaseName,
         severity: aiResult.severity,
         description: aiResult.description,
         recommendedTreatment: aiResult.recommendedTreatment,
         preventiveMeasures: aiResult.preventiveMeasures,
         confidence: aiResult.confidence,
         analyzedAt: new Date().toISOString(),
       },
     }
     ```
   - Show success toast: "Incident reported successfully! An agriculturist will review it soon."
   - Redirect to `/farmer`.

---

## STEP 17 — AI Analysis API Route (Optional Server-Side Alternative)

### What to do
Create file: `src/app/api/analyze/route.ts`

This is an OPTIONAL server-side API route if you want to keep the Gemini API key secret (not exposed via `NEXT_PUBLIC_`). If using the client-side approach from Step 16, you may skip this. But for best practice, create it:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const { images, cropType, description } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert agricultural plant pathologist AI assistant. Analyze the following images of a ${cropType} plant that a farmer has reported.

The farmer describes the problem as: "${description}"

IMPORTANT INSTRUCTIONS:
- Identify ONLY the disease or pest problem visible in the images.
- Do NOT identify the plant species (the farmer already told you it is ${cropType}).
- If you cannot identify a specific disease, say "Unidentified condition - requires expert inspection".
- Be practical and actionable for small-scale farmers.

Respond STRICTLY in this JSON format (no markdown, no code fences, just raw JSON):
{
  "diseaseName": "Name of the identified disease or pest",
  "severity": "Low | Moderate | High | Critical",
  "description": "Brief description of the disease/pest and how it affects the plant",
  "recommendedTreatment": "Step-by-step treatment instructions",
  "preventiveMeasures": "Preventive steps to avoid recurrence",
  "confidence": "Low | Medium | High"
}`;

    const imageParts = images.map((base64: string) => {
      const match = base64.match(/^data:(image\/\w+);base64,(.+)$/);
      return {
        inlineData: {
          mimeType: match ? match[1] : "image/jpeg",
          data: match ? match[2] : base64,
        },
      };
    });

    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text();
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI Analysis error:", error);
    return NextResponse.json({
      diseaseName: "Analysis Failed",
      severity: "Unknown",
      description: "AI analysis could not be completed. Manual review required.",
      recommendedTreatment: "Awaiting manual review.",
      preventiveMeasures: "N/A",
      confidence: "Low",
    });
  }
}
```

> If using this API route, update Step 16 to call `fetch("/api/analyze", { method: "POST", body: JSON.stringify({ images, cropType, description }) })` instead of calling `analyzePlantDisease()` directly.
> Also add a non-public env var `GEMINI_API_KEY` to `.env.local` (without `NEXT_PUBLIC_` prefix) for server-side use.

---

## STEP 18 — Farmer Incident Detail Page

### What to do
Create file: `src/app/farmer/incident/[id]/page.tsx`

This page must:
1. Use `DashboardLayout`.
2. Read the incident ID from the URL params.
3. Fetch the incident document from Firestore: `getDoc(doc(db, "incidents", id))`.
4. Verify `incident.farmerId === currentUser.uid` (farmers can only see their own incidents).
5. Display:
   - Incident status badge at the top.
   - Crop type, description, location, date submitted.
   - **Photo gallery**: Use `ImageGallery` component from Step 9D to display all uploaded photos with lightbox zoom.
   - **AI Analysis Section** (if `aiAnalysis` exists):
     - Show a card titled "🤖 AI Preliminary Analysis" with:
       - Disease Name & Confidence level
       - Severity indicator (color-coded)
       - Description
       - Suggested treatment
       - Note: "This is an automated analysis. An agriculturist will verify and provide the final recommendation."
   - **Agriculturist Recommendation** (if incident is resolved):
     - Query Firestore `recommendations` collection where `incidentId === id`.
     - Show the final diagnosis, treatment plan, and preventive advice.
     - Show the agriculturist's name and date.
6. If no recommendation yet, show: "Your report is being reviewed. You will be notified when a recommendation is available."

---

## STEP 19 — Farmer Advisories Page

### What to do
Create file: `src/app/farmer/advisories/page.tsx`

This page must:
1. Use `DashboardLayout`.
2. Query Firestore `advisories` collection where `targetRole` is `"all"` or `"farmer"`, ordered by `createdAt desc`.
3. Display advisory cards with:
   - Title
   - Severity badge (Info = blue, Warning = yellow, Urgent = red)
   - Content text
   - Published date
4. If no advisories, show: "No advisories at this time."

---

## STEP 20 — Agriculturist Dashboard / Incident Queue

### What to do
Create file: `src/app/agriculturist/page.tsx`

This page must:
1. Use `DashboardLayout`.
2. Verify `userProfile.role === "agriculturist"`.
3. Show summary stats:
   - Total pending cases (status === "pending").
   - Cases under review.
   - Resolved cases.
4. Show the full incident queue as a list/table:
   - Query ALL incidents from Firestore (`collection(db, "incidents")`), ordered by `createdAt desc`.
   - Display: Farmer name, crop type, location, date, status badge, and a **thumbnail of the first image**.
   - Each row/card clickable → `/agriculturist/incident/[id]`.
5. Include tab filters: "All", "Pending", "Under Review", "Resolved".

---

## STEP 21 — Agriculturist Case Review Page

### What to do
Create file: `src/app/agriculturist/incident/[id]/page.tsx`

This is a CRITICAL page. It must:

1. Use `DashboardLayout`.
2. Fetch the incident from Firestore by ID.
3. Display two main sections side by side on desktop, stacked on mobile:

**Left/Top Section — Farmer Report:**
- Farmer name, crop type, location, date, description.
- **Full photo gallery** with lightbox (use `ImageGallery` component). The agriculturist needs to zoom into each photo to inspect pest/disease symptoms.

**Right/Bottom Section — Diagnosis & Recommendation:**

4. Show the **AI Analysis Draft** in an outlined card:
   - Title: "🤖 AI Analysis (Auto-Generated Draft)"
   - Display: `aiAnalysis.diseaseName`, `aiAnalysis.severity`, `aiAnalysis.description`, `aiAnalysis.recommendedTreatment`, `aiAnalysis.preventiveMeasures`, `aiAnalysis.confidence`.
   - A button: "Use AI Draft as Starting Point" — pre-fills the recommendation form below with AI values.

5. Show a **Pest Database Tagging** dropdown:
   - Fetch all entries from `pest_database` collection.
   - Autocomplete/searchable dropdown to select the matching pest or disease.
   - On selection, display the matched entry's symptoms and standard treatments as reference (read-only).

6. Show the **Recommendation Form**:
   - **Diagnosis** (textarea, pre-fillable from AI draft or pest database).
   - **Treatment Plan** (textarea, pre-fillable from AI draft).
   - **Preventive Advice** (textarea, pre-fillable from AI draft).
   - A checkbox: "Based on AI analysis" (auto-checked if pre-filled from AI).

7. **Submit Recommendation** button:
   - Creates a document in `recommendations` collection:
     ```typescript
     {
       id: generatedId,
       incidentId: incident.id,
       agriculturistId: currentUser.uid,
       agriculturistName: userProfile.fullName,
       diagnosis,
       treatmentPlan,
       preventiveAdvice,
       basedOnAI: isBasedOnAI,
       createdAt: new Date().toISOString(),
     }
     ```
   - Updates the incident document:
     ```typescript
     {
       status: "resolved",
       taggedPestId: selectedPest?.id || null,
       taggedPestName: selectedPest?.name || null,
       resolvedAt: new Date().toISOString(),
     }
     ```
   - Creates a notification for the farmer:
     ```typescript
     {
       id: generatedId,
       recipientId: incident.farmerId,
       title: "Recommendation Received",
       message: `Your incident report for ${incident.cropType} has been reviewed. Diagnosis: ${diagnosis}`,
       link: `/farmer/incident/${incident.id}`,
       read: false,
       createdAt: new Date().toISOString(),
     }
     ```
   - Show success toast and redirect to `/agriculturist`.

8. If the incident already has a recommendation (status === "resolved"), show the existing recommendation in read-only mode instead of the form.

---

## STEP 22 — Admin Dashboard

### What to do
Create file: `src/app/admin/page.tsx`

This page must:
1. Use `DashboardLayout`.
2. Verify `userProfile.role === "admin"`.
3. Show analytics cards:
   - Total users (count of `users` collection).
   - Pending registrations (users where `status === "pending"`).
   - Total incidents reported.
   - Resolved incidents.
   - Pests/Diseases in database.
4. Show quick-action links:
   - "Manage Users" → `/admin/users`
   - "Pest Database" → `/admin/pests`
   - "Publish Advisory" → `/admin/advisories`

---

## STEP 23 — Admin User Management Page

### What to do
Create file: `src/app/admin/users/page.tsx`

This page must:
1. Use `DashboardLayout`.
2. Query ALL users from Firestore `users` collection, ordered by `createdAt desc`.
3. Show tab filters: "Pending", "Approved", "Rejected", "All".
4. Display each user as a card or table row:
   - Full name, email, role, contact number, farm location, registration date, status badge.
5. For **pending** users, show two action buttons:
   - **Approve** (green button): Updates `status` to `"approved"` in Firestore. Creates a notification for the user: "Your account has been approved! You can now log in."
   - **Reject** (red button): Updates `status` to `"rejected"` in Firestore.
6. For already approved/rejected users, show the status badge but no action buttons (or optionally allow toggling).

---

## STEP 24 — Admin Pest Database Manager

### What to do
Create file: `src/app/admin/pests/page.tsx`

This page must:
1. Use `DashboardLayout`.
2. Query all entries from `pest_database` collection.
3. Display them in a searchable list/grid with: name, scientific name, type (pest/disease), affected crops.
4. Include a "+ Add New Entry" button that opens a form (modal or inline) with fields:
   - Name (e.g., "Fall Armyworm")
   - Scientific Name (e.g., "Spodoptera frugiperda")
   - Type: Select `pest` or `disease`
   - Affected Crops: Multi-input or comma-separated (e.g., "Rice, Corn")
   - Symptoms (textarea)
   - Standard Treatments (textarea)
   - Preventive Measures (textarea)
   - Reference Images (optional file upload to Supabase Storage)
5. Save creates a document in `pest_database` collection.
6. Each existing entry should have an **Edit** button to update and a **Delete** button to remove.

---

## STEP 25 — Admin Advisories Publisher

### What to do
Create file: `src/app/admin/advisories/page.tsx`

This page must:
1. Use `DashboardLayout`.
2. Show a list of previously published advisories (from `advisories` collection, ordered by `createdAt desc`).
3. Include a "+ Publish New Advisory" button that shows a form:
   - Title (text input)
   - Content (textarea — the advisory message body)
   - Severity: Select from `info`, `warning`, `urgent`
   - Target Audience: Select from `all`, `farmer`, `agriculturist`
4. On submit, create a document in `advisories` collection:
   ```typescript
   {
     id: generatedId,
     title,
     content,
     severity,
     targetRole,
     authorId: currentUser.uid,
     authorName: userProfile.fullName,
     createdAt: new Date().toISOString(),
   }
   ```
5. Optionally create notifications for all targeted users.
6. Show success toast.

---

## STEP 26 — Notification System

### What to do

#### 26A. Create `src/components/notifications/NotificationBell.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Notification } from "@/lib/types";

export default function NotificationBell() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Notification)
      );
      setNotifications(notifs);
    });

    return () => unsub();
  }, [firebaseUser]);

  const markAsRead = async (notifId: string) => {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }))
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-green-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 20).map((notif) => (
              <a
                key={notif.id}
                href={notif.link}
                onClick={() => {
                  markAsRead(notif.id);
                  setShowDropdown(false);
                }}
                className={`block p-3 border-b border-gray-50 hover:bg-gray-50 ${
                  !notif.read ? "bg-green-50" : ""
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </p>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

Integrate `NotificationBell` into the `Navbar` component from Step 14A (place it next to the user's name).

---

## STEP 27 — Middleware and Route Protection

### What to do
Create file: `src/middleware.ts` (in the `src` root, NOT inside `app`)

> **NOTE**: Firebase Auth does not work natively in Next.js middleware (Edge Runtime). Instead, implement client-side route guards inside the `DashboardLayout` component from Step 14B.

The `DashboardLayout` component MUST enforce these rules:
1. If `loading` is true → show `LoadingSpinner`.
2. If `firebaseUser` is null → redirect to `/login`.
3. If `userProfile.status !== "approved"` → redirect to `/pending-approval`.
4. Each role-specific page must also check `userProfile.role` matches the expected role.

Optionally, create a simple Next.js middleware that redirects unauthenticated requests to `/login` for protected paths, using a cookie check:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/pending-approval"];
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith("/api"))) {
    return NextResponse.next();
  }

  // For protected routes, we rely on client-side auth checks in DashboardLayout.
  // This middleware is a lightweight first layer.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## STEP 28 — Seed Admin Account Script

### What to do
Create file: `src/scripts/seed-admin.ts`

This is a one-time utility script to create the first admin account. Provide instructions in the README:

```typescript
/**
 * SEED ADMIN ACCOUNT
 *
 * Usage:
 * 1. Register a new account through the web app at /register (choose any role).
 * 2. Open Firebase Console > Firestore > users collection.
 * 3. Find the document for the account you just registered.
 * 4. Change the "role" field to "admin".
 * 5. Change the "status" field to "approved".
 * 6. Log out and log back in. You will be redirected to the Admin dashboard.
 *
 * Alternatively, create the user document directly in Firestore Console:
 * Document ID: (copy the UID from Firebase Auth)
 * Fields:
 *   fullName: "System Administrator"
 *   email: "admin@agricare.com"
 *   role: "admin"
 *   status: "approved"
 *   contactNumber: ""
 *   farmLocation: ""
 *   createdAt: (current ISO timestamp)
 */
```

Also add this instruction to the project's `README.md`.

---

## STEP 29 — Final Verification

### What to do
After completing ALL steps above, verify the application works:

#### Build Check
```bash
npm run build
```
Must complete with NO errors. Fix any TypeScript or build errors.

#### Dev Server Test
```bash
npm run dev
```

#### Manual Test Checklist

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Open `http://localhost:3000` | Landing page loads with Register/Login buttons |
| 2 | Click Register, fill form as Farmer, submit | Account created, redirected to Pending Approval page |
| 3 | Go to Firebase Console, manually set admin account (Step 28) | Admin account ready |
| 4 | Login as Admin | Admin dashboard loads |
| 5 | Admin → Users → Approve the Farmer account | Farmer status changes to "approved" |
| 6 | Login as Farmer | Farmer dashboard loads |
| 7 | Farmer → Report New Incident → Fill form with 3 photos | Submit button remains DISABLED |
| 8 | Add 4th photo | Submit button becomes ENABLED |
| 9 | Submit incident | AI analysis runs, incident saved, redirected to dashboard |
| 10 | Register as Agriculturist, get approved by Admin | Agriculturist can log in |
| 11 | Agriculturist → Incident Queue | Farmer's incident appears in the queue |
| 12 | Agriculturist → Open incident → See photos + AI draft | AI analysis card is visible with disease info |
| 13 | Click "Use AI Draft as Starting Point" | Recommendation form pre-fills with AI values |
| 14 | Edit recommendation and submit | Incident status → Resolved, notification created |
| 15 | Login as Farmer → Check notification bell | Unread notification appears with recommendation link |
| 16 | Farmer → Click notification → View recommendation | Full recommendation with diagnosis and treatment visible |
| 17 | Admin → Pest Database → Add new pest entry | Entry saved and visible in list |
| 18 | Admin → Advisories → Publish advisory | Advisory appears on Farmer's advisories page |

---

## Firestore Security Rules (Production)

Before deploying to production, set up proper Firestore security rules. For development, use test mode. For production:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || getUserRole() == 'admin');
      allow write: if request.auth != null && getUserRole() == 'admin';
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    // Incidents
    match /incidents/{incidentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && isApproved();
      allow update: if request.auth != null && (getUserRole() == 'agriculturist' || getUserRole() == 'admin');
    }

    // Recommendations
    match /recommendations/{recId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && getUserRole() == 'agriculturist';
    }

    // Advisories
    match /advisories/{advId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && getUserRole() == 'admin';
    }

    // Notifications
    match /notifications/{notifId} {
      allow read: if request.auth != null && resource.data.recipientId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.recipientId == request.auth.uid;
    }

    // Pest Database
    match /pest_database/{pestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && getUserRole() == 'admin';
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isApproved() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
    }
  }
}
```

---

## Firestore Indexes Required

Create these composite indexes in Firebase Console > Firestore > Indexes:

| Collection | Fields | Order |
|------------|--------|-------|
| `incidents` | `farmerId` ASC, `createdAt` DESC | |
| `incidents` | `status` ASC, `createdAt` DESC | |
| `notifications` | `recipientId` ASC, `createdAt` DESC | |
| `advisories` | `targetRole` ASC, `createdAt` DESC | |
| `users` | `status` ASC, `createdAt` DESC | |

> **TIP**: These indexes will also be auto-prompted by Firebase when you first run queries that need them. Just click the link in the browser console error message.

---

## README.md Content

Create or update `README.md` in the project root with:

```markdown
# AgriCare — Mobile-Based Pest and Disease Reporting and Advisory System

## Quick Start

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Firebase and Gemini API keys
4. Run `npm run dev`
5. Open http://localhost:3000

## Setting Up the First Admin Account

1. Register a new account through the web app
2. Open Firebase Console > Firestore > `users` collection
3. Find your user document and change `role` to `"admin"` and `status` to `"approved"`
4. Log out and log back in — you will be redirected to the Admin dashboard

## Tech Stack

- Next.js 14+ (App Router, TypeScript)
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)
- Google Gemini AI (plant disease analysis)
- Vercel (deployment)

## Environment Variables

See `.env.example` for required variables.
```

---

> **END OF TASK DOCUMENT**. Follow every step sequentially. Do NOT skip steps. Every step depends on previous steps being completed. After completing all 29 steps, run the verification checklist in Step 29.

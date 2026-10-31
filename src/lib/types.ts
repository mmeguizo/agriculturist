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

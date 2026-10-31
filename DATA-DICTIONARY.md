# AgriCare — Data Dictionary

Database: Cloud Firestore (NoSQL) for text/data + Supabase Storage for incident images.
All timestamps are ISO-8601 strings (`createdAt`, `updatedAt`, `resolvedAt`, `analyzedAt`).

---

## `users`

Stores every account (admin, agriculturist, farmer). The Firestore document ID is the Firebase Auth UID.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Primary key / Firebase Auth UID (document ID). |
| `fullName` | string | Yes | Full name of the user. |
| `email` | string | Yes | Email address used for login. |
| `role` | string | Yes | `admin` \| `agriculturist` \| `farmer`. |
| `status` | string | Yes | `pending` \| `approved` \| `rejected`. |
| `contactNumber` | string | No | Contact phone number. |
| `farmLocation` | string | No | Barangay / municipality / station. |
| `createdAt` | string | Yes | ISO timestamp when the account was created. |

---

## `incidents`

Stores farmer-submitted pest/disease incident reports. The `aiAnalysis` object is embedded.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Primary key (UUID). |
| `farmerId` | string | Yes | References `users.id` (the reporting farmer). |
| `farmerName` | string | Yes | Denormalized farmer display name. |
| `cropType` | string | Yes | Crop affected (e.g., Rice, Corn). |
| `description` | string | Yes | Farmer's description of symptoms. |
| `location` | string | No | Farm location / GPS / barangay. |
| `imageUrls` | string[] | Yes | Supabase Storage public/signed URLs or inline `data:` fallbacks (minimum 4). |
| `taggedPestId` | string \| null | No | References `pest_database.id` once classified. |
| `taggedPestName` | string \| null | No | Denormalized pest/disease name. |
| `status` | string | Yes | `pending` \| `under_review` \| `resolved`. |
| `createdAt` | string | Yes | ISO timestamp when the report was filed. |
| `resolvedAt` | string \| null | No | ISO timestamp when resolved. |
| `aiAnalysis` | object \| null | No | Embedded AI result (see below). |

### `incidents.aiAnalysis` (embedded object)

| Field | Type | Description |
|---|---|---|
| `diseaseName` | string | AI-identified pest/disease (plant NOT identified). |
| `severity` | string | Severity assessment (e.g., Low, Moderate, Severe). |
| `description` | string | AI description of symptoms/analysis. |
| `recommendedTreatment` | string | AI draft treatment recommendations. |
| `preventiveMeasures` | string | AI draft preventive measures. |
| `confidence` | string | AI confidence level (e.g., Low, Moderate, High). |
| `analyzedAt` | string | ISO timestamp of the AI scan. |

---

## `recommendations`

Stores the agriculturist's official recommendation. One per incident.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Primary key (UUID). |
| `incidentId` | string | Yes | References `incidents.id`. |
| `agriculturistId` | string | Yes | References `users.id` of the agriculturist. |
| `agriculturistName` | string | Yes | Denormalized agriculturist display name. |
| `diagnosis` | string | Yes | Official diagnosis / tagged pest-disease. |
| `treatmentPlan` | string | Yes | Chemical/organic treatment and control plan. |
| `preventiveAdvice` | string | No | Cultural practices and prevention measures. |
| `purchaseRecommendation` | string | No | Products/chemicals recommended to buy. |
| `basedOnAI` | boolean | Yes | Whether the AI draft was used as the base. |
| `confidence` | string | No | Captured AI confidence level. |
| `createdAt` | string | Yes | ISO timestamp when submitted. |

---

## `pest_database`

Official pest and disease knowledge base maintained by admins.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Primary key. |
| `name` | string | Yes | Common name (e.g., Fall Armyworm). |
| `scientificName` | string | Yes | Scientific name. |
| `type` | string | Yes | `pest` \| `disease`. |
| `affectedCrops` | string[] | No | Crops affected. |
| `symptoms` | string | No | Characteristic symptoms. |
| `standardTreatments` | string | No | Standard treatment options. |
| `preventiveMeasures` | string | No | Preventive/cultural practices. |
| `referenceImages` | string[] | No | Reference image URLs. |
| `createdBy` | string | No | References `users.id` (admin). |
| `updatedAt` | string | Yes | ISO timestamp of last update. |

---

## `advisories`

Community-wide or targeted agricultural alerts published by admins.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Primary key. |
| `title` | string | Yes | Advisory title. |
| `content` | string | Yes | Advisory message body. |
| `severity` | string | Yes | `info` \| `warning` \| `urgent`. |
| `targetRole` | string | Yes | `all` \| `farmer` \| `agriculturist`. |
| `authorId` | string | Yes | References `users.id` (admin). |
| `authorName` | string | Yes | Denormalized author name. |
| `createdAt` | string | Yes | ISO timestamp when published. |

---

## `notifications`

In-app notifications delivered to users.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Primary key (UUID). |
| `recipientId` | string | Yes | References `users.id` of the recipient. |
| `title` | string | Yes | Notification title. |
| `message` | string | Yes | Notification body text. |
| `link` | string | No | Deep link to the related page. |
| `read` | boolean | Yes | Whether the user has read it. |
| `createdAt` | string | Yes | ISO timestamp when created. |

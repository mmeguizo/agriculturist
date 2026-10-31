// One-time utility to seed a Firestore `users/{uid}` document.
// The document ID must be the Firebase Auth UID (copy it from
// Firebase Console > Authentication > Users).
//
// Usage:
//   node scripts/seed-user.mjs <uid> <email> <fullName> <role> [farmLocation] [contactNumber]
//
// Reads Firebase config from the project `.env`.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

function loadEnvFile(path) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (e) {
    console.error("Could not read .env:", e.message);
  }
}

loadEnvFile(resolve(root, ".env"));

const [uid, email, fullName, role, farmLocation = "", contactNumber = ""] =
  process.argv.slice(2);

if (!uid || !email || !fullName || !role) {
  console.error(
    "Usage: node scripts/seed-user.mjs <uid> <email> <fullName> <role> [farmLocation] [contactNumber]"
  );
  process.exit(1);
}

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

const profile = {
  fullName,
  email,
  role,
  status: "approved",
  contactNumber,
  farmLocation,
  createdAt: new Date().toISOString(),
};

try {
  await setDoc(doc(db, "users", uid), profile);
  console.log(`Seeded Firestore document: users/${uid}`);

  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    console.log("VERIFIED:");
    console.log(JSON.stringify({ id: snap.id, ...snap.data() }, null, 2));
  } else {
    console.warn("WARNING: write succeeded but read-back returned no document.");
  }
} catch (err) {
  console.error("Seed failed:", err?.message || err);
  process.exit(1);
}

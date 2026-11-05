import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "screenshots");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// -------------------------------------------------------------
// Realistic Mock / Seed Data for High Quality Documentation Screenshots
// -------------------------------------------------------------
const sampleUsers = [
  {
    id: "demo-farmer-id",
    fullName: "Pedro Penduko",
    email: "pedro.farmer@gmail.com",
    role: "farmer",
    status: "approved",
    contactNumber: "0917 888 9999",
    farmLocation: "Brgy. Malabanban, Candelaria, Quezon",
    createdAt: "2026-10-15T08:00:00.000Z",
  },
  {
    id: "demo-agri-id",
    fullName: "Maria Santos (Agriculturist)",
    email: "maria.agri@agricare.gov.ph",
    role: "agriculturist",
    status: "approved",
    contactNumber: "0918 234 5678",
    farmLocation: "Municipal Agriculture Office, Candelaria",
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  {
    id: "demo-admin-id",
    fullName: "Chief Agronomist Admin",
    email: "admin@agricare.gov.ph",
    role: "admin",
    status: "approved",
    contactNumber: "(02) 8928-8741",
    farmLocation: "Central Agricultural Bureau",
    createdAt: "2026-10-01T07:30:00.000Z",
  },
  {
    id: "pending-farmer-1",
    fullName: "Juan Dela Cruz",
    email: "juan.delacruz@agrimail.ph",
    role: "farmer",
    status: "pending",
    contactNumber: "0920 123 4567",
    farmLocation: "Brgy. Masalukot I, Candelaria, Quezon",
    createdAt: "2026-11-04T14:20:00.000Z",
  },
  {
    id: "pending-agri-2",
    fullName: "Elena Morales, BSA",
    email: "elena.morales@provincial.gov.ph",
    role: "agriculturist",
    status: "pending",
    contactNumber: "0919 765 4321",
    farmLocation: "Quezon Agricultural Research Experiment Station",
    createdAt: "2026-11-05T08:15:00.000Z",
  },
];

const sampleIncidents = [
  {
    id: "INC-2026-081",
    farmerId: "demo-farmer-id",
    farmerName: "Pedro Penduko",
    cropType: "Rice (Palay)",
    description:
      "Noticed spindle-shaped lesions on upper leaves with grayish necrotic centers. Leaf tips are wilting and several tillers show early collar rot symptoms.",
    location: "Brgy. Malabanban, Candelaria, Quezon (Lat: 13.92810, Lng: 121.42310)",
    status: "resolved",
    imageUrls: [
      "/demo-assets/rice-blast-1.svg",
      "/demo-assets/rice-blast-2.svg",
      "/demo-assets/rice-blast-3.svg",
      "/demo-assets/rice-blast-4.svg",
    ],
    aiAnalysis: {
      diseaseName: "Rice Blast (Magnaporthe oryzae)",
      severity: "High",
      confidence: "94.8% (Gemini Vision 2.5)",
      recommendedAction:
        "Apply systemic fungicide (e.g. Tricyclazole or Azoxystrobin) during early morning or late afternoon. Suspend nitrogen top-dressing immediately and ensure field is drained to reduce canopy humidity.",
    },
    createdAt: "2026-11-03T09:15:00.000Z",
  },
  {
    id: "INC-2026-082",
    farmerId: "demo-farmer-id",
    farmerName: "Pedro Penduko",
    cropType: "Corn (Mais)",
    description:
      "Observed ragged holes on whorl leaves and extensive frass droppings. Early instar larvae active inside young corn whorls.",
    location: "Brgy. Masalukot, Candelaria, Quezon (Lat: 13.91420, Lng: 121.41100)",
    status: "pending",
    imageUrls: [
      "/demo-assets/rice-blast-1.svg",
      "/demo-assets/rice-blast-2.svg",
      "/demo-assets/rice-blast-3.svg",
      "/demo-assets/rice-blast-4.svg",
    ],
    aiAnalysis: {
      diseaseName: "Fall Armyworm (Spodoptera frugiperda)",
      severity: "High",
      confidence: "91.2% (Gemini Vision 2.5)",
      recommendedAction:
        "Apply biological insecticide such as Bacillus thuringiensis (Bt) or spinosad directly into the whorl. Deploy pheromone traps across borders to monitor adult moth densities.",
    },
    createdAt: "2026-11-04T11:45:00.000Z",
  },
  {
    id: "INC-2026-083",
    farmerId: "demo-farmer-id",
    farmerName: "Pedro Penduko",
    cropType: "Vegetables (Gulayan)",
    description:
      "Sudden wilting of tomato vines while leaves remain green. Stem cross-section placed in water exhibits white bacterial streaming.",
    location: "Brgy. Bukal, Sariaya, Quezon (Lat: 13.96200, Lng: 121.51900)",
    status: "under_review",
    imageUrls: [
      "/demo-assets/rice-blast-1.svg",
      "/demo-assets/rice-blast-2.svg",
      "/demo-assets/rice-blast-3.svg",
      "/demo-assets/rice-blast-4.svg",
    ],
    aiAnalysis: {
      diseaseName: "Bacterial Wilt (Ralstonia solanacearum)",
      severity: "Medium",
      confidence: "88.6% (Gemini Vision 2.5)",
      recommendedAction:
        "Rogue out infected plants immediately and bag them to prevent soil transmission. Avoid furrow irrigation through infected rows and rotate with non-solanaceous crops.",
    },
    createdAt: "2026-11-05T07:20:00.000Z",
  },
];

const sampleRecommendations = [
  {
    id: "rec-2026-001",
    incidentId: "INC-2026-081",
    agriculturistId: "demo-agri-id",
    agriculturistName: "Maria Santos (Agriculturist)",
    identifiedPest: "Rice Blast (Magnaporthe oryzae)",
    treatmentPlan:
      "Verified diagnosis: Foliar Rice Blast. Spray Tricyclazole 75% WP at 10-12g per 16L knapsack sprayer. Conduct follow-up treatment after 7 days if weather remains overcast. Coordinate with your barangay agricultural coordinator for free fungicide allocation.",
    preventiveMeasures:
      "Avoid excessive split applications of Urea nitrogen. Maintain 2-3cm shallow water level in paddy and avoid drought stress which exacerbates fungal penetration.",
    isApproved: true,
    createdAt: "2026-11-03T14:30:00.000Z",
  },
];

const samplePests = [
  {
    id: "pest-001",
    name: "Rice Blast",
    scientificName: "Magnaporthe oryzae",
    type: "disease",
    affectedCrops: ["Rice (Palay)"],
    symptoms:
      "Spindle-shaped or diamond-shaped lesions with gray/whitish centers and dark brown margins. Rapid blighting under high humidity.",
    standardTreatments:
      "Foliar application of Tricyclazole 75% WP, Azoxystrobin, or Isoprothiolane. Suspend high-dose Nitrogen fertilizers.",
    preventiveMeasures:
      "Plant certified blast-resistant seed varieties (e.g. NSIC Rc222). Optimize plant spacing to avoid dense canopy humidity.",
  },
  {
    id: "pest-002",
    name: "Fall Armyworm (FAW)",
    scientificName: "Spodoptera frugiperda",
    type: "pest",
    affectedCrops: ["Corn (Mais)", "Sorghum", "Rice (Palay)"],
    symptoms:
      "Window pane feeding damage, ragged pinholes in leaf whorls, prominent moist yellowish-brown sawdust-like frass.",
    standardTreatments:
      "Apply Bacillus thuringiensis (Bt kurstaki), Spinetoram, or Chlorantraniliprole targeted directly into the whorl cup.",
    preventiveMeasures:
      "Synchronous planting across neighboring parcels. Regular weekly field scouting during vegetative V2-V6 stages.",
  },
  {
    id: "pest-003",
    name: "Bacterial Leaf Blight (BLB)",
    scientificName: "Xanthomonas oryzae pv. oryzae",
    type: "disease",
    affectedCrops: ["Rice (Palay)"],
    symptoms:
      "Water-soaked to yellowish stripes along leaf margins with wavy borders that turn bleached white with amber bacterial beads.",
    standardTreatments:
      "Apply copper hydroxide or copper oxychloride at initial lesion detection. Ensure paddies are thoroughly drained.",
    preventiveMeasures:
      "Avoid field trimming of seedling tips during transplanting. Sterilize farm tools between adjacent paddies.",
  },
  {
    id: "pest-004",
    name: "Brown Planthopper (BPH)",
    scientificName: "Nilaparvata lugens",
    type: "pest",
    affectedCrops: ["Rice (Palay)"],
    symptoms:
      "Hopperburn patches of circular drying and wilting plants turning yellow then straw-colored. Honeydew secretion leading to sooty mold.",
    standardTreatments:
      "Drain field water to ground surface level. Apply pymetrozine or buprofezin targeting plant bases. Avoid broad-spectrum pyrethroids which wipe out wolf spider predators.",
    preventiveMeasures:
      "Alternate wetting and drying (AWD) water management. Conserve natural predators such as spiders and mirid bugs.",
  },
];

const sampleAdvisories = [
  {
    id: "adv-001",
    title: "URGENT ADVISORY: Heightened Fall Armyworm Risk in Southern Tagalog Corn Fields",
    content:
      "Field monitoring officers reported elevated egg cluster counts in vegetative corn crops. All corn farmers in Candelaria, Sariaya, and Tiaong are strongly encouraged to inspect the central whorls for early pinhole damage. Free Bt biopesticide distribution is ongoing at the Municipal Agriculture Office.",
    severity: "urgent",
    targetRole: "all",
    createdBy: "Chief Agronomist Admin",
    createdAt: "2026-11-04T08:00:00.000Z",
  },
  {
    id: "adv-002",
    title: "WEATHER ALERT: Continuous Rains Increase Foliar Fungal & Rice Blast Susceptibility",
    content:
      "Due to the prevailing low pressure area bringing intermittent rains and dense morning fog, rice fields are under heightened risk of Rice Blast and Sheath Blight. Farmers should avoid urea top-dressing and verify adequate paddy drainage to mitigate fungal spore germination.",
    severity: "warning",
    targetRole: "all",
    createdBy: "Chief Agronomist Admin",
    createdAt: "2026-11-02T10:15:00.000Z",
  },
  {
    id: "adv-003",
    title: "NOTICE: Standardized Digital Incident Reporting Protocols for Agri-Extension Workers",
    content:
      "Field officers are reminded to ensure farmers upload a minimum of 4 clear photographs (symptom close-up, foliage collar, stem node, and canopy overview) with GPS enabled for every reported case to ensure high accuracy with the Gemini AI diagnostic pipeline.",
    severity: "info",
    targetRole: "agriculturist",
    createdBy: "Chief Agronomist Admin",
    createdAt: "2026-10-25T14:00:00.000Z",
  },
];

async function seedLocalStorage(page, activeUser) {
  await page.evaluate(
    ({ activeUser, sampleUsers, sampleIncidents, sampleRecommendations, samplePests, sampleAdvisories }) => {
      localStorage.setItem("agricare_all_users", JSON.stringify(sampleUsers));
      localStorage.setItem("agricare_incidents", JSON.stringify(sampleIncidents));
      localStorage.setItem("agricare_recommendations", JSON.stringify(sampleRecommendations));
      localStorage.setItem("agricare_pests", JSON.stringify(samplePests));
      localStorage.setItem("agricare_advisories", JSON.stringify(sampleAdvisories));
      if (activeUser) {
        localStorage.setItem("agricare_demo_user", JSON.stringify(activeUser));
      } else {
        localStorage.removeItem("agricare_demo_user");
      }
    },
    { activeUser, sampleUsers, sampleIncidents, sampleRecommendations, samplePests, sampleAdvisories }
  );
}

async function run() {
  console.log("Launching Microsoft Edge via Playwright...");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();
  const baseUrl = "http://localhost:3000";

  const farmerUser = sampleUsers[0];
  const agriUser = sampleUsers[1];
  const adminUser = sampleUsers[2];
  const pendingUser = sampleUsers[3];

  const screenshots = [];

  async function snap(filename, label) {
    const fullPath = path.join(outputDir, filename);
    await page.addStyleTag({
      content: `
        nextjs-portal,
        [data-nextjs-toast],
        [data-nextjs-dialog-overlay],
        div[data-nextjs-dialog],
        #__next-build-watcher {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `,
    }).catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: fullPath, fullPage: false });
    console.log(`[SAVED] ${filename} - ${label}`);
    screenshots.push({ filename, label, fullPath });
  }

  try {
    // ---------------------------------------------------------
    // 1. Landing Page
    // ---------------------------------------------------------
    console.log("\n--> 1. Public Landing Page");
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await seedLocalStorage(page, null);
    await snap("01_Landing_Page_Public_Portal.png", "Public Landing Page & System Features");

    // ---------------------------------------------------------
    // 2. Authentication: Login
    // ---------------------------------------------------------
    console.log("\n--> 2. Authentication: Login");
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await snap("02_Authentication_Login.png", "Sign In Portal with 1-Click Role Switcher");

    // ---------------------------------------------------------
    // 3. Authentication: Register
    // ---------------------------------------------------------
    console.log("\n--> 3. Authentication: Register");
    await page.goto(`${baseUrl}/register`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="text"]', "Danilo Reyes");
    await page.fill('input[type="email"]', "danilo.farmer@gmail.com");
    await snap("03_Authentication_Register.png", "User Registration with Role & Location Form");

    // ---------------------------------------------------------
    // 4. Authentication: Pending Approval
    // ---------------------------------------------------------
    console.log("\n--> 4. Authentication: Pending Approval");
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await seedLocalStorage(page, pendingUser);
    await page.goto(`${baseUrl}/pending-approval`, { waitUntil: "domcontentloaded" });
    await snap("04_Authentication_Pending_Approval.png", "Account Pending Administrator Verification");

    // ---------------------------------------------------------
    // 5. Farmer Dashboard: Incidents & Tracking
    // ---------------------------------------------------------
    console.log("\n--> 5. Farmer Dashboard");
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await seedLocalStorage(page, farmerUser);
    await page.goto(`${baseUrl}/farmer`, { waitUntil: "domcontentloaded" });
    await snap("05_Farmer_Dashboard_Incident_Tracking.png", "Farmer Incident Overview & Status Tracker");

    // ---------------------------------------------------------
    // 6. Farmer: Report New Incident Form
    // ---------------------------------------------------------
    console.log("\n--> 6. Farmer: Report Incident");
    await page.goto(`${baseUrl}/farmer/report`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.selectOption("select", "Rice (Palay)");
    await page.fill(
      'textarea',
      "Brown spindle lesions observed spreading on leaf blades. Stems turning dark near the nodes after heavy morning rain. Field drainage temporarily halted."
    );
    const samplePhotos = [
      path.join(rootDir, "public", "demo-assets", "rice-blast-1.svg"),
      path.join(rootDir, "public", "demo-assets", "rice-blast-2.svg"),
      path.join(rootDir, "public", "demo-assets", "rice-blast-3.svg"),
      path.join(rootDir, "public", "demo-assets", "rice-blast-4.svg"),
    ];
    await page.setInputFiles('input[type="file"]', samplePhotos).catch(() => {});
    await snap("06_Farmer_New_Incident_Report_Form.png", "Mobile Incident Report with GPS and Photo Requirements");

    // ---------------------------------------------------------
    // 7. Farmer: Incident Details & Gemini AI Preliminary Scan
    // ---------------------------------------------------------
    console.log("\n--> 7. Farmer: Incident Details with AI Scan");
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await seedLocalStorage(page, farmerUser);
    await page.goto(`${baseUrl}/farmer/incident/INC-2026-081`, { waitUntil: "domcontentloaded" });
    await snap("07_Farmer_Incident_Detail_AI_Diagnosis.png", "Incident Diagnosis Details with Google Gemini Vision Scan");

    // ---------------------------------------------------------
    // 8. Farmer: Advisories & Outbreak Warnings Feed
    // ---------------------------------------------------------
    console.log("\n--> 8. Farmer: Advisories Feed");
    await page.goto(`${baseUrl}/farmer/advisories`, { waitUntil: "domcontentloaded" });
    await snap("08_Farmer_Advisories_Feed.png", "Agricultural Advisories, Weather Alerts & Disease Bulletins");

    // ---------------------------------------------------------
    // 9. Agriculturist: Incident Triage Queue
    // ---------------------------------------------------------
    console.log("\n--> 9. Agriculturist Dashboard: Triage Queue");
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await seedLocalStorage(page, agriUser);
    await page.goto(`${baseUrl}/agriculturist`, { waitUntil: "domcontentloaded" });
    await snap("09_Agriculturist_Incident_Triage_Queue.png", "Agriculturist Case Management & Incident Triage Queue");

    // ---------------------------------------------------------
    // 10. Agriculturist: Incident Review & Prescription Editor
    // ---------------------------------------------------------
    console.log("\n--> 10. Agriculturist: Review & Recommend Incident");
    await page.goto(`${baseUrl}/agriculturist/incident/INC-2026-082`, { waitUntil: "domcontentloaded" });
    await snap(
      "10_Agriculturist_Incident_Review_and_Prescription.png",
      "Field Evidence Review, Pest Catalog Matching & Official Prescription Issuance"
    );

    // ---------------------------------------------------------
    // 11. Admin: Dashboard & System Analytics
    // ---------------------------------------------------------
    console.log("\n--> 11. Admin Dashboard");
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await seedLocalStorage(page, adminUser);
    await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
    await snap("11_Admin_System_Dashboard_Analytics.png", "System Administrator Overview, Metrics & Governance");

    // ---------------------------------------------------------
    // 12. Admin: User Approvals & Role Management
    // ---------------------------------------------------------
    console.log("\n--> 12. Admin: User Management");
    await page.goto(`${baseUrl}/admin/users`, { waitUntil: "domcontentloaded" });
    await snap("12_Admin_User_Management_and_Approvals.png", "User Verification, Pending Account Approval & Role Assignment");

    // ---------------------------------------------------------
    // 13. Admin: Pest & Disease Catalog
    // ---------------------------------------------------------
    console.log("\n--> 13. Admin: Pest Catalog");
    await page.goto(`${baseUrl}/admin/pests`, { waitUntil: "domcontentloaded" });
    await snap("13_Admin_Pest_and_Disease_Catalog.png", "Municipal Pest & Plant Pathology Reference Knowledge Base");

    // ---------------------------------------------------------
    // 14. Admin: Broadcast Advisory Authoring
    // ---------------------------------------------------------
    console.log("\n--> 14. Admin: Advisory Broadcast Management");
    await page.goto(`${baseUrl}/admin/advisories`, { waitUntil: "domcontentloaded" });
    await snap(
      "14_Admin_Broadcast_Advisory_Management.png",
      "Public Agricultural Advisory Authoring & Bulletin Dispatch"
    );

    console.log(`\n=============================================================`);
    console.log(`Successfully captured all ${screenshots.length} screenshots to: ${outputDir}`);
    console.log(`=============================================================`);
  } catch (error) {
    console.error("Error during screenshot capture:", error);
  } finally {
    await browser.close();
  }
}

run();

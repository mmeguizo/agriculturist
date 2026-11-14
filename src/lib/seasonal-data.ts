export type CropCategory = "All Crops" | "Rice" | "Corn" | "Sugarcane" | "Vegetables";
export type ThreatSeverity = "low" | "moderate" | "high" | "critical";

export interface PestThreat {
  name: string;
  category: "fungal" | "bacterial" | "insect" | "rodent_pest";
  risk: ThreatSeverity;
  symptoms: string;
  recommendedAction: string;
}

export interface CropMonthlyThreat {
  riskScore: number; // 1-10
  riskLevel: ThreatSeverity;
  stage: string;
  pests: PestThreat[];
  managementTips: string[];
}

export interface MonthlyOutbreakData {
  monthIndex: number; // 1-12
  monthName: string; // "January", etc.
  shortName: string; // "Jan", etc.
  season: "Wet Season" | "Dry Season";
  climateSummary: string; // Specific to Negros Occidental
  overallRiskLevel: ThreatSeverity;
  riskScore: number; // 1-10
  highlightOutbreaks: string[]; // verbatim / direct from notes.txt
  cropThreats: Record<"Rice" | "Corn" | "Sugarcane" | "Vegetables", CropMonthlyThreat>;
}

export const NEGROS_CROPS: { id: CropCategory; label: string; icon: string }[] = [
  { id: "All Crops", label: "All Major Crops", icon: "🌾" },
  { id: "Rice", label: "Rice (Palay)", icon: "🌱" },
  { id: "Corn", label: "Corn (Mais)", icon: "🌽" },
  { id: "Sugarcane", label: "Sugarcane (Tubo)", icon: "🎋" },
  { id: "Vegetables", label: "Vegetables (Utanon)", icon: "🥬" },
];

export const MONTHLY_OUTBREAK_SCHEDULE: MonthlyOutbreakData[] = [
  {
    monthIndex: 1,
    monthName: "January",
    shortName: "Jan",
    season: "Dry Season",
    climateSummary: "Cooler northeast monsoon (Amihan). Drier conditions, lower humidity.",
    overallRiskLevel: "moderate",
    riskScore: 5.2,
    highlightOutbreaks: ["Thrips", "Sugarcane woolly aphids", "Cutworms", "Vegetable aphids"],
    cropThreats: {
      Rice: {
        riskScore: 4.5,
        riskLevel: "moderate",
        stage: "Dry Season Planting / Vegetative",
        pests: [
          {
            name: "Rice Thrips",
            category: "insect",
            risk: "moderate",
            symptoms: "Inward rolling of young leaf tips, silvery patches on seedlings.",
            recommendedAction: "Maintain standing water in seedbeds; avoid unnecessary insecticide spraying.",
          },
          {
            name: "Stem Borer (Deadheart)",
            category: "insect",
            risk: "moderate",
            symptoms: "Central tiller dries up and dies.",
            recommendedAction: "Release Trichogramma parasitoids; remove egg masses.",
          },
        ],
        managementTips: ["Ensure good field leveling", "Monitor nursery beds twice weekly"],
      },
      Corn: {
        riskScore: 5.0,
        riskLevel: "moderate",
        stage: "Early Vegetative",
        pests: [
          {
            name: "Cutworms",
            category: "insect",
            risk: "moderate",
            symptoms: "Young seedlings severed at ground level during night.",
            recommendedAction: "Hand collection during twilight; clean cultivation of field borders.",
          },
        ],
        managementTips: ["Deep plowing to expose pupae to sunlight", "Border sanitation"],
      },
      Sugarcane: {
        riskScore: 6.0,
        riskLevel: "moderate",
        stage: "Milling Season / Ratoon Emergence",
        pests: [
          {
            name: "Sugarcane Woolly Aphid",
            category: "insect",
            risk: "moderate",
            symptoms: "White waxy colonies on underside of leaves, sooty mold on upper surface.",
            recommendedAction: "Conserve natural predators (Micromus, Syrphids); avoid water stress.",
          },
        ],
        managementTips: ["Burn or compost trash infected with smut", "Inspect ratoon tillers"],
      },
      Vegetables: {
        riskScore: 5.5,
        riskLevel: "moderate",
        stage: "Active Fruiting / Harvest",
        pests: [
          {
            name: "Aphids & Whiteflies",
            category: "insect",
            risk: "moderate",
            symptoms: "Curling of young leaves, honeydew secretion, vector of mosaic virus.",
            recommendedAction: "Install yellow sticky traps; spray neem oil or soap solution.",
          },
        ],
        managementTips: ["Mulching with silver-reflective film", "Inspect underside of leaves"],
      },
    },
  },
  {
    monthIndex: 2,
    monthName: "February",
    shortName: "Feb",
    season: "Dry Season",
    climateSummary: "Mild temperatures, low rainfall. Ideal for sugarcane harvesting and drying fields.",
    overallRiskLevel: "moderate",
    riskScore: 4.8,
    highlightOutbreaks: ["Spider mites", "Sugarcane stem borers", "Diamondback moth"],
    cropThreats: {
      Rice: {
        riskScore: 4.0,
        riskLevel: "low",
        stage: "Panicle Initiation / Heading",
        pests: [
          {
            name: "Green Leafhopper",
            category: "insect",
            risk: "low",
            symptoms: "Mild leaf yellowing; potential tungro virus vector.",
            recommendedAction: "Synchronous planting; light traps for monitoring.",
          },
        ],
        managementTips: ["Avoid excessive nitrogen fertilizers", "Monitor leaf color"],
      },
      Corn: {
        riskScore: 5.2,
        riskLevel: "moderate",
        stage: "Tasseling & Silking",
        pests: [
          {
            name: "Corn Earworm",
            category: "insect",
            risk: "moderate",
            symptoms: "Larvae feeding inside ear tips, damaged silks.",
            recommendedAction: "Apply mineral oil or Bacillus thuringiensis (Bt) on fresh silks.",
          },
        ],
        managementTips: ["Regular field scouting during silk emergence"],
      },
      Sugarcane: {
        riskScore: 5.5,
        riskLevel: "moderate",
        stage: "Peak Milling & Early Growth",
        pests: [
          {
            name: "Early Shoot Borer",
            category: "insect",
            risk: "moderate",
            symptoms: "Deadhearts in 1-3 month old cane; rot odor upon pull-out.",
            recommendedAction: "Light earthing up at 30 and 45 days after planting.",
          },
        ],
        managementTips: ["Prompt trash mulching in ratoon fields to conserve soil moisture"],
      },
      Vegetables: {
        riskScore: 6.0,
        riskLevel: "moderate",
        stage: "Vegetative / Flowering",
        pests: [
          {
            name: "Diamondback Moth",
            category: "insect",
            risk: "high",
            symptoms: "Window pane feeding damage on cabbage/pechay leaves.",
            recommendedAction: "Intercrop with tomato or coriander; rotate biopesticides.",
          },
        ],
        managementTips: ["Avoid sequential crucifer planting", "Use fine mesh netting"],
      },
    },
  },
  {
    monthIndex: 3,
    monthName: "March",
    shortName: "Mar",
    season: "Dry Season",
    climateSummary: "Rising temperatures, decreasing humidity. Dry spell onset across Negros plains.",
    overallRiskLevel: "moderate",
    riskScore: 5.0,
    highlightOutbreaks: ["Red spider mites", "Sugarcane white grubs", "Thrips"],
    cropThreats: {
      Rice: {
        riskScore: 4.2,
        riskLevel: "low",
        stage: "Maturity / Dry Harvest",
        pests: [
          {
            name: "Rice Grain Discoloration",
            category: "fungal",
            risk: "low",
            symptoms: "Dark spots on husk due to moisture remnants.",
            recommendedAction: "Timely harvesting at 80-85% straw grain color.",
          },
        ],
        managementTips: ["Immediate threshing and drying to 14% moisture content"],
      },
      Corn: {
        riskScore: 4.8,
        riskLevel: "moderate",
        stage: "Grain Filling & Harvest",
        pests: [
          {
            name: "Storage Weevils (Field onset)",
            category: "insect",
            risk: "moderate",
            symptoms: "Early entrance holes in husks exposed by drought.",
            recommendedAction: "Harvest promptly when black layer forms at kernel base.",
          },
        ],
        managementTips: ["Proper drying on clean concrete tarps"],
      },
      Sugarcane: {
        riskScore: 5.8,
        riskLevel: "moderate",
        stage: "Late Milling / Spring Planting",
        pests: [
          {
            name: "White Grubs (Bungol)",
            category: "insect",
            risk: "moderate",
            symptoms: "Yellowing and drying of cane clumps; root system severed.",
            recommendedAction: "Deep plowing to expose grubs to birds; fungal biocontrol (Metarhizium).",
          },
        ],
        managementTips: ["Monitor fields with sandy-loam soils prone to grubs"],
      },
      Vegetables: {
        riskScore: 6.2,
        riskLevel: "moderate",
        stage: "Fruiting",
        pests: [
          {
            name: "Red Spider Mite",
            category: "insect",
            risk: "high",
            symptoms: "Speckled bronze foliage, delicate webbing on eggplant/tomato leaves.",
            recommendedAction: "Overhead water misting; sulfur dust or mite-specific oils.",
          },
        ],
        managementTips: ["Keep field borders moist and free of dusty weeds"],
      },
    },
  },
  {
    monthIndex: 4,
    monthName: "April",
    shortName: "Apr",
    season: "Dry Season",
    climateSummary: "Hottest month in Negros Occidental. Intense solar radiation, seasonal land prep.",
    overallRiskLevel: "moderate",
    riskScore: 5.5,
    highlightOutbreaks: ["Mole crickets", "Mealybugs", "Bacterial wilt (hot soils)"],
    cropThreats: {
      Rice: {
        riskScore: 4.0,
        riskLevel: "low",
        stage: "Fallow / Main Season Land Prep",
        pests: [
          {
            name: "Mole Crickets",
            category: "insect",
            risk: "low",
            symptoms: "Burrows along seedling seedbeds, clipped roots.",
            recommendedAction: "Flood seedbeds for 24-48 hours before sowing.",
          },
        ],
        managementTips: ["Plow under rice stubbles to break pest lifecycle"],
      },
      Corn: {
        riskScore: 5.0,
        riskLevel: "moderate",
        stage: "Pre-monsoon Planting",
        pests: [
          {
            name: "Ants & Soil Cutworms",
            category: "insect",
            risk: "moderate",
            symptoms: "Removal of sown seeds from furrows.",
            recommendedAction: "Use certified fungicide-insecticide treated seed.",
          },
        ],
        managementTips: ["Deep soil preparation to break hardpan"],
      },
      Sugarcane: {
        riskScore: 6.4,
        riskLevel: "moderate",
        stage: "Germination & Tillering",
        pests: [
          {
            name: "Pink Mealybug",
            category: "insect",
            risk: "moderate",
            symptoms: "Pinkish clusters under leaf sheaths at nodal regions, stunted cane.",
            recommendedAction: "Hot water treatment (50°C for 2 hrs) of planting setts.",
          },
        ],
        managementTips: ["Select pest-free cane seed pieces (patdan)"],
      },
      Vegetables: {
        riskScore: 6.8,
        riskLevel: "high",
        stage: "Vegetative / Solanaceous crops",
        pests: [
          {
            name: "Bacterial Wilt",
            category: "bacterial",
            risk: "high",
            symptoms: "Rapid daytime wilting without yellowing, vascular browning.",
            recommendedAction: "Crop rotation with non-solanaceous crops (corn/rice); resistant cultivars.",
          },
        ],
        managementTips: ["Avoid moving soil from infected plots", "Solarize nursery beds"],
      },
    },
  },
  // MAY (Specified in notes.txt: Rice blast, bacterial leaf blight, fungal diseases)
  {
    monthIndex: 5,
    monthName: "May",
    shortName: "May",
    season: "Wet Season",
    climateSummary: "Arrival of Habagat (Southwest Monsoon). Frequent afternoon thunderstorms and high humidity.",
    overallRiskLevel: "high",
    riskScore: 7.8,
    highlightOutbreaks: [
      "Rice blast",
      "Bacterial leaf blight",
      "Fungal diseases",
    ],
    cropThreats: {
      Rice: {
        riskScore: 8.5,
        riskLevel: "high",
        stage: "Wet Season Seedbed / Transplanting",
        pests: [
          {
            name: "Rice Blast (Pyricularia oryzae)",
            category: "fungal",
            risk: "high",
            symptoms: "Spindle-shaped lesions with grayish centers and brown borders on young leaves.",
            recommendedAction: "Avoid excessive nitrogen application; spray tricyclazole or copper fungicide.",
          },
          {
            name: "Bacterial Leaf Blight (Xanthomonas oryzae)",
            category: "bacterial",
            risk: "high",
            symptoms: "Water-soaked stripes turning wavy yellowish-white along leaf margins.",
            recommendedAction: "Ensure proper field drainage; apply copper oxychloride; avoid clipping seedling tips.",
          },
          {
            name: "Seedling Fungal Damping-Off",
            category: "fungal",
            risk: "high",
            symptoms: "Seedlings collapse and rot at soil line in wet nursery beds.",
            recommendedAction: "Seed treatment with Trichoderma; raise nursery bed height for rapid drainage.",
          },
        ],
        managementTips: [
          "Do not over-fertilize with urea during seedling stage",
          "Ensure clean irrigation canals to prevent bacterial inoculum spread",
        ],
      },
      Corn: {
        riskScore: 7.2,
        riskLevel: "high",
        stage: "Early Vegetative",
        pests: [
          {
            name: "Corn Downy Mildew",
            category: "fungal",
            risk: "high",
            symptoms: "Chlorotic striping on leaves, whitish fungal growth on lower surface.",
            recommendedAction: "Rogue out infected seedlings immediately; use metalaxyl seed treatment.",
          },
        ],
        managementTips: ["Plant resistant hybrid varieties", "Maintain good row drainage"],
      },
      Sugarcane: {
        riskScore: 7.0,
        riskLevel: "high",
        stage: "Tillering Stage",
        pests: [
          {
            name: "Sugarcane Smut (Whip Smut)",
            category: "fungal",
            risk: "high",
            symptoms: "Black whip-like structure emerging from the central shoot apex.",
            recommendedAction: "Carefully rogue and burn infected whips in plastic bags; dip seed setts in hot water.",
          },
        ],
        managementTips: ["Inspect Negros cane fields weekly for emerging smut whips"],
      },
      Vegetables: {
        riskScore: 7.5,
        riskLevel: "high",
        stage: "Transplanting & Early Growth",
        pests: [
          {
            name: "Anthracnose & Fruit Rot",
            category: "fungal",
            risk: "high",
            symptoms: "Circular sunken water-soaked spots with dark concentric rings on pepper/tomato.",
            recommendedAction: "Apply preventive copper or mancozeb sprays; remove infected plant debris.",
          },
        ],
        managementTips: ["Plastic mulch to prevent soil splashing onto foliage"],
      },
    },
  },
  // JUNE (Specified in notes.txt: Rice stem borers, golden apple snails, planthoppers)
  {
    monthIndex: 6,
    monthName: "June",
    shortName: "Jun",
    season: "Wet Season",
    climateSummary: "Consistent heavy rainfall. Saturated paddy fields and standing water across lowlands.",
    overallRiskLevel: "high",
    riskScore: 8.4,
    highlightOutbreaks: [
      "Rice stem borers",
      "Golden apple snails",
      "Planthoppers",
    ],
    cropThreats: {
      Rice: {
        riskScore: 9.0,
        riskLevel: "critical",
        stage: "Early Tillering Stage",
        pests: [
          {
            name: "Golden Apple Snail (Kuhol - Pomacea canaliculata)",
            category: "rodent_pest",
            risk: "critical",
            symptoms: "Severed tillers floating on water, rapid destruction of newly transplanted rice within 48h.",
            recommendedAction: "Deploy bamboo traps and herd ducks in paddies; maintain water depth below 2cm.",
          },
          {
            name: "Yellow Stem Borer (Scirpophaga incertulas)",
            category: "insect",
            risk: "high",
            symptoms: "Deadheart (drying of central tiller shoot) in young tillering plants.",
            recommendedAction: "Release Trichogramma japonicum cards; clip seedling leaf tips to remove egg clusters.",
          },
          {
            name: "Whitebacked & Green Planthoppers",
            category: "insect",
            risk: "high",
            symptoms: "Discolored lower leaves, vectoring Rice Grassy Stunt and Tungro viruses.",
            recommendedAction: "Drain paddy intermittently (Alternate Wetting & Drying); conserve spider predators.",
          },
        ],
        managementTips: [
          "Install screen meshes at water inlets to trap snail egg masses",
          "Synchronize transplanting with neighboring farms in the barangay",
        ],
      },
      Corn: {
        riskScore: 7.8,
        riskLevel: "high",
        stage: "Mid-Vegetative (V4-V8)",
        pests: [
          {
            name: "Asian Corn Borer (Ostrinia furnacalis)",
            category: "insect",
            risk: "high",
            symptoms: "Shot-holes in leaf whorls, frass accumulation in leaf axils.",
            recommendedAction: "Trichogramma evanescens egg parasitoid releases; apply Bt granule to whorl.",
          },
        ],
        managementTips: ["Scout weekly for pinhole whorl feeding"],
      },
      Sugarcane: {
        riskScore: 7.6,
        riskLevel: "high",
        stage: "Formative / Canopy Closure",
        pests: [
          {
            name: "Sugarcane Top Borer",
            category: "insect",
            risk: "high",
            symptoms: "Midrib red streaks, bunchy top appearance from killed apical bud.",
            recommendedAction: "Cut off and destroy infested shoots below ground level.",
          },
        ],
        managementTips: ["Ensure good drainage ditches in heavy clay cane soils"],
      },
      Vegetables: {
        riskScore: 7.9,
        riskLevel: "high",
        stage: "Vegetative / Flowering",
        pests: [
          {
            name: "Eggplant & Tomato Fruit Borer",
            category: "insect",
            risk: "high",
            symptoms: "Wilting of tender terminal shoots; entry holes plugged with frass in fruits.",
            recommendedAction: "Prompt pruning and disposal of bored shoots; pheromone traps (10/ha).",
          },
        ],
        managementTips: ["Net bagging of fruits", "Sanitation of fallen produce"],
      },
    },
  },
  // JULY (Specified in notes.txt: Rice blast, sheath blight, bacterial leaf blight)
  {
    monthIndex: 7,
    monthName: "July",
    shortName: "Jul",
    season: "Wet Season",
    climateSummary: "Peak monsoon rainfall. High relative humidity (>85%) and continuous overcast days.",
    overallRiskLevel: "critical",
    riskScore: 9.1,
    highlightOutbreaks: [
      "Rice blast",
      "Sheath blight",
      "Bacterial leaf blight",
    ],
    cropThreats: {
      Rice: {
        riskScore: 9.5,
        riskLevel: "critical",
        stage: "Active & Maximum Tillering",
        pests: [
          {
            name: "Sheath Blight (Rhizoctonia solani)",
            category: "fungal",
            risk: "critical",
            symptoms: "Oval or irregular greenish-gray water-soaked spots on leaf sheaths near water line.",
            recommendedAction: "Widen plant spacing; avoid excessive urea; apply validamycin or azoxystrobin.",
          },
          {
            name: "Rice Blast (Pyricularia oryzae)",
            category: "fungal",
            risk: "critical",
            symptoms: "Enlarging eye-shaped lesions coalescing into large necrotic blighted areas.",
            recommendedAction: "Apply systemic fungicides (isoprothiolane/tricyclazole) at initial spot detection.",
          },
          {
            name: "Bacterial Leaf Blight (Xanthomonas oryzae)",
            category: "bacterial",
            risk: "high",
            symptoms: "Rapid wilting of entire leaves (kresek stage) and milky bacterial ooze on young dew.",
            recommendedAction: "Lower paddy water level; avoid overhead mechanical disturbances.",
          },
        ],
        managementTips: [
          "Avoid high plant densities that trap microclimate humidity",
          "Balanced N-P-K fertilizer application with potassium boost",
        ],
      },
      Corn: {
        riskScore: 8.2,
        riskLevel: "high",
        stage: "Tasseling & Silking",
        pests: [
          {
            name: "Northern Leaf Blight",
            category: "fungal",
            risk: "high",
            symptoms: "Long elliptical cigar-shaped grayish-green lesions on middle and upper leaves.",
            recommendedAction: "Foliar fungicide application if lesions appear below the ear leaf before silking.",
          },
        ],
        managementTips: ["Ensure field edges allow wind flow to reduce leaf wetness"],
      },
      Sugarcane: {
        riskScore: 8.0,
        riskLevel: "high",
        stage: "Grand Growth Phase",
        pests: [
          {
            name: "Sugarcane Red Rot (Colletotrichum falcatum)",
            category: "fungal",
            risk: "high",
            symptoms: "Third or fourth leaf from top shows yellowing; stalk internal tissues show red lesions with white cross patches.",
            recommendedAction: "Drain standing water; avoid inter-cultivation that wounds roots/stalks.",
          },
        ],
        managementTips: ["Maintain deep perimeter canals to avoid waterlogged cane roots"],
      },
      Vegetables: {
        riskScore: 8.4,
        riskLevel: "high",
        stage: "Fruiting",
        pests: [
          {
            name: "Bacterial Spot & Soft Rot",
            category: "bacterial",
            risk: "high",
            symptoms: "Water-soaked lesions on tomato/pepper fruits collapsing into foul-smelling mush.",
            recommendedAction: "Spray copper hydroxide; stake plants off wet soil; remove diseased fruits.",
          },
        ],
        managementTips: ["Trellising/staking is mandatory during July wet season"],
      },
    },
  },
  // AUGUST (Specified in notes.txt: Brown planthoppers, armyworms, leaf folders)
  {
    monthIndex: 8,
    monthName: "August",
    shortName: "Aug",
    season: "Wet Season",
    climateSummary: "Intense Habagat squalls and humid lulls. Dense crop canopies across Negros Occidental.",
    overallRiskLevel: "critical",
    riskScore: 9.4,
    highlightOutbreaks: [
      "Brown planthoppers",
      "Armyworms",
      "Leaf folders",
    ],
    cropThreats: {
      Rice: {
        riskScore: 9.8,
        riskLevel: "critical",
        stage: "Panicle Initiation / Booting",
        pests: [
          {
            name: "Brown Planthopper (BPH - Nilaparvata lugens)",
            category: "insect",
            risk: "critical",
            symptoms: "Rapid circular yellowing and drying of rice clumps known as 'hopperburn'.",
            recommendedAction: "Drain water to expose plant bases; conserve Cyrtorhinus mirid bugs; avoid pyrethroids.",
          },
          {
            name: "Rice Armyworm (Mythimna separata)",
            category: "insect",
            risk: "critical",
            symptoms: "Massive overnight defoliation; marching larvae cutting flag leaves and stems.",
            recommendedAction: "Dig barrier trenches around infested paddies; apply Bt or chlorantraniliprole.",
          },
          {
            name: "Rice Leaf Folder (Cnaphalocrocis medinalis)",
            category: "insect",
            risk: "high",
            symptoms: "Leaves longitudinally folded with silk threads; white transparent streaks from scraped green tissue.",
            recommendedAction: "Avoid excessive urea; install light traps; spray neem extract or biologicals.",
          },
        ],
        managementTips: [
          "Check base of rice tillers weekly by parting rows to count planthoppers",
          "Maintain refuge strips of flowering plants on dikes for parasitoids",
        ],
      },
      Corn: {
        riskScore: 8.8,
        riskLevel: "high",
        stage: "Whorl to Tassel Stage",
        pests: [
          {
            name: "Fall Armyworm (FAW - Spodoptera frugiperda)",
            category: "insect",
            risk: "critical",
            symptoms: "Extensive ragged whorl feeding holes, sawdust-like frass plugs, severed tassels.",
            recommendedAction: "Drop sand/lime or neem cake into whorls; release Trichogramma; targeted biopesticide.",
          },
        ],
        managementTips: ["Scout fields in early morning when armyworm larvae feed actively"],
      },
      Sugarcane: {
        riskScore: 8.5,
        riskLevel: "high",
        stage: "Elongation / Tall Cane",
        pests: [
          {
            name: "Sugarcane Stem Borer",
            category: "insect",
            risk: "high",
            symptoms: "Bore holes in cane internodes with frass; dead tops; reduced juice purity.",
            recommendedAction: "Periodic release of Trichogramma chilonis; remove and burn severely bored canes.",
          },
        ],
        managementTips: ["Avoid lodging caused by excess nitrogen combined with monsoon gusts"],
      },
      Vegetables: {
        riskScore: 8.6,
        riskLevel: "high",
        stage: "Fruiting / Harvesting",
        pests: [
          {
            name: "Spodoptera litura (Cutworm / Armyworm)",
            category: "insect",
            risk: "critical",
            symptoms: "Skeletonized leaves, bored tomatoes and bell peppers.",
            recommendedAction: "Pheromone traps; handpick egg masses; apply nuclear polyhedrosis virus (NPV).",
          },
        ],
        managementTips: ["Inspect leaf undersides for velvety brown egg clusters"],
      },
    },
  },
  // SEPTEMBER (Specified in notes.txt: Rice blast, bacterial diseases, fungal infections)
  {
    monthIndex: 9,
    monthName: "September",
    shortName: "Sep",
    season: "Wet Season",
    climateSummary: "Tropical cyclone season peaks. Frequent heavy rains, windy gusts, and prolonged leaf wetness.",
    overallRiskLevel: "critical",
    riskScore: 9.0,
    highlightOutbreaks: [
      "Rice blast",
      "Bacterial diseases",
      "Fungal infections",
    ],
    cropThreats: {
      Rice: {
        riskScore: 9.4,
        riskLevel: "critical",
        stage: "Flowering & Heading Stage",
        pests: [
          {
            name: "Neck Blast (Panicle Blast)",
            category: "fungal",
            risk: "critical",
            symptoms: "Lesion girdling the panicle node; head turns grayish-white and breaks over with unfilled grains.",
            recommendedAction: "Preventive spray at 5% heading and 50% heading using tricyclazole or kasugamycin.",
          },
          {
            name: "Bacterial Leaf Streak & Grain Rot",
            category: "bacterial",
            risk: "high",
            symptoms: "Translucent brown streaks between veins; aborted or discolored chalky florets.",
            recommendedAction: "Avoid working in wet fields to prevent spreading bacteria on clothes/tools.",
          },
          {
            name: "False Smut (Ustilaginoidea virens)",
            category: "fungal",
            risk: "high",
            symptoms: "Individual grains transformed into large velvety greenish-orange spores.",
            recommendedAction: "Apply copper-based fungicides at booting stage; discard infected heads during harvest.",
          },
        ],
        managementTips: [
          "Do not spray insecticides during active morning flowering (8 AM - 11 AM)",
          "Maintain constant shallow water during grain filling",
        ],
      },
      Corn: {
        riskScore: 8.0,
        riskLevel: "high",
        stage: "Grain Fill / Early Maturity",
        pests: [
          {
            name: "Gibberella & Fusarium Stalk Rot",
            category: "fungal",
            risk: "high",
            symptoms: "Premature dying of corn stalks; internal pith rots into pinkish-red spongy mass.",
            recommendedAction: "Avoid moisture stress and plant lodging; harvest early if stalk rots appear.",
          },
        ],
        managementTips: ["Ensure good aeration around border rows"],
      },
      Sugarcane: {
        riskScore: 8.3,
        riskLevel: "high",
        stage: "Grand Growth",
        pests: [
          {
            name: "Pokkah Boeng (Fusarium moniliforme)",
            category: "fungal",
            risk: "high",
            symptoms: "Malformed, twisted, and crinkled top leaves with chlorotic bases and reddish-brown rotting.",
            recommendedAction: "Foliar copper oxychloride or carbendazim at onset of symptoms.",
          },
        ],
        managementTips: ["Inspect cane varieties sensitive to high humidity and typhoons"],
      },
      Vegetables: {
        riskScore: 8.5,
        riskLevel: "high",
        stage: "Flowering / Fruiting",
        pests: [
          {
            name: "Downy Mildew & Black Rot",
            category: "fungal",
            risk: "high",
            symptoms: "Yellow angular leaf spots bounded by veins; purple-gray downy mold on underside.",
            recommendedAction: "Improve air circulation; apply preventive fosetyl-aluminum or copper sprays.",
          },
        ],
        managementTips: ["Remove lower blighted leaves to promote airflow"],
      },
    },
  },
  // OCTOBER (Specified in notes.txt: Stem borers, planthoppers, fruit and root rots)
  {
    monthIndex: 10,
    monthName: "October",
    shortName: "Oct",
    season: "Wet Season",
    climateSummary: "Monsoon transition with torrential thunderstorms. High soil saturation and waterlogging.",
    overallRiskLevel: "high",
    riskScore: 8.6,
    highlightOutbreaks: [
      "Stem borers",
      "Planthoppers",
      "Fruit and root rots",
    ],
    cropThreats: {
      Rice: {
        riskScore: 8.8,
        riskLevel: "high",
        stage: "Dough / Ripening Stage",
        pests: [
          {
            name: "Whiteheads (Stem Borer damage)",
            category: "insect",
            risk: "high",
            symptoms: "Entire panicle turns white and stands erect with empty, unfilled chaff.",
            recommendedAction: "Destroy stubble immediately after harvest; light traps for moths.",
          },
          {
            name: "Brown & Whitebacked Planthoppers",
            category: "insect",
            risk: "high",
            symptoms: "Hopper populations congregating on maturing stems; sooty mold growth on honeydew.",
            recommendedAction: "Begin gradual field drainage 10-14 days before harvest.",
          },
        ],
        managementTips: [
          "Gradually drain paddies to firm soil for harvest and lower humidity",
          "Calibrate threshing machinery to prevent grain breakage",
        ],
      },
      Corn: {
        riskScore: 8.0,
        riskLevel: "high",
        stage: "Late Harvest / Field Drying",
        pests: [
          {
            name: "Ear Rot & Stalk Borers",
            category: "fungal",
            risk: "high",
            symptoms: "Ears rotting on stalks due to moisture trapped inside tight husks.",
            recommendedAction: "De-husk ears promptly upon harvest; dry immediately to avoid aflatoxin.",
          },
        ],
        managementTips: ["Do not leave harvested ears stacked in damp fields"],
      },
      Sugarcane: {
        riskScore: 8.2,
        riskLevel: "high",
        stage: "Late Elongation / Maturation Onset",
        pests: [
          {
            name: "Sugarcane Root Rot & Stem Borer",
            category: "fungal",
            risk: "high",
            symptoms: "Waterlogged roots rot; bored stalks snap in strong winds.",
            recommendedAction: "Clean drainage canals to allow quick exit of floodwaters.",
          },
        ],
        managementTips: ["Ensure field accessibility for upcoming milling season"],
      },
      Vegetables: {
        riskScore: 9.0,
        riskLevel: "critical",
        stage: "Fruiting / Root Development",
        pests: [
          {
            name: "Phytophthora Fruit & Root Rot",
            category: "fungal",
            risk: "critical",
            symptoms: "Dark water-soaked crown rot causing sudden wilting; fruits develop white cottony mold.",
            recommendedAction: "Plant on raised beds (at least 30cm high); drench soil with metalaxyl/phosphite.",
          },
        ],
        managementTips: ["Ensure raised planting beds have clear runoff furrows"],
      },
    },
  },
  // NOVEMBER (Specified in notes.txt: Rats, rice bugs, fungal diseases)
  {
    monthIndex: 11,
    monthName: "November",
    shortName: "Nov",
    season: "Dry Season",
    climateSummary: "Northeast monsoon (Amihan) begins to take over. Cooler breezes, declining rain days.",
    overallRiskLevel: "high",
    riskScore: 8.2,
    highlightOutbreaks: [
      "Rats / Rodents",
      "Rice bugs (Tiangao)",
      "Fungal diseases",
    ],
    cropThreats: {
      Rice: {
        riskScore: 9.0,
        riskLevel: "critical",
        stage: "Milking to Mature Grain / Harvest",
        pests: [
          {
            name: "Rice Field Rats (Rattus tanezumi)",
            category: "rodent_pest",
            risk: "critical",
            symptoms: "Neatly cut 45-degree angle tillers, large circular patches of trampled and eaten grain.",
            recommendedAction: "Community rat campaigns (bayanihan); trap barrier system (TBS); clear weeds around dikes.",
          },
          {
            name: "Rice Bug (Tiangao - Leptocorisa oratorius)",
            category: "insect",
            risk: "critical",
            symptoms: "Unpleasant odor; pecky/brown-spotted grains and empty chaff from piercing milk-stage grain.",
            recommendedAction: "Smokey smudging with dried neem/herbs at dusk; deploy rotten meat/snail bait traps.",
          },
          {
            name: "Sheath Rot & Grain Discoloration",
            category: "fungal",
            risk: "high",
            symptoms: "Oblong reddish-brown lesions enclosing un-emerged or partially emerged panicles.",
            recommendedAction: "Control rice bugs and stem borers which create entry wounds for fungi.",
          },
        ],
        managementTips: [
          "Coordinate community rodent control across adjacent barangays",
          "Harvest promptly as soon as grain reaches maturity",
        ],
      },
      Corn: {
        riskScore: 7.5,
        riskLevel: "high",
        stage: "Maturity / Post-harvest",
        pests: [
          {
            name: "Rodents attacking drying ears",
            category: "rodent_pest",
            risk: "high",
            symptoms: "Gnawed husks and eaten kernels on standing stalks.",
            recommendedAction: "Install zinc/tin collar barriers on cribs; keep barn perimeters clean.",
          },
        ],
        managementTips: ["Store dried corn in rodent-proof metal bins or sealed hermetic bags"],
      },
      Sugarcane: {
        riskScore: 7.8,
        riskLevel: "high",
        stage: "Early Milling / Ripening",
        pests: [
          {
            name: "Cane Field Rats",
            category: "rodent_pest",
            risk: "high",
            symptoms: "Gnawed lower internodes causing cane to lodge, sour ferment, and lose sugar recovery.",
            recommendedAction: "Zinc phosphide or anticoagulant baiting along field perimeters and railways.",
          },
        ],
        managementTips: ["Maintain wide firebreaks and weed-free perimeters around cane blocks"],
      },
      Vegetables: {
        riskScore: 7.4,
        riskLevel: "high",
        stage: "Harvest / Post-monsoon Planting",
        pests: [
          {
            name: "Powdery Mildew & Fruit Flies",
            category: "fungal",
            risk: "high",
            symptoms: "White talcum-powder coating on cucurbit/tomato leaves; fruit fly sting punctures on young fruits.",
            recommendedAction: "Spray potassium bicarbonate or neem; deploy cue-lure and methyl eugenol traps.",
          },
        ],
        managementTips: ["Prompt bagging of cucurbits (ampalaya, patola, squash)"],
      },
    },
  },
  // DECEMBER (Specified in notes.txt: Rice blast, rodents, vegetable pests)
  {
    monthIndex: 12,
    monthName: "December",
    shortName: "Dec",
    season: "Dry Season",
    climateSummary: "Cool, dry winds with low overnight temperatures and heavy morning dew. Favorable for vegetable production.",
    overallRiskLevel: "high",
    riskScore: 7.9,
    highlightOutbreaks: [
      "Rice blast",
      "Rodents",
      "Vegetable pests",
    ],
    cropThreats: {
      Rice: {
        riskScore: 7.8,
        riskLevel: "high",
        stage: "Dry Season Seedbed / Post-Harvest Storage",
        pests: [
          {
            name: "Rice Blast (Dry Season Seedbed)",
            category: "fungal",
            risk: "high",
            symptoms: "Cold nighttime temperatures combined with long morning dew periods trigger nursery blast.",
            recommendedAction: "Cover dry-season seedbeds with agro-netting; avoid evening irrigation.",
          },
          {
            name: "Rodents & Storage Pests",
            category: "rodent_pest",
            risk: "high",
            symptoms: "Rats moving from harvested fields into storage bodegas; grain weevils in stored palay.",
            recommendedAction: "Elevate grain bags on wooden pallets; place rodent bait stations around warehouses.",
          },
        ],
        managementTips: [
          "Ensure palay is thoroughly dried to 13-14% moisture before bagging",
          "Seal bodega wall gaps and door bottoms with wire mesh",
        ],
      },
      Corn: {
        riskScore: 7.0,
        riskLevel: "moderate",
        stage: "Second Cropping Land Prep / Sowing",
        pests: [
          {
            name: "Seedling Cutworms & Rodents",
            category: "rodent_pest",
            risk: "moderate",
            symptoms: "Dug-up seed furrows; clipped young shoots.",
            recommendedAction: "Deep tillage; keep field headlands cleared of weeds.",
          },
        ],
        managementTips: ["Seed treatment to protect against soil insects and birds"],
      },
      Sugarcane: {
        riskScore: 7.6,
        riskLevel: "high",
        stage: "Peak Milling Season (Negros Sugar Mills Running)",
        pests: [
          {
            name: "Rats & Stalk Borers",
            category: "rodent_pest",
            risk: "high",
            symptoms: "Borer damage reduces cane sucrose yield (LKG/TC) delivered to mills.",
            recommendedAction: "Prompt delivery of harvested cane within 24 hours to prevent deterioration.",
          },
        ],
        managementTips: ["Coordinate hauling schedules to prevent cut canes drying in field"],
      },
      Vegetables: {
        riskScore: 8.8,
        riskLevel: "critical",
        stage: "Highland & Lowland Vegetable Boom",
        pests: [
          {
            name: "Diamondback Moth (DBM - Plutella xylostella)",
            category: "insect",
            risk: "critical",
            symptoms: "Severe leaf skeletonization in crucifers (cabbage, broccoli, pechay).",
            recommendedAction: "Rotate insecticide modes of action; apply Bacillus thuringiensis (Bt kurstaki).",
          },
          {
            name: "Thrips & Broad Mites",
            category: "insect",
            risk: "high",
            symptoms: "Upward leaf curling, stunted bushy growth in peppers and tomatoes.",
            recommendedAction: "Use overhead sprinkler washing; spray neem oil or spinosad.",
          },
          {
            name: "Fruit Borers (Helicoverpa / Leucinodes)",
            category: "insect",
            risk: "high",
            symptoms: "Bored eggplants and tomatoes causing unmarketable fruit drops.",
            recommendedAction: "Regular fruit sanitation; install pheromone lure traps.",
          },
        ],
        managementTips: [
          "Peak vegetable planting season in Negros — scout brassicas and solanaceous crops twice weekly",
          "Intercrop with aromatic herbs to disorient diamondback moths",
        ],
      },
    },
  },
];

// Helper functions for easy querying and filtering
export function getMonthlyOutbreak(monthIndex: number): MonthlyOutbreakData {
  const found = MONTHLY_OUTBREAK_SCHEDULE.find((m) => m.monthIndex === monthIndex);
  return found || MONTHLY_OUTBREAK_SCHEDULE[0];
}

export function getCurrentMonthOutbreak(): MonthlyOutbreakData {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return getMonthlyOutbreak(currentMonth);
}

export function getCropThreatScore(
  data: MonthlyOutbreakData,
  crop: CropCategory
): number {
  if (crop === "All Crops") return data.riskScore;
  return data.cropThreats[crop]?.riskScore ?? data.riskScore;
}

export function getCropThreatLevel(
  data: MonthlyOutbreakData,
  crop: CropCategory
): ThreatSeverity {
  if (crop === "All Crops") return data.overallRiskLevel;
  return data.cropThreats[crop]?.riskLevel ?? data.overallRiskLevel;
}

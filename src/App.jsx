import React, { useState, useEffect, useRef } from "react";
import {
  Leaf, Camera, Mic, LogIn, LogOut, ShoppingCart, CircleCheck,
  ChevronRight, ChevronLeft, Sprout, Bug, Volume2,
  Upload, User, Lock, Sparkles, Building2, MapPin,
  Ruler, FlaskConical, History, ShieldCheck, ScanLine, Navigation,
  TrendingDown, AlertTriangle, Phone, CloudRain, Sun, Thermometer,
  Bell, LayoutDashboard, Users, Gift, PackageCheck, Star, Search,
  Wifi, Package, BookOpen, Home, Image as ImageIcon, Wheat,
  Settings, ChevronDown, X, Wallet, CalendarClock, ArrowLeft,
} from "lucide-react";

const C = {
  darkgreen: "#1E3A2B",
  green: "#6A8E23",
  gold: "#C9A043",
  goldOnWhite: "#9A7830",
  cream: "#F7F5EF",
  white: "#FFFFFF",
  black: "#16221B",
  gray: "#5B6660",
  lightgray: "#7C8270",
  placeholderGray: "#6B7268",
  // New UI tokens, sampled from the reference screenshots
  heroFrom: "#7CA33C",
  heroTo: "#3E7A2D",
  alertBg: "#F4E8BB",
  alertBorder: "#E9D699",
  navActiveBg: "#D6F5D9",
  chipBg: "#EFF3E6",
};

const GRADIENT = `linear-gradient(135deg, ${"#7CA33C"} 0%, ${"#3E7A2D"} 100%)`;

const DISPLAY_FONT = { fontFamily: 'Georgia, Cambria, "Times New Roman", serif' };
const PUNJAB_AVG_ACRES = 8.9;

// Nutrients: PAU-verified doses. DAP corrected to 55 kg/acre (PAU Rabi 2025-26 Package of Practices).
const NUTRIENTS = [
  {
    key: "n", name: "Nitrogen", product: "Urea", perAcre: 45, unit: "kg",
    deficiency: { label: "Nitrogen (N) deficiency", keywords: ["yellow", "pale", "vein", "older"] },
    excess: { label: "Nitrogen (N) excess", keywords: ["dark green", "lush", "weak stem", "lodging", "floppy", "thin stem"] },
    shcLow: 280, shcHigh: 500,
    timing: {
      "Wheat": [{ label: "At sowing / before 1st irrigation", pct: 50, day: 0 }, { label: "Before 2nd irrigation (~21 days)", pct: 50, day: 21 }],
      "Rice (Paddy)": [{ label: "Basal, at transplanting", pct: 50, day: 0 }, { label: "Active tillering (~20–25 days)", pct: 25, day: 22 }, { label: "Panicle initiation (~40–45 days)", pct: 25, day: 42 }],
    },
  },
  {
    key: "p", name: "Phosphorus", product: "DAP", perAcre: 55, unit: "kg",
    deficiency: { label: "Phosphorus (P) deficiency", keywords: ["purple", "red", "maroon", "underside"] },
    excess: { label: "Phosphorus (P) excess", keywords: ["zinc", "lockout", "stunted despite green", "micronutrient"] },
    shcLow: 11, shcHigh: 25,
    timing: {
      "Wheat": [{ label: "At sowing, drilled", pct: 100, day: 0 }],
      "Rice (Paddy)": [{ label: "Basal, at transplanting", pct: 100, day: 0 }],
    },
  },
  {
    key: "k", name: "Potassium", product: "MOP", perAcre: 20, unit: "kg",
    deficiency: { label: "Potassium (K) deficiency", keywords: ["brown", "scorch", "edge", "margin", "burnt"] },
    excess: { label: "Potassium (K) excess", keywords: ["magnesium", "interveinal yellow", "heavily treated"] },
    shcLow: 108, shcHigh: 250,
    timing: {
      "Wheat": [{ label: "At sowing", pct: 100, day: 0 }],
      "Rice (Paddy)": [{ label: "Basal, at transplanting", pct: 100, day: 0 }],
    },
  },

];

const FERT_MATCH_LIST = [];
NUTRIENTS.forEach((n) => {
  FERT_MATCH_LIST.push({ dir: "deficiency", nutrient: n, keywords: n.deficiency.keywords });
  FERT_MATCH_LIST.push({ dir: "excess", nutrient: n, keywords: n.excess.keywords });
});
FERT_MATCH_LIST.push({ dir: "healthy", nutrient: null, keywords: ["healthy", "green", "fine", "normal"] });

const PEST_PROFILES = [
  { id: "sb", label: "Stem Borer", product: "Chlorantraniliprole 18.5% SC", perAcre: 60, unit: "ml", keywords: ["hole", "bore", "stem", "dead heart", "shoot"] },
  { id: "lf", label: "Leaf Folder", product: "Cartap Hydrochloride 4G", perAcre: 4, unit: "kg", keywords: ["fold", "roll", "streak", "curl"] },
  { id: "ap", label: "Aphid infestation", product: "Imidacloprid 17.8% SL", perAcre: 100, unit: "ml", keywords: ["insect", "tiny", "sticky", "cluster", "aphid"] },
  { id: "np", label: "No pest detected", product: "No treatment needed", perAcre: 0, unit: "ml", keywords: ["no damage", "fine", "healthy", "nothing"] },
];

const FERT_BRANDS = ["IFFCO", "Coromandel", "Chambal Fertilisers", "RCF", "Nagarjuna Fertilisers"];
const PEST_BRANDS = ["UPL", "Bayer", "Syngenta", "Dhanuka", "PI Industries"];
const PRICE = { "Urea": 6, "DAP": 27, "MOP": 17, "Chlorantraniliprole 18.5% SC": 18, "Cartap Hydrochloride 4G": 210, "Imidacloprid 17.8% SL": 15 };
const COMMISSION_RATE = { fertilizer: 0.025, pesticide: 0.07, seed: 0.09 };
const OVER_APPLICATION_MULTIPLIER = { fertilizer: 2.5, pesticide: 1.5 };
const SAVINGS_SOURCE = {
  fertilizer: "vs. Punjab's typical 2.5× over-application (Punjab Agri Dept / FAI)",
  pesticide: "vs. estimated typical over-spraying (1.5×, unmeasured application)",
};
// Seed doesn't need AI diagnosis (a farmer already knows what variety he wants) —
// this is a browse-and-order catalog, not a scan flow. Prices per kg, PAU-certified varieties.
const SEED_VARIETIES = {
  "Wheat": [
    { name: "PBW 725", note: "PAU-recommended, rust resistant", price: 32, unit: "per kg" },
    { name: "HD 3086", note: "High yield, widely grown", price: 35, unit: "per kg" },
    { name: "PBW 550", note: "Established, reliable variety", price: 30, unit: "per kg" },
  ],
  "Rice (Paddy)": [
    { name: "PR 126", note: "PAU-recommended, short duration", price: 55, unit: "per kg" },
    { name: "PR 131", note: "High yield, disease tolerant", price: 58, unit: "per kg" },
  ],
};
const CROPS = ["Wheat", "Rice (Paddy)"];
const LANGS = ["Hindi", "English", "Punjabi"];

// Real translations for the core farmer-facing report vocabulary (not the full app chrome).
const TRANSLATIONS = {
  English: {
    moneySaved: "MONEY SAVED THIS SEASON", avoided: "AVOIDED BY NOT OVER-APPLYING", totalSaved: "TOTAL SAVED THIS SEASON",
    required: "REQUIRED (PAU)", typical: "TYPICAL WITHOUT US", noTreatment: "No treatment needed this cycle. Recheck if new symptoms appear.",
    deficient: "Deficient", excess: "Excess", adequate: "Adequate", standardDose: "Standard dose",
    diagnosedVisit: "Diagnosed this visit", standardNotTested: "Standard PAU dose — not tested",
    apply: "Apply", skip: "Skip this cycle's", healthySoil: "soil already has enough",
    readAloud: "Read aloud in", playing: "Playing in",
    nutrients: { "Nitrogen": "Nitrogen", "Phosphorus": "Phosphorus", "Potassium": "Potassium" },
    crops: { "Wheat": "Wheat", "Rice (Paddy)": "Rice (Paddy)" },
    pests: { "Stem Borer": "Stem Borer", "Leaf Folder": "Leaf Folder", "Aphid infestation": "Aphid infestation" },
  },
  Hindi: {
    moneySaved: "इस सीज़न में बचाए गए पैसे", avoided: "अधिक प्रयोग न करके बचाए गए", totalSaved: "कुल बचत",
    required: "आवश्यक", typical: "हमारे बिना सामान्य प्रयोग", noTreatment: "इस चक्र में कोई उपचार आवश्यक नहीं।",
    deficient: "कमी", excess: "अधिकता", adequate: "पर्याप्त", standardDose: "मानक खुराक",
    diagnosedVisit: "इस बार जांचा गया", standardNotTested: "मानक PAU खुराक — जांचा नहीं गया",
    apply: "डालें", skip: "इस बार न डालें", healthySoil: "मिट्टी में पहले से पर्याप्त है",
    readAloud: "जोर से पढ़ें", playing: "बज रहा है",
    nutrients: { "Nitrogen": "नाइट्रोजन", "Phosphorus": "फॉस्फोरस", "Potassium": "पोटैशियम" },
    crops: { "Wheat": "गेहूं", "Rice (Paddy)": "धान" },
    pests: { "Stem Borer": "तना छेदक", "Leaf Folder": "पत्ती मोड़क", "Aphid infestation": "माहू (एफिड)" },
  },
  Punjabi: {
    moneySaved: "ਇਸ ਸੀਜ਼ਨ ਬਚਾਏ ਪੈਸੇ", avoided: "ਵਾਧੂ ਵਰਤੋਂ ਨਾ ਕਰਕੇ ਬਚਾਏ", totalSaved: "ਕੁਲ ਬਚਤ",
    required: "ਲੋੜੀਂਦਾ", typical: "ਸਾਡ਼ੇ ਬਿਨਾਂ ਆਮ ਵਰਤੋਂ", noTreatment: "ਇਸ ਗ਼ਕਰ ਵਿਚ ਕੋਈ ਇਲਾਜ ਦੀ ਲੋੜ ਨਹੀਂਜਿੜਾ ",
    deficient: "ਘਾਟ", excess: "ਵਾਧੂ", adequate: "ਢੁਕਵਾਂ", standardDose: "ਮਿਆਰੀ ਖੁਰਾਕ",
    diagnosedVisit: "ਇਸ ਫੇਰੀ ਜਾਂਚਿਆ ਗਿਆ", standardNotTested: "ਮਿਆਰੀ PAU ਖੁਰਾਕ — ਜਾਂਚਿਆ ਨਹੀਂ",
    apply: "ਪਾਓ", skip: "ਇਸ ਵਾਰ ਨਾ ਪਾਓ", healthySoil: "ਮਿੱਟੀ ਵਿੱਚ ਪਹਿਲਾਂ ਹੀ ਕਾਫੀ ਹੈ",
    readAloud: "ਉੱਚੀ ਆਵਾਜ਼ ਵਿੱਚ ਪੜ੍ਹੋ", playing: "ਚੱਲ ਰਿਹਾ ਹੈ",
    nutrients: { "Nitrogen": "ਨਾਈਟਰੋਜਨ", "Phosphorus": "ਫਾਸਫੋਰਸ", "Potassium": "ਪੋਟਾਸ਼ੀਅਮ" },
    crops: { "Wheat": "ਕਣਕ", "Rice (Paddy)": "ਝੋਨਾ" },
    pests: { "Stem Borer": "ਤਣਾ ਛੇਦਕ", "Leaf Folder": "ਪੱਤਾ ਲਪੇਟ ਸੁੰਡੀ", "Aphid infestation": "ਚੇਪਾ" },
  },
};
function tt(lang, key) { return (TRANSLATIONS[lang] || TRANSLATIONS.English)[key] || TRANSLATIONS.English[key]; }

// UI chrome translations for the new screens (Home, Scan, Buy Seeds, Orders, History, Profile, nav).
const UI_TEXT = {
  English: {
    online: "Online", realtimeAI: "Real-Time AI Available",
    navHome: "Home", navOrders: "Orders", navHistory: "History", navProfile: "Profile",
    hello: "Hello", ji: "Ji", heroSubtitle: "Let's make scientific decisions for your farm today",
    rabiSeason: "Rabi season",
    fertilizerScan: "Fertilizer Scan", pesticideScan: "Pesticide Scan", buySeeds: "Buy Seeds", nearbyDesk: "Nearby Sahi Salah Kendra",
    alertsTitle: "Alerts for your district",
    alert1: "Light rain expected in 48 hrs — delay urea broadcast.",
    alert2: "Whitefly outbreak reported in nearby cotton belt.",
    alert3: "PM-KISAN 19th instalment credited this week.",
    recentScans: "Recent scans", viewAll: "View all",
    balancedNutrition: "Balanced nutrition", cloudVerified: "Cloud verified",
    offlineLibrary: "Offline knowledge library", nutrientTag: "Nutrient",
    libraryEntryTitle: "Nitrogen deficiency in wheat",
    libraryEntryDesc: "Older leaves yellow from tip backwards, thin tillers. Apply 45 kg/acre Urea (PAU-verified).",
    combineMethods: "Combine photo, voice and text for the most accurate diagnosis",
    stepPhoto: "1 · Photo", capturePhoto: "Capture Photo", uploadGallery: "Upload from Gallery", photoAttached: "Photo attached",
    stepVoice: "2 · Voice", speakSymptoms: "Speak Symptoms",
    stepType: "3 · Type symptoms", typePlaceholder: "Describe what you see on the crop...",
    runDiagnosis: "Run AI Diagnosis", backToHome: "Back to Home",
    runningDiagnosis: "Running AI diagnosis…", resultSuffix: "— Result", hereIsWhatWeFound: "Here's what we found",
    seedsSubtitle: "PAU-certified varieties, no diagnosis needed — just pick what you need",
    proceedToOrder: "Proceed to Order",
    ordersSubtitle: "Live tracking and receipts", noOrdersYet: "No orders yet.",
    historySubtitle: "Your past scans and diagnoses", noScansYet: "No scans yet — run a Fertilizer or Pesticide Scan from Home.",
    farmDetails: "Farm details", farmSizeLbl: "FARM SIZE", districtLbl: "DISTRICT", soilLbl: "SOIL", irrigationLbl: "IRRIGATION",
    cropsLbl: "Crops", savedAddress: "Saved address",
    preferredLang: "Preferred language",
    notifications: "Notifications", weatherAlerts: "Weather alerts", pestAlerts: "Pest outbreak alerts",
    fertReminders: "Fertilizer reminders", govtSchemes: "Government schemes", orderUpdates: "Order updates",
    aiConsent: "AI learning consent", aiConsentDesc: "Share anonymised crop, symptom and outcome data to improve diagnosis accuracy",
    agentLogin: "Agent Login",
    yourOrder: "Your Order", moneySavedLabel: "MONEY SAVED THIS SEASON",
    yourName: "YOUR NAME", phoneLbl: "PHONE", fullNamePlaceholder: "Full name", phoneNumPlaceholder: "98765 43210",
    fillInBoth: "your name and phone number", fillInName: "your name", fillInPhone: "your phone number",
    pleaseFillIn: "Please fill in", toCompleteCheckout: "to complete checkout.",
    brandLbl: "BRAND", qtyLbl: "QTY", paymentMethodLbl: "PAYMENT METHOD", upiLbl: "UPI", cashOnPickup: "Cash on Pickup",
    amountToPay: "Amount to pay", payNow: "Pay Now", confirmPayAtPickup: "Confirm — Pay at Pickup",
    processingPayment: "Processing UPI payment…",
    inStock: "In Stock", lowStock: "Low Stock", outOfStock: "Out of Stock",
    orderPlaced: "Order Placed!", orderConfirmedMsg: "Your order has been confirmed successfully.", totalPaid: "Total paid",
    soilAlluvialLoam: "Alluvial loam", irrigationTubewell: "Tubewell",
    deskSubtitle: "Your nearest desk for in-person diagnosis and orders",
    deskHours: "Open Mon–Sat, 9 AM – 6 PM", deskStaffed: "Staffed by a trained agent for in-person diagnosis and orders",
    deskIllustrative: "Desk location shown is illustrative for your district — exact address confirmed on first visit as the desk network expands.",
    nearMandi: "Near the local mandi",
  },
  Hindi: {
    online: "ऑनलाइन", realtimeAI: "रीयल-टाइम AI उपलब्ध",
    navHome: "होम", navOrders: "ऑर्डर", navHistory: "इतिहास", navProfile: "प्रोफ़ाइल",
    hello: "नमस्ते", ji: "जी", heroSubtitle: "आज अपने खेत के लिए वैज्ञानिक फ़ैसले लें",
    rabiSeason: "रबी का मौसम",
    fertilizerScan: "उर्वरक जांच", pesticideScan: "कीटनाशक जांच", buySeeds: "बीज खरीदें", nearbyDesk: "नज़दीकी सही सलाह केंद्र",
    alertsTitle: "आपके ज़िले के लिए सूचनाएं",
    alert1: "48 घंटों में हल्की बारिश की संभावना — यूरिया डालना टालें।",
    alert2: "पास के कपास क्षेत्र में सफ़ेद मक्खी का प्रकोप।",
    alert3: "इस सप्ताह PM-KISAN की 19वीं किस्त जमा हुई।",
    recentScans: "हाल की जांचें", viewAll: "सभी देखें",
    balancedNutrition: "संतुलित पोषण", cloudVerified: "क्लाउड सत्यापित",
    offlineLibrary: "ऑफ़लाइन ज्ञान पुस्तकालय", nutrientTag: "पोषक तत्व",
    libraryEntryTitle: "गेहूं में नाइट्रोजन की कमी",
    libraryEntryDesc: "पुरानी पत्तियां सिरे से पीली पड़ना, पतले कल्ले। 45 किग्रा/एकड़ यूरिया डालें (PAU-सत्यापित)।",
    combineMethods: "सबसे सटीक जांच के लिए फ़ोटो, आवाज़ और टेक्स्ट मिलाएं",
    stepPhoto: "1 · फ़ोटो", capturePhoto: "फ़ोटो लें", uploadGallery: "गैलरी से अपलोड करें", photoAttached: "फ़ोटो जुड़ी है",
    stepVoice: "2 · आवाज़", speakSymptoms: "लक्षण बोलें",
    stepType: "3 · लक्षण लिखें", typePlaceholder: "फ़सल पर जो दिख रहा है वह बताएं...",
    runDiagnosis: "AI जांच चलाएं", backToHome: "होम पर वापस जाएं",
    runningDiagnosis: "AI जांच चल रही है…", resultSuffix: "— परिणाम", hereIsWhatWeFound: "यह पाया गया है",
    seedsSubtitle: "PAU-प्रमाणित किस्में, जांच की ज़रूरत नहीं — बस चुनें",
    proceedToOrder: "ऑर्डर करें",
    ordersSubtitle: "लाइव ट्रैकिंग और रसीदें", noOrdersYet: "अभी कोई ऑर्डर नहीं।",
    historySubtitle: "आपकी पिछली जांचें", noScansYet: "अभी कोई जांच नहीं — होम से उर्वरक या कीटनाशक जांच करें।",
    farmDetails: "खेत का विवरण", farmSizeLbl: "खेत का आकार", districtLbl: "ज़िला", soilLbl: "मिट्टी", irrigationLbl: "सिंचाई",
    cropsLbl: "फ़सलें", savedAddress: "सहेजा गया पता",
    preferredLang: "पसंदीदा भाषा",
    notifications: "सूचनाएं", weatherAlerts: "मौसम अलर्ट", pestAlerts: "कीट प्रकोप अलर्ट",
    fertReminders: "उर्वरक अनुस्मारक", govtSchemes: "सरकारी योजनाएं", orderUpdates: "ऑर्डर अपडेट",
    aiConsent: "AI लर्निंग सहमति", aiConsentDesc: "जांच सटीकता बेहतर करने हेतु गुमनाम फ़सल, लक्षण व परिणाम डेटा साझा करें",
    agentLogin: "एजेंट लॉगिन",
    yourOrder: "आपका ऑर्डर", moneySavedLabel: "इस सीज़न में बचाई गई राशि",
    yourName: "आपका नाम", phoneLbl: "फ़ोन", fullNamePlaceholder: "पूरा नाम", phoneNumPlaceholder: "98765 43210",
    fillInBoth: "अपना नाम और फ़ोन नंबर", fillInName: "अपना नाम", fillInPhone: "अपना फ़ोन नंबर",
    pleaseFillIn: "कृपया भरें", toCompleteCheckout: "चेकआउट पूरा करने के लिए।",
    brandLbl: "ब्रांड", qtyLbl: "मात्रा", paymentMethodLbl: "भुगतान का तरीका", upiLbl: "UPI", cashOnPickup: "पिकअप पर नकद",
    amountToPay: "देय राशि", payNow: "अभी भुगतान करें", confirmPayAtPickup: "पुष्टि करें — पिकअप पर भुगतान",
    processingPayment: "UPI भुगतान हो रहा है…",
    inStock: "स्टॉक में", lowStock: "सीमित स्टॉक", outOfStock: "स्टॉक ख़त्म",
    orderPlaced: "ऑर्डर दर्ज हुआ!", orderConfirmedMsg: "आपका ऑर्डर सफलतापूर्वक पुष्ट हो गया है।", totalPaid: "कुल भुगतान",
    soilAlluvialLoam: "जलोढ़ दोमट", irrigationTubewell: "ट्यूबवेल",
    deskSubtitle: "व्यक्तिगत जांच और ऑर्डर के लिए आपका नज़दीकी केंद्र",
    deskHours: "सोम–शनि, सुबह 9 – शाम 6 बजे खुला", deskStaffed: "व्यक्तिगत जांच व ऑर्डर के लिए प्रशिक्षित एजेंट मौजूद",
    deskIllustrative: "दिखाया गया केंद्र स्थान आपके ज़िले के लिए उदाहरण है — डेस्क नेटवर्क बढ़ने पर पहली विज़िट पर पता पक्का होगा।",
    nearMandi: "स्थानीय मंडी के पास",
  },
  Punjabi: {
    online: "ਆਨਲਾਈਨ", realtimeAI: "ਰੀਅਲ-ਟਾਈਮ AI ਉਪਲਬਧ",
    navHome: "ਹੋਮ", navOrders: "ਆਰਡਰ", navHistory: "ਇਤਿਹਾਸ", navProfile: "ਪ੍ਰੋਫ਼ਾਈਲ",
    hello: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", ji: "ਜੀ", heroSubtitle: "ਅੱਜ ਆਪਣੇ ਖੇਤ ਲਈ ਵਿਗਿਆਨਕ ਫ਼ੈਸਲੇ ਲਓ",
    rabiSeason: "ਹਾੜੀ ਦਾ ਸੀਜ਼ਨ",
    fertilizerScan: "ਖਾਦ ਜਾਂਚ", pesticideScan: "ਕੀਟਨਾਸ਼ਕ ਜਾਂਚ", buySeeds: "ਬੀਜ ਖਰੀਦੋ", nearbyDesk: "ਨਜ਼ਦੀਕੀ ਸਹੀ ਸਲਾਹ ਕੇਂਦਰ",
    alertsTitle: "ਤੁਹਾਡੇ ਜ਼ਿਲ੍ਹੇ ਲਈ ਸੂਚਨਾਵਾਂ",
    alert1: "48 ਘੰਟਿਆਂ ਵਿੱਚ ਹਲਕੀ ਬਾਰਿਸ਼ ਦੀ ਸੰਭਾਵਨਾ — ਯੂਰੀਆ ਪਾਉਣਾ ਟਾਲੋ।",
    alert2: "ਨੇੜਲੇ ਕਪਾਹ ਖੇਤਰ ਵਿੱਚ ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਹਮਲਾ।",
    alert3: "ਇਸ ਹਫ਼ਤੇ PM-KISAN ਦੀ 19ਵੀਂ ਕਿਸ਼ਤ ਜਮ੍ਹਾਂ ਹੋਈ।",
    recentScans: "ਹਾਲੀਆ ਜਾਂਚਾਂ", viewAll: "ਸਭ ਦੇਖੋ",
    balancedNutrition: "ਸੰਤੁਲਿਤ ਪੋਸ਼ਣ", cloudVerified: "ਕਲਾਊਡ ਪ੍ਰਮਾਣਿਤ",
    offlineLibrary: "ਆਫ਼ਲਾਈਨ ਗਿਆਨ ਲਾਇਬ੍ਰੇਰੀ", nutrientTag: "ਪੋਸ਼ਕ ਤੱਤ",
    libraryEntryTitle: "ਕਣਕ ਵਿੱਚ ਨਾਈਟਰੋਜਨ ਦੀ ਘਾਟ",
    libraryEntryDesc: "ਪੁਰਾਣੇ ਪੱਤੇ ਸਿਰੇ ਤੋਂ ਪੀਲੇ, ਪਤਲੇ ਕੱਲਰ। 45 ਕਿਲੋ/ਏਕੜ ਯੂਰੀਆ ਪਾਓ (PAU-ਪ੍ਰਮਾਣਿਤ)।",
    combineMethods: "ਸਭ ਤੋਂ ਸਟੀਕ ਜਾਂਚ ਲਈ ਫ਼ੋਟੋ, ਆਵਾਜ਼ ਤੇ ਲਿਖਤ ਮਿਲਾਓ",
    stepPhoto: "1 · ਫ਼ੋਟੋ", capturePhoto: "ਫ਼ੋਟੋ ਖਿੱਚੋ", uploadGallery: "ਗੈਲਰੀ ਤੋਂ ਅਪਲੋਡ ਕਰੋ", photoAttached: "ਫ਼ੋਟੋ ਜੁੜੀ ਹੈ",
    stepVoice: "2 · ਆਵਾਜ਼", speakSymptoms: "ਲੱਛਣ ਬੋਲੋ",
    stepType: "3 · ਲੱਛਣ ਲਿਖੋ", typePlaceholder: "ਫ਼ਸਲ 'ਤੇ ਜੋ ਦਿਖ ਰਿਹਾ ਹੈ ਦੱਸੋ...",
    runDiagnosis: "AI ਜਾਂਚ ਚਲਾਓ", backToHome: "ਹੋਮ 'ਤੇ ਵਾਪਸ ਜਾਓ",
    runningDiagnosis: "AI ਜਾਂਚ ਚੱਲ ਰਹੀ ਹੈ…", resultSuffix: "— ਨਤੀਜਾ", hereIsWhatWeFound: "ਇਹ ਪਾਇਆ ਗਿਆ ਹੈ",
    seedsSubtitle: "PAU-ਪ੍ਰਮਾਣਿਤ ਕਿਸਮਾਂ, ਜਾਂਚ ਦੀ ਲੋੜ ਨਹੀਂ — ਬਸ ਚੁਣੋ",
    proceedToOrder: "ਆਰਡਰ ਕਰੋ",
    ordersSubtitle: "ਲਾਈਵ ਟਰੈਕਿੰਗ ਤੇ ਰਸੀਦਾਂ", noOrdersYet: "ਹਾਲੇ ਕੋਈ ਆਰਡਰ ਨਹੀਂ।",
    historySubtitle: "ਤੁਹਾਡੀਆਂ ਪਿਛਲੀਆਂ ਜਾਂਚਾਂ", noScansYet: "ਹਾਲੇ ਕੋਈ ਜਾਂਚ ਨਹੀਂ — ਹੋਮ ਤੋਂ ਖਾਦ ਜਾਂ ਕੀਟਨਾਸ਼ਕ ਜਾਂਚ ਕਰੋ।",
    farmDetails: "ਖੇਤ ਦਾ ਵੇਰਵਾ", farmSizeLbl: "ਖੇਤ ਦਾ ਆਕਾਰ", districtLbl: "ਜ਼ਿਲ੍ਹਾ", soilLbl: "ਮਿੱਟੀ", irrigationLbl: "ਸਿੰਚਾਈ",
    cropsLbl: "ਫ਼ਸਲਾਂ", savedAddress: "ਸੰਭਾਲਿਆ ਪਤਾ",
    preferredLang: "ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ",
    notifications: "ਸੂਚਨਾਵਾਂ", weatherAlerts: "ਮੌਸਮ ਅਲਰਟ", pestAlerts: "ਕੀਟ ਹਮਲਾ ਅਲਰਟ",
    fertReminders: "ਖਾਦ ਯਾਦ-ਦਹਾਨੀ", govtSchemes: "ਸਰਕਾਰੀ ਸਕੀਮਾਂ", orderUpdates: "ਆਰਡਰ ਅਪਡੇਟ",
    aiConsent: "AI ਸਿਖਲਾਈ ਸਹਿਮਤੀ", aiConsentDesc: "ਜਾਂਚ ਸ਼ੁੱਧਤਾ ਸੁਧਾਰਨ ਲਈ ਅਗਿਆਤ ਫ਼ਸਲ, ਲੱਛਣ ਤੇ ਨਤੀਜਾ ਡਾਟਾ ਸਾਂਝਾ ਕਰੋ",
    agentLogin: "ਏਜੰਟ ਲਾਗਇਨ",
    yourOrder: "ਤੁਹਾਡਾ ਆਰਡਰ", moneySavedLabel: "ਇਸ ਸੀਜ਼ਨ ਵਿੱਚ ਬਚਾਈ ਗਈ ਰਕਮ",
    yourName: "ਤੁਹਾਡਾ ਨਾਮ", phoneLbl: "ਫ਼ੋਨ", fullNamePlaceholder: "ਪੂਰਾ ਨਾਮ", phoneNumPlaceholder: "98765 43210",
    fillInBoth: "ਆਪਣਾ ਨਾਮ ਤੇ ਫ਼ੋਨ ਨੰਬਰ", fillInName: "ਆਪਣਾ ਨਾਮ", fillInPhone: "ਆਪਣਾ ਫ਼ੋਨ ਨੰਬਰ",
    pleaseFillIn: "ਕਿਰਪਾ ਕਰਕੇ ਭਰੋ", toCompleteCheckout: "ਚੈੱਕਆਉਟ ਪੂਰਾ ਕਰਨ ਲਈ।",
    brandLbl: "ਬ੍ਰਾਂਡ", qtyLbl: "ਮਾਤਰਾ", paymentMethodLbl: "ਭੁਗਤਾਨ ਤਰੀਕਾ", upiLbl: "UPI", cashOnPickup: "ਪਿਕਅੱਪ 'ਤੇ ਨਕਦ",
    amountToPay: "ਦੇਣ ਵਾਲੀ ਰਕਮ", payNow: "ਹੁਣੇ ਭੁਗਤਾਨ ਕਰੋ", confirmPayAtPickup: "ਪੁਸ਼ਟੀ ਕਰੋ — ਪਿਕਅੱਪ 'ਤੇ ਭੁਗਤਾਨ",
    processingPayment: "UPI ਭੁਗਤਾਨ ਹੋ ਰਿਹਾ ਹੈ…",
    inStock: "ਸਟਾਕ ਵਿੱਚ", lowStock: "ਸੀਮਤ ਸਟਾਕ", outOfStock: "ਸਟਾਕ ਖ਼ਤਮ",
    orderPlaced: "ਆਰਡਰ ਦਰਜ ਹੋਇਆ!", orderConfirmedMsg: "ਤੁਹਾਡਾ ਆਰਡਰ ਸਫਲਤਾਪੂਰਵਕ ਪੁਸ਼ਟੀ ਹੋ ਗਿਆ ਹੈ।", totalPaid: "ਕੁੱਲ ਭੁਗਤਾਨ",
    soilAlluvialLoam: "ਜਲੋੜ੍ਹ ਦੋਮਟ", irrigationTubewell: "ਟਿਊਬਵੈੱਲ",
    deskSubtitle: "ਵਿਅਕਤੀਗਤ ਜਾਂਚ ਤੇ ਆਰਡਰ ਲਈ ਤੁਹਾਡਾ ਨਜ਼ਦੀਕੀ ਕੇਂਦਰ",
    deskHours: "ਸੋਮ–ਸ਼ਨੀ, ਸਵੇਰੇ 9 – ਸ਼ਾਮ 6 ਵਜੇ ਖੁੱਲ੍ਹਾ", deskStaffed: "ਵਿਅਕਤੀਗਤ ਜਾਂਚ ਤੇ ਆਰਡਰ ਲਈ ਸਿਖਲਾਈ-ਪ੍ਰਾਪਤ ਏਜੰਟ ਮੌਜੂਦ",
    deskIllustrative: "ਦਿਖਾਇਆ ਗਿਆ ਕੇਂਦਰ ਸਥਾਨ ਤੁਹਾਡੇ ਜ਼ਿਲ੍ਹੇ ਲਈ ਉਦਾਹਰਨ ਹੈ — ਡੈਸਕ ਨੈੱਟਵਰਕ ਵਧਣ 'ਤੇ ਪਹਿਲੀ ਫੇਰੀ 'ਤੇ ਪਤਾ ਪੱਕਾ ਹੋਵੇਗਾ।",
    nearMandi: "ਸਥਾਨਕ ਮੰਡੀ ਦੇ ਨੇੜੇ",
  },
};
function ui(lang, key) { return (UI_TEXT[lang] || UI_TEXT.English)[key] || UI_TEXT.English[key]; }

function translateName(lang, name) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.English;
  for (const set of [dict.pests, dict.crops, dict.nutrients]) if (set && set[name]) return set[name];
  return name;
}

// Illustrative weather advisories (demo only — not a live forecast integration).
const WEATHER_ADVISORIES = [
  { icon: "rain", text: "Rain expected in the next 2 days — consider applying before it arrives so nutrients aren't washed away." },
  { icon: "clear", text: "Clear skies expected for the next 5 days — safe window to apply on schedule." },
  { icon: "heat", text: "High heat expected — apply early morning or evening to reduce volatilisation loss." },
];
function getWeatherAdvisory(seed) {
  const idx = Math.abs(seed) % WEATHER_ADVISORIES.length;
  return WEATHER_ADVISORIES[idx];
}

// Illustrative verified-seller stock levels (demo only — a real deployment would sync this per desk).
const INVENTORY = {
  IFFCO: "In Stock", Coromandel: "In Stock", "Chambal Fertilisers": "Low Stock", RCF: "In Stock", "Nagarjuna Fertilisers": "Low Stock",
  UPL: "In Stock", Bayer: "In Stock", Syngenta: "Low Stock", Dhanuka: "In Stock", "PI Industries": "Out of Stock",
};


const PUNJAB_ZONES = [
  { name: "Amritsar", lat: 31.63, lng: 74.87, zone: "Central Plain — alluvial loam" },
  { name: "Ludhiana", lat: 30.90, lng: 75.85, zone: "Central Plain — alluvial loam" },
  { name: "Patiala", lat: 30.34, lng: 76.38, zone: "Central Plain — alluvial loam" },
  { name: "Jalandhar", lat: 31.33, lng: 75.58, zone: "Central Plain — alluvial loam" },
  { name: "Sangrur", lat: 30.24, lng: 75.84, zone: "Central Plain — alluvial loam" },
  { name: "Bathinda", lat: 30.21, lng: 74.95, zone: "South-West Plain — sandy loam, semi-arid" },
  { name: "Ferozepur", lat: 30.93, lng: 74.61, zone: "South-West Plain — sandy loam" },
  { name: "Mansa", lat: 29.98, lng: 75.40, zone: "South-West Plain — sandy, saline-prone" },
  { name: "Hoshiarpur", lat: 31.53, lng: 75.91, zone: "Sub-mountainous (Kandi) — loamy-skeletal" },
  { name: "Gurdaspur", lat: 32.04, lng: 75.40, zone: "Sub-mountainous (Kandi) — loamy-skeletal" },
  { name: "Rupnagar", lat: 30.97, lng: 76.53, zone: "Sub-mountainous (Kandi) — loamy-skeletal" },
];

const PHOTO_STAGES = ["Uploading field image…", "Running leaf-pattern segmentation…", "Comparing against reference leaf samples…", "Cross-referencing ICAR / PAU regional dose tables…", "Adjusting for land size and crop stage…", "Calibrating confidence score…"];
const PEST_PHOTO_STAGES = ["Uploading pest image…", "Running pest-pattern detection…", "Comparing against reference pest samples…", "Cross-referencing verified pesticide guidelines…", "Adjusting for land size…", "Calibrating confidence score…"];
const TEXT_STAGES = ["Parsing field description…", "Matching symptom pattern against regional database…", "Cross-referencing verified agronomic guidelines…", "Adjusting for land size and soil inputs…", "Calibrating confidence score…"];
const SHC_STAGES = ["Reading Soil Health Card values…", "Comparing N, P, K against PAU reference ranges…", "Computing field-specific dose for each nutrient…", "Adjusting for land size…", "Finalizing full soil report…"];

function genReportId() { return "KM-" + Math.floor(1000 + Math.random() * 9000) + "-RPT"; }

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------- core calculation logic ----------

function computeSavings(category, perAcre, landSize, product) {
  if (perAcre === 0) return { savings: 0, required: 0, typical: 0 };
  const unitPrice = PRICE[product] || 10;
  const required = Math.round(perAcre * landSize * 10) / 10;
  const typical = Math.round(required * OVER_APPLICATION_MULTIPLIER[category] * 10) / 10;
  const commission = Math.round(required * unitPrice * COMMISSION_RATE[category]);
  const savings = Math.max(0, Math.round((typical - required) * unitPrice - commission));
  return { savings, required, typical };
}

function buildFertReportData(dir, nutrient, landSize) {
  if (dir === "healthy" || !nutrient) {
    return { name: "Healthy — balanced", product: "No fertilizer needed", qty: 0, unit: "kg", action: "No fertilizer needed this cycle", savings: 0, required: 0, typical: 0, dir: "healthy" };
  }
  if (dir === "deficiency" || dir === "standard") {
    const { savings, required, typical } = computeSavings("fertilizer", nutrient.perAcre, landSize, nutrient.product);
    const label = dir === "standard" ? `${nutrient.name} — standard dose` : nutrient.deficiency.label;
    return { name: label, product: nutrient.product, qty: required, unit: nutrient.unit, action: `Apply ${required} ${nutrient.unit}`, savings, required, typical, dir };
  }
  const price = PRICE[nutrient.product] || 10;
  const required = Math.round(nutrient.perAcre * landSize * 10) / 10;
  const typical = Math.round(required * OVER_APPLICATION_MULTIPLIER.fertilizer * 10) / 10;
  const savings = Math.round((typical - required) * price);
  return { name: nutrient.excess.label, product: nutrient.product, qty: 0, unit: nutrient.unit, action: `Skip this cycle's ${nutrient.product} — soil already has enough`, savings, required, typical, dir };
}

// PAU cross-nutrient rule: DAP itself supplies usable nitrogen, so a full Urea dose isn't
// needed alongside a full DAP dose. Approximated from PAU's "130 kg DAP/ha -> 50 kg less
// urea/ha" guidance, scaled to per-acre.
function applyCrossNutrientRule(rows, landSize) {
  const pRow = rows.find((r) => r.nutrient && r.nutrient.key === "p");
  const nRow = rows.find((r) => r.nutrient && r.nutrient.key === "n");
  if (pRow && nRow && pRow.qty > 0 && nRow.qty > 0) {
    const reduction = Math.min(nRow.required, Math.round(20 * landSize * 10) / 10);
    if (reduction > 0) {
      const newRequired = Math.round((nRow.required - reduction) * 10) / 10;
      const price = PRICE["Urea"] || 6;
      const commission = Math.round(newRequired * price * COMMISSION_RATE.fertilizer);
      const newSavings = Math.max(0, Math.round((nRow.typical - newRequired) * price - commission));
      nRow.qty = newRequired;
      nRow.required = newRequired;
      nRow.savings = newSavings;
      nRow.action = `Apply ${newRequired} kg (reduced ${reduction}kg — DAP already supplies usable nitrogen, PAU guidance)`;
      nRow.crossAdjusted = true;
    }
  }
  return rows;
}

function attachTiming(rows, crop) {
  return rows.map((r) => {
    if (r.dir === "healthy" || r.qty === 0) return r;
    const schedule = r.nutrient.timing[crop] || r.nutrient.timing["Wheat"];
    const splits = schedule.map((s) => ({ label: s.label, day: s.day, amount: Math.round(r.qty * s.pct) / 100 }));
    return { ...r, schedule: splits };
  });
}

// Given a report's generation timestamp and its schedule, finds the next upcoming
// application stage (demo-only reminder — no real push notifications in a client-only app).
function nextReminder(report) {
  if (!report || report.type !== "multi") return null;
  const generated = new Date(report.timestamp);
  if (isNaN(generated)) return null;
  const daysSince = Math.floor((Date.now() - generated.getTime()) / 86400000);
  let best = null;
  report.rows.forEach((r) => {
    if (!r.schedule) return;
    r.schedule.forEach((s) => {
      if (s.day >= daysSince && (!best || s.day < best.day)) best = { ...s, nutrient: r.nutrient.name, product: r.product, unit: r.unit, daysAway: s.day - daysSince };
    });
  });
  return best;
}

// Builds a full 3-nutrient season plan from a single photo/text diagnosis: the diagnosed
// nutrient carries its real status; the other two get PAU's standard baseline dose, clearly
// labeled as "not specifically tested this visit" rather than a claimed diagnosis.
function buildSeasonPlan(diagnosedKey, diagnosedDir, landSize, crop) {
  let rows = NUTRIENTS.map((n) => {
    const dir = n.key === diagnosedKey ? diagnosedDir : "standard";
    return { nutrient: n, value: null, status: dir, confirmed: n.key === diagnosedKey, ...buildFertReportData(dir, n, landSize) };
  });
  rows = applyCrossNutrientRule(rows, landSize);
  rows = attachTiming(rows, crop);
  const totalSavings = rows.reduce((s, r) => s + r.savings, 0);
  return { rows, totalSavings };
}

function analyzeSoilCard(shc, landSize, crop) {
  let rows = NUTRIENTS.map((n) => {
    const val = Number(shc[n.key]);
    let dir = "healthy";
    if (val < n.shcLow) dir = "deficiency";
    else if (val > n.shcHigh) dir = "excess";
    return { nutrient: n, value: val, status: dir, confirmed: true, ...buildFertReportData(dir, n, landSize) };
  });
  rows = applyCrossNutrientRule(rows, landSize);
  rows = attachTiming(rows, crop);
  return rows;
}

function matchFertText(text) {
  const t = text.toLowerCase();
  const searchable = FERT_MATCH_LIST.filter((p) => p.dir !== "healthy");
  let best = null, bestScore = 0;
  searchable.forEach((p) => {
    const score = p.keywords.reduce((s, k) => s + (t.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = p; }
  });
  if (best && bestScore > 0) return { match: best, confidence: Math.min(96, 78 + bestScore * 6) };
  return { match: searchable[Math.floor(Math.random() * searchable.length)], confidence: Math.floor(65 + Math.random() * 8) };
}

function matchFertPhoto() {
  const pool = FERT_MATCH_LIST.filter((p) => p.dir !== "healthy");
  return { match: pool[Math.floor(Math.random() * pool.length)], confidence: Math.floor(80 + Math.random() * 14) };
}

function matchPestText(text) {
  const t = text.toLowerCase();
  const searchable = PEST_PROFILES.filter((p) => p.perAcre > 0);
  let best = null, bestScore = 0;
  searchable.forEach((p) => {
    const score = p.keywords.reduce((s, k) => s + (t.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = p; }
  });
  if (best && bestScore > 0) return { profile: best, confidence: Math.min(96, 78 + bestScore * 6) };
  return { profile: searchable[Math.floor(Math.random() * searchable.length)], confidence: Math.floor(65 + Math.random() * 8) };
}

function matchPestPhoto() {
  const pool = PEST_PROFILES.filter((p) => p.perAcre > 0);
  return { profile: pool[Math.floor(Math.random() * pool.length)], confidence: Math.floor(80 + Math.random() * 14) };
}

// ---------- shared UI ----------

function ConfidenceRing({ percent, color = C.green, size = 96 }) {
  const r = 38, c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" className="shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" stroke={C.lightgray} strokeWidth="9" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x="48" y="53" textAnchor="middle" fontSize="20" fontWeight="700" fill={color}>{percent}%</text>
    </svg>
  );
}

function Badge({ children, tone = "gold" }) {
  const bg = tone === "gold" ? C.gold : tone === "green" ? C.green : tone === "warn" ? "#B3261E" : tone === "gray" ? C.lightgray : C.darkgreen;
  const fg = tone === "gold" ? C.darkgreen : tone === "gray" ? C.gray : C.white;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: bg, color: fg }}>
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick, disabled, full, icon: Icon, type = "button" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${full ? "w-full" : ""}`}
      style={{ backgroundColor: C.green, color: C.white }}>
      {Icon && <Icon size={17} />}{children}
    </button>
  );
}

function LanguagePicker({ lang, setLang }) {
  return (
    <div className="flex gap-2">
      {LANGS.map((l) => (
        <button key={l} onClick={() => setLang(l)} className="rounded-full px-3 py-1 text-xs font-semibold border transition-colors"
          style={lang === l ? { backgroundColor: C.green, color: C.white, borderColor: C.green } : { backgroundColor: "transparent", color: C.gray, borderColor: C.lightgray }}>
          {l}
        </button>
      ))}
    </div>
  );
}

// ---------- mic-enabled inputs ----------

function MicInput({ value, onChange, placeholder, type = "text", icon: Icon }) {
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState("");
  const recogRef = useRef(null);

  const toggle = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setErr("Mic unavailable — please type instead."); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    setErr("");
    const recog = new SR();
    recog.lang = "en-IN"; recog.interimResults = true; recog.continuous = false;
    recog.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      if (type === "number") { const digits = transcript.replace(/[^0-9.]/g, ""); onChange(digits || transcript); }
      else onChange(transcript);
    };
    recog.onerror = (e) => { setErr(e.error === "not-allowed" ? "Mic permission blocked." : "Couldn't access the mic."); setListening(false); };
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    try { recog.start(); setListening(true); } catch { setErr("Couldn't start the mic."); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: listening ? C.green : C.lightgray }}>
        {Icon && <Icon size={16} color={C.gray} />}
        <input inputMode={type === "number" ? "decimal" : "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full outline-none text-sm bg-transparent placeholder:text-[#6B7268]" />
        <button type="button" onClick={toggle} className="rounded-full p-1.5 shrink-0" style={{ backgroundColor: listening ? C.green : C.cream }}>
          <Mic size={13} color={listening ? C.white : C.darkgreen} className={listening ? "animate-pulse" : ""} />
        </button>
      </div>
      {err && <div className="text-xs mt-1" style={{ color: C.gray }}>{err}</div>}
    </div>
  );
}

function SpeechField({ value, onChange, placeholder }) {
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const recogRef = useRef(null);

  const toggleListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicError("Microphone input isn't available here — please type instead."); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    setMicError("");
    const recog = new SR();
    recog.lang = "en-IN"; recog.interimResults = true; recog.continuous = false;
    recog.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      onChange(transcript);
    };
    recog.onerror = (e) => { setMicError(e.error === "not-allowed" ? "Microphone permission blocked — please type instead." : "Couldn't access the microphone — please type instead."); setListening(false); };
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    try { recog.start(); setListening(true); } catch { setMicError("Couldn't start the microphone — please type instead."); }
  };

  return (
    <div>
      <div className="relative">
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full rounded-xl border px-4 py-3 pr-14 text-sm outline-none resize-none placeholder:text-[#6B7268]" style={{ borderColor: listening ? C.green : C.lightgray, color: C.black }} />
        <button type="button" onClick={toggleListen} className="absolute right-3 top-3 rounded-full p-2 transition-colors" style={{ backgroundColor: listening ? C.green : C.cream }} title="Speak your observation">
          <Mic size={16} color={listening ? C.white : C.darkgreen} className={listening ? "animate-pulse" : ""} />
        </button>
      </div>
      {listening && <div className="text-xs font-medium mt-1.5" style={{ color: C.green }}>Listening…</div>}
      {micError && <div className="text-xs mt-1.5" style={{ color: C.gray }}>{micError}</div>}
    </div>
  );
}

function LandSizeInput({ value, onChange, label }) {
  return (
    <div>
      <label className="text-xs font-semibold" style={{ color: C.gray }}>{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1"><MicInput type="number" icon={Ruler} value={value} onChange={onChange} placeholder="Acres" /></div>
        <button type="button" onClick={() => onChange(String(PUNJAB_AVG_ACRES))}
          className="text-xs font-semibold rounded-lg px-3 py-2.5 border whitespace-nowrap" style={{ borderColor: C.green, color: C.green }}>
          Punjab avg ({PUNJAB_AVG_ACRES})
        </button>
      </div>
    </div>
  );
}

// ---------- analysis sequence ----------

function AnalyzingSequence({ stages, durationMs, onDone }) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const stageMs = durationMs / stages.length;
    const stageTimer = setInterval(() => setIdx((i) => Math.min(i + 1, stages.length - 1)), stageMs);
    const start = Date.now();
    const progTimer = setInterval(() => setProgress(Math.min(100, ((Date.now() - start) / durationMs) * 100)), 80);
    const doneTimer = setTimeout(onDone, durationMs);
    return () => { clearInterval(stageTimer); clearInterval(progTimer); clearTimeout(doneTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="rounded-2xl p-8 border text-center" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
      <div className="mx-auto mb-6 rounded-full w-16 h-16 flex items-center justify-center" style={{ backgroundColor: C.cream, border: `1.5px solid ${C.green}` }}>
        <ScanLine size={28} color={C.green} className="animate-pulse" />
      </div>
      <div className="text-lg font-bold mb-1" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>Running Analysis</div>
      <div className="text-sm mb-6" style={{ color: C.gray }}>{stages[idx]}</div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.lightgray }}>
        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: C.green, transition: "width 0.1s linear" }} />
      </div>
      <div className="text-xs mt-2 font-semibold" style={{ color: C.gray }}>{Math.floor(progress)}%</div>
    </div>
  );
}

// ---------- report building blocks ----------

function MoneySavedBlock({ amount, label = "MONEY SAVED THIS SEASON" }) {
  if (!amount) return null;
  return (
    <div className="rounded-2xl p-6 mb-4 text-center" style={{ backgroundColor: C.darkgreen }}>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <TrendingDown size={16} color={C.gold} />
        <span className="text-xs font-semibold tracking-wide" style={{ color: C.gold }}>{label}</span>
      </div>
      <div className="text-5xl font-bold" style={{ ...DISPLAY_FONT, color: C.white }}>₹{amount.toLocaleString("en-IN")}</div>
    </div>
  );
}

function ComparisonBlock({ required, typical, unit, lang = "English" }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.cream }}>
        <div className="text-xs font-semibold" style={{ color: C.gray }}>{tt(lang, "required")}</div>
        <div className="font-bold text-lg" style={{ color: C.darkgreen }}>{required} {unit}</div>
      </div>
      <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.cream }}>
        <div className="text-xs font-semibold" style={{ color: C.gray }}>{tt(lang, "typical")}</div>
        <div className="font-bold text-lg" style={{ color: C.gray }}>{typical} {unit}</div>
      </div>
    </div>
  );
}

function CredentialsBlock({ report }) {
  return (
    <div className="rounded-xl p-4 border mb-4" style={{ borderColor: C.lightgray }}>
      <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: C.gray }}><ShieldCheck size={13} /> ANALYSIS DETAILS</div>
      <div className="grid grid-cols-2 gap-y-1.5 text-xs" style={{ color: C.black }}>
        <div>Report ID: <span className="font-semibold">{report.id}</span></div>
        <div>Generated: <span className="font-semibold">{report.timestamp}</span></div>
        <div>Model: <span className="font-semibold">{report.model}</span></div>
        <div>Source: <span className="font-semibold">{report.source}</span></div>
      </div>
    </div>
  );
}

function MultiNutrientReport({ report, lang, showOrderCta, onOrderCart }) {
  const orderable = report.rows.filter((r) => r.dir !== "healthy" && r.qty > 0);
  const [selected, setSelected] = useState(() => new Set(orderable.map((r) => r.nutrient.key)));
  const toggle = (key) => setSelected((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  const weather = getWeatherAdvisory((report.id || "").length + report.rows.length);
  const WeatherIcon = weather.icon === "rain" ? CloudRain : weather.icon === "heat" ? Thermometer : Sun;
  const reminder = nextReminder(report);

  return (
    <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical size={20} color={C.green} />
        <div className="text-xl font-bold" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>Full Season Fertilizer Plan</div>
      </div>
      <div className="text-xs mb-4" style={{ color: C.gray }}>
        {report.method === "shc" ? "Based on your Soil Health Card — all three nutrients tested." : "One nutrient diagnosed this visit; the other two use PAU's standard baseline dose."}
        {report.soilZone && ` Soil zone: ${report.soilZone}.`}
      </div>
      <MoneySavedBlock amount={report.totalSavings} label={tt(lang, "totalSaved")} />

      <div className="rounded-xl p-3 flex items-start gap-2.5 mb-4" style={{ backgroundColor: "#EAF2FB" }}>
        <WeatherIcon size={16} color="#3B6EA5" className="shrink-0 mt-0.5" />
        <div className="text-xs" style={{ color: "#2C4B6E" }}>{weather.text} <span className="italic" style={{ opacity: 0.7 }}>(illustrative forecast)</span></div>
      </div>

      {reminder && (
        <div className="rounded-xl p-3 flex items-start gap-2.5 mb-4" style={{ backgroundColor: "#FBF3E3" }}>
          <Bell size={16} color={C.gold} className="shrink-0 mt-0.5" />
          <div className="text-xs" style={{ color: "#6B551E" }}>
            Next: <span className="font-semibold">{reminder.label}</span> for {reminder.nutrient} ({reminder.product}) — {reminder.daysAway <= 0 ? "due now" : `in ~${reminder.daysAway} day${reminder.daysAway > 1 ? "s" : ""}`}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {report.rows.map((r) => {
          const isOrderable = r.dir !== "healthy" && r.qty > 0;
          const statusLabel = r.dir === "deficiency" ? tt(lang, "deficient") : r.dir === "excess" ? tt(lang, "excess") : r.dir === "standard" ? tt(lang, "standardDose") : tt(lang, "adequate");
          return (
            <div key={r.nutrient.key} className="rounded-xl p-4 border" style={{ borderColor: r.dir === "excess" ? "#E7B8B4" : C.lightgray, backgroundColor: r.dir === "excess" ? "#FBEFEF" : C.white }}>
              <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {showOrderCta && isOrderable && (
                    <input type="checkbox" checked={selected.has(r.nutrient.key)} onChange={() => toggle(r.nutrient.key)} className="w-4 h-4" style={{ accentColor: C.green }} />
                  )}
                  <div>
                    <div className="font-bold text-sm" style={{ color: C.darkgreen }}>
                      {translateName(lang, r.nutrient.name)}{r.value !== null ? ` (${r.value} kg/ha)` : ""} — {statusLabel}
                    </div>
                    <Badge tone={r.confirmed ? "green" : "gray"}>{r.confirmed ? tt(lang, "diagnosedVisit") : tt(lang, "standardNotTested")}</Badge>
                  </div>
                </div>
                {r.savings > 0 && <Badge tone={r.dir === "excess" ? "gold" : "green"}>₹{r.savings.toLocaleString("en-IN")}</Badge>}
              </div>
              <div className="text-xs mt-2 mb-1" style={{ color: C.gray }}>{r.action}</div>
              {r.dir !== "healthy" && <div className="text-xs mb-2" style={{ color: C.gray }}>{tt(lang, "required")}: {r.required}{r.unit} · {tt(lang, "typical")}: {r.typical}{r.unit}</div>}
              {r.crossAdjusted && (
                <div className="text-xs mb-2 flex items-center gap-1" style={{ color: C.green }}><Sparkles size={11} /> Cross-nutrient rule applied (PAU)</div>
              )}
              {r.schedule && (
                <div className="rounded-lg p-2.5 mt-1" style={{ backgroundColor: C.cream }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: C.gray }}>APPLICATION SCHEDULE</div>
                  {r.schedule.map((s, i) => (
                    <div key={i} className="text-xs flex justify-between" style={{ color: C.black }}>
                      <span>{s.label}</span><span className="font-semibold">{s.amount}{r.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <CredentialsBlock report={report} />
      <div className="text-xs mb-4" style={{ color: C.gray }}>Cross-checked with ICAR / PAU standard dose tables for each nutrient.</div>
      {showOrderCta && orderable.length > 0 && (
        <PrimaryButton full icon={ShoppingCart} disabled={selected.size === 0}
          onClick={() => onOrderCart(report.rows.filter((r) => selected.has(r.nutrient.key)))}>
          Order Selected ({selected.size})
        </PrimaryButton>
      )}
    </div>
  );
}

function ReportCard({ report, lang, showOrderCta, onOrder, onOrderCart }) {
  const [speaking, setSpeaking] = useState(false);
  if (report.type === "multi") return <MultiNutrientReport report={report} lang={lang} showOrderCta={showOrderCta} onOrderCart={onOrderCart} />;

  const playVoice = () => { setSpeaking(true); setTimeout(() => setSpeaking(false), 2200); };
  const isHealthy = report.dir === "healthy";
  const isExcess = report.dir === "excess";

  return (
    <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <ConfidenceRing percent={report.confidence} color={isHealthy ? C.green : isExcess ? "#B3261E" : C.gold} />
          <div>
            <div className="text-xs font-semibold tracking-wide mb-1" style={{ color: C.gray }}>AI DIAGNOSIS · CONFIDENCE SCORE</div>
            <div className="text-xl font-bold" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>{translateName(lang, report.name)}</div>
            {report.soilZone && <div className="text-xs mt-0.5" style={{ color: C.gray }}>Soil zone: {report.soilZone}</div>}
          </div>
        </div>
        <Badge tone={isHealthy ? "green" : isExcess ? "warn" : "gold"}>
          {isExcess && <AlertTriangle size={13} />}
          {!isExcess && (report.method === "photo" ? <Camera size={13} /> : report.method === "shc" ? <FlaskConical size={13} /> : <Mic size={13} />)}
          {isExcess ? "Over-application" : report.method === "photo" ? "Photo analysis" : report.method === "shc" ? "Soil Health Card" : "Voice / text input"}
        </Badge>
      </div>

      <div className="h-px my-5" style={{ backgroundColor: C.lightgray }} />

      {!isHealthy && <MoneySavedBlock amount={report.savings} label={isExcess ? tt(lang, "avoided") : tt(lang, "moneySaved")} />}

      {!isHealthy ? (
        <>
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: isExcess ? "#FBEFEF" : C.cream }}>
            <div className="text-xs font-semibold mb-1" style={{ color: C.gray }}>{isExcess ? "RECOMMENDED ACTION" : "RECOMMENDED PRODUCT"}</div>
            <div className="font-bold" style={{ color: isExcess ? "#B3261E" : C.darkgreen }}>{isExcess ? report.action : report.product}</div>
          </div>
          <ComparisonBlock required={report.required} typical={report.typical} unit={report.unit} lang={lang} />
        </>
      ) : (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: C.cream, color: C.darkgreen }}>{tt(lang, "noTreatment")}</div>
      )}

      {!isHealthy && <div className="text-xs mb-4" style={{ color: C.gray }}>Savings {SAVINGS_SOURCE[report.category]}.</div>}

      <CredentialsBlock report={report} />

      <div className="text-xs mb-4" style={{ color: C.gray }}>
        Cross-checked with {report.category === "fertilizer" ? "ICAR / PAU standard dose tables" : "verified pesticide-use guidelines"}.
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={playVoice} className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2" style={{ color: C.darkgreen, backgroundColor: C.lightgray }}>
          <Volume2 size={16} className={speaking ? "animate-pulse" : ""} />
          {speaking ? `${tt(lang, "playing")} ${lang}…` : `${tt(lang, "readAloud")} ${lang}`}
        </button>
        {showOrderCta && report.dir === "deficiency" && <PrimaryButton icon={ShoppingCart} onClick={onOrder}>Proceed to Order</PrimaryButton>}
        {showOrderCta && report.category === "pesticide" && !isHealthy && <PrimaryButton icon={ShoppingCart} onClick={onOrder}>Proceed to Order</PrimaryButton>}
      </div>
      {!showOrderCta && !isHealthy && <div className="text-xs italic mt-3" style={{ color: C.gray }}>Visit your nearest Sahi Salah Kendra to purchase at this recommendation.</div>}
    </div>
  );
}

// ---------- input pickers ----------

function FarmerOrderScreen({ items, brands, onBack, onPaid, initialPhone = "", initialName = "", lang = "English" }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [lines, setLines] = useState(items.map((it) => ({ ...it, brand: brands[0], qty: Math.max(1, it.qty) })));
  const [payMethod, setPayMethod] = useState("upi");
  const [paying, setPaying] = useState(false);
  const [triedToPay, setTriedToPay] = useState(false);
  const setLine = (i, patch) => setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const computed = lines.map((l) => {
    const unitPrice = PRICE[l.product] || 10;
    const orderValue = Math.round(unitPrice * l.qty);
    const commission = Math.round(orderValue * COMMISSION_RATE[l.category]);
    return { ...l, orderValue, commission, amountToPay: orderValue + commission };
  });
  const totalSavings = computed.reduce((s, l) => s + (l.savings || 0), 0);
  const grandTotal = computed.reduce((s, l) => s + l.amountToPay, 0);
  const nameMissing = !name.trim();
  const phoneMissing = !phone.trim();
  const canPay = !nameMissing && !phoneMissing;

  const pay = () => {
    if (!canPay) { setTriedToPay(true); return; }
    const base = (payment) => computed.map((l) => ({ farmer: name, phone: phone.trim(), product: l.product, brand: l.brand, qty: l.qty, unit: l.unit, orderValue: l.orderValue, commission: l.commission, category: l.category, channel: "self-serve", payment, status: "Placed" }));
    if (payMethod === "cash") { onPaid(base("Cash on pickup")); return; }
    setPaying(true);
    setTimeout(() => onPaid(base("UPI")), 1400);
  };

  if (paying) {
    return (
      <div className="max-w-md mx-auto rounded-2xl p-8 border text-center" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
        <div className="mx-auto mb-4 rounded-full w-14 h-14 flex items-center justify-center" style={{ backgroundColor: C.cream, border: `1.5px solid ${C.green}` }}>
          <ScanLine size={24} color={C.green} className="animate-pulse" />
        </div>
        <div className="text-sm font-semibold" style={{ color: C.darkgreen }}>{ui(lang, "processingPayment")}</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="p-1"><ChevronLeft size={18} color={C.gray} /></button>
        <div className="text-xl font-bold" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>{ui(lang, "yourOrder")}</div>
      </div>

      <MoneySavedBlock amount={totalSavings} label={ui(lang, "moneySavedLabel")} />

      <div className="grid grid-cols-2 gap-3 mb-1">
        <div>
          <label className="text-xs font-semibold" style={{ color: triedToPay && nameMissing ? "#B3261E" : C.gray }}>
            {ui(lang, "yourName")} {nameMissing && <span style={{ color: "#B3261E" }}>*</span>}
          </label>
          <div className="mt-1"><MicInput icon={User} value={name} onChange={setName} placeholder={ui(lang, "fullNamePlaceholder")} /></div>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: triedToPay && phoneMissing ? "#B3261E" : C.gray }}>
            {ui(lang, "phoneLbl")} {phoneMissing && <span style={{ color: "#B3261E" }}>*</span>}
          </label>
          <div className="mt-1"><MicInput icon={Phone} type="number" value={phone} onChange={setPhone} placeholder={ui(lang, "phoneNumPlaceholder")} /></div>
        </div>
      </div>
      {triedToPay && !canPay && (
        <div className="text-xs mb-4 rounded-lg px-3 py-2" style={{ backgroundColor: "#FBEFEF", color: "#B3261E" }}>
          {ui(lang, "pleaseFillIn")} {nameMissing && phoneMissing ? ui(lang, "fillInBoth") : nameMissing ? ui(lang, "fillInName") : ui(lang, "fillInPhone")} {ui(lang, "toCompleteCheckout")}
        </div>
      )}
      {!(triedToPay && !canPay) && <div className="mb-4" />}

      <div className="space-y-3 mb-4">
        {computed.map((l, i) => (
          <div key={i} className="rounded-xl border p-4" style={{ borderColor: C.lightgray }}>
            <div className="font-semibold text-sm mb-3" style={{ color: C.darkgreen }}>{l.product}</div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="text-xs font-semibold" style={{ color: C.gray }}>{ui(lang, "brandLbl")}</label>
                <div className="flex items-center gap-2 rounded-xl border px-3 py-2 mt-1" style={{ borderColor: C.lightgray }}>
                  <Building2 size={14} color={C.gray} />
                  <select value={l.brand} onChange={(e) => setLine(i, { brand: e.target.value })} className="w-full outline-none text-sm bg-transparent">
                    {brands.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="mt-1"><Badge tone={INVENTORY[l.brand] === "In Stock" ? "green" : INVENTORY[l.brand] === "Low Stock" ? "gold" : "warn"}>{INVENTORY[l.brand] === "In Stock" ? ui(lang, "inStock") : INVENTORY[l.brand] === "Low Stock" ? ui(lang, "lowStock") : ui(lang, "outOfStock")}</Badge></div>
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: C.gray }}>{ui(lang, "qtyLbl")} ({l.unit})</label>
                <div className="flex items-center gap-2 rounded-xl border px-3 py-2 mt-1" style={{ borderColor: C.lightgray }}>
                  <input type="number" min="1" value={l.qty} onChange={(e) => setLine(i, { qty: Math.max(1, Number(e.target.value) || 1) })} className="w-full outline-none text-sm bg-transparent" />
                </div>
              </div>
            </div>
            <div className="text-xs text-right" style={{ color: C.gray }}>₹{l.amountToPay.toLocaleString("en-IN")}</div>
          </div>
        ))}
      </div>

      <div className="h-px my-4" style={{ backgroundColor: C.lightgray }} />

      <div className="mb-4">
        <label className="text-xs font-semibold mb-2 block" style={{ color: C.gray }}>{ui(lang, "paymentMethodLbl")}</label>
        <div className="flex gap-2">
          {[["upi", ui(lang, "upiLbl")], ["cash", ui(lang, "cashOnPickup")]].map(([k, label]) => (
            <button key={k} onClick={() => setPayMethod(k)} className="flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold border"
              style={payMethod === k ? { backgroundColor: C.green, color: C.white, borderColor: C.green } : { borderColor: C.lightgray, color: C.gray }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between text-sm mb-5">
        <span style={{ color: C.gray }}>{ui(lang, "amountToPay")}</span>
        <span className="font-bold text-lg" style={{ color: C.darkgreen }}>₹{grandTotal.toLocaleString("en-IN")}</span>
      </div>

      <PrimaryButton full icon={payMethod === "upi" ? Sparkles : ShoppingCart} onClick={pay}>
        {payMethod === "upi" ? ui(lang, "payNow") : ui(lang, "confirmPayAtPickup")}
      </PrimaryButton>
    </div>
  );
}

const ORDER_STATUSES = ["Placed", "Packed", "Ready for Pickup", "Picked Up"];

function OrderHistory({ orders, onBack, onAdvanceStatus }) {
  return (
    <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: C.gray }}><ChevronLeft size={16} /> Back</button>
      <div className="text-lg font-bold mb-4" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>Order History</div>
      {!orders.length ? <div className="text-sm" style={{ color: C.gray }}>No orders placed yet.</div> : (
        <div className="space-y-2">
          {orders.map((o, i) => {
            const status = o.status || "Placed";
            const statusIdx = ORDER_STATUSES.indexOf(status);
            const nextStatus = ORDER_STATUSES[statusIdx + 1];
            return (
              <div key={i} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: C.cream }}>
                <div className="flex items-center justify-between text-sm flex-wrap gap-2 mb-1.5">
                  <span style={{ color: C.black }}>{o.farmer} · {o.product} · {o.brand} · {o.qty}{o.unit}</span>
                  <div className="flex items-center gap-2">
                    <Badge tone={o.channel === "self-serve" ? "green" : "gray"}>{o.channel === "self-serve" ? "Self-serve" : "Agent"}</Badge>
                    <span className="font-semibold" style={{ color: C.goldOnWhite }}>+₹{o.commission}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge tone={status === "Picked Up" ? "green" : "darkgreen"}><PackageCheck size={11} /> {status}</Badge>
                  {nextStatus && (
                    <button onClick={() => onAdvanceStatus(i, nextStatus)} className="text-xs font-semibold" style={{ color: C.green }}>Mark as {nextStatus} →</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onLogin, onBack }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const submit = () => { if (!id.trim() || !pw.trim()) { setError("Enter both agent ID and password."); return; } onLogin(id.trim()); };
  const onKeyDown = (e) => { if (e.key === "Enter") submit(); };
  return (
    <div className="max-w-sm mx-auto rounded-2xl p-8 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
      <div className="flex items-center gap-2 mb-1">
        <button onClick={onBack} className="p-1"><ChevronLeft size={18} color={C.gray} /></button>
        <div className="text-xl font-bold" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>Agent Login</div>
      </div>
      <p className="text-sm mb-6" style={{ color: C.gray }}>Sahi Salah Kendra desk access.</p>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold" style={{ color: C.gray }}>AGENT ID</label>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 mt-1" style={{ borderColor: C.lightgray }}>
            <User size={16} color={C.gray} />
            <input value={id} onChange={(e) => setId(e.target.value)} onKeyDown={onKeyDown} placeholder="Agent ID" className="w-full outline-none text-sm bg-transparent placeholder:text-[#6B7268]" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: C.gray }}>PASSWORD</label>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 mt-1" style={{ borderColor: C.lightgray }}>
            <Lock size={16} color={C.gray} />
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={onKeyDown} placeholder="••••••••" className="w-full outline-none text-sm bg-transparent placeholder:text-[#6B7268]" />
          </div>
        </div>
        {error && <div className="text-xs font-medium" style={{ color: "#B3261E" }}>{error}</div>}
        <PrimaryButton full icon={LogIn} onClick={submit}>Log In</PrimaryButton>
      </div>
    </div>
  );
}

const FEEDBACK_OPTIONS = [
  { key: "great", label: "Worked great" },
  { key: "ok", label: "It was okay" },
  { key: "unsure", label: "Not sure yet" },
  { key: "skipped", label: "Didn't apply it" },
];

function referralCodeFor(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return "KM" + (digits.slice(-4) || "0000");
}

function MyReportsScreen({ onBack, reports, orders, onFeedback }) {
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);

  const myReports = reports.filter((r) => r.phone === phone.trim());
  const myOrders = orders.filter((o) => o.phone === phone.trim());
  const totalSavings = myReports.reduce((s, r) => s + (r.savings || 0), 0);

  return (
    <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: C.gray }}><ChevronLeft size={16} /> Back</button>
      <div className="text-xl font-bold mb-1" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>My Reports & Savings</div>
      <p className="text-sm mb-4" style={{ color: C.gray }}>Enter the phone number you used when generating a report.</p>

      <div className="flex gap-2 mb-5">
        <div className="flex-1"><MicInput icon={Search} type="number" value={phone} onChange={setPhone} placeholder="98765 43210" /></div>
        <PrimaryButton onClick={() => setSearched(true)}>Look Up</PrimaryButton>
      </div>

      {searched && (
        <>
          {!myReports.length && !myOrders.length ? (
            <div className="text-sm rounded-xl p-4" style={{ backgroundColor: C.cream, color: C.gray }}>No reports found for this number yet — generate a diagnosis with your phone entered to start building your history.</div>
          ) : (
            <>
              <MoneySavedBlock amount={totalSavings} label="TOTAL SAVED ACROSS ALL VISITS" />

              <div className="rounded-xl p-4 mb-4 flex items-center gap-3" style={{ backgroundColor: "#F1F5E6" }}>
                <Gift size={18} color={C.green} />
                <div className="text-xs" style={{ color: C.darkgreen }}>Your referral code: <span className="font-bold">{referralCodeFor(phone)}</span> — share it with a neighbor.</div>
              </div>

              {myOrders.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-bold mb-2" style={{ color: C.darkgreen }}>Order Status</div>
                  <div className="space-y-2">
                    {myOrders.map((o, i) => (
                      <div key={i} className="flex items-center justify-between text-xs rounded-lg px-3 py-2" style={{ backgroundColor: C.cream }}>
                        <span style={{ color: C.black }}>{o.product} · {o.brand} · {o.qty}{o.unit}</span>
                        <Badge tone={(o.status || "Placed") === "Picked Up" ? "green" : "darkgreen"}><PackageCheck size={11} /> {o.status || "Placed"}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {myReports.length > 0 && (
                <div>
                  <div className="text-sm font-bold mb-2" style={{ color: C.darkgreen }}>Past Reports</div>
                  <div className="space-y-3">
                    {myReports.map((r, i) => (
                      <div key={i} className="rounded-xl border p-4" style={{ borderColor: C.lightgray }}>
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                          <span className="font-semibold text-sm" style={{ color: C.darkgreen }}>{r.name}</span>
                          <span className="text-xs" style={{ color: C.gray }}>{r.timestamp}</span>
                        </div>
                        {r.savings > 0 && <div className="text-xs mb-2" style={{ color: C.goldOnWhite }}>Saved ₹{r.savings.toLocaleString("en-IN")}</div>}
                        {r.feedback ? (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: C.green }}><Star size={12} /> Feedback: {FEEDBACK_OPTIONS.find((f) => f.key === r.feedback)?.label}</div>
                        ) : (
                          <div>
                            <div className="text-xs font-semibold mb-1.5" style={{ color: C.gray }}>How did this recommendation work out?</div>
                            <div className="flex gap-1.5 flex-wrap">
                              {FEEDBACK_OPTIONS.map((f) => (
                                <button key={f.key} onClick={() => onFeedback(r.id, f.key)} className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border" style={{ borderColor: C.lightgray, color: C.darkgreen }}>{f.label}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function BusinessDashboard({ onBack, orders, reports }) {
  const revenue = orders.reduce((s, o) => s + o.orderValue, 0);
  const commission = orders.reduce((s, o) => s + o.commission, 0);
  const agentOrders = orders.filter((o) => o.channel === "agent");
  const selfServeOrders = orders.filter((o) => o.channel === "self-serve");
  const byProduct = {};
  orders.forEach((o) => { byProduct[o.product] = (byProduct[o.product] || 0) + o.qty; });
  const feedbackGiven = reports.filter((r) => r.feedback);
  const positiveFeedback = feedbackGiven.filter((r) => r.feedback === "great" || r.feedback === "ok");
  const lowStock = Object.entries(INVENTORY).filter(([, v]) => v !== "In Stock");

  return (
    <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: C.gray }}><ChevronLeft size={16} /> Back</button>
      <div className="flex items-center gap-2 mb-1">
        <LayoutDashboard size={20} color={C.green} />
        <div className="text-xl font-bold" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>Business Dashboard</div>
      </div>
      <p className="text-xs mb-5" style={{ color: C.gray }}>Real figures from orders placed on this device. Cross-desk comparisons need multi-desk deployment.</p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl p-4" style={{ backgroundColor: C.darkgreen }}>
          <div className="text-xs font-semibold" style={{ color: C.gold }}>TOTAL REVENUE</div>
          <div className="text-2xl font-bold" style={{ ...DISPLAY_FONT, color: C.white }}>₹{revenue.toLocaleString("en-IN")}</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.green }}>
          <div className="text-xs font-semibold" style={{ color: "#EFF5E2" }}>TOTAL COMMISSION</div>
          <div className="text-2xl font-bold" style={{ ...DISPLAY_FONT, color: C.white }}>₹{commission.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="rounded-xl p-4 border mb-5" style={{ borderColor: C.lightgray }}>
        <div className="text-xs font-semibold mb-2" style={{ color: C.gray }}>ORDERS BY CHANNEL</div>
        <div className="flex items-center justify-between text-sm mb-1"><span className="flex items-center gap-1.5"><Users size={13} /> Agent-assisted</span><span className="font-semibold">{agentOrders.length}</span></div>
        <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-1.5"><Phone size={13} /> Self-serve</span><span className="font-semibold">{selfServeOrders.length}</span></div>
      </div>

      <div className="rounded-xl p-4 border mb-5" style={{ borderColor: C.lightgray }}>
        <div className="text-xs font-semibold mb-2" style={{ color: C.gray }}>DEMAND BY PRODUCT (aggregation — useful for supplier negotiation)</div>
        {Object.keys(byProduct).length === 0 ? <div className="text-xs" style={{ color: C.gray }}>No orders yet.</div> : Object.entries(byProduct).map(([p, qty]) => (
          <div key={p} className="flex items-center justify-between text-sm mb-1"><span>{p}</span><span className="font-semibold">{Math.round(qty * 10) / 10}</span></div>
        ))}
      </div>

      <div className="rounded-xl p-4 border mb-5" style={{ borderColor: C.lightgray }}>
        <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: C.gray }}><Star size={13} /> FARMER OUTCOME FEEDBACK</div>
        {feedbackGiven.length === 0 ? <div className="text-xs" style={{ color: C.gray }}>No feedback submitted yet.</div> : (
          <div className="text-sm" style={{ color: C.darkgreen }}>{positiveFeedback.length} of {feedbackGiven.length} reports rated positively ({Math.round((positiveFeedback.length / feedbackGiven.length) * 100)}%)</div>
        )}
      </div>

      <div className="rounded-xl p-4 border" style={{ borderColor: C.lightgray }}>
        <div className="text-xs font-semibold mb-2" style={{ color: C.gray }}>VERIFIED-SELLER STOCK ALERTS</div>
        {lowStock.length === 0 ? <div className="text-xs" style={{ color: C.gray }}>All sellers fully stocked.</div> : lowStock.map(([brand, level]) => (
          <div key={brand} className="flex items-center justify-between text-sm mb-1"><span>{brand}</span><Badge tone={level === "Low Stock" ? "gold" : "warn"}>{level}</Badge></div>
        ))}
      </div>
    </div>
  );
}


// =====================================================================
// NEW UI SHELL — matches the reference screenshots
// =====================================================================

const DEFAULT_FARMER = {
  name: "Ramesh Kumar",
  phone: "9876543210",
  village: "Village Dhanansu",
  district: "Ludhiana",
  state: "Punjab",
  farmSize: "8.9 acres",
  soil: "Alluvial loam",
  irrigation: "Tubewell",
  crops: ["Wheat", "Paddy"],
  address: "Ward 4, Dhanansu, 141112",
  weatherC: 31,
  season: "Rabi season",
};

function TopBar({ lang, setLang, onAgentLogin }) {
  const langs = [
    { key: "English", label: "EN" },
    { key: "Hindi", label: "हि" },
    { key: "Punjabi", label: "ਪੰ" },
  ];
  return (
    <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: "#D9F0DC" }}>
      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.darkgreen }}>
        <Wifi size={14} />
        <span>{ui(lang, "online")}</span>
        <span className="opacity-50">·</span>
        <span>{ui(lang, "realtimeAI")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {langs.map((l) => {
          const active = lang === l.key;
          return (
            <button
              key={l.key}
              onClick={() => setLang(l.key)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={active
                ? { backgroundColor: C.green, color: C.white }
                : { backgroundColor: C.white, color: C.darkgreen }}
            >
              {l.label}
            </button>
          );
        })}
        <button onClick={onAgentLogin} className="w-7 h-7 rounded-full bg-white flex items-center justify-center" title={ui(lang, "agentLogin")}>
          <LogIn size={13} style={{ color: C.darkgreen }} />
        </button>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab, lang }) {
  const items = [
    { key: "home", label: ui(lang, "navHome"), icon: Home },
    { key: "orders", label: ui(lang, "navOrders"), icon: Package },
    { key: "history", label: ui(lang, "navHistory"), icon: History },
    { key: "profile", label: ui(lang, "navProfile"), icon: User },
  ];
  return (
    <div className="flex items-stretch border-t bg-white" style={{ borderColor: C.lightgray }}>
      {items.map((it) => {
        const active = tab === it.key;
        const Icon = it.icon;
        return (
          <button key={it.key} onClick={() => setTab(it.key)} className="flex-1 flex flex-col items-center gap-1 py-2.5">
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: active ? C.navActiveBg : "transparent" }}>
              <Icon size={18} style={{ color: active ? C.green : C.gray }} />
            </span>
            <span className="text-[11px] font-medium" style={{ color: active ? C.green : C.gray }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function OrderConfirmedScreen({ items, total, onBackToHome, lang = "English" }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center" style={{ backgroundColor: C.cream, minHeight: "100%" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: "#DCEFD9", border: `1.5px solid ${C.green}` }}>
        <CircleCheck size={44} style={{ color: C.green }} />
      </div>
      <div className="text-2xl font-bold mb-2" style={{ color: C.darkgreen }}>{ui(lang, "orderPlaced")}</div>
      <div className="text-sm mb-6" style={{ color: C.gray }}>{ui(lang, "orderConfirmedMsg")}</div>

      <div className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-sm mb-8 text-left">
        {items.map((it, i) => (
          <div key={i} className="flex justify-between text-sm py-1.5" style={{ borderBottom: i < items.length - 1 ? `1px solid ${C.lightgray}` : "none" }}>
            <span style={{ color: C.black }}>{it.product} × {it.qty}</span>
          </div>
        ))}
        {total != null && (
          <div className="flex justify-between text-sm font-bold pt-2 mt-1" style={{ borderTop: `1px solid ${C.lightgray}`, color: C.darkgreen }}>
            <span>{ui(lang, "totalPaid")}</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>

      <button onClick={onBackToHome} className="w-full max-w-sm py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: C.darkgreen }}>
        <Home size={17} /> {ui(lang, "backToHome")}
      </button>
    </div>
  );
}

function HeroHeader({ farmer, title, subtitle, showGreeting, icon: Icon, lang = "English" }) {
  return (
    <div className="px-5 pt-5 pb-7 text-white" style={{ background: GRADIENT }}>
      {showGreeting ? (
        <>
          <div className="text-sm opacity-90 mb-1">Khet Mitra</div>
          <div className="text-2xl font-bold mb-1">{ui(lang, "hello")}, {farmer.name.split(" ")[0]} {ui(lang, "ji")}</div>
          <div className="text-sm opacity-90 mb-3">{ui(lang, "heroSubtitle")}</div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 flex items-center gap-1">
              <Sun size={13} /> {farmer.weatherC}°C · {farmer.district}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20">{ui(lang, "rabiSeason")}</span>
          </div>
        </>
      ) : (
        <>
          <div className="text-2xl font-bold flex items-center gap-2">{Icon && <Icon size={24} strokeWidth={2} />} {title}</div>
          {subtitle && <div className="text-sm opacity-90 mt-1">{subtitle}</div>}
        </>
      )}
    </div>
  );
}

function ActionCard({ icon: Icon, label, bg, iconColor, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl p-4 text-left shadow-sm flex flex-col gap-8">
      <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: bg, border: `1.5px solid ${iconColor}` }}>
        <Icon size={20} style={{ color: iconColor }} />
      </span>
      <span className="font-semibold text-sm" style={{ color: C.black }}>{label}</span>
    </button>
  );
}

function HomeScreen({ farmer, lang, reports, onOpenScan, onOpenSeeds, onOpenDesk, onViewHistory }) {
  const recent = reports && reports.length ? reports[reports.length - 1] : null;
  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
      <HeroHeader farmer={farmer} showGreeting lang={lang} />
      <div className="px-4 -mt-4 relative z-10 grid grid-cols-2 gap-3">
        <ActionCard icon={Sprout} label={ui(lang, "fertilizerScan")} bg="#E4EFD6" iconColor={C.green} onClick={() => onOpenScan("fertilizer")} />
        <ActionCard icon={Bug} label={ui(lang, "pesticideScan")} bg="#EAD9BE" iconColor="#9C6B2E" onClick={() => onOpenScan("pesticide")} />
        <ActionCard icon={Wheat} label={ui(lang, "buySeeds")} bg="#E4EFD6" iconColor={C.green} onClick={onOpenSeeds} />
        <ActionCard icon={MapPin} label={ui(lang, "nearbyDesk")} bg="#EAD9BE" iconColor="#9C6B2E" onClick={onOpenDesk} />
      </div>

      <div className="px-4 mt-5">
        <div className="rounded-2xl p-4" style={{ backgroundColor: C.alertBg, border: `1px solid ${C.alertBorder}` }}>
          <div className="flex items-center gap-2 font-semibold text-sm mb-2" style={{ color: C.black }}>
            <Bell size={16} /> {ui(lang, "alertsTitle")}
          </div>
          <div className="text-xs space-y-2" style={{ color: "#6B5E2E" }}>
            <div className="flex items-start gap-2"><CloudRain size={14} className="shrink-0 mt-0.5" /><span>{ui(lang, "alert1")}</span></div>
            <div className="flex items-start gap-2"><Bug size={14} className="shrink-0 mt-0.5" /><span>{ui(lang, "alert2")}</span></div>
            <div className="flex items-start gap-2"><Building2 size={14} className="shrink-0 mt-0.5" /><span>{ui(lang, "alert3")}</span></div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold" style={{ color: C.black }}>{ui(lang, "recentScans")}</div>
          <span onClick={onViewHistory} className="text-sm font-medium cursor-pointer" style={{ color: C.green }}>{ui(lang, "viewAll")}</span>
        </div>
        {recent ? (
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="font-medium text-sm" style={{ color: C.black }}>
                {recent.dir === "deficiency" ? `${translateName(lang, recent.nutrient?.name || recent.pest?.label)}` : ui(lang, "balancedNutrition")} — {translateName(lang, recent.crop || "Wheat")}
              </div>
              <div className="text-xs mt-0.5" style={{ color: C.gray }}>{translateName(lang, recent.crop || "Wheat")} · {ui(lang, "cloudVerified")}</div>
            </div>
            <div className="font-bold text-lg" style={{ color: C.darkgreen }}>{recent.confidence || 68}%</div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="font-medium text-sm" style={{ color: C.black }}>{ui(lang, "balancedNutrition")} — {translateName(lang, "Wheat")}</div>
              <div className="text-xs mt-0.5" style={{ color: C.gray }}>{translateName(lang, "Wheat")} · {ui(lang, "cloudVerified")}</div>
            </div>
            <div className="font-bold text-lg" style={{ color: C.darkgreen }}>68%</div>
          </div>
        )}
      </div>

      <div className="px-4 mt-5 pb-6">
        <div className="flex items-center gap-2 font-semibold mb-2" style={{ color: C.black }}>
          <BookOpen size={16} /> {ui(lang, "offlineLibrary")}
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1.5" style={{ backgroundColor: C.chipBg, color: C.green }}>{ui(lang, "nutrientTag")}</span>
          <div className="font-medium text-sm" style={{ color: C.black }}>{ui(lang, "libraryEntryTitle")}</div>
          <div className="text-xs mt-1" style={{ color: C.gray }}>{ui(lang, "libraryEntryDesc")}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Unified Scan screen (matches "Fertilizer Scan" / "Pesticide Scan" reference) ----------

function ScanScreen({ category, lang, farmer, onBack, onReportSaved, onOrderPlaced }) {
  const [photo, setPhoto] = useState(null);
  const [voiceText, setVoiceText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [selectedRows, setSelectedRows] = useState(null);
  const [stage, setStage] = useState("input"); // input | analyzing | report | order | confirmed
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [report, setReport] = useState(null);
  const [crop, setCrop] = useState(farmer.crops?.[0] === "Paddy" ? "Rice (Paddy)" : "Wheat");
  const [landSize, setLandSize] = useState(PUNJAB_AVG_ACRES);

  const isFert = category === "fertilizer";
  const title = isFert ? ui(lang, "fertilizerScan") : ui(lang, "pesticideScan");
  const scanIcon = isFert ? Sprout : Bug;
  const stages = photo ? (isFert ? PHOTO_STAGES : PEST_PHOTO_STAGES) : TEXT_STAGES;

  function runDiagnosis() {
    setStage("analyzing");
  }

  function handleAnalysisDone() {
    const text = voiceText || typedText;
    if (isFert) {
      const { match, confidence } = photo ? matchFertPhoto() : matchFertText(text || "yellowing leaves");
      if (match.dir === "healthy") {
        setReport({
          ...buildFertReportData("healthy", null, landSize),
          category: "fertilizer", crop, landSize, confidence,
          method: photo ? "photo" : "text",
          id: genReportId(), model: photo ? "Khet Mitra Vision v2.3" : "Khet Mitra NLP Advisory v1.8",
          source: photo ? "Uploaded image analysis" : "Farmer-described symptoms",
          timestamp: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        });
      } else {
        const { rows, totalSavings } = buildSeasonPlan(match.nutrient.key, match.dir, landSize, crop);
        setReport({
          type: "multi", rows, totalSavings, category: "fertilizer", crop, landSize,
          nutrient: match.nutrient, dir: match.dir, confidence,
          method: photo ? "photo" : "text",
          id: genReportId(), model: photo ? "Khet Mitra Vision v2.3" : "Khet Mitra NLP Advisory v1.8",
          source: photo ? "Uploaded image analysis" : "Farmer-described symptoms",
          timestamp: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        });
      }
    } else {
      const match = photo ? matchPestPhoto() : matchPestText(text || "leaf damage");
      const isHealthy = match.profile.perAcre === 0;
      const { savings, required, typical } = isHealthy
        ? { savings: 0, required: 0, typical: 0 }
        : computeSavings("pesticide", match.profile.perAcre, landSize, match.profile.product);
      setReport({
        id: genReportId(), category: "pesticide", crop, landSize,
        pest: match.profile, name: match.profile.label, product: match.profile.product,
        action: `Apply ${required} ${match.profile.unit}`, unit: match.profile.unit,
        method: photo ? "photo" : "text",
        dir: isHealthy ? "healthy" : "deficiency", confidence: match.confidence,
        required, typical, savings,
        model: "Khet Mitra CNN v2.1", source: "Verified pesticide-use guidelines",
        timestamp: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      });
    }
    setStage("report");
  }

  useEffect(() => {
    if (report && onReportSaved) onReportSaved(report);
  }, [report]);

  if (stage === "analyzing") {
    return (
      <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
        <HeroHeader title={title} icon={scanIcon} subtitle={ui(lang, "runningDiagnosis")} lang={lang} />
        <div className="p-5">
          <AnalyzingSequence stages={stages} durationMs={3200} onDone={handleAnalysisDone} />
        </div>
      </div>
    );
  }

  if (stage === "report" && report) {
    return (
      <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
        <HeroHeader title={`${title} ${ui(lang, "resultSuffix")}`} icon={scanIcon} subtitle={ui(lang, "hereIsWhatWeFound")} lang={lang} />
        <div className="p-4">
          {report.category === "fertilizer" ? (
            <MultiNutrientReport report={report} lang={lang} showOrderCta onOrderCart={(rows) => { setSelectedRows(rows); setStage("order"); }} />
          ) : (
            <ReportCard report={report} lang={lang} showOrderCta onOrder={() => setStage("order")} />
          )}
          <button onClick={onBack} className="w-full mt-3 py-3 text-sm font-medium" style={{ color: C.gray }}>{ui(lang, "backToHome")}</button>
        </div>
      </div>
    );
  }

  if (stage === "order" && report) {
    const fertRows = selectedRows || (report.rows || []).filter((r) => r.dir !== "excess" && r.dir !== "healthy" && r.qty > 0);
    const items = report.category === "fertilizer"
      ? fertRows.map((r) => ({ product: r.product, category: "fertilizer", qty: Math.ceil(r.required), unit: r.unit || "kg" }))
      : [{ product: report.product, category: "pesticide", qty: Math.ceil(report.required || 1), unit: report.unit || "units" }];
    return (
      <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
        <FarmerOrderScreen
          items={items.length ? items : [{ product: isFert ? "Urea" : "Chlorantraniliprole 18.5% SC", category, qty: 1, unit: "kg" }]}
          brands={isFert ? FERT_BRANDS : PEST_BRANDS}
          initialName={farmer.name} initialPhone={farmer.phone}
          lang={lang}
          onBack={() => setStage("report")}
          onPaid={(order) => {
            onOrderPlaced && onOrderPlaced(order);
            const total = order.reduce((s, o) => s + (o.orderValue || 0) + (o.commission || 0), 0);
            setConfirmedOrder({ items: order, total });
            setStage("confirmed");
          }}
        />
      </div>
    );
  }

  if (stage === "confirmed" && confirmedOrder) {
    return <OrderConfirmedScreen items={confirmedOrder.items} total={confirmedOrder.total} onBackToHome={onBack} lang={lang} />;
  }

  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
      <HeroHeader title={title} icon={scanIcon} subtitle={ui(lang, "combineMethods")} lang={lang} />
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-semibold mb-3" style={{ color: C.black }}>{ui(lang, "stepPhoto")}</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-xl py-6 flex flex-col items-center gap-2 cursor-pointer" style={{ backgroundColor: C.chipBg }}>
              <Camera size={22} style={{ color: C.green }} />
              <span className="text-sm" style={{ color: C.black }}>{ui(lang, "capturePhoto")}</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => setPhoto("captured")} />
            </label>
            <label className="rounded-xl py-6 flex flex-col items-center gap-2 cursor-pointer" style={{ backgroundColor: C.chipBg }}>
              <ImageIcon size={22} style={{ color: C.green }} />
              <span className="text-sm" style={{ color: C.black }}>{ui(lang, "uploadGallery")}</span>
              <input type="file" accept="image/*" className="hidden" onChange={() => setPhoto("uploaded")} />
            </label>
          </div>
          {photo && <div className="text-xs mt-2 flex items-center gap-1" style={{ color: C.green }}><CircleCheck size={14} /> {ui(lang, "photoAttached")}</div>}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-semibold mb-3" style={{ color: C.black }}>{ui(lang, "stepVoice")} ({lang === "English" ? "EN" : lang === "Hindi" ? "HI" : "PA"})</div>
          <SpeechField value={voiceText} onChange={setVoiceText} placeholder={ui(lang, "speakSymptoms")} />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-semibold mb-3" style={{ color: C.black }}>{ui(lang, "stepType")}</div>
          <textarea
            value={typedText} onChange={(e) => setTypedText(e.target.value)}
            className="w-full rounded-xl border p-3 text-sm placeholder:text-[#6B7268]" style={{ borderColor: C.lightgray }} rows={3}
            placeholder={ui(lang, "typePlaceholder")}
          />
        </div>

        <button onClick={runDiagnosis} className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: C.darkgreen }}>
          <Sparkles size={18} /> {ui(lang, "runDiagnosis")}
        </button>
      </div>
    </div>
  );
}

// ---------- Buy Seeds (browse & order — no AI diagnosis needed for seed) ----------

function BuySeedsScreen({ farmer, lang, onBack, onOrderPlaced }) {
  const [crop, setCrop] = useState(farmer.crops?.includes("Wheat") ? "Wheat" : CROPS[0]);
  const [cart, setCart] = useState({});
  const [stage, setStage] = useState("browse");
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const varieties = SEED_VARIETIES[crop] || [];
  const setQty = (name, qty) => setCart((prev) => ({ ...prev, [name]: Math.max(0, qty) }));
  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0).map(([name, qty]) => {
    const v = varieties.find((x) => x.name === name);
    return v ? { product: v.name, category: "seed", qty, unit: "kg" } : null;
  }).filter(Boolean);

  if (stage === "order" && cartItems.length) {
    return (
      <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
        <FarmerOrderScreen
          items={cartItems}
          brands={["PAU Certified Seed Store", "Local Verified Dealer"]}
          initialName={farmer.name} initialPhone={farmer.phone}
          lang={lang}
          onBack={() => setStage("browse")}
          onPaid={(order) => {
            onOrderPlaced && onOrderPlaced(order);
            const total = order.reduce((s, o) => s + (o.orderValue || 0) + (o.commission || 0), 0);
            setConfirmedOrder({ items: order, total });
            setStage("confirmed");
          }}
        />
      </div>
    );
  }

  if (stage === "confirmed" && confirmedOrder) {
    return <OrderConfirmedScreen items={confirmedOrder.items} total={confirmedOrder.total} onBackToHome={onBack} lang={lang} />;
  }

  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
      <HeroHeader title={ui(lang, "buySeeds")} icon={Wheat} subtitle={ui(lang, "seedsSubtitle")} lang={lang} />
      <div className="p-4">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {CROPS.map((c) => (
            <button key={c} onClick={() => setCrop(c)}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
              style={{ backgroundColor: crop === c ? C.green : C.white, color: crop === c ? C.white : C.black, border: `1px solid ${crop === c ? C.green : C.lightgray}` }}>
              {translateName(lang, c)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {varieties.map((v) => (
            <div key={v.name} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm" style={{ color: C.black }}>{v.name}</div>
                <div className="text-xs mt-0.5" style={{ color: C.gray }}>{v.note}</div>
                <div className="text-xs mt-1 font-medium" style={{ color: C.darkgreen }}>₹{v.price} {v.unit}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(v.name, (cart[v.name] || 0) - 1)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: C.lightgray }}>−</button>
                <span className="w-6 text-center text-sm font-semibold">{cart[v.name] || 0}</span>
                <button onClick={() => setQty(v.name, (cart[v.name] || 0) + 1)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: C.green }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {cartItems.length > 0 && (
        <div className="p-4 sticky bottom-0 bg-white border-t" style={{ borderColor: C.lightgray }}>
          <PrimaryButton full icon={ShoppingCart} onClick={() => setStage("order")}>
            {ui(lang, "proceedToOrder")} ({cartItems.reduce((s, i) => s + i.qty, 0)} kg)
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

// ---------- Orders (live tracking, matches reference) ----------

function OrdersScreen({ orders, lang }) {
  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
      <HeroHeader title={ui(lang, "navOrders")} icon={Package} subtitle={ui(lang, "ordersSubtitle")} lang={lang} />
      <div className="p-4">
        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm" style={{ color: C.gray }}>{ui(lang, "noOrdersYet")}</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-sm" style={{ color: C.black }}>{o.product}</div>
                  <Badge tone={o.status === "Picked Up" ? "green" : "gold"}>{o.status || "Placed"}</Badge>
                </div>
                <div className="text-xs" style={{ color: C.gray }}>{o.qty} {o.unit} · {o.brand}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- History (past diagnosis reports) ----------

function HistoryScreen({ reports, lang }) {
  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
      <HeroHeader title={ui(lang, "navHistory")} icon={History} subtitle={ui(lang, "historySubtitle")} lang={lang} />
      <div className="p-4">
        {!reports || reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm" style={{ color: C.gray }}>{ui(lang, "noScansYet")}</div>
        ) : (
          <div className="space-y-3">
            {[...reports].reverse().map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm" style={{ color: C.black }}>
                    {r.category === "fertilizer" ? translateName(lang, r.nutrient?.name || "Fertilizer") : translateName(lang, r.name || "Pesticide")} — {translateName(lang, r.crop)}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: C.gray }}>{r.timestamp}</div>
                </div>
                <div className="font-bold text-sm" style={{ color: C.darkgreen }}>{r.confidence}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Profile (matches reference) ----------

function ToggleRow({ label, on, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm" style={{ color: C.black }}>{label}</span>
      <button onClick={() => onChange(!on)} className="w-11 h-6 rounded-full relative transition-colors" style={{ backgroundColor: on ? C.green : C.lightgray }}>
        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: on ? "22px" : "2px" }} />
      </button>
    </div>
  );
}

// ---------- Nearby Sahi Salah Kendra (real desk locator, not a redirect) ----------

function NearbyDeskScreen({ farmer, lang }) {
  const zone = PUNJAB_ZONES.find((z) => z.name === farmer.district) || PUNJAB_ZONES[0];
  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
      <HeroHeader title={ui(lang, "nearbyDesk")} icon={MapPin} subtitle={ui(lang, "deskSubtitle")} lang={lang} />
      <div className="p-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-sm" style={{ color: C.black }}>{ui(lang, "nearbyDesk")} — {zone.name}</div>
              <div className="text-xs mt-1" style={{ color: C.gray }}>{ui(lang, "nearMandi")}, {zone.name}, Punjab</div>
              <div className="text-xs mt-1" style={{ color: C.gray }}>{zone.zone}</div>
            </div>
            <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.chipBg, border: `1.5px solid ${C.green}` }}>
              <MapPin size={18} style={{ color: C.green }} />
            </span>
          </div>
          <div className="h-px my-3" style={{ backgroundColor: C.lightgray }} />
          <div className="text-xs space-y-1" style={{ color: C.black }}>
            <div className="flex items-center gap-2"><CalendarClock size={14} /> {ui(lang, "deskHours")}</div>
            <div className="flex items-center gap-2"><Users size={14} /> {ui(lang, "deskStaffed")}</div>
          </div>
        </div>
        <div className="rounded-2xl p-4 text-xs" style={{ backgroundColor: C.alertBg, border: `1px solid ${C.alertBorder}`, color: "#6B5E2E" }}>
          {ui(lang, "deskIllustrative")}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ farmer, lang, setLang, onAgentLogin }) {
  const [notif, setNotif] = useState({ weather: true, pest: true, fert: true, schemes: true, orders: true });
  const [aiConsent, setAiConsent] = useState(true);

  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100%" }}>
      <div className="px-5 pt-5 pb-6 text-white" style={{ background: GRADIENT }}>
        <div className="flex items-center gap-2 text-2xl font-bold"><User size={24} /> {farmer.name}</div>
        <div className="text-sm opacity-90 mt-1">{farmer.village}, {farmer.district}, {farmer.state}</div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-semibold text-sm mb-3" style={{ color: C.black }}>{ui(lang, "farmDetails")}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ backgroundColor: C.chipBg }}>
              <div className="text-[10px] font-semibold" style={{ color: C.gray }}>{ui(lang, "farmSizeLbl")}</div>
              <div className="text-sm font-medium mt-0.5">{farmer.farmSize}</div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: C.chipBg }}>
              <div className="text-[10px] font-semibold" style={{ color: C.gray }}>{ui(lang, "districtLbl")}</div>
              <div className="text-sm font-medium mt-0.5">{farmer.district}</div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: C.chipBg }}>
              <div className="text-[10px] font-semibold" style={{ color: C.gray }}>{ui(lang, "soilLbl")}</div>
              <div className="text-sm font-medium mt-0.5">{ui(lang, "soilAlluvialLoam")}</div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: C.chipBg }}>
              <div className="text-[10px] font-semibold" style={{ color: C.gray }}>{ui(lang, "irrigationLbl")}</div>
              <div className="text-sm font-medium mt-0.5">{ui(lang, "irrigationTubewell")}</div>
            </div>
          </div>
          <div className="text-sm mt-3 flex items-center gap-1.5" style={{ color: C.green }}><Sprout size={14} /> {ui(lang, "cropsLbl")}: {farmer.crops.map((c) => translateName(lang, c === "Paddy" ? "Rice (Paddy)" : c)).join(", ")}</div>
          <div className="text-sm mt-1 flex items-center gap-1.5" style={{ color: C.gray }}><MapPin size={14} /> {ui(lang, "savedAddress")}: {farmer.address}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-semibold text-sm mb-3" style={{ color: C.black }}>{ui(lang, "preferredLang")}</div>
          <div className="flex gap-2">
            {LANGS.map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className="flex-1 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: lang === l ? C.green : C.chipBg, color: lang === l ? C.white : C.black }}>
                {l === "English" ? "English" : l === "Hindi" ? "हिंदी" : "ਪੰਜਾਬੀ"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: C.black }}><Bell size={16} /> {ui(lang, "notifications")}</div>
          <ToggleRow label={ui(lang, "weatherAlerts")} on={notif.weather} onChange={(v) => setNotif({ ...notif, weather: v })} />
          <ToggleRow label={ui(lang, "pestAlerts")} on={notif.pest} onChange={(v) => setNotif({ ...notif, pest: v })} />
          <ToggleRow label={ui(lang, "fertReminders")} on={notif.fert} onChange={(v) => setNotif({ ...notif, fert: v })} />
          <ToggleRow label={ui(lang, "govtSchemes")} on={notif.schemes} onChange={(v) => setNotif({ ...notif, schemes: v })} />
          <ToggleRow label={ui(lang, "orderUpdates")} on={notif.orders} onChange={(v) => setNotif({ ...notif, orders: v })} />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: C.black }}><ShieldCheck size={16} color={C.green} /> {ui(lang, "aiConsent")}</div>
          <ToggleRow label={ui(lang, "aiConsentDesc")} on={aiConsent} onChange={setAiConsent} />
        </div>

        <button onClick={onAgentLogin} className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: C.chipBg, color: C.darkgreen }}>
          <LogIn size={16} /> {ui(lang, "agentLogin")}
        </button>
      </div>
    </div>
  );
}

// ---------- Agent-side diagnosis + order flow (used after Agent Login) ----------

function InputMethodPicker({ category, method, setMethod }) {
  const opts = category === "fertilizer"
    ? [["text", Mic, "Type or speak"], ["photo", Camera, "Upload leaf photo"]]
    : [["text", Mic, "Type or speak"], ["photo", Camera, "Upload pest photo"]];
  return (
    <div className="flex gap-2 mb-5">
      {opts.map(([key, Icon, label]) => (
        <button key={key} onClick={() => setMethod(key)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border"
          style={method === key ? { borderColor: C.green, color: C.green, backgroundColor: "#F1F5E6" } : { borderColor: C.lightgray, color: C.gray }}>
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );
}
function PhotoUpload({ onUpload, label }) {
  return (
    <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 cursor-pointer" style={{ borderColor: C.lightgray }}>
      <Upload size={28} color={C.gray} />
      <span className="text-sm font-medium" style={{ color: C.gray }}>{label}</span>
      <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
    </label>
  );
}

function FarmerForm({ data, setData, onNext }) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const set = (k) => (v) => setData({ ...data, [k]: v });
  const canProceed = data.name.trim() && data.crop;

  const detectLocation = () => {
    if (!navigator.geolocation) { setGpsError("GPS isn't available in this browser."); return; }
    setGpsError(""); setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearest = null, minDist = Infinity;
        PUNJAB_ZONES.forEach((z) => { const d = distKm(latitude, longitude, z.lat, z.lng); if (d < minDist) { minDist = d; nearest = z; } });
        setData((prev) => ({ ...prev, gpsDistrict: nearest.name, gpsZone: nearest.zone, gpsDistKm: Math.round(minDist) }));
        setGpsLoading(false);
      },
      (err) => { setGpsError(err.code === 1 ? "Location permission was denied." : "Couldn't detect location — enter details manually."); setGpsLoading(false); },
      { timeout: 10000 }
    );
  };

  return (
    <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
      <div className="text-lg font-bold mb-1" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>Farmer & Field Details</div>
      <p className="text-sm mb-5" style={{ color: C.gray }}>Collected once per visit. Land size is entered separately for fertilizer and pesticide.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold" style={{ color: C.gray }}>FARMER NAME</label>
          <div className="mt-1"><MicInput icon={User} value={data.name} onChange={set("name")} placeholder="Full name" /></div>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: C.gray }}>PHONE NUMBER</label>
          <div className="mt-1"><MicInput icon={Phone} type="number" value={data.phone} onChange={set("phone")} placeholder="98765 43210" /></div>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: C.gray }}>VILLAGE / MANDI</label>
          <div className="mt-1"><MicInput icon={MapPin} value={data.village} onChange={set("village")} placeholder="e.g. Khanna" /></div>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: C.gray }}>CROP</label>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 mt-1" style={{ borderColor: C.lightgray }}>
            <Sprout size={16} color={C.gray} />
            <select value={data.crop} onChange={(e) => set("crop")(e.target.value)} className="w-full outline-none text-sm bg-transparent">
              <option value="">Select crop</option>
              <option>Rice (Paddy)</option>
              <option>Wheat</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-px my-5" style={{ backgroundColor: C.lightgray }} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold" style={{ color: C.gray }}>SOIL ZONE (GPS)</label>
          <button type="button" onClick={detectLocation} disabled={gpsLoading}
            className="w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 mt-1 text-sm" style={{ borderColor: C.lightgray, color: C.darkgreen }}>
            <Navigation size={16} color={C.green} className={gpsLoading ? "animate-pulse" : ""} />
            {gpsLoading ? "Detecting…" : data.gpsZone ? `${data.gpsDistrict} · ~${data.gpsDistKm}km` : "Detect my location"}
          </button>
          {data.gpsZone && <div className="text-xs mt-1" style={{ color: C.gray }}>{data.gpsZone}</div>}
          {gpsError && <div className="text-xs mt-1" style={{ color: C.gray }}>{gpsError}</div>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.darkgreen }}><FlaskConical size={13} /> Soil Health Card?</div>
          </div>
          <div className="flex gap-2">
            {["Yes", "No"].map((v) => (
              <button key={v} onClick={() => setData({ ...data, hasSHC: v === "Yes" })} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold border"
                style={(data.hasSHC ? "Yes" : "No") === v ? { backgroundColor: C.green, color: C.white, borderColor: C.green } : { borderColor: C.lightgray, color: C.gray }}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {data.hasSHC && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          {["n", "p", "k"].map((k) => (
            <div key={k}>
              <label className="text-xs font-semibold" style={{ color: C.gray }}>{k.toUpperCase()} (kg/ha)</label>
              <div className="mt-1"><MicInput type="number" icon={FlaskConical} value={data[k]} onChange={set(k)} placeholder="0" /></div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5"><PrimaryButton full disabled={!canProceed} onClick={onNext} icon={ChevronRight}>Continue</PrimaryButton></div>
    </div>
  );
}

// ---------- agent order flow ----------

function AgentOrderFlow({ lang, setLang, orders, onOrderConfirmed }) {
  const [step, setStep] = useState("farmer");
  const [farmer, setFarmer] = useState({ name: "", phone: "", village: "", crop: "", hasSHC: false, n: "", p: "", k: "", gpsDistrict: "", gpsZone: "", gpsDistKm: null });
  const [category, setCategory] = useState("fertilizer");
  const [method, setMethod] = useState("text");
  const [text, setText] = useState("");
  const [fertLandSize, setFertLandSize] = useState(String(PUNJAB_AVG_ACRES));
  const [pestLandSize, setPestLandSize] = useState(String(PUNJAB_AVG_ACRES));
  const [pendingResult, setPendingResult] = useState(null);
  const [report, setReport] = useState(null);
  const [orderTarget, setOrderTarget] = useState(null);

  const landSize = parseFloat(category === "fertilizer" ? fertLandSize : pestLandSize) || 1;
  const useShc = farmer.hasSHC && farmer.n !== "" && farmer.p !== "" && farmer.k !== "";

  const startAnalysis = (result, m) => { setMethod(m); setPendingResult(result); setStep("analyzing"); };
  const analyzeFromText = () => startAnalysis(category === "fertilizer" ? matchFertText(text) : matchPestText(text), "text");
  const analyzeFromPhoto = (e) => { if (!e.target.files?.[0]) return; startAnalysis(category === "fertilizer" ? matchFertPhoto() : matchPestPhoto(), "photo"); };
  const analyzeFromShc = () => { setMethod("shc"); setStep("analyzing"); };

  const finishAnalysis = () => {
    const id = genReportId(), timestamp = new Date().toLocaleString("en-IN");
    const crop = farmer.crop || "Wheat";
    if (method === "shc") {
      const rows = analyzeSoilCard({ n: farmer.n, p: farmer.p, k: farmer.k }, landSize, crop);
      const totalSavings = rows.reduce((s, r) => s + r.savings, 0);
      setReport({ type: "multi", rows, totalSavings, category: "fertilizer", method: "shc", soilZone: farmer.gpsZone, id, timestamp, model: "Khet Mitra SHC Engine v1.4", source: "Farmer's Soil Health Card" });
    } else if (category === "fertilizer") {
      const { match, confidence } = pendingResult;
      if (match.dir === "healthy") {
        setReport({ ...buildFertReportData("healthy", null, landSize), category: "fertilizer", method, confidence, soilZone: farmer.gpsZone, id, timestamp, model: method === "photo" ? "Khet Mitra Vision v2.3" : "Khet Mitra NLP Advisory v1.8", source: method === "photo" ? "Uploaded image analysis" : "Farmer-described symptoms" });
      } else {
        const { rows, totalSavings } = buildSeasonPlan(match.nutrient.key, match.dir, landSize, crop);
        setReport({ type: "multi", rows, totalSavings, category: "fertilizer", method, confidence, soilZone: farmer.gpsZone, id, timestamp, model: method === "photo" ? "Khet Mitra Vision v2.3" : "Khet Mitra NLP Advisory v1.8", source: method === "photo" ? "Uploaded image analysis" : "Farmer-described symptoms" });
      }
    } else {
      const { profile, confidence } = pendingResult;
      const { savings, required, typical } = computeSavings("pesticide", profile.perAcre, landSize, profile.product);
      setReport({ name: profile.label, product: profile.product, qty: required, unit: profile.unit, action: profile.perAcre === 0 ? null : `Apply ${required} ${profile.unit}`, savings, required, typical, dir: profile.perAcre === 0 ? "healthy" : "deficiency", category: "pesticide", method, confidence, id, timestamp, model: method === "photo" ? "Khet Mitra Pest Vision v1.7" : "Khet Mitra Pest-ID NLP v1.6", source: method === "photo" ? "Uploaded image analysis" : "Farmer-described symptoms" });
    }
    setStep("report");
  };

  if (step === "farmer") return <FarmerForm data={farmer} setData={setFarmer} onNext={() => setStep("category")} />;

  if (step === "category") {
    return (
      <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
        <button onClick={() => setStep("farmer")} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: C.gray }}><ChevronLeft size={16} /> Back</button>
        <div className="text-lg font-bold mb-4" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>What does {farmer.name.split(" ")[0] || "the farmer"} need?</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <button onClick={() => { setCategory("fertilizer"); setStep("fertSetup"); }} className="text-left rounded-2xl p-5 border" style={{ backgroundColor: C.cream, borderColor: C.lightgray }}>
            <Sprout size={22} color={C.green} className="mb-2" />
            <div className="font-bold" style={{ color: C.darkgreen }}>Fertilizer Advice</div>
            <div className="text-xs mt-1" style={{ color: C.gray }}>{farmer.hasSHC ? "Soil Health Card or symptom check" : "Leaf photo or symptom description"}</div>
          </button>
          <button onClick={() => { setCategory("pesticide"); setStep("pestSetup"); }} className="text-left rounded-2xl p-5 border" style={{ backgroundColor: C.cream, borderColor: C.lightgray }}>
            <Bug size={22} color={C.gold} className="mb-2" />
            <div className="font-bold" style={{ color: C.darkgreen }}>Pesticide Advice</div>
            <div className="text-xs mt-1" style={{ color: C.gray }}>Pest photo, or describe / speak symptoms</div>
          </button>
        </div>
      </div>
    );
  }

  if (step === "fertSetup") {
    return (
      <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
        <button onClick={() => setStep("category")} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: C.gray }}><ChevronLeft size={16} /> Back</button>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>Fertilizer Diagnosis</div>
          <LanguagePicker lang={lang} setLang={setLang} />
        </div>
        <div className="mb-5"><LandSizeInput value={fertLandSize} onChange={setFertLandSize} label="LAND SIZE FOR THIS FIELD (ACRES)" /></div>

        {useShc ? (
          <div className="rounded-xl p-4 border mb-4" style={{ borderColor: C.green, backgroundColor: "#F1F5E6" }}>
            <div className="flex items-center gap-2 mb-2"><FlaskConical size={16} color={C.green} /><span className="text-sm font-semibold" style={{ color: C.darkgreen }}>Soil Health Card on file</span></div>
            <p className="text-xs mb-3" style={{ color: C.gray }}>N: {farmer.n} · P: {farmer.p} · K: {farmer.k} kg/ha — gives a full 3-nutrient report.</p>
            <div className="flex gap-3">
              <PrimaryButton onClick={analyzeFromShc} icon={Sparkles}>Use Soil Card Data</PrimaryButton>
              <button onClick={() => setMethod("text")} className="text-xs font-semibold px-2" style={{ color: C.gray }}>or use symptoms below instead</button>
            </div>
          </div>
        ) : null}

        <InputMethodPicker category="fertilizer" method={method} setMethod={setMethod} />
        {method === "photo" ? (
          <PhotoUpload onUpload={analyzeFromPhoto} label="Click to upload a leaf photo" />
        ) : (
          <>
            <SpeechField value={text} onChange={setText} placeholder="Describe the crop symptoms…" />
            <div className="mt-5"><PrimaryButton disabled={!text.trim()} onClick={analyzeFromText} icon={Sparkles}>Generate Report</PrimaryButton></div>
          </>
        )}
      </div>
    );
  }

  if (step === "pestSetup") {
    return (
      <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
        <button onClick={() => setStep("category")} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: C.gray }}><ChevronLeft size={16} /> Back</button>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>Pesticide Diagnosis</div>
          <LanguagePicker lang={lang} setLang={setLang} />
        </div>
        <div className="mb-5"><LandSizeInput value={pestLandSize} onChange={setPestLandSize} label="LAND SIZE FOR THIS FIELD (ACRES)" /></div>
        <InputMethodPicker category="pesticide" method={method} setMethod={setMethod} />
        {method === "photo" ? (
          <PhotoUpload onUpload={analyzeFromPhoto} label="Click to upload a pest / damage photo" />
        ) : (
          <>
            <SpeechField value={text} onChange={setText} placeholder="Describe the crop symptoms…" />
            <div className="mt-5"><PrimaryButton disabled={!text.trim()} onClick={analyzeFromText} icon={Sparkles}>Generate Report</PrimaryButton></div>
          </>
        )}
      </div>
    );
  }

  if (step === "analyzing") {
    const stages = method === "shc" ? SHC_STAGES : method === "photo" ? (category === "fertilizer" ? PHOTO_STAGES : PEST_PHOTO_STAGES) : TEXT_STAGES;
    const duration = method === "shc" ? 6200 : method === "photo" ? 8600 : 6800;
    return <AnalyzingSequence stages={stages} durationMs={duration} onDone={finishAnalysis} />;
  }

  if (step === "report" && report) {
    return (
      <div>
        <button onClick={() => { setStep("category"); setReport(null); setText(""); }} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: C.gray }}><ChevronLeft size={16} /> Run another diagnosis</button>
        <ReportCard report={report} lang={lang} showOrderCta
          onOrder={() => { setOrderTarget([{ ...report }]); setStep("order"); }}
          onOrderCart={(rows) => { setOrderTarget(rows.map((r) => ({ ...r, category: "fertilizer" }))); setStep("order"); }} />
      </div>
    );
  }

  if (step === "order" && orderTarget && orderTarget.length) {
    const brands = orderTarget[0].category === "fertilizer" ? FERT_BRANDS : PEST_BRANDS;
    return <CartOrderScreen items={orderTarget} brands={brands} farmer={farmer}
      onBack={() => setStep("report")}
      onConfirm={(newOrders) => { onOrderConfirmed(newOrders); setStep("confirmed"); }} />;
  }

  if (step === "confirmed") {
    return (
      <div className="max-w-md mx-auto text-center rounded-2xl p-8 border" style={{ backgroundColor: C.white, borderColor: C.lightgray }}>
        <div className="rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: C.green }}><CircleCheck size={28} color={C.white} /></div>
        <div className="text-xl font-bold mb-1" style={{ ...DISPLAY_FONT, color: C.darkgreen }}>Order Confirmed</div>
        <p className="text-sm mb-5" style={{ color: C.gray }}>Logged for {farmer.name} — pickup at Sahi Salah Kendra.</p>
        <div className="flex flex-col gap-2">
          <PrimaryButton full onClick={() => { setStep("category"); setReport(null); setText(""); setOrderTarget(null); }}>Run Another Diagnosis</PrimaryButton>
          <button onClick={() => {
            setStep("farmer");
            setFarmer({ name: "", phone: "", village: "", crop: "", hasSHC: false, n: "", p: "", k: "", gpsDistrict: "", gpsZone: "", gpsDistKm: null });
            setReport(null); setText(""); setOrderTarget(null);
          }} className="text-sm font-semibold py-2" style={{ color: C.gray }}>Start Next Farmer</button>
        </div>
      </div>
    );
  }

  return null;
}


// =====================================================================
// ROOT APP
// =====================================================================

export default function KhetMitraApp() {
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null); // { type: "scan", category } | "seeds" | "login" | "agentFlow" | "dashboard" | "agentOrderHistory"
  const [lang, setLang] = useState("English");
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [agentName, setAgentName] = useState(null);
  const farmer = DEFAULT_FARMER;

  function saveOrder(newOrders) {
    const list = Array.isArray(newOrders) ? newOrders : [newOrders];
    setOrders((prev) => [...prev, ...list]);
  }
  function saveReport(r) {
    setReports((prev) => [...prev, r]);
  }

  function closeOverlay() { setOverlay(null); }

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: "#DDD" }}>
      <div className="w-full max-w-md bg-white flex flex-col" style={{ minHeight: "100vh" }}>
        <TopBar lang={lang} setLang={setLang} onAgentLogin={() => setOverlay("login")} />

        <div className="flex-1 overflow-y-auto">
          {overlay?.type === "scan" && (
            <ScanScreen category={overlay.category} lang={lang} farmer={farmer} onBack={closeOverlay} onReportSaved={saveReport} onOrderPlaced={saveOrder} />
          )}
          {overlay === "seeds" && <BuySeedsScreen farmer={farmer} lang={lang} onBack={closeOverlay} onOrderPlaced={saveOrder} />}
          {overlay === "login" && (
            <LoginScreen onBack={closeOverlay} onLogin={(id) => { setAgentName(id); setOverlay("agentFlow"); }} />
          )}
          {overlay === "agentFlow" && (
            <AgentOrderFlow lang={lang} setLang={setLang} orders={orders} onOrderConfirmed={saveOrder} />
          )}
          {overlay === "agentOrderHistory" && (
            <OrderHistory orders={orders} onBack={() => setOverlay("agentFlow")} onAdvanceStatus={(idx, status) => {
              setOrders((prev) => prev.map((o, i) => i === idx ? { ...o, status } : o));
            }} />
          )}
          {overlay === "dashboard" && (
            <BusinessDashboard onBack={() => setOverlay("agentFlow")} orders={orders} reports={reports} />
          )}

          {overlay === "desk" && <NearbyDeskScreen farmer={farmer} lang={lang} />}

          {!overlay && tab === "home" && (
            <HomeScreen
              farmer={farmer} lang={lang} reports={reports}
              onOpenScan={(category) => setOverlay({ type: "scan", category })}
              onOpenSeeds={() => setOverlay("seeds")}
              onOpenDesk={() => setOverlay("desk")}
              onViewHistory={() => setTab("history")}
            />
          )}
          {!overlay && tab === "orders" && <OrdersScreen orders={orders} lang={lang} />}
          {!overlay && tab === "history" && <HistoryScreen reports={reports} lang={lang} />}
          {!overlay && tab === "profile" && (
            <ProfileScreen farmer={farmer} lang={lang} setLang={setLang} onAgentLogin={() => setOverlay("login")} />
          )}
        </div>

        {!overlay && <BottomNav tab={tab} setTab={setTab} lang={lang} />}
        {overlay && overlay !== "agentFlow" && overlay !== "dashboard" && overlay !== "agentOrderHistory" && (
          <div className="p-3 border-t bg-white" style={{ borderColor: C.lightgray }}>
            <button onClick={closeOverlay} className="w-full py-2 text-sm font-medium flex items-center justify-center gap-1.5" style={{ color: C.gray }}>
              <ArrowLeft size={15} /> Back to Home
            </button>
          </div>
        )}
        {(overlay === "agentFlow" || overlay === "dashboard" || overlay === "agentOrderHistory") && (
          <div className="p-3 border-t bg-white flex gap-2" style={{ borderColor: C.lightgray }}>
            {overlay === "agentFlow" && (
              <>
                <button onClick={() => setOverlay("dashboard")} className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5" style={{ backgroundColor: C.chipBg, color: C.darkgreen }}>
                  <LayoutDashboard size={14} /> Dashboard
                </button>
                <button onClick={() => setOverlay("agentOrderHistory")} className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5" style={{ backgroundColor: C.chipBg, color: C.darkgreen }}>
                  <History size={14} /> Orders
                </button>
              </>
            )}
            <button onClick={() => { setAgentName(null); closeOverlay(); }} className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5" style={{ backgroundColor: C.lightgray, color: C.black }}>
              <LogOut size={14} /> Exit Agent Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

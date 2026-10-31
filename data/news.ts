import type { NewsArticle, NewsSource } from "@/lib/types";

/**
 * Demo content is explicitly labelled in the UI. It is NOT live news and must
 * never be presented as verified or breaking news. Real headlines are loaded
 * from configured, permitted RSS feeds via /api/cron/news.
 */
export const demoNews: NewsArticle[] = [
  {
    id: "demo-roads-1",
    title: {
      hi: "गड्ढों की मरम्मत के लिए नगर निगम की नई समय-सीमा",
      en: "Municipal corporation sets a new deadline for pothole repairs",
    },
    summary: {
      hi: "यह एक उदाहरण खबर है जो दिखाती है कि स्थानीय सड़कों से जुड़ी खबरें कैसी दिखेंगी। वास्तविक खबर के लिए स्रोत लिंक के साथ लाइव फ़ीड जोड़ें।",
      en: "This is a sample article showing how local road-related news will appear. Connect a live feed for real stories with source links.",
    },
    category: "roads",
    stateId: "up",
    districtId: "up-lucknow",
    sourceName: "उदाहरण सामग्री (डेमो)",
    sourceUrl: null,
    publishedAt: null,
    language: "hi",
    isDemo: true,
    lastVerifiedAt: null,
  },
  {
    id: "demo-water-1",
    title: {
      hi: "मोहल्लों में जलापूर्ति समय-सारणी जारी करने की मांग",
      en: "Residents ask for a published water supply schedule",
    },
    summary: {
      hi: "नागरिकों ने साफ़ समय-सारणी और हेल्पलाइन नंबर की मांग की। यह लेख केवल प्रारूप दिखाने के लिए है।",
      en: "Citizens asked for a clear schedule and helpline number. This article only demonstrates the layout.",
    },
    category: "water",
    stateId: "up",
    districtId: "up-lucknow",
    sourceName: "उदाहरण सामग्री (डेमो)",
    sourceUrl: null,
    publishedAt: null,
    language: "hi",
    isDemo: true,
    lastVerifiedAt: null,
  },
  {
    id: "demo-scheme-1",
    title: {
      hi: "सरकारी योजना की पात्रता और आवेदन प्रक्रिया को समझना",
      en: "Understanding eligibility and the application process for a government scheme",
    },
    summary: {
      hi: "योजना से जुड़ी जानकारी हमेशा आधिकारिक पोर्टल से जाँचें। यह उदाहरण कार्ड आधिकारिक स्रोत लिंक के साथ जानकारी दिखाने का तरीका बताता है।",
      en: "Always verify scheme details on the official portal. This sample card shows how official source links will be displayed.",
    },
    category: "schemes",
    stateId: "bihar",
    districtId: "bihar-patna",
    sourceName: "उदाहरण सामग्री (डेमो)",
    sourceUrl: null,
    publishedAt: null,
    language: "hi",
    isDemo: true,
    lastVerifiedAt: null,
  },
  {
    id: "demo-municipal-1",
    title: {
      hi: "सफ़ाई व्यवस्था पर नागरिक फ़ीडबैक अभियान",
      en: "Citizen feedback drive on sanitation services",
    },
    summary: {
      hi: "नगरीय सेवाओं पर नागरिक अनुभव साझा कर सकते हैं। यह डेमो प्रविष्टि है, कोई वास्तविक अभियान नहीं।",
      en: "Citizens can share experiences about urban services. This is a demo entry, not a real campaign.",
    },
    category: "municipal",
    stateId: "bihar",
    districtId: "bihar-patna",
    sourceName: "उदाहरण सामग्री (डेमो)",
    sourceUrl: null,
    publishedAt: null,
    language: "hi",
    isDemo: true,
    lastVerifiedAt: null,
  },
  {
    id: "demo-education-1",
    title: {
      hi: "सरकारी स्कूलों में नामांकन प्रक्रिया: अभिभावकों के लिए जानकारी",
      en: "Government school admissions: a guide for parents",
    },
    summary: {
      hi: "नामांकन से जुड़ी जानकारी के लिए शिक्षा विभाग के आधिकारिक पोर्टल और स्थानीय स्कूल से संपर्क करें।",
      en: "For admission details, check the education department portal and contact the local school.",
    },
    category: "education",
    stateId: "up",
    districtId: "up-varanasi",
    sourceName: "उदाहरण सामग्री (डेमो)",
    sourceUrl: null,
    publishedAt: null,
    language: "hi",
    isDemo: true,
    lastVerifiedAt: null,
  },
  {
    id: "demo-health-1",
    title: {
      hi: "प्राथमिक स्वास्थ्य केंद्रों में उपलब्ध सेवाओं की जानकारी",
      en: "What services are available at primary health centres",
    },
    summary: {
      hi: "स्वास्थ्य सेवाओं की जानकारी राज्य स्वास्थ्य विभाग के आधिकारिक पोर्टल पर उपलब्ध होती है। यह केवल उदाहरण है।",
      en: "Health service details are available on the state health department portal. This is only a sample.",
    },
    category: "health",
    stateId: "up",
    districtId: "up-prayagraj",
    sourceName: "उदाहरण सामग्री (डेमो)",
    sourceUrl: null,
    publishedAt: null,
    language: "hi",
    isDemo: true,
    lastVerifiedAt: null,
  },
];

/**
 * Only permitted, official feeds should be enabled here. PIB is a Government of
 * India public information source; always retain attribution and link back.
 * Additional feeds should be reviewed for licence/terms before enabling.
 */
export const newsSources: NewsSource[] = [
  {
    id: "pib-hindi",
    name: "पत्र सूचना कार्यालय (PIB) — हिंदी",
    feedUrl: "https://www.pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
    language: "hi",
    scope: "national",
    enabled: true,
    attribution: "स्रोत: पत्र सूचना कार्यालय (PIB), भारत सरकार",
    termsNote: "सरकारी जन-सूचना फ़ीड। शीर्षक, छोटा सारांश और मूल लिंक के साथ श्रेय दिया जाता है।",
    lastFetchedAt: null,
  },
];

export const newsCategories = [
  { id: "local", hi: "स्थानीय नागरिक मुद्दे", en: "Local civic issues" },
  { id: "state", hi: "राज्य की राजनीति", en: "State politics" },
  { id: "national", hi: "राष्ट्रीय राजनीति", en: "National politics" },
  { id: "schemes", hi: "सरकारी योजनाएँ", en: "Government schemes" },
  { id: "education", hi: "शिक्षा", en: "Education" },
  { id: "roads", hi: "सड़क और बुनियादी ढाँचा", en: "Roads & infrastructure" },
  { id: "water", hi: "पानी और बिजली", en: "Water & electricity" },
  { id: "health", hi: "स्वास्थ्य", en: "Health" },
  { id: "employment", hi: "रोज़गार", en: "Employment" },
  { id: "municipal", hi: "नगरपालिका सेवाएँ", en: "Municipal services" },
  { id: "safety", hi: "जन सुरक्षा", en: "Public safety" },
] as const;

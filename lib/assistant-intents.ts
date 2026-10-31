import { quizzes } from "@/data/quizzes";
import type { Locale } from "@/lib/types";

export type AssistantIntent =
  | "news"
  | "representatives"
  | "water-complaint"
  | "issues"
  | "schemes"
  | "quiz"
  | "emergency"
  | "voter"
  | "greeting"
  | "fallback";

const rules: { intent: AssistantIntent; patterns: RegExp[] }[] = [
  { intent: "greeting", patterns: [/^(नमस्ते|नमस्कार|hello|hi|hey|hii)[\s!।.]*$/i] },
  {
    intent: "news",
    patterns: [/(खबर|समाचार|न्यूज़|news|headline|khabar|samachar)/i],
  },
  {
    intent: "water-complaint",
    patterns: [
      /(पानी|water|jal).{0,30}(शिकायत|complaint|कहाँ|kahan|where|समस्या|problem)/i,
      /(शिकायत|complaint).{0,30}(पानी|water|jal)/i,
    ],
  },
  {
    intent: "representatives",
    patterns: [
      /(mla|mp|mlc|सांसद|विधायक|विधानसभा|पार्षद|महापौर|प्रधान|जनप्रतिनिधि|councillor|mayor|representative|sansad|vidhayak|parshad)/i,
    ],
  },
  {
    intent: "schemes",
    patterns: [/(योजना|योजनाएँ|scheme|सब्सिडी|subsidy|राशन|आवास|pension|पेंशन)/i],
  },
  {
    intent: "emergency",
    patterns: [/(आपात|emergency|112|पुलिस|police|एम्बुलेंस|ambulance|मदद|help)/i],
  },
  {
    intent: "voter",
    patterns: [/(मतदाता|वोट|चुनाव|voter|vote|election|form 6|1950)/i],
  },
  {
    intent: "quiz",
    patterns: [/(quiz|क्विज|खेल|game|सीखना|learn)/i],
  },
  {
    intent: "issues",
    patterns: [/(शिकायत|समस्या|complaint|problem|गड्ढा|pothole|कचरा|garbage|स्ट्रीटलाइट|streetlight|सड़क|road)/i],
  },
];

export function detectIntent(query: string): AssistantIntent {
  const normalized = query.trim();
  if (!normalized) return "fallback";
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) return rule.intent;
  }
  return "fallback";
}

export function replyForIntent(
  intent: AssistantIntent,
  locale: Locale,
): { text: string; links: { label: string; href: string; external?: boolean }[] } {
  const hi = locale === "hi";
  switch (intent) {
    case "greeting":
      return {
        text: hi
          ? "नमस्कार! मैं जनता साथी हूँ। आप खबरें, जनप्रतिनिधि, शिकायत, योजनाएँ या क्विज़ के बारे में पूछ सकते हैं।"
          : "Hello! I am Janata Saathi. You can ask about news, representatives, complaints, schemes or quizzes.",
        links: [],
      };
    case "news":
      return {
        text: hi
          ? "मैं ताज़ा खबरें आपके चुने हुए इलाके के हिसाब से दिखा रहा हूँ। हर खबर के साथ स्रोत और समय जाँचें।"
          : "Here are the latest stories for your selected area. Check the source and timestamp on each story.",
        links: [{ label: hi ? "सभी खबरें देखें" : "View all news", href: "/news" }],
      };
    case "representatives":
      return {
        text: hi
          ? "जनप्रतिनिधियों के नाम अनुमान से नहीं भरे जाते। अपना ज़िला चुनें और आधिकारिक स्रोत से सत्यापित जानकारी देखें। यदि डेटा सत्यापित नहीं है तो पेज साफ़ रूप से बताएगा।"
          : "Representative names are never guessed. Choose your district and verify through the official source. If data is not verified, the page says so clearly.",
        links: [
          { label: hi ? "जनप्रतिनिधि पेज" : "Representatives page", href: "/representatives" },
          { label: hi ? "मतदाता सूची (ECI)" : "Electoral roll (ECI)", href: "https://electoralsearch.eci.gov.in/", external: true },
        ],
      };
    case "water-complaint":
      return {
        text: hi
          ? "पानी की शिकायत के लिए पहले अपने नगरीय निकाय (शहर) या ग्राम पंचायत (गाँव) से संपर्क करें। उत्तर प्रदेश में जनसुनवाई पोर्टल पर भी शिकायत दर्ज हो सकती है। शिकायत संख्या सहेजें।"
          : "For a water complaint, contact your urban local body (city) or gram panchayat (village) first. In Uttar Pradesh, the Jansunwai portal also accepts complaints. Save your complaint number.",
        links: [
          { label: hi ? "समस्या दर्ज करें" : "Report an issue", href: "/issues/new?category=water" },
          { label: hi ? "जल शिकायत पोर्टल (UP)" : "Jansunwai (UP)", href: "https://jansunwai.up.nic.in/", external: true },
        ],
      };
    case "issues":
      return {
        text: hi
          ? "आप सड़क, पानी, सफ़ाई, बिजली, स्ट्रीटलाइट या परिवहन की समस्या दर्ज कर सकते हैं। आपको ट्रैकिंग कोड मिलेगा। यह सरकारी शिकायत दर्ज होने का विकल्प नहीं, बल्कि स्थानीय रिकॉर्ड है।"
          : "You can report roads, water, sanitation, electricity, streetlights or transport issues. You will get a tracking code. This is a local record, not a government complaint registration.",
        links: [
          { label: hi ? "समस्या दर्ज करें" : "Report an issue", href: "/issues/new" },
          { label: hi ? "समस्याएँ देखें" : "Browse issues", href: "/issues" },
        ],
      };
    case "schemes":
      return {
        text: hi
          ? "योजनाओं की पात्रता और आवेदन प्रक्रिया हमेशा आधिकारिक पोर्टल पर जाँचें। हमारी योजना क्विज़ से बुनियादी समझ बनाइए, फिर official portal पर पुष्टि करें।"
          : "Always verify scheme eligibility and application steps on the official portal. Use our schemes quiz for the basics, then confirm on the official portal.",
        links: [
          { label: hi ? "योजना क्विज़" : "Schemes quiz", href: "/games/schemes" },
          { label: "National Portal of India", href: "https://www.india.gov.in/", external: true },
        ],
      };
    case "quiz":
      return {
        text: hi
          ? `नागरिक ज्ञान के ${quizzes.length} खेल उपलब्ध हैं — संविधान, योजनाएँ, जनप्रतिनिधि भूमिकाएँ और मिथक-तथ्य। स्कोर केवल सीखने के लिए है।`
          : `There are ${quizzes.length} civic quizzes — Constitution, schemes, representative roles and myth-vs-fact. Scores are for learning only.`,
        links: [{ label: hi ? "सभी खेल" : "All games", href: "/games" }],
      };
    case "emergency":
      return {
        text: hi
          ? "तत्काल आपात स्थिति में 112 पर कॉल करें। पुलिस के लिए 100, अग्निशमन के लिए 101 और एम्बुलेंस के लिए 108 है। यह जानकारी सलाह नहीं, आधिकारिक हेल्पलाइन है।"
          : "In an immediate emergency call 112. Police: 100, fire: 101, ambulance: 108. These are official helplines, not legal advice.",
        links: [{ label: "112 India", href: "https://112.gov.in/", external: true }],
      };
    case "voter":
      return {
        text: hi
          ? "मतदाता पंजीकरण के लिए Form 6, मतदाता सूची खोजने के लिए ECI का पोर्टल और मदद के लिए 1950 हेल्पलाइन उपलब्ध है।"
          : "Use Form 6 for voter registration, the ECI portal to search the electoral roll, and the 1950 helpline for help.",
        links: [
          { label: hi ? "मतदाता पोर्टल" : "Voters' portal", href: "https://voters.eci.gov.in/", external: true },
          { label: hi ? "मतदाता जागरूकता क्विज़" : "Voter awareness quiz", href: "/games/voter-awareness" },
        ],
      };
    default:
      return {
        text: hi
          ? "मैं इस सवाल को पूरी तरह नहीं समझ पाया। आप खोज का इस्तेमाल करें या नीचे दिए विषयों में से चुनें। मैं केवल जानकारी देता हूँ, कोई कानूनी सलाह नहीं।"
          : "I could not fully understand that. Try search or pick a topic below. I provide information only, not legal advice.",
        links: [
          { label: hi ? "खोजें" : "Search", href: "/search" },
          { label: hi ? "सवाल-जवाब" : "Civic Q&A", href: "/qa" },
        ],
      };
  }
}

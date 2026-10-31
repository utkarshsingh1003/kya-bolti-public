import type { State } from "@/lib/types";

const up = [
  ["agra", "आगरा", "Agra"], ["aligarh", "अलीगढ़", "Aligarh"], ["ambedkar-nagar", "अम्बेडकर नगर", "Ambedkar Nagar"],
  ["amethi", "अमेठी", "Amethi"], ["amroha", "अमरोहा", "Amroha"], ["auraiya", "औरैया", "Auraiya"],
  ["ayodhya", "अयोध्या", "Ayodhya"], ["azamgarh", "आज़मगढ़", "Azamgarh"], ["baghpat", "बागपत", "Baghpat"],
  ["bahraich", "बहराइच", "Bahraich"], ["ballia", "बलिया", "Ballia"], ["balrampur", "बलरामपुर", "Balrampur"],
  ["banda", "बांदा", "Banda"], ["barabanki", "बाराबंकी", "Barabanki"], ["bareilly", "बरेली", "Bareilly"],
  ["basti", "बस्ती", "Basti"], ["bhadohi", "भदोही", "Bhadohi"], ["bijnor", "बिजनौर", "Bijnor"],
  ["budaun", "बदायूं", "Budaun"], ["bulandshahr", "बुलंदशहर", "Bulandshahr"], ["chandauli", "चंदौली", "Chandauli"],
  ["chitrakoot", "चित्रकूट", "Chitrakoot"], ["deoria", "देवरिया", "Deoria"], ["etah", "एटा", "Etah"],
  ["etawah", "इटावा", "Etawah"], ["farrukhabad", "फर्रुखाबाद", "Farrukhabad"], ["fatehpur", "फतेहपुर", "Fatehpur"],
  ["firozabad", "फिरोज़ाबाद", "Firozabad"], ["gautam-buddha-nagar", "गौतम बुद्ध नगर", "Gautam Buddha Nagar"],
  ["ghaziabad", "गाज़ियाबाद", "Ghaziabad"], ["ghazipur", "गाज़ीपुर", "Ghazipur"], ["gonda", "गोंडा", "Gonda"],
  ["gorakhpur", "गोरखपुर", "Gorakhpur"], ["hamirpur", "हमीरपुर", "Hamirpur"], ["hapur", "हापुड़", "Hapur"],
  ["hardoi", "हरदोई", "Hardoi"], ["hathras", "हाथरस", "Hathras"], ["jalaun", "जालौन", "Jalaun"],
  ["jaunpur", "जौनपुर", "Jaunpur"], ["jhansi", "झांसी", "Jhansi"], ["kannauj", "कन्नौज", "Kannauj"],
  ["kanpur-dehat", "कानपुर देहात", "Kanpur Dehat"], ["kanpur-nagar", "कानपुर नगर", "Kanpur Nagar"],
  ["kasganj", "कासगंज", "Kasganj"], ["kaushambi", "कौशाम्बी", "Kaushambi"], ["kushinagar", "कुशीनगर", "Kushinagar"],
  ["lakhimpur-kheri", "लखीमपुर खीरी", "Lakhimpur Kheri"], ["lalitpur", "ललितपुर", "Lalitpur"],
  ["lucknow", "लखनऊ", "Lucknow"], ["maharajganj", "महाराजगंज", "Maharajganj"], ["mahoba", "महोबा", "Mahoba"],
  ["mainpuri", "मैनपुरी", "Mainpuri"], ["mathura", "मथुरा", "Mathura"], ["mau", "मऊ", "Mau"],
  ["meerut", "मेरठ", "Meerut"], ["mirzapur", "मिर्ज़ापुर", "Mirzapur"], ["moradabad", "मुरादाबाद", "Moradabad"],
  ["muzaffarnagar", "मुज़फ़्फ़रनगर", "Muzaffarnagar"], ["pilibhit", "पीलीभीत", "Pilibhit"],
  ["pratapgarh", "प्रतापगढ़", "Pratapgarh"], ["prayagraj", "प्रयागराज", "Prayagraj"],
  ["rae-bareli", "रायबरेली", "Rae Bareli"], ["rampur", "रामपुर", "Rampur"], ["saharanpur", "सहारनपुर", "Saharanpur"],
  ["sambhal", "सम्भल", "Sambhal"], ["sant-kabir-nagar", "संत कबीर नगर", "Sant Kabir Nagar"],
  ["shahjahanpur", "शाहजहांपुर", "Shahjahanpur"], ["shamli", "शामली", "Shamli"], ["shravasti", "श्रावस्ती", "Shravasti"],
  ["siddharthnagar", "सिद्धार्थनगर", "Siddharthnagar"], ["sitapur", "सीतापुर", "Sitapur"],
  ["sonbhadra", "सोनभद्र", "Sonbhadra"], ["sultanpur", "सुल्तानपुर", "Sultanpur"], ["unnao", "उन्नाव", "Unnao"],
  ["varanasi", "वाराणसी", "Varanasi"],
] as const;

const bihar = [
  ["araria", "अररिया", "Araria"], ["arwal", "अरवल", "Arwal"], ["aurangabad", "औरंगाबाद", "Aurangabad"],
  ["banka", "बांका", "Banka"], ["begusarai", "बेगूसराय", "Begusarai"], ["bhagalpur", "भागलपुर", "Bhagalpur"],
  ["bhojpur", "भोजपुर", "Bhojpur"], ["buxar", "बक्सर", "Buxar"], ["darbhanga", "दरभंगा", "Darbhanga"],
  ["east-champaran", "पूर्वी चंपारण", "East Champaran"], ["gaya", "गया", "Gaya"], ["gopalganj", "गोपालगंज", "Gopalganj"],
  ["jamui", "जमुई", "Jamui"], ["jehanabad", "जहानाबाद", "Jehanabad"], ["kaimur", "कैमूर", "Kaimur"],
  ["katihar", "कटिहार", "Katihar"], ["khagaria", "खगड़िया", "Khagaria"], ["kishanganj", "किशनगंज", "Kishanganj"],
  ["lakhisarai", "लखीसराय", "Lakhisarai"], ["madhepura", "मधेपुरा", "Madhepura"], ["madhubani", "मधुबनी", "Madhubani"],
  ["munger", "मुंगेर", "Munger"], ["muzaffarpur", "मुज़फ़्फ़रपुर", "Muzaffarpur"], ["nalanda", "नालंदा", "Nalanda"],
  ["nawada", "नवादा", "Nawada"], ["patna", "पटना", "Patna"], ["purnia", "पूर्णिया", "Purnia"],
  ["rohtas", "रोहतास", "Rohtas"], ["saharsa", "सहरसा", "Saharsa"], ["samastipur", "समस्तीपुर", "Samastipur"],
  ["saran", "सारण", "Saran"], ["sheikhpura", "शेखपुरा", "Sheikhpura"], ["sheohar", "शिवहर", "Sheohar"],
  ["sitamarhi", "सीतामढ़ी", "Sitamarhi"], ["siwan", "सीवान", "Siwan"], ["supaul", "सुपौल", "Supaul"],
  ["vaishali", "वैशाली", "Vaishali"], ["west-champaran", "पश्चिम चंपारण", "West Champaran"],
] as const;

function toDistricts(prefix: string, rows: readonly (readonly [string, string, string])[]) {
  return rows.map(([id, nameHi, nameEn]) => ({ id: `${prefix}-${id}`, nameHi, nameEn }));
}

const otherStates = [
  ["maharashtra", "महाराष्ट्र", "Maharashtra"],
  ["madhya-pradesh", "मध्य प्रदेश", "Madhya Pradesh"],
  ["rajasthan", "राजस्थान", "Rajasthan"],
  ["delhi", "दिल्ली", "Delhi"],
  ["west-bengal", "पश्चिम बंगाल", "West Bengal"],
  ["punjab", "पंजाब", "Punjab"],
  ["haryana", "हरियाणा", "Haryana"],
  ["gujarat", "गुजरात", "Gujarat"],
  ["karnataka", "कर्नाटक", "Karnataka"],
  ["tamil-nadu", "तमिलनाडु", "Tamil Nadu"],
  ["telangana", "तेलंगाना", "Telangana"],
  ["andhra-pradesh", "आंध्र प्रदेश", "Andhra Pradesh"],
  ["odisha", "ओडिशा", "Odisha"],
  ["jharkhand", "झारखंड", "Jharkhand"],
  ["chhattisgarh", "छत्तीसगढ़", "Chhattisgarh"],
  ["uttarakhand", "उत्तराखंड", "Uttarakhand"],
  ["himachal-pradesh", "हिमाचल प्रदेश", "Himachal Pradesh"],
  ["assam", "असम", "Assam"],
  ["kerala", "केरल", "Kerala"],
  ["goa", "गोवा", "Goa"],
] as const;

export const states: State[] = [
  {
    id: "up",
    nameHi: "उत्तर प्रदेश",
    nameEn: "Uttar Pradesh",
    districts: toDistricts("up", up),
    active: true,
  },
  {
    id: "bihar",
    nameHi: "बिहार",
    nameEn: "Bihar",
    districts: toDistricts("bihar", bihar),
    active: true,
  },
  ...otherStates.map(([id, nameHi, nameEn]) => ({
    id,
    nameHi,
    nameEn,
    districts: [],
    active: false,
  })),
];

export function getState(stateId: string): State | undefined {
  return states.find((state) => state.id === stateId);
}

export function getDistrict(districtId: string) {
  for (const state of states) {
    const district = state.districts.find((d) => d.id === districtId);
    if (district) return { state, district };
  }
  return null;
}

export const defaultLocation = {
  stateId: "up",
  districtId: "up-lucknow",
  label: "लखनऊ, उत्तर प्रदेश",
} as const;

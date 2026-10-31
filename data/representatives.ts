import type { LocalizedText, RepresentativeRole } from "@/lib/types";

/**
 * Structural role catalogue. Names and contact details are intentionally NOT
 * seeded here: representative data must be imported from an official source and
 * marked verified, with a verification date. The UI shows an explicit
 * "not verified yet" state instead of guessing.
 */
export const roleInfo: Record<
  RepresentativeRole,
  {
    title: LocalizedText;
    scope: LocalizedText;
    responsibility: LocalizedText;
    appliesTo: "all" | "urban" | "rural" | "state_with_council";
    sourceLabel: string;
    sourceUrl: string;
  }
> = {
  mp: {
    title: { hi: "सांसद (MP)", en: "Member of Parliament (MP)" },
    scope: { hi: "लोकसभा क्षेत्र", en: "Lok Sabha constituency" },
    responsibility: {
      hi: "संसद में कानून बनाने, केंद्रीय बजट और राष्ट्रीय नीतियों में भागीदारी; अपने क्षेत्र की आवाज़ संसद में उठाना।",
      en: "Participates in national law-making, the Union budget and national policy; raises constituency concerns in Parliament.",
    },
    appliesTo: "all",
    sourceLabel: "संसद सदस्य सूची (sansad.in)",
    sourceUrl: "https://sansad.in/ls/members",
  },
  mla: {
    title: { hi: "विधायक (MLA)", en: "Member of Legislative Assembly (MLA)" },
    scope: { hi: "विधानसभा क्षेत्र", en: "Assembly constituency" },
    responsibility: {
      hi: "राज्य विधानसभा में कानून, राज्य बजट और स्थानीय नीतियों पर काम; क्षेत्र की समस्याएँ सदन में उठाना।",
      en: "Works on state laws, the state budget and local policy in the Assembly; raises constituency issues on the floor.",
    },
    appliesTo: "all",
    sourceLabel: "राज्य विधानसभा की आधिकारिक वेबसाइट",
    sourceUrl: "https://uplegisassembly.gov.in/",
  },
  mlc: {
    title: { hi: "विधान परिषद सदस्य (MLC)", en: "Member of Legislative Council (MLC)" },
    scope: { hi: "विधान परिषद क्षेत्र / निर्वाचन मंडल", en: "Legislative Council seat" },
    responsibility: {
      hi: "जिन राज्यों में विधान परिषद है, वहाँ विधेयकों की समीक्षा और राज्य विधायिका में भागीदारी। हर राज्य में परिषद नहीं होती।",
      en: "Reviews bills and participates in the state legislature in states that have a Legislative Council. Not every state has one.",
    },
    appliesTo: "state_with_council",
    sourceLabel: "विधान परिषद की आधिकारिक जानकारी",
    sourceUrl: "https://uplegisassembly.gov.in/",
  },
  mayor: {
    title: { hi: "महापौर", en: "Mayor" },
    scope: { hi: "नगर निगम", en: "Municipal corporation" },
    responsibility: {
      hi: "नगर निगम की सभाओं की अध्यक्षता और शहर की नागरिक सेवाओं की निगरानी; यह भूमिका हर शहर में नहीं होती।",
      en: "Chairs municipal corporation meetings and oversees city services; this office does not exist in every city.",
    },
    appliesTo: "urban",
    sourceLabel: "राज्य नगरीय विकास विभाग",
    sourceUrl: "https://urban.up.nic.in/",
  },
  chairperson: {
    title: { hi: "नगर पालिका/नगर पंचायत अध्यक्ष", en: "Municipal chairperson" },
    scope: { hi: "नगर पालिका या नगर पंचायत", en: "Municipal council / town panchayat" },
    responsibility: {
      hi: "छोटे शहरों में नगरीय सेवाओं और निकाय की बैठकों की अध्यक्षता; नगर निगम वाले शहरों में महापौर की भूमिका होती है।",
      en: "Leads urban services and council meetings in smaller towns; larger cities have a Mayor instead.",
    },
    appliesTo: "urban",
    sourceLabel: "राज्य नगरीय विकास विभाग",
    sourceUrl: "https://urban.up.nic.in/",
  },
  councillor: {
    title: { hi: "पार्षद", en: "Ward councillor" },
    scope: { hi: "वार्ड", en: "Ward" },
    responsibility: {
      hi: "वार्ड की स्थानीय समस्याएँ नगरीय निकाय तक पहुँचाना; सफ़ाई, स्ट्रीटलाइट और सड़क जैसी सेवाओं पर ध्यान दिलाना।",
      en: "Represents ward-level issues to the urban body, including sanitation, streetlights and local roads.",
    },
    appliesTo: "urban",
    sourceLabel: "नगरीय निकाय / राज्य निर्वाचन आयोग",
    sourceUrl: "https://urban.up.nic.in/",
  },
  gram_pradhan: {
    title: { hi: "ग्राम प्रधान", en: "Gram Pradhan" },
    scope: { hi: "ग्राम पंचायत", en: "Gram panchayat" },
    responsibility: {
      hi: "गाँव की पंचायत का नेतृत्व; स्थानीय सफ़ाई, पेयजल, सड़क और योजनाओं के क्रियान्वयन में भूमिका।",
      en: "Leads the village panchayat and supports local sanitation, drinking water, roads and scheme implementation.",
    },
    appliesTo: "rural",
    sourceLabel: "पंचायती राज विभाग",
    sourceUrl: "https://panchayatiraj.up.nic.in/",
  },
  district_magistrate: {
    title: { hi: "जिलाधिकारी (DM)", en: "District Magistrate (DM)" },
    scope: { hi: "जिला प्रशासन", en: "District administration" },
    responsibility: {
      hi: "जिले का प्रशासनिक प्रमुख; यह निर्वाचित पद नहीं है। कानून-व्यवस्था और जिला स्तरीय योजनाओं का समन्वय।",
      en: "Administrative head of the district; this is an appointed, not elected, office. Coordinates law and order and district schemes.",
    },
    appliesTo: "all",
    sourceLabel: "जिला प्रशासन",
    sourceUrl: "https://up.gov.in/",
  },
};

export const stateSources: Record<
  string,
  { assembly: string; urban: string; rural: string; statePortal: string; council: boolean }
> = {
  up: {
    assembly: "https://uplegisassembly.gov.in/",
    urban: "https://urban.up.nic.in/",
    rural: "https://panchayatiraj.up.nic.in/",
    statePortal: "https://up.gov.in/",
    council: true,
  },
  bihar: {
    assembly: "https://vidhansabha.bih.nic.in/",
    urban: "https://urban.bih.nic.in/",
    rural: "https://ps.bihar.gov.in/",
    statePortal: "https://state.bihar.gov.in/",
    council: true,
  },
};

export const civicLookupLinks = [
  {
    label: { hi: "मतदाता सूची में अपना नाम खोजें", en: "Search the electoral roll" },
    url: "https://electoralsearch.eci.gov.in/",
  },
  {
    label: { hi: "मतदाता पंजीकरण (Form 6)", en: "Voter registration (Form 6)" },
    url: "https://voters.eci.gov.in/",
  },
  {
    label: { hi: "निर्वाचन आयोग के परिणाम", en: "Election Commission results" },
    url: "https://results.eci.gov.in/",
  },
  {
    label: { hi: "पिन कोड से डाकघर खोजें (India Post)", en: "Find a post office by PIN (India Post)" },
    url: "https://www.indiapost.gov.in/",
  },
];

/** Roles that apply to a district; urban/rural split is confirmed with the user. */
export function rolesForArea(areaType: "urban" | "rural" | "unknown", stateId: string): RepresentativeRole[] {
  const roles: RepresentativeRole[] = ["mp", "mla", "district_magistrate"];
  if (stateSources[stateId]?.council) roles.push("mlc");
  if (areaType === "urban") roles.push("mayor", "councillor", "chairperson");
  if (areaType === "rural") roles.push("gram_pradhan");
  if (areaType === "unknown") roles.push("mayor", "chairperson", "councillor", "gram_pradhan");
  return roles;
}

import type { LocalizedText } from "@/lib/types";

export type LegalSection = {
  heading: LocalizedText;
  paragraphs?: LocalizedText[];
  bullets?: LocalizedText[];
};

export type LegalDoc = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  sections: LegalSection[];
};

const both = (hiText: string, enText: string): LocalizedText => ({ hi: hiText, en: enText });

export const legalDocs: Record<string, LegalDoc> = {
  about: {
    eyebrow: both("हमारे बारे में", "About"),
    title: both("क्या बोलती PUBLIC क्या है?", "What is Kya Bolti Public?"),
    description: both(
      "एक स्वतंत्र, हिंदी-पहले नागरिक मंच जो स्थानीय खबरें, जनप्रतिनिधियों की भूमिकाएँ, सार्वजनिक सेवाओं के अनुभव और नागरिक भागीदारी को एक जगह लाता है।",
      "An independent, Hindi-first civic platform that brings local news, representative roles, public-service experiences and citizen participation together.",
    ),
    sections: [
      {
        heading: both("हमारा उद्देश्य", "Our purpose"),
        paragraphs: [
          both(
            "उत्तर प्रदेश और बिहार के नागरिकों के लिए स्थानीय जानकारी को सरल हिंदी में उपलब्ध कराना, ताकि लोग अपने इलाके के मुद्दों को समझ सकें और सही आधिकारिक माध्यम तक पहुँच सकें।",
            "To make local information available in simple Hindi for people in Uttar Pradesh and Bihar, so they can understand local issues and reach the right official channel.",
          ),
        ],
      },
      {
        heading: both("हम क्या नहीं हैं", "What we are not"),
        bullets: [
          both("हम किसी सरकार, राजनीतिक दल या निर्वाचन आयोग से संबद्ध नहीं हैं।", "We are not affiliated with any government, political party or election commission."),
          both("हम कोई सरकारी शिकायत दर्ज नहीं करते। समस्या दर्ज करना केवल स्थानीय रिकॉर्ड है।", "We do not register government complaints. Reporting an issue creates a local record only."),
          both("हमारे पोल गैर-वैज्ञानिक और गैर-आधिकारिक हैं; वे चुनाव पूर्वानुमान नहीं हैं।", "Our polls are non-scientific and unofficial; they are not election forecasts."),
          both("हम कानूनी सलाह नहीं देते।", "We do not provide legal advice."),
        ],
      },
      {
        heading: both("पारदर्शिता", "Transparency"),
        paragraphs: [
          both(
            "डेमो सामग्री हमेशा ‘डेमो’ के रूप में चिह्नित होती है। जनप्रतिनिधियों के नाम अनुमान से नहीं भरे जाते; जहाँ सत्यापित डेटा नहीं है, वहाँ आधिकारिक स्रोत का लिंक दिया जाता है।",
            "Demo content is always labelled. Representative names are never guessed; where verified data is unavailable, we link to the official source instead.",
          ),
          both(
            "खबरें सार्वजनिक RSS फ़ीड से आती हैं और मूल स्रोत से लिंक करती हैं। फ़ीड उपलब्ध न होने पर डेमो सामग्री दिखाई जाती है और साफ़ बताया जाता है।",
            "News comes from public RSS feeds and links to the original source. When a feed is unavailable, demo content is shown and clearly labelled.",
          ),
        ],
      },
      {
        heading: both("तकनीक और डेटा", "Technology and data"),
        paragraphs: [
          both(
            "इस मंच पर खाते बनाने की ज़रूरत नहीं है। स्थानीय डेटा संग्रह के लिए PostgreSQL या JSON फ़ाइल का उपयोग होता है। डेटाबेस कॉन्फ़िगर न होने पर सामग्री अस्थायी हो सकती है और इंटरफ़ेस यह साफ़ बताता है।",
            "No account is required. Local data uses PostgreSQL or a JSON file. Without a configured database, content may be temporary and the interface says so clearly.",
          ),
        ],
      },
    ],
  },
  privacy: {
    eyebrow: both("गोपनीयता", "Privacy"),
    title: both("गोपनीयता नीति", "Privacy policy"),
    description: both(
      "हम कम से कम डेटा लेने की कोशिश करते हैं। यह नीति बताती है कि कौन-सी जानकारी कहाँ रहती है और क्यों।",
      "We try to collect as little data as possible. This policy explains what information lives where and why.",
    ),
    sections: [
      {
        heading: both("आपके ब्राउज़र में", "In your browser"),
        bullets: [
          both("भाषा और चुना हुआ ज़िला आपके ब्राउज़र के localStorage/cookie में सहेजे जाते हैं ताकि अगली बार वही सेटिंग रहे।", "Language and selected district are stored in your browser's localStorage/cookie so your preference persists."),
          both("आप कभी भी ब्राउज़र डेटा साफ़ करके इन्हें हटा सकते हैं।", "You can clear this at any time by clearing browser data."),
        ],
      },
      {
        heading: both("वोट और सत्र", "Votes and sessions"),
        bullets: [
          both("पोल में डुप्लीकेट वोट रोकने के लिए एक यादृच्छिक HttpOnly कुकी दी जाती है। सर्वर पर उसका हैश सहेजा जाता है, कच्चा ID नहीं।", "A random HttpOnly cookie is used to limit duplicate poll votes. Only its hash is stored on the server, not the raw ID."),
          both("यह उपाय पूर्ण नहीं है — अलग ब्राउज़र या डिवाइस से फिर वोट संभव है।", "This is not foolproof — voting again from another browser or device is possible."),
          both("एडमिन सत्र केवल तब बनता है जब सर्वर पर एडमिन क्रेडेंशियल कॉन्फ़िगर हों।", "An admin session is created only when admin credentials are configured on the server."),
        ],
      },
      {
        heading: both("लोकेशन", "Location"),
        paragraphs: [
          both(
            "लोकेशन पूरी तरह वैकल्पिक है। अनुमति देने पर भी हम केवल ज़िला पहचानने के लिए निर्देशांक सर्वर-साइड भू-स्थानिक सेवा को भेजते हैं और सटीक निर्देशांक सहेजते नहीं। आप हमेशा मैन्युअल रूप से ज़िला चुन सकते हैं।",
            "Location is entirely optional. Even with permission, coordinates are sent to a server-side geocoding service only to identify the district, and exact coordinates are not stored. You can always choose your district manually.",
          ),
        ],
      },
      {
        heading: both("आपकी सार्वजनिक सामग्री", "Your public content"),
        paragraphs: [
          both(
            "समस्या, समीक्षा, चर्चा या सवाल भेजने पर वह सार्वजनिक रूप से दिख सकता है। कृपया फ़ोन नंबर, सटीक घर का पता, पहचान पत्र संख्या या किसी अन्य व्यक्ति की निजी जानकारी न लिखें।",
            "Issues, reviews, discussions and questions may appear publicly. Do not include phone numbers, exact home addresses, ID numbers or anyone else's private information.",
          ),
        ],
      },
      {
        heading: both("संपर्क फ़ॉर्म", "Contact form"),
        paragraphs: [
          both(
            "संपर्क फ़ॉर्म में ईमेल देना वैकल्पिक है। दिया गया ईमेल केवल आपके संदेश का जवाब देने के लिए उपयोग किया जाएगा और सार्वजनिक रूप से नहीं दिखाया जाएगा।",
            "Email is optional in the contact form. If provided, it is used only to respond to your message and is not shown publicly.",
          ),
        ],
      },
      {
        heading: both("तृतीय-पक्ष सेवाएँ", "Third-party services"),
        paragraphs: [
          both(
            "समाचार के लिए सार्वजनिक RSS फ़ीड और वैकल्पिक लोकेशन के लिए OpenStreetMap Nominatim जैसी सेवा उपयोग हो सकती है। होस्टिंग और डेटाबेस प्रदाता अपनी नीतियों के अनुसार तकनीकी लॉग रख सकते हैं।",
            "Public RSS feeds are used for news, and services such as OpenStreetMap Nominatim may be used for optional location lookup. Hosting and database providers may keep technical logs under their own policies.",
          ),
        ],
      },
    ],
  },
  terms: {
    eyebrow: both("उपयोग की शर्तें", "Terms of use"),
    title: both("उपयोग की शर्तें", "Terms of use"),
    description: both(
      "इस मंच का उपयोग करने से पहले इन सामान्य नियमों को समझ लें।",
      "Please read these basic rules before using the platform.",
    ),
    sections: [
      {
        heading: both("मंच का उपयोग", "Using the platform"),
        bullets: [
          both("आप कानूनी और सभ्य उद्देश्यों के लिए मंच का उपयोग करेंगे।", "You will use the platform for lawful and civil purposes."),
          both("आप ऐसी सामग्री नहीं भेजेंगे जो किसी को धमकाती हो, नफ़रत फैलाती हो, गोपनीयता का उल्लंघन करती हो या स्पष्ट रूप से झूठी हो।", "You will not post content that threatens, spreads hate, violates privacy or is clearly false."),
          both("आप दूसरों के नाम पर सामग्री नहीं भेजेंगे।", "You will not post content impersonating others."),
        ],
      },
      {
        heading: both("सामग्री की सीमाएँ", "Content limits"),
        paragraphs: [
          both(
            "हम किसी भी सामग्री को हटाने, छिपाने या संपादित करने का अधिकार रखते हैं, विशेषकर जब वह इन शर्तों या सामुदायिक दिशानिर्देशों का उल्लंघन करती हो।",
            "We may remove, hide or edit content, especially when it breaks these terms or the community guidelines.",
          ),
          both(
            "नागरिक समीक्षाएँ और चर्चाएँ व्यक्तिगत राय हैं। हम उनकी सत्यता की गारंटी नहीं देते।",
            "Citizen reviews and discussions are personal opinions. We do not guarantee their accuracy.",
          ),
        ],
      },
      {
        heading: both("कोई सरकारी सेवा नहीं", "Not a government service"),
        paragraphs: [
          both(
            "यह मंच सरकारी शिकायत, कानूनी सलाह, आपातकालीन सहायता या चुनाव संबंधी आधिकारिक जानकारी का विकल्प नहीं है। आधिकारिक कार्य के लिए संबंधित सरकारी पोर्टल का उपयोग करें।",
            "This platform is not a substitute for government complaints, legal advice, emergency help or official election information. Use the relevant government portal for official business.",
          ),
        ],
      },
      {
        heading: both("उपलब्धता", "Availability"),
        paragraphs: [
          both(
            "हम सेवा को बेहतर बनाने के लिए इसे बदल या रोक सकते हैं। डेटाबेस कॉन्फ़िगर न होने पर सामग्री स्थायी नहीं रह सकती।",
            "We may change or pause the service to improve it. Without a configured database, content may not persist.",
          ),
        ],
      },
    ],
  },
  guidelines: {
    eyebrow: both("सामुदायिक दिशानिर्देश", "Community guidelines"),
    title: both("सुरक्षित और सभ्य भागीदारी", "Safe and civil participation"),
    description: both(
      "ये नियम सबके लिए हैं — समस्या, समीक्षा, चर्चा और सवाल भेजते समय इनका पालन करें।",
      "These rules apply to everyone — follow them when posting issues, reviews, discussions and questions.",
    ),
    sections: [
      {
        heading: both("करें", "Do"),
        bullets: [
          both("अपने अनुभव, तारीख और इलाका साफ़ लिखें।", "Describe your experience, date and area clearly."),
          both("आधिकारिक स्रोत का लिंक दें जहाँ संभव हो।", "Link to an official source where possible."),
          both("दूसरों की बात को समझने की कोशिश करें और सवाल पूछें।", "Try to understand others and ask questions."),
        ],
      },
      {
        heading: both("न करें", "Don't"),
        bullets: [
          both("किसी व्यक्ति को नाम लेकर धमकाएँ या अपमानित करें।", "Threaten or insult any person by name."),
          both("सांप्रदायिक, जातिगत या नफ़रत भरी बात लिखें।", "Post communal, casteist or hateful content."),
          both("फ़ोन नंबर, घर का पता, आधार/ID नंबर या निजी फोटो साझा करें।", "Share phone numbers, home addresses, ID numbers or private photos."),
          both("अफ़वाह को तथ्य की तरह पेश करें या बार-बार स्पैम करें।", "Present rumours as facts or repeatedly spam."),
          both("किसी की पहचान का नकल करें।", "Impersonate anyone."),
        ],
      },
      {
        heading: both("रिपोर्ट और मॉडरेशन", "Reporting and moderation"),
        paragraphs: [
          both(
            "नियम तोड़ने वाली सामग्री पर ‘रिपोर्ट’ बटन का उपयोग करें। मॉडरेशन टीम समीक्षा के बाद सामग्री छिपा सकती है। बार-बार उल्लंघन पर भविष्य की भागीदारी सीमित की जा सकती है।",
            "Use the ‘Report’ button on content that breaks the rules. Moderators may hide content after review. Repeated violations may lead to limits on future participation.",
          ),
        ],
      },
    ],
  },
  corrections: {
    eyebrow: both("सुधार नीति", "Corrections"),
    title: both("गलती मिले तो बताइए", "Tell us when something is wrong"),
    description: both(
      "हम सटीक जानकारी देने की कोशिश करते हैं। अगर कुछ गलत है, तो हमें स्रोत के साथ बताएँ।",
      "We try to be accurate. If something is wrong, tell us with a source.",
    ),
    sections: [
      {
        heading: both("कैसे रिपोर्ट करें", "How to report a correction"),
        paragraphs: [
          both(
            "संपर्क पेज से संदेश भेजें। कृपया पेज का लिंक, गलत दिख रही जानकारी और आधिकारिक स्रोत शामिल करें। हम समीक्षा करेंगे और उचित होने पर सुधार करेंगे।",
            "Send a message via the contact page. Include the page link, the information you believe is wrong, and an official source. We will review it and correct it where appropriate.",
          ),
        ],
      },
      {
        heading: both("क्या सुधारा जा सकता है", "What can be corrected"),
        bullets: [
          both("खबर के शीर्षक, सारांश या स्रोत लिंक में स्पष्ट गलती।", "A clear error in a news headline, summary or source link."),
          both("जनप्रतिनिधि की गलत भूमिका या पुरानी सत्यापन तिथि।", "An incorrect representative role or stale verification date."),
          both("टाइपिंग, नाम या स्थान की गलती।", "Typographical, name or place errors."),
        ],
      },
      {
        heading: both("सीमाएँ", "Limits"),
        paragraphs: [
          both(
            "हम उपयोगकर्ता की राय को ‘गलत’ नहीं कहते। समीक्षा और चर्चा व्यक्तिगत अनुभव हैं; उन्हें केवल नियम उल्लंघन पर छिपाया जाता है।",
            "We do not label a user's opinion as ‘wrong’. Reviews and discussions are personal experiences; they are hidden only when they break the rules.",
          ),
        ],
      },
    ],
  },
  sources: {
    eyebrow: both("स्रोत और श्रेय", "Sources and attribution"),
    title: both("हमारी जानकारी कहाँ से आती है?", "Where our information comes from"),
    description: both(
      "हम केवल सार्वजनिक, आधिकारिक या स्पष्ट रूप से चिह्नित स्रोतों का उपयोग करते हैं। किसी भी तथ्य की पुष्टि मूल स्रोत से करें।",
      "We use only public, official or clearly labelled sources. Always verify facts at the original source.",
    ),
    sections: [
      {
        heading: both("समाचार", "News"),
        bullets: [
          both("PIB हिंदी RSS फ़ीड (सार्वजनिक) — शीर्षक, सारांश, प्रकाशन समय और मूल लिंक के साथ।", "PIB Hindi RSS feed (public) — with title, summary, publication time and original link."),
          both("फ़ीड उपलब्ध न होने पर डेमो सामग्री दिखाई जाती है, जिसे साफ़ ‘डेमो’ कहा जाता है।", "When the feed is unavailable, clearly labelled demo content is shown."),
          both("हम पूरी खबर कॉपी नहीं करते; मूल स्रोत तक ले जाते हैं।", "We do not copy full articles; we link to the original source."),
        ],
      },
      {
        heading: both("जनप्रतिनिधि", "Representatives"),
        bullets: [
          both("नाम और संपर्क केवल आधिकारिक स्रोत से आयात किए जाते हैं और सत्यापन तिथि के साथ दिखाए जाते हैं।", "Names and contacts are imported only from official sources and shown with a verification date."),
          both("जहाँ डेटा नहीं है, वहाँ नाम का अनुमान नहीं लगाया जाता — ‘सत्यापित नहीं’ दिखाया जाता है।", "Where data is unavailable, names are not guessed — the page says ‘not verified’."),
        ],
      },
      {
        heading: both("आधिकारिक पोर्टल", "Official portals"),
        bullets: [
          both("जनसुनवाई, उत्तर प्रदेश — https://jansunwai.up.nic.in/", "Jansunwai, Uttar Pradesh — https://jansunwai.up.nic.in/"),
          both("उत्तर प्रदेश विधानसभा — https://uplegisassembly.gov.in/", "Uttar Pradesh Legislative Assembly — https://uplegisassembly.gov.in/"),
          both("संसद सदस्य — https://sansad.in/ls/members", "Members of Parliament — https://sansad.in/ls/members"),
          both("भारत निर्वाचन आयोग — https://www.eci.gov.in/", "Election Commission of India — https://www.eci.gov.in/"),
          both("मतदाता पोर्टल — https://voters.eci.gov.in/", "Voters' portal — https://voters.eci.gov.in/"),
          both("राष्ट्रीय पोर्टल — https://www.india.gov.in/", "National Portal of India — https://www.india.gov.in/"),
        ],
      },
      {
        heading: both("क्विज़ और व्याख्या", "Quizzes and explanations"),
        paragraphs: [
          both(
            "क्विज़ के प्रश्न संविधान, निर्वाचन आयोग और सरकारी पोर्टलों पर आधारित हैं। हर प्रश्न के साथ स्रोत लिंक दिया जाता है। यदि कोई लिंक बदल जाए, तो हमें बताएँ।",
            "Quiz questions are based on the Constitution, the Election Commission and government portals. Each question links to a source. If a link changes, please tell us.",
          ),
        ],
      },
    ],
  },
};

export const legalOrder = ["about", "privacy", "terms", "guidelines", "corrections", "sources"] as const;

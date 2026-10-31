import type { Quiz } from "@/lib/types";

const constitutionSource = {
  label: "भारत का संविधान (विधि मंत्रालय)",
  url: "https://www.legislative.gov.in/constitution-of-india/",
};
const eciSource = { label: "भारत निर्वाचन आयोग", url: "https://www.eci.gov.in/" };
const indiaGov = { label: "National Portal of India", url: "https://www.india.gov.in/" };
const upGov = { label: "उत्तर प्रदेश सरकार", url: "https://up.gov.in/" };
const biharGov = { label: "बिहार सरकार", url: "https://state.bihar.gov.in/" };
const upPanchayat = { label: "पंचायती राज विभाग, उत्तर प्रदेश", url: "https://panchayatiraj.up.nic.in/" };
const upLegislature = { label: "उत्तर प्रदेश विधानमंडल", url: "https://uplegisassembly.gov.in/" };
const uppcl = { label: "उत्तर प्रदेश पावर कॉर्पोरेशन (UPPCL)", url: "https://www.uppcl.org/" };
const upEducation = { label: "बेसिक शिक्षा विभाग, उत्तर प्रदेश", url: "https://basiceducation.up.gov.in/" };
const wcd = { label: "महिला एवं बाल विकास मंत्रालय", url: "https://wcd.gov.in/" };

export const quizzes: Quiz[] = [
  {
    slug: "constitution",
    title: { hi: "संविधान को जानें", en: "Know Your Constitution" },
    description: {
      hi: "अधिकार, कर्तव्य और लोकतंत्र की बुनियादी बातें — आसान भाषा में।",
      en: "Rights, duties and the basics of democracy in simple language.",
    },
    icon: "book",
    color: "saffron",
    questions: [
      {
        id: "c1",
        prompt: { hi: "भारत के संविधान में मौलिक अधिकार किस भाग में हैं?", en: "In which Part of the Indian Constitution are Fundamental Rights placed?" },
        options: [
          { hi: "भाग III", en: "Part III" },
          { hi: "भाग II", en: "Part II" },
          { hi: "भाग IV", en: "Part IV" },
          { hi: "भाग V", en: "Part V" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "मौलिक अधिकार भाग III (अनुच्छेद 12–35) में हैं। भाग IV में राज्य के नीति निर्देशक तत्व हैं।",
          en: "Fundamental Rights are in Part III (Articles 12–35). Part IV contains the Directive Principles.",
        },
        sources: [constitutionSource],
      },
      {
        id: "c2",
        prompt: { hi: "संविधान सभा के अध्यक्ष कौन थे?", en: "Who was the President of the Constituent Assembly?" },
        options: [
          { hi: "डॉ. भीमराव अंबेडकर", en: "Dr. B. R. Ambedkar" },
          { hi: "डॉ. राजेंद्र प्रसाद", en: "Dr. Rajendra Prasad" },
          { hi: "जवाहरलाल नेहरू", en: "Jawaharlal Nehru" },
          { hi: "सरदार पटेल", en: "Sardar Patel" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "डॉ. राजेंद्र प्रसाद संविधान सभा के अध्यक्ष थे। डॉ. अंबेडकर प्रारूप समिति के अध्यक्ष थे।",
          en: "Dr. Rajendra Prasad chaired the Constituent Assembly. Dr. Ambedkar chaired the Drafting Committee.",
        },
        sources: [constitutionSource],
      },
      {
        id: "c3",
        prompt: { hi: "73वाँ संविधान संशोधन किससे जुड़ा है?", en: "The 73rd Constitutional Amendment is about what?" },
        options: [
          { hi: "नगरीय निकाय", en: "Urban local bodies" },
          { hi: "पंचायती राज", en: "Panchayati Raj" },
          { hi: "शिक्षा का अधिकार", en: "Right to Education" },
          { hi: "सूचना का अधिकार", en: "Right to Information" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "73वें संशोधन (1992) ने पंचायती राज को संवैधानिक दर्जा दिया। 74वाँ संशोधन नगरीय निकायों से जुड़ा है।",
          en: "The 73rd Amendment (1992) gave constitutional status to Panchayati Raj. The 74th covers urban local bodies.",
        },
        sources: [constitutionSource],
      },
      {
        id: "c4",
        prompt: { hi: "सूचना का अधिकार (RTI) अधिनियम किस वर्ष लागू हुआ?", en: "In which year did the Right to Information Act come into force?" },
        options: [
          { hi: "2002", en: "2002" },
          { hi: "2005", en: "2005" },
          { hi: "2009", en: "2009" },
          { hi: "2013", en: "2013" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "RTI अधिनियम 2005 में पारित हुआ और 2005 में लागू हुआ।",
          en: "The RTI Act was passed and came into force in 2005.",
        },
        sources: [{ label: "RTI Portal", url: "https://rtionline.gov.in/" }],
      },
      {
        id: "c5",
        prompt: { hi: "अनुच्छेद 14 किस अधिकार से जुड़ा है?", en: "Article 14 relates to which right?" },
        options: [
          { hi: "समानता का अधिकार", en: "Right to equality" },
          { hi: "स्वतंत्रता का अधिकार", en: "Right to freedom" },
          { hi: "शोषण के विरुद्ध अधिकार", en: "Right against exploitation" },
          { hi: "धार्मिक स्वतंत्रता", en: "Freedom of religion" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "अनुच्छेद 14 कानून के समक्ष समानता और कानूनों के समान संरक्षण की बात करता है।",
          en: "Article 14 guarantees equality before the law and equal protection of the laws.",
        },
        sources: [constitutionSource],
      },
    ],
  },
  {
    slug: "who-does-what",
    title: { hi: "कौन क्या करता है?", en: "Who Does What?" },
    description: {
      hi: "सांसद, विधायक, पार्षद, महापौर और ग्राम प्रधान की भूमिकाएँ पहचानें।",
      en: "Learn the roles of MPs, MLAs, councillors, mayors and gram pradhans.",
    },
    icon: "people",
    color: "navy",
    questions: [
      {
        id: "w1",
        prompt: { hi: "राज्य विधानसभा के लिए चुना गया प्रतिनिधि कौन होता है?", en: "Who is elected to a state Legislative Assembly?" },
        options: [
          { hi: "सांसद", en: "MP" },
          { hi: "विधायक (MLA)", en: "MLA" },
          { hi: "पार्षद", en: "Councillor" },
          { hi: "ग्राम प्रधान", en: "Gram Pradhan" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "विधायक (MLA) राज्य विधानसभा के लिए चुना जाता है। सांसद संसद (लोकसभा) के लिए चुना जाता है।",
          en: "An MLA is elected to the state Assembly. An MP is elected to Parliament (Lok Sabha).",
        },
        sources: [indiaGov],
      },
      {
        id: "w2",
        prompt: { hi: "वार्ड स्तर पर नगर निगम का निर्वाचित प्रतिनिधि कौन है?", en: "Who is the elected ward-level representative in a municipal corporation?" },
        options: [
          { hi: "महापौर", en: "Mayor" },
          { hi: "पार्षद", en: "Councillor" },
          { hi: "विधायक", en: "MLA" },
          { hi: "जिलाधिकारी", en: "District Magistrate" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "पार्षद वार्ड का प्रतिनिधित्व करता है। महापौर पूरे नगर निगम का नेतृत्व करते हैं।",
          en: "A councillor represents a ward. The Mayor leads the municipal corporation as a whole.",
        },
        sources: [indiaGov],
      },
      {
        id: "w3",
        prompt: { hi: "ग्राम पंचायत का प्रमुख कौन होता है?", en: "Who heads a gram panchayat?" },
        options: [
          { hi: "ग्राम प्रधान", en: "Gram Pradhan" },
          { hi: "सरपंच (हर राज्य में)", en: "Sarpanch (in every state)" },
          { hi: "पार्षद", en: "Councillor" },
          { hi: "विधायक", en: "MLA" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "ग्राम पंचायत के प्रमुख को उत्तर प्रदेश में ग्राम प्रधान कहा जाता है; अन्य राज्यों में नाम अलग हो सकते हैं।",
          en: "The head of a gram panchayat is called Gram Pradhan in Uttar Pradesh; other states use different titles.",
        },
        sources: [upPanchayat],
      },
      {
        id: "w4",
        prompt: { hi: "जिलाधिकारी (DM) के बारे में कौन-सी बात सही है?", en: "Which statement about the District Magistrate (DM) is correct?" },
        options: [
          { hi: "DM जनता द्वारा सीधे चुना जाता है", en: "The DM is directly elected by the public" },
          { hi: "DM एक नियुक्त प्रशासनिक अधिकारी है", en: "The DM is an appointed administrative officer" },
          { hi: "DM केवल पंचायत चुनाव लड़ता है", en: "The DM only contests panchayat elections" },
          { hi: "DM संसद का सदस्य होता है", en: "The DM is a member of Parliament" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "जिलाधिकारी एक नियुक्त प्रशासनिक अधिकारी होता है, निर्वाचित जनप्रतिनिधि नहीं।",
          en: "The DM is an appointed administrative officer, not an elected representative.",
        },
        sources: [upGov],
      },
      {
        id: "w5",
        prompt: { hi: "विधान परिषद (MLC) किन राज्यों में होती है?", en: "Where does a Legislative Council (MLC) exist?" },
        options: [
          { hi: "हर राज्य में", en: "In every state" },
          { hi: "केवल उन राज्यों में जहाँ परिषद बनी है", en: "Only in states that have established one" },
          { hi: "केवल केंद्र शासित प्रदेशों में", en: "Only in union territories" },
          { hi: "केवल गाँवों में", en: "Only in villages" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "विधान परिषद हर राज्य में नहीं होती। जहाँ है, वहाँ MLC विधायिका के ऊपरी सदन का हिस्सा होते हैं।",
          en: "Not every state has a Legislative Council. Where one exists, MLCs form the upper house of the state legislature.",
        },
        sources: [upLegislature],
      },
    ],
  },
  {
    slug: "schemes",
    title: { hi: "सरकारी योजनाएँ", en: "Government Schemes" },
    description: {
      hi: "लोकप्रिय कल्याणकारी योजनाओं की पात्रता और लाभ को समझें।",
      en: "Understand eligibility and benefits of key welfare schemes.",
    },
    icon: "scheme",
    color: "teal",
    questions: [
      {
        id: "s1",
        prompt: { hi: "मनरेगा (MGNREGA) में कितने दिनों के रोज़गार की कानूनी गारंटी है?", en: "How many days of employment does MGNREGA legally guarantee?" },
        options: [
          { hi: "50 दिन", en: "50 days" },
          { hi: "100 दिन", en: "100 days" },
          { hi: "150 दिन", en: "150 days" },
          { hi: "365 दिन", en: "365 days" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "MGNREGA एक वित्तीय वर्ष में एक परिवार को कम से कम 100 दिन के अकुशल श्रम की गारंटी देता है।",
          en: "MGNREGA guarantees at least 100 days of unskilled manual work per household in a financial year.",
        },
        sources: [{ label: "MGNREGA", url: "https://nrega.nic.in/" }],
      },
      {
        id: "s2",
        prompt: { hi: "PM-KISAN के तहत पात्र किसान परिवार को सालाना कितनी राशि मिलती है?", en: "How much does an eligible farmer family receive annually under PM-KISAN?" },
        options: [
          { hi: "₹2,000", en: "₹2,000" },
          { hi: "₹4,000", en: "₹4,000" },
          { hi: "₹6,000", en: "₹6,000" },
          { hi: "₹10,000", en: "₹10,000" },
        ],
        correctIndex: 2,
        explanation: {
          hi: "PM-KISAN में ₹6,000 प्रति वर्ष, तीन समान किस्तों में दिए जाते हैं। पात्रता की पुष्टि आधिकारिक पोर्टल पर करें।",
          en: "PM-KISAN provides ₹6,000 per year in three equal instalments. Verify eligibility on the official portal.",
        },
        sources: [{ label: "PM-KISAN", url: "https://pmkisan.gov.in/" }],
      },
      {
        id: "s3",
        prompt: { hi: "आयुष्मान भारत PM-JAY में प्रति परिवार प्रति वर्ष कितना स्वास्थ्य कवर मिलता है?", en: "What annual health cover does Ayushman Bharat PM-JAY provide per family?" },
        options: [
          { hi: "₹1 लाख", en: "₹1 lakh" },
          { hi: "₹2 लाख", en: "₹2 lakh" },
          { hi: "₹5 लाख", en: "₹5 lakh" },
          { hi: "₹10 लाख", en: "₹10 lakh" },
        ],
        correctIndex: 2,
        explanation: {
          hi: "पात्र परिवारों को ₹5 लाख प्रति वर्ष का स्वास्थ्य कवर मिलता है। पात्रता आधिकारिक पोर्टल पर जाँचें।",
          en: "Eligible families get health cover of ₹5 lakh per year. Check eligibility on the official portal.",
        },
        sources: [{ label: "PM-JAY", url: "https://pmjay.gov.in/" }],
      },
      {
        id: "s4",
        prompt: { hi: "जल जीवन मिशन का मुख्य लक्ष्य क्या है?", en: "What is the main goal of Jal Jeevan Mission?" },
        options: [
          { hi: "हर ग्रामीण घर में नल से जल", en: "Tap water to every rural household" },
          { hi: "हर शहर में मेट्रो", en: "Metro in every city" },
          { hi: "मुफ़्त लैपटॉप", en: "Free laptops" },
          { hi: "सौर पैनल पर सब्सिडी", en: "Solar panel subsidy" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "जल जीवन मिशन का लक्ष्य ग्रामीण घरों तक सुरक्षित पेयजल पहुँचाना है।",
          en: "Jal Jeevan Mission aims to provide safe drinking water to rural households.",
        },
        sources: [{ label: "Jal Jeevan Mission", url: "https://jaljeevanmission.gov.in/" }],
      },
      {
        id: "s5",
        prompt: { hi: "प्रधानमंत्री उज्ज्वला योजना किससे जुड़ी है?", en: "What does the Pradhan Mantri Ujjwala Yojana provide?" },
        options: [
          { hi: "एलपीजी कनेक्शन", en: "LPG connections" },
          { hi: "सोलर पंप", en: "Solar pumps" },
          { hi: "स्कूल यूनिफ़ॉर्म", en: "School uniforms" },
          { hi: "दिव्यांग पेंशन", en: "Disability pension" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "उज्ज्वला योजना पात्र महिलाओं को स्वच्छ ईंधन के लिए एलपीजी कनेक्शन उपलब्ध कराती है।",
          en: "Ujjwala provides LPG connections to eligible women for clean cooking fuel.",
        },
        sources: [{ label: "PM Ujjwala", url: "https://www.pmuy.gov.in/" }],
      },
    ],
  },
  {
    slug: "local-responsibility",
    title: { hi: "किसकी ज़िम्मेदारी?", en: "Local Responsibility Challenge" },
    description: {
      hi: "सड़क, पानी, बिजली और कचरे की शिकायत सही विभाग तक पहुँचाएँ।",
      en: "Route road, water, electricity and waste complaints to the right authority.",
    },
    icon: "map",
    color: "gold",
    questions: [
      {
        id: "l1",
        prompt: { hi: "शहर में घर के बाहर कचरा न उठाया जाए तो सबसे पहले किससे संपर्क करें?", en: "If household waste is not collected in a city, who should you contact first?" },
        options: [
          { hi: "नगरीय निकाय (नगर निगम/पालिका)", en: "Urban local body (municipal corporation/council)" },
          { hi: "संसद", en: "Parliament" },
          { hi: "सुप्रीम कोर्ट", en: "Supreme Court" },
          { hi: "चुनाव आयोग", en: "Election Commission" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "शहरी क्षेत्र में सफ़ाई और कचरा प्रबंधन नगरीय निकाय की ज़िम्मेदारी है; वार्ड पार्षद से भी संपर्क कर सकते हैं।",
          en: "In urban areas, sanitation and waste management are the local body's responsibility; your ward councillor can also help.",
        },
        sources: [upGov],
      },
      {
        id: "l2",
        prompt: { hi: "बिजली आपूर्ति बाधित होने पर सामान्यतः किससे शिकायत करें?", en: "Who normally handles electricity supply complaints?" },
        options: [
          { hi: "स्थानीय विद्युत वितरण कंपनी (DISCOM)", en: "The local electricity distribution company (DISCOM)" },
          { hi: "ग्राम पंचायत", en: "Gram panchayat" },
          { hi: "नगर निगम", en: "Municipal corporation" },
          { hi: "जिला न्यायालय", en: "District court" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "बिजली वितरण राज्य की विद्युत वितरण कंपनी का काम है। राज्य की हेल्पलाइन/ऐप पर शिकायत दर्ज करें।",
          en: "Electricity distribution is handled by the state DISCOM. Use its helpline or app to register a complaint.",
        },
        sources: [uppcl],
      },
      {
        id: "l3",
        prompt: { hi: "गाँव में पंचायत भवन या गली-नाली के काम की ज़िम्मेदारी मुख्य रूप से किसकी है?", en: "Who is primarily responsible for village lanes and drains?" },
        options: [
          { hi: "ग्राम पंचायत", en: "Gram panchayat" },
          { hi: "संसद", en: "Parliament" },
          { hi: "सुप्रीम कोर्ट", en: "Supreme Court" },
          { hi: "भारत सरकार का रक्षा मंत्रालय", en: "Ministry of Defence" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "ग्राम पंचायत स्थानीय सड़क, नाली और बुनियादी सुविधाओं पर काम करती है; योजना के अनुसार विभाग भी जुड़ते हैं।",
          en: "Gram panchayats handle local lanes, drains and basic amenities, with line departments involved depending on the scheme.",
        },
        sources: [upPanchayat],
      },
      {
        id: "l4",
        prompt: { hi: "सरकारी स्कूल में शिक्षक की अनुपस्थिति की शिकायत मुख्य रूप से किस विभाग से जुड़ी है?", en: "A complaint about teacher absence in a government school mainly concerns which department?" },
        options: [
          { hi: "शिक्षा विभाग", en: "Education department" },
          { hi: "पंचायती राज विभाग", en: "Panchayati Raj department" },
          { hi: "विद्युत विभाग", en: "Electricity department" },
          { hi: "वन विभाग", en: "Forest department" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "सरकारी स्कूलों के शिक्षक और शैक्षणिक व्यवस्था राज्य शिक्षा विभाग के अधीन होती है।",
          en: "Teachers and academic administration in government schools fall under the state education department.",
        },
        sources: [upEducation],
      },
      {
        id: "l5",
        prompt: { hi: "सार्वजनिक स्थान पर तत्काल पुलिस सहायता के लिए कौन-सा नंबर है?", en: "Which number provides immediate police help in a public emergency?" },
        options: [
          { hi: "100 / 112", en: "100 / 112" },
          { hi: "1950", en: "1950" },
          { hi: "181", en: "181" },
          { hi: "1912", en: "1912" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "112 आपातकालीन सहायता का एकीकृत नंबर है; 100 पुलिस नंबर है। 1950 मतदाता हेल्पलाइन है।",
          en: "112 is the integrated emergency helpline; 100 is the police helpline. 1950 is the voter helpline.",
        },
        sources: [{ label: "112 India", url: "https://112.gov.in/" }],
      },
    ],
  },
  {
    slug: "geography",
    title: { hi: "भारत की समझ", en: "India & Your State" },
    description: {
      hi: "राज्यों, राजधानियों और लोकतांत्रिक संरचना की बुनियादी जानकारी।",
      en: "States, capitals and the basic structure of Indian democracy.",
    },
    icon: "globe",
    color: "navy",
    questions: [
      {
        id: "g1",
        prompt: { hi: "उत्तर प्रदेश की राजधानी कहाँ है?", en: "What is the capital of Uttar Pradesh?" },
        options: [
          { hi: "कानपुर", en: "Kanpur" },
          { hi: "लखनऊ", en: "Lucknow" },
          { hi: "वाराणसी", en: "Varanasi" },
          { hi: "प्रयागराज", en: "Prayagraj" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "उत्तर प्रदेश की राजधानी लखनऊ है।",
          en: "Lucknow is the capital of Uttar Pradesh.",
        },
        sources: [upGov],
      },
      {
        id: "g2",
        prompt: { hi: "बिहार की राजधानी कहाँ है?", en: "What is the capital of Bihar?" },
        options: [
          { hi: "गया", en: "Gaya" },
          { hi: "भागलपुर", en: "Bhagalpur" },
          { hi: "पटना", en: "Patna" },
          { hi: "मुज़फ़्फ़रपुर", en: "Muzaffarpur" },
        ],
        correctIndex: 2,
        explanation: {
          hi: "बिहार की राजधानी पटना है।",
          en: "Patna is the capital of Bihar.",
        },
        sources: [biharGov],
      },
      {
        id: "g3",
        prompt: { hi: "भारत में कितने राज्य हैं (2026 तक)?", en: "How many states does India have (as of 2026)?" },
        options: [
          { hi: "25", en: "25" },
          { hi: "28", en: "28" },
          { hi: "29", en: "29" },
          { hi: "30", en: "30" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "भारत में 28 राज्य और 8 केंद्र शासित प्रदेश हैं। जम्मू-कश्मीर पुनर्गठन के बाद यह संख्या बनी।",
          en: "India has 28 states and 8 union territories, the count after the Jammu & Kashmir reorganisation.",
        },
        sources: [indiaGov],
      },
      {
        id: "g4",
        prompt: { hi: "हिंदी भारत की संवैधानिक रूप से क्या है?", en: "What is Hindi constitutionally in India?" },
        options: [
          { hi: "राष्ट्रभाषा", en: "The national language" },
          { hi: "संघ की राजभाषा (देवनागरी लिपि में)", en: "Official language of the Union (in Devanagari script)" },
          { hi: "केवल उत्तर प्रदेश की भाषा", en: "Only the language of Uttar Pradesh" },
          { hi: "कोई विशेष दर्जा नहीं", en: "It has no special status" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "संविधान के अनुच्छेद 343 के अनुसार संघ की राजभाषा हिंदी है, देवनागरी लिपि में। संविधान 'राष्ट्रभाषा' शब्द का इस्तेमाल नहीं करता।",
          en: "Article 343 makes Hindi in Devanagari script the official language of the Union. The Constitution does not use the term 'national language'.",
        },
        sources: [constitutionSource],
      },
    ],
  },
  {
    slug: "myth-fact",
    title: { hi: "मिथक या तथ्य?", en: "Myth vs Fact" },
    description: {
      hi: "चुनाव और नागरिक अधिकारों से जुड़ी आम गलतफ़हमियाँ दूर करें।",
      en: "Bust common myths about elections and civic rights.",
    },
    icon: "shield",
    color: "teal",
    questions: [
      {
        id: "m1",
        prompt: { hi: "क्या EVM इंटरनेट से जुड़ी होती है?", en: "Are EVMs connected to the internet?" },
        options: [
          { hi: "हाँ, हर मशीन ऑनलाइन होती है", en: "Yes, every machine is online" },
          { hi: "नहीं, EVM स्वतंत्र स्टैंडअलोन मशीन होती है", en: "No, an EVM is a standalone machine" },
          { hi: "केवल शहरों में ऑनलाइन", en: "Only in cities they are online" },
          { hi: "केवल VVPAT ऑनलाइन होता है", en: "Only VVPAT is online" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "EVM एक स्टैंडअलोन उपकरण है और इंटरनेट से नहीं जुड़ी होती। मतदान प्रक्रिया की निगरानी के लिए अलग व्यवस्था होती है।",
          en: "An EVM is a standalone device and is not connected to the internet. Separate safeguards govern the polling process.",
        },
        sources: [eciSource],
      },
      {
        id: "m2",
        prompt: { hi: "अगर NOTA को सबसे ज़्यादा वोट मिलें तो क्या चुनाव रद्द हो जाता है?", en: "If NOTA gets the most votes, is the election cancelled?" },
        options: [
          { hi: "हाँ, तुरंत दोबारा चुनाव होता है", en: "Yes, a re-election is held immediately" },
          { hi: "नहीं, सबसे ज़्यादा वोट पाने वाला उम्मीदवार जीतता है", en: "No, the candidate with the most votes wins" },
          { hi: "हाँ, लेकिन केवल लोकसभा में", en: "Yes, but only for Lok Sabha" },
          { hi: "NOTA का कोई अर्थ नहीं", en: "NOTA has no meaning" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "भारत में NOTA सबसे ज़्यादा वोट पाने पर चुनाव रद्द नहीं होता; विजेता सबसे ज़्यादा वैध वोट पाने वाला उम्मीदवार होता है।",
          en: "In India, NOTA topping the poll does not cancel the election; the candidate with the most valid votes wins.",
        },
        sources: [eciSource],
      },
      {
        id: "m3",
        prompt: { hi: "क्या भारत में हर नागरिक के लिए वोट डालना कानूनन अनिवार्य है?", en: "Is voting legally compulsory for every citizen in India?" },
        options: [
          { hi: "हाँ, न वोट तो जुर्माना", en: "Yes, with a fine for not voting" },
          { hi: "नहीं, मतदान अधिकार है, बाध्यता नहीं", en: "No, voting is a right, not a legal obligation" },
          { hi: "केवल सरकारी कर्मचारियों के लिए", en: "Only for government employees" },
          { hi: "केवल 25 वर्ष से ऊपर", en: "Only above age 25" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "भारत में मतदान एक अधिकार है; राष्ट्रीय स्तर पर मतदान अनिवार्य नहीं है। कुछ देशों में अनिवार्य मतदान होता है।",
          en: "Voting is a right in India and is not compulsory nationally. Some other countries have compulsory voting.",
        },
        sources: [eciSource],
      },
      {
        id: "m4",
        prompt: { hi: "क्या कोई व्यक्ति एक ही चुनाव में दो जगह वोट दे सकता है?", en: "Can a person vote twice in the same election?" },
        options: [
          { hi: "हाँ, दो नाम हों तो", en: "Yes, if registered in two places" },
          { hi: "नहीं, यह चुनावी कानून का उल्लंघन है", en: "No, it violates electoral law" },
          { hi: "हाँ, अगर दोनों जगहें एक ही जिले में हों", en: "Yes, if both are in the same district" },
          { hi: "केवल NOTA के साथ", en: "Only with NOTA" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "एक व्यक्ति को एक ही चुनाव में एक ही स्थान पर वोट देने का अधिकार है; दोहरा मतदान कानूनन अपराध है।",
          en: "A voter may vote only once in the same election; double voting is an offence under electoral law.",
        },
        sources: [eciSource],
      },
    ],
  },
  {
    slug: "voter-awareness",
    title: { hi: "मतदाता जागरूकता चुनौती", en: "Constituency Awareness Challenge" },
    description: {
      hi: "मतदाता पंजीकरण, EVM-VVPAT और हेल्पलाइन की जानकारी।",
      en: "Voter registration, EVM-VVPAT and helpline essentials.",
    },
    icon: "vote",
    color: "saffron",
    questions: [
      {
        id: "v1",
        prompt: { hi: "नए मतदाता के रूप में पंजीकरण के लिए आमतौर पर कौन-सा फ़ॉर्म इस्तेमाल होता है?", en: "Which form is generally used for new voter registration?" },
        options: [
          { hi: "Form 6", en: "Form 6" },
          { hi: "Form 16", en: "Form 16" },
          { hi: "Form 26", en: "Form 26" },
          { hi: "Form 10", en: "Form 10" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "नए मतदाता पंजीकरण के लिए Form 6 का उपयोग होता है। पात्रता और प्रक्रिया voters.eci.gov.in पर देखें।",
          en: "Form 6 is used for new voter registration. Check eligibility and process at voters.eci.gov.in.",
        },
        sources: [{ label: "Voters' Portal", url: "https://voters.eci.gov.in/" }],
      },
      {
        id: "v2",
        prompt: { hi: "मतदाता हेल्पलाइन नंबर कौन-सा है?", en: "What is the voter helpline number?" },
        options: [
          { hi: "1950", en: "1950" },
          { hi: "112", en: "112" },
          { hi: "100", en: "100" },
          { hi: "108", en: "108" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "1950 भारत निर्वाचन आयोग की मतदाता हेल्पलाइन है।",
          en: "1950 is the Election Commission's voter helpline.",
        },
        sources: [eciSource],
      },
      {
        id: "v3",
        prompt: { hi: "लोकसभा का कार्यकाल सामान्यतः कितने वर्ष का होता है?", en: "What is the normal term of the Lok Sabha?" },
        options: [
          { hi: "4 वर्ष", en: "4 years" },
          { hi: "5 वर्ष", en: "5 years" },
          { hi: "6 वर्ष", en: "6 years" },
          { hi: "7 वर्ष", en: "7 years" },
        ],
        correctIndex: 1,
        explanation: {
          hi: "लोकसभा का सामान्य कार्यकाल 5 वर्ष है, जब तक समय से पहले भंग न हो।",
          en: "The Lok Sabha's normal term is five years unless dissolved earlier.",
        },
        sources: [constitutionSource],
      },
      {
        id: "v4",
        prompt: { hi: "VVPAT का मतलब क्या है?", en: "What does VVPAT stand for?" },
        options: [
          { hi: "मतदाता द्वारा सत्यापन योग्य पेपर ऑडिट ट्रेल", en: "Voter Verifiable Paper Audit Trail" },
          { hi: "वोटर वेरिफिकेशन प्रोसेस ऑन टाइम", en: "Voter Verification Process On Time" },
          { hi: "वर्चुअल वोटिंग पेपर ट्रांसफर", en: "Virtual Voting Paper Transfer" },
          { hi: "वैध वोट पब्लिक ट्रैकिंग", en: "Valid Vote Public Tracking" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "VVPAT एक पेपर स्लिप दिखाता है जिससे मतदाता अपने वोट को सत्यापित कर सकता है।",
          en: "VVPAT shows a paper slip so the voter can verify the vote recorded.",
        },
        sources: [eciSource],
      },
    ],
  },
  {
    slug: "daily-civic",
    title: { hi: "रोज़ का नागरिक सवाल", en: "Daily Civic Question" },
    description: {
      hi: "हेल्पलाइन और रोज़मर्रा की नागरिक जानकारी। हर दिन एक नया सवाल।",
      en: "Helplines and everyday civic knowledge. A new question each day.",
    },
    icon: "spark",
    color: "gold",
    questions: [
      {
        id: "d1",
        prompt: { hi: "भारत का एकीकृत आपातकालीन नंबर कौन-सा है?", en: "What is India's integrated emergency number?" },
        options: [
          { hi: "112", en: "112" },
          { hi: "181", en: "181" },
          { hi: "1950", en: "1950" },
          { hi: "1912", en: "1912" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "112 पुलिस, अग्निशमन और एम्बुलेंस सहित आपातकालीन सहायता का एकीकृत नंबर है।",
          en: "112 is the integrated emergency number covering police, fire and ambulance services.",
        },
        sources: [{ label: "112 India", url: "https://112.gov.in/" }],
      },
      {
        id: "d2",
        prompt: { hi: "महिला हेल्पलाइन का नंबर कौन-सा है?", en: "What is the women's helpline number?" },
        options: [
          { hi: "181", en: "181" },
          { hi: "112", en: "112" },
          { hi: "100", en: "100" },
          { hi: "1950", en: "1950" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "181 महिला हेल्पलाइन है। आपात स्थिति में 112 पर भी संपर्क कर सकते हैं।",
          en: "181 is the women's helpline. In an emergency you can also call 112.",
        },
        sources: [wcd],
      },
      {
        id: "d3",
        prompt: { hi: "सूचना का अधिकार के तहत जानकारी माँगने के लिए आमतौर पर कितना शुल्क होता है (केंद्र सरकार)?", en: "What is the usual central RTI application fee?" },
        options: [
          { hi: "₹10", en: "₹10" },
          { hi: "₹50", en: "₹50" },
          { hi: "₹100", en: "₹100" },
          { hi: "मुफ़्त", en: "Free" },
        ],
        correctIndex: 0,
        explanation: {
          hi: "केंद्रीय RTI आवेदन का सामान्य शुल्क ₹10 है। राज्यों में शुल्क अलग हो सकता है।",
          en: "The usual central RTI fee is ₹10. State fees may differ.",
        },
        sources: [{ label: "RTI Online", url: "https://rtionline.gov.in/" }],
      },
    ],
  },
];

export function getQuiz(slug: string) {
  return quizzes.find((quiz) => quiz.slug === slug);
}

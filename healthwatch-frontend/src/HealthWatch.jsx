import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import * as api from "./api.js";

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sora', sans-serif; background: #f8fafc; color: #1e293b; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #1e293b; }
  ::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 3px; }
  input, select, textarea, button { font-family: 'Sora', sans-serif; }
  input::placeholder, textarea::placeholder { color: #94a3b8; } input, select { color: #0f172a !important; background: #ffffff !important; }
  input:focus, select:focus, textarea:focus { outline: none; }
  a { text-decoration: none; color: inherit; }

  @keyframes slideIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  @keyframes ripple  { 0% { transform:scale(1); opacity:0.8; } 100% { transform:scale(2.5); opacity:0; } }
  @keyframes slideBg { 0% { transform:scale(1.08) translateX(-4%); } 100% { transform:scale(1.08) translateX(2%); } }
  @keyframes slideImgIn { from { opacity:0; transform:scale(1.08) translateX(-6%); } to { opacity:1; transform:scale(1.08) translateX(-4%); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes spin    { to { transform: rotate(360deg); } }

  .slide-in   { animation: slideIn 0.4s ease forwards; }
  .fade-in    { animation: fadeIn  0.3s ease forwards; }
  .btn-scale:hover  { transform: translateY(-2px); opacity: 0.9; }
  .btn-scale:active { transform: translateY(0); }
  .card-lift:hover  { transform: translateY(-3px); box-shadow: 0 20px 60px rgba(255,255,255,0.7) !important; }

  /* Make injected slideshow SVGs fill container */
  .slide-svg-wrap svg { width:100%; height:100%; display:block; }

  /* ── WHITE THEME GLOBAL OVERRIDES ── */
  input, select, textarea { color: #0d1117 !important; background: #ffffff !important; border-color: #d1d5db !important; }
  input::placeholder, textarea::placeholder { color: #9ca3af !important; }
  input:focus, select:focus, textarea:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 3px rgba(14,165,233,0.12) !important; }
  select option { background: #ffffff; color: #0d1117; }
  .recharts-text tspan, .recharts-cartesian-axis-tick-value tspan { fill: #4b5563 !important; }
  .recharts-legend-item-text { color: #4b5563 !important; }
  .recharts-tooltip-wrapper .recharts-default-tooltip { background: #ffffff !important; border: 1px solid #e5e7eb !important; border-radius: 8px !important; }

  /* Hide native password reveal in ALL browsers */
  input::-ms-reveal, input::-ms-clear { display: none !important; }
  input::-webkit-reveal, input::-webkit-clear-button { display: none !important; }
  /* For some versions of Edge/Chrome */
  input[type="password"]::-ms-reveal { display: none !important; }

  .glass {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .mono { font-family: 'JetBrains Mono', monospace; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// DISEASE SYMPTOM MATRIX
// ─────────────────────────────────────────────────────────────────────────────
const DISEASE_SYMPTOMS = {
  "Cholera":            ["Severe watery diarrhea","Vomiting","Rapid dehydration","Muscle cramps","Weakness","Low blood pressure"],
  "Typhoid Fever":      ["High fever","Headache","Stomach pain","Weakness","Loss of appetite","Diarrhea or constipation"],
  "Dysentery":          ["Bloody diarrhea","Abdominal cramps","Fever","Nausea","Vomiting"],
  "Hepatitis A":        ["Fatigue","Nausea","Vomiting","Abdominal pain","Dark urine","Yellow skin (Jaundice)"],
  "Acute Diarrheal Disease": ["Frequent loose stools","Dehydration","Weakness","Stomach cramps","Nausea"],
  "Giardiasis":         ["Diarrhea","Gas and bloating","Fatigue","Weight loss","Greasy stools"],
  "Leptospirosis":      ["Fever","Headache","Muscle pain","Vomiting","Red eyes","Abdominal pain"],
  "Campylobacteriosis": ["Diarrhea (sometimes bloody)","Fever","Abdominal pain","Nausea","Vomiting"],
  "E. coli Infection":  ["Severe stomach cramps","Diarrhea (sometimes bloody)","Vomiting","Mild fever"],
  "Cryptosporidiosis":  ["Watery diarrhea","Stomach cramps","Dehydration","Nausea","Fever"],
};

// All unique symptoms across diseases
const ALL_SYMPTOMS = [...new Set(Object.values(DISEASE_SYMPTOMS).flat())].sort();

// ─────────────────────────────────────────────────────────────────────────────
// INDIA STATES → DISTRICTS DATA
// ─────────────────────────────────────────────────────────────────────────────
const INDIA_DISTRICTS = {
  "Tamil Nadu": [
    "Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul",
    "Erode","Kallakurichi","Kancheepuram","Karur","Krishnagiri","Madurai","Mayiladuthurai",
    "Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram",
    "Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli",
    "Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur",
    "Vellore","Villupuram","Virudhunagar","Krishnagiri"
  ],
  "Maharashtra": [
    "Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur",
    "Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City",
    "Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani",
    "Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha",
    "Washim","Yavatmal"
  ],
  "Karnataka": [
    "Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban","Bidar","Chamarajanagar",
    "Chikkaballapur","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davangere","Dharwad",
    "Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur",
    "Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"
  ],
  "Kerala": [
    "Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode",
    "Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"
  ],
  "Andhra Pradesh": [
    "Alluri Sitarama Raju","Anakapalli","Ananthapuramu","Annamayya","Bapatla","Chittoor",
    "Dr. B.R. Ambedkar Konaseema","East Godavari","Eluru","Guntur","Kakinada","Krishna",
    "Kurnool","Nandyal","NTR","Palnadu","Prakasam","Srikakulam","Sri Sathya Sai",
    "Tirupati","Visakhapatnam","Vizianagaram","West Godavari","YSR Kadapa"
  ],
  "Telangana": [
    "Adilabad","Bhadradri Kothagudem","Hanamkonda","Hyderabad","Jagtial","Jangaon",
    "Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam",
    "Kumuram Bheem","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal-Malkajgiri",
    "Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli",
    "Rajanna Sircilla","Ranga Reddy","Sangareddy","Siddipet","Suryapet","Vikarabad",
    "Wanaparthy","Warangal","Yadadri Bhuvanagiri"
  ],
  "Gujarat": [
    "Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad",
    "Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath",
    "Jamnagar","Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada",
    "Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar",
    "Tapi","Vadodara","Valsad"
  ],
  "Rajasthan": [
    "Ajmer","Alwar","Banswara","Baran","Barmer","Bharatpur","Bhilwara","Bikaner","Bundi",
    "Chittorgarh","Churu","Dausa","Dholpur","Dungarpur","Hanumangarh","Jaipur","Jaisalmer",
    "Jalore","Jhalawar","Jhunjhunu","Jodhpur","Karauli","Kota","Nagaur","Pali","Pratapgarh",
    "Rajsamand","Sawai Madhopur","Sikar","Sirohi","Sri Ganganagar","Tonk","Udaipur"
  ],
  "Madhya Pradesh": [
    "Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind",
    "Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori",
    "Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua","Katni","Khandwa",
    "Khargone","Mandla","Mandsaur","Morena","Narsinghpur","Neemuch","Niwari","Panna","Raisen",
    "Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur",
    "Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"
  ],
  "Uttar Pradesh": [
    "Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh",
    "Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti",
    "Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah",
    "Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad",
    "Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun",
    "Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi",
    "Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura",
    "Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh",
    "Prayagraj","Raebareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur",
    "Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao",
    "Varanasi"
  ],
  "West Bengal": [
    "Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling",
    "Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad",
    "Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman",
    "Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"
  ],
  "Punjab": [
    "Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur",
    "Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa",
    "Moga","Mohali","Muktsar","Nawanshahr","Pathankot","Patiala","Roopnagar","Sangrur",
    "Tarn Taran"
  ],
  "Haryana": [
    "Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar",
    "Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal",
    "Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"
  ],
  "Bihar": [
    "Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar",
    "Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar",
    "Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur",
    "Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura",
    "Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"
  ],
  "Assam": [
    "Bajali","Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang",
    "Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi",
    "Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar",
    "Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara-Mankachar",
    "Tamulpur","Tinsukia","Udalguri","West Karbi Anglong"
  ],
  "Odisha": [
    "Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal",
    "Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara",
    "Kendujhar","Khordha","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada",
    "Puri","Rayagada","Sambalpur","Subarnapur","Sundargarh"
  ],
  "Jharkhand": [
    "Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih",
    "Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga",
    "Pakur","Palamu","Ramgarh","Ranchi","Sahebganj","Seraikela Kharsawan","Simdega",
    "West Singhbhum"
  ],
  "Himachal Pradesh": [
    "Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul & Spiti","Mandi",
    "Shimla","Sirmaur","Solan","Una"
  ],
  "Uttarakhand": [
    "Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal",
    "Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"
  ],
  "Chhattisgarh": [
    "Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada",
    "Dhamtari","Durg","Gariaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur",
    "Kabirdham","Kanker","Khairagarh","Kondagaon","Korba","Koriya","Mahasamund","Manendragarh",
    "Mohla-Manpur","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sakti","Sarangarh-Bilaigarh",
    "Sukma","Surajpur","Surguja"
  ],
  "Goa": ["North Goa","South Goa"],
  "Tripura": [
    "Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti","West Tripura"
  ],
  "Meghalaya": [
    "East Garo Hills","East Jaintia Hills","East Khasi Hills","Eastern West Khasi Hills",
    "North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills",
    "West Garo Hills","West Jaintia Hills","West Khasi Hills"
  ],
  "Manipur": [
    "Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching",
    "Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"
  ],
  "Nagaland": [
    "Chumoukedima","Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Niuland",
    "Noklak","Peren","Phek","Shamator","Tseminyü","Tuensang","Wokha","Zunheboto"
  ],
  "Arunachal Pradesh": [
    "Anjaw","Changlang","Dibang Valley","East Kameng","East Siang","Itanagar Capital Complex",
    "Kamle","Kra Daadi","Kurung Kumey","Lepa Rada","Lohit","Longding","Lower Dibang Valley",
    "Lower Siang","Lower Subansiri","Namsai","Pakke-Kessang","Papum Pare","Shi-Yomi",
    "Siang","Tawang","Tirap","Upper Dibang Valley","Upper Siang","Upper Subansiri","West Kameng","West Siang"
  ],
  "Mizoram": [
    "Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit",
    "Saitual","Serchhip","Siaha"
  ],
  "Sikkim": [
    "East Sikkim","Gyalshing","Namchi","Pakyong","Soreng","North Sikkim","South Sikkim","West Sikkim"
  ],
  "Jammu & Kashmir": [
    "Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar",
    "Kulgam","Kupwara","Poonch","Pulwama","Rajouri","Ramban","Reasi","Samba","Shopian",
    "Srinagar","Udhampur"
  ],
  "Delhi": [
    "Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi",
    "Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"
  ],
  "Puducherry":        ["Karaikal","Mahe","Puducherry","Yanam"],
  "Chandigarh":        ["Chandigarh"],
  "Andaman & Nicobar Islands": ["Nicobar","North & Middle Andaman","South Andaman"],
  "Dadra & Nagar Haveli and Daman & Diu": ["Dadra & Nagar Haveli","Daman","Diu"],
  "Lakshadweep":       ["Agatti","Amini","Androth","Chetlat","Kadmat","Kalpeni","Kavaratti","Kiltan","Minicoy"],
  "Ladakh":            ["Kargil","Leh"],
};

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH MINISTER CREDENTIALS SEED (managed dynamically by Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
const HEALTH_MINISTERS_SEED = [
  { id:"HM-TN-001",  pass:"tn@health2024",  state:"Tamil Nadu",        name:"Ma. Subramanian",       title:"Health Minister, Tamil Nadu" },
  { id:"HM-MH-001",  pass:"mh@health2024",  state:"Maharashtra",       name:"Tanaji Sawant",          title:"Health Minister, Maharashtra" },
  { id:"HM-KA-001",  pass:"ka@health2024",  state:"Karnataka",         name:"Dinesh Gundu Rao",       title:"Health Minister, Karnataka" },
  { id:"HM-KL-001",  pass:"kl@health2024",  state:"Kerala",            name:"Veena George",           title:"Health Minister, Kerala" },
  { id:"HM-AP-001",  pass:"ap@health2024",  state:"Andhra Pradesh",    name:"Y. Satya Kumar",         title:"Health Minister, Andhra Pradesh" },
  { id:"HM-TG-001",  pass:"tg@health2024",  state:"Telangana",         name:"Damodar Raja Narasimha", title:"Health Minister, Telangana" },
  { id:"HM-GJ-001",  pass:"gj@health2024",  state:"Gujarat",           name:"Rushikesh Patel",        title:"Health Minister, Gujarat" },
  { id:"HM-RJ-001",  pass:"rj@health2024",  state:"Rajasthan",         name:"Gajendra Singh",         title:"Health Minister, Rajasthan" },
  { id:"HM-MP-001",  pass:"mp@health2024",  state:"Madhya Pradesh",    name:"Vishvas Sarang",         title:"Health Minister, Madhya Pradesh" },
  { id:"HM-UP-001",  pass:"up@health2024",  state:"Uttar Pradesh",     name:"Brajesh Pathak",         title:"Health Minister, Uttar Pradesh" },
  { id:"HM-WB-001",  pass:"wb@health2024",  state:"West Bengal",       name:"Chandrima Bhattacharya", title:"Health Minister, West Bengal" },
  { id:"HM-PB-001",  pass:"pb@health2024",  state:"Punjab",            name:"Balbir Singh",           title:"Health Minister, Punjab" },
  { id:"HM-HR-001",  pass:"hr@health2024",  state:"Haryana",           name:"Anil Vij",               title:"Health Minister, Haryana" },
  { id:"HM-BR-001",  pass:"br@health2024",  state:"Bihar",             name:"Mangal Pandey",          title:"Health Minister, Bihar" },
  { id:"HM-AS-001",  pass:"as@health2024",  state:"Assam",             name:"Keshab Mahanta",         title:"Health Minister, Assam" },
  { id:"HM-OR-001",  pass:"or@health2024",  state:"Odisha",            name:"Mukesh Mahaling",        title:"Health Minister, Odisha" },
  { id:"HM-JH-001",  pass:"jh@health2024",  state:"Jharkhand",         name:"Banna Gupta",            title:"Health Minister, Jharkhand" },
  { id:"HM-HP-001",  pass:"hp@health2024",  state:"Himachal Pradesh",  name:"Dhani Ram Shandil",      title:"Health Minister, Himachal Pradesh" },
  { id:"HM-UK-001",  pass:"uk@health2024",  state:"Uttarakhand",       name:"Dhan Singh Rawat",       title:"Health Minister, Uttarakhand" },
  { id:"HM-CG-001",  pass:"cg@health2024",  state:"Chhattisgarh",      name:"Shyam Bihari Jaiswal",   title:"Health Minister, Chhattisgarh" },
  { id:"HM-GA-001",  pass:"ga@health2024",  state:"Goa",               name:"Vishwajit Rane",         title:"Health Minister, Goa" },
  { id:"HM-TR-001",  pass:"tr@health2024",  state:"Tripura",           name:"Sushanta Chowdhury",     title:"Health Minister, Tripura" },
  { id:"HM-ML-001",  pass:"ml@health2024",  state:"Meghalaya",         name:"Ampareen Lyngdoh",       title:"Health Minister, Meghalaya" },
  { id:"HM-MN-001",  pass:"mn@health2024",  state:"Manipur",           name:"Sapam Ranjan Singh",     title:"Health Minister, Manipur" },
  { id:"HM-NL-001",  pass:"nl@health2024",  state:"Nagaland",          name:"S. Pangyu Phom",         title:"Health Minister, Nagaland" },
  { id:"HM-AR-001",  pass:"ar@health2024",  state:"Arunachal Pradesh", name:"Alo Libang",             title:"Health Minister, Arunachal Pradesh" },
  { id:"HM-MZ-001",  pass:"mz@health2024",  state:"Mizoram",           name:"Dr. R. Lalthangliana",   title:"Health Minister, Mizoram" },
  { id:"HM-SK-001",  pass:"sk@health2024",  state:"Sikkim",            name:"MK Sharma",              title:"Health Minister, Sikkim" },
  { id:"HM-JK-001",  pass:"jk@health2024",  state:"Jammu & Kashmir",   name:"Sakeena Masood",         title:"Health Minister, J&K" },
  { id:"HM-DL-001",  pass:"dl@health2024",  state:"Delhi",             name:"Saurabh Bharadwaj",      title:"Health Minister, Delhi" },
  // ── Union Territories ──
  { id:"HM-PY-001",  pass:"py@health2024",  state:"Puducherry",        name:"Malladi Krishna Rao",    title:"Health Minister, Puducherry" },
  { id:"HM-CH-001",  pass:"ch@health2024",  state:"Chandigarh",        name:"Saurabh Bharadwaj",      title:"Health Administrator, Chandigarh" },
  { id:"HM-AN-001",  pass:"an@health2024",  state:"Andaman & Nicobar Islands", name:"D.K. Joshi",     title:"Health Administrator, A&N Islands" },
  { id:"HM-DD-001",  pass:"dd@health2024",  state:"Dadra & Nagar Haveli and Daman & Diu", name:"Praful Patel", title:"Health Administrator, DNHDD" },
  { id:"HM-LD-001",  pass:"ld@health2024",  state:"Lakshadweep",       name:"Praful Patel",           title:"Health Administrator, Lakshadweep" },
  { id:"HM-LA-001",  pass:"la@health2024",  state:"Ladakh",            name:"B.D. Mishra",            title:"Health Administrator, Ladakh" },
];

// Super Admin credentials
const SUPER_ADMIN_ID   = "SA-INDIA-2024";
const SUPER_ADMIN_PASS = "india@healthwatch";

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
const SLIDESHOW_IMAGES = [
  {
    caption: "Modern Hospital Facility",
    svg: `<svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#1e3a5f"/>
      <rect x="200" y="150" width="800" height="450" rx="8" fill="#1a3050" stroke="#93c5fd" stroke-width="2"/>
      <rect x="520" y="150" width="160" height="80" fill="#1a3050" stroke="#93c5fd" stroke-width="2"/>
      <text x="600" y="202" font-family="Arial" font-size="28" fill="#14b8a6" text-anchor="middle" font-weight="bold">+</text>
      <rect x="260" y="280" width="120" height="140" rx="4" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <rect x="420" y="280" width="120" height="140" rx="4" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <rect x="660" y="280" width="120" height="140" rx="4" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <rect x="820" y="280" width="120" height="140" rx="4" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <rect x="460" y="450" width="280" height="150" rx="4" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <rect x="540" y="470" width="120" height="8" rx="4" fill="#14b8a6" opacity="0.6"/>
      <rect x="540" y="488" width="80" height="8" rx="4" fill="#3b82f6" opacity="0.6"/>
      <circle cx="300" cy="240" r="6" fill="#14b8a6" opacity="0.8"/>
      <circle cx="480" cy="240" r="6" fill="#14b8a6" opacity="0.8"/>
      <circle cx="720" cy="240" r="6" fill="#14b8a6" opacity="0.8"/>
      <circle cx="880" cy="240" r="6" fill="#14b8a6" opacity="0.8"/>
      <rect x="0" y="580" width="1200" height="120" fill="#163048" opacity="0.8"/>
      <rect x="100" y="590" width="200" height="8" rx="4" fill="#93c5fd"/>
      <rect x="100" y="608" width="140" height="6" rx="3" fill="#93c5fd" opacity="0.6"/>
      <rect x="900" y="590" width="200" height="8" rx="4" fill="#93c5fd"/>
      <rect x="900" y="608" width="140" height="6" rx="3" fill="#93c5fd" opacity="0.6"/>
    </svg>`
  },
  {
    caption: "Doctors Collaborating on Patient Care",
    svg: `<svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#0f2d18"/>
      <circle cx="380" cy="260" r="70" fill="#1a3050" stroke="#14b8a6" stroke-width="2"/>
      <circle cx="380" cy="220" r="30" fill="#93c5fd"/>
      <rect x="330" y="260" width="100" height="120" rx="10" fill="#93c5fd"/>
      <rect x="340" y="270" width="80" height="10" rx="5" fill="#14b8a6" opacity="0.7"/>
      <circle cx="820" cy="260" r="70" fill="#1a3050" stroke="#3b82f6" stroke-width="2"/>
      <circle cx="820" cy="220" r="30" fill="#93c5fd"/>
      <rect x="770" y="260" width="100" height="120" rx="10" fill="#93c5fd"/>
      <rect x="780" y="270" width="80" height="10" rx="5" fill="#3b82f6" opacity="0.7"/>
      <rect x="450" y="300" width="300" height="180" rx="12" fill="#1a3050" stroke="#14b8a6" stroke-width="1.5"/>
      <rect x="470" y="320" width="260" height="8" rx="4" fill="#14b8a6" opacity="0.5"/>
      <rect x="470" y="338" width="200" height="6" rx="3" fill="#3b82f6" opacity="0.4"/>
      <rect x="470" y="354" width="220" height="6" rx="3" fill="#3b82f6" opacity="0.4"/>
      <rect x="470" y="370" width="180" height="6" rx="3" fill="#3b82f6" opacity="0.4"/>
      <circle cx="600" cy="420" r="20" fill="#14b8a6" opacity="0.2" stroke="#14b8a6" stroke-width="1.5"/>
      <text x="600" y="426" font-family="Arial" font-size="18" fill="#14b8a6" text-anchor="middle">+</text>
      <line x1="450" y1="330" x2="380" y2="310" stroke="#14b8a6" stroke-width="1" stroke-dasharray="6,4" opacity="0.5"/>
      <line x1="750" y1="330" x2="820" y2="310" stroke="#3b82f6" stroke-width="1" stroke-dasharray="6,4" opacity="0.5"/>
    </svg>`
  },
  {
    caption: "Medical Emergency Response Team",
    svg: `<svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#0d1525"/>
      <rect x="150" y="200" width="900" height="360" rx="12" fill="#1e3a5f" stroke="#ef4444" stroke-width="2"/>
      <rect x="150" y="200" width="900" height="60" rx="12" fill="#1a0a0a"/>
      <rect x="150" y="240" width="900" height="20" fill="#1a0a0a"/>
      <circle cx="200" cy="230" r="12" fill="#ef4444" opacity="0.8"/>
      <circle cx="240" cy="230" r="12" fill="#f97316" opacity="0.8"/>
      <circle cx="280" cy="230" r="12" fill="#22c55e" opacity="0.8"/>
      <text x="600" y="238" font-family="Arial" font-size="14" fill="#64748b" text-anchor="middle">EMERGENCY RESPONSE DASHBOARD</text>
      <rect x="180" y="290" width="220" height="120" rx="8" fill="#2d0f0f" stroke="#ef4444" stroke-width="1" opacity="0.8"/>
      <text x="290" y="315" font-family="Arial" font-size="11" fill="#ef4444" text-anchor="middle">CRITICAL ALERTS</text>
      <text x="290" y="355" font-family="Arial" font-size="36" fill="#ef4444" text-anchor="middle" font-weight="bold">12</text>
      <text x="290" y="385" font-family="Arial" font-size="11" fill="#64748b" text-anchor="middle">Active Cases</text>
      <rect x="430" y="290" width="220" height="120" rx="8" fill="#0a1505" stroke="#22c55e" stroke-width="1" opacity="0.8"/>
      <text x="540" y="315" font-family="Arial" font-size="11" fill="#22c55e" text-anchor="middle">TEAMS DEPLOYED</text>
      <text x="540" y="355" font-family="Arial" font-size="36" fill="#22c55e" text-anchor="middle" font-weight="bold">8</text>
      <text x="540" y="385" font-family="Arial" font-size="11" fill="#64748b" text-anchor="middle">Response Units</text>
      <rect x="680" y="290" width="220" height="120" rx="8" fill="#050a1a" stroke="#3b82f6" stroke-width="1" opacity="0.8"/>
      <text x="790" y="315" font-family="Arial" font-size="11" fill="#3b82f6" text-anchor="middle">HOSPITALS READY</text>
      <text x="790" y="355" font-family="Arial" font-size="36" fill="#3b82f6" text-anchor="middle" font-weight="bold">24</text>
      <text x="790" y="385" font-family="Arial" font-size="11" fill="#64748b" text-anchor="middle">Facilities</text>
      <rect x="180" y="440" width="720" height="80" rx="8" fill="#1e3a5f" stroke="#93c5fd" stroke-width="1"/>
      <rect x="200" y="460" width="60" height="8" rx="4" fill="#ef4444" opacity="0.7"/>
      <rect x="270" y="460" width="100" height="8" rx="4" fill="#ef4444" opacity="0.4"/>
      <rect x="200" y="478" width="60" height="8" rx="4" fill="#22c55e" opacity="0.7"/>
      <rect x="270" y="478" width="140" height="8" rx="4" fill="#22c55e" opacity="0.4"/>
      <rect x="200" y="496" width="60" height="8" rx="4" fill="#3b82f6" opacity="0.7"/>
      <rect x="270" y="496" width="120" height="8" rx="4" fill="#3b82f6" opacity="0.4"/>
    </svg>`
  },
  {
    caption: "Disease Outbreak Surveillance",
    svg: `<svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#1e3a5f"/>
      <rect x="100" y="120" width="1000" height="480" rx="16" fill="#1e3a5f" stroke="#14b8a6" stroke-width="1.5"/>
      <text x="600" y="170" font-family="Arial" font-size="16" fill="#14b8a6" text-anchor="middle" letter-spacing="3">INDIA DISEASE SURVEILLANCE MAP</text>
      <ellipse cx="600" cy="360" rx="320" ry="260" fill="none" stroke="#93c5fd" stroke-width="40" opacity="0.3"/>
      <ellipse cx="600" cy="360" rx="280" ry="220" fill="#1e3a5f" stroke="#93c5fd" stroke-width="1"/>
      <circle cx="480" cy="280" r="8" fill="#ef4444" opacity="0.9"/>
      <circle cx="480" cy="280" r="20" fill="#ef4444" opacity="0.2"/>
      <circle cx="480" cy="280" r="35" fill="#ef4444" opacity="0.08"/>
      <circle cx="620" cy="320" r="6" fill="#f97316" opacity="0.9"/>
      <circle cx="620" cy="320" r="15" fill="#f97316" opacity="0.2"/>
      <circle cx="560" cy="400" r="10" fill="#ef4444" opacity="0.9"/>
      <circle cx="560" cy="400" r="25" fill="#ef4444" opacity="0.15"/>
      <circle cx="700" cy="380" r="5" fill="#22c55e" opacity="0.9"/>
      <circle cx="700" cy="380" r="12" fill="#22c55e" opacity="0.2"/>
      <circle cx="530" cy="340" r="7" fill="#f97316" opacity="0.9"/>
      <circle cx="650" cy="440" r="4" fill="#22c55e" opacity="0.9"/>
      <rect x="850" y="200" width="200" height="260" rx="8" fill="#1a3050" stroke="#93c5fd" stroke-width="1"/>
      <text x="950" y="228" font-family="Arial" font-size="11" fill="#64748b" text-anchor="middle">LEGEND</text>
      <circle cx="880" cy="255" r="6" fill="#ef4444"/>
      <text x="895" y="259" font-family="Arial" font-size="10" fill="#0d1525">High Risk</text>
      <circle cx="880" cy="280" r="6" fill="#f97316"/>
      <text x="895" y="284" font-family="Arial" font-size="10" fill="#0d1525">Medium Risk</text>
      <circle cx="880" cy="305" r="6" fill="#22c55e"/>
      <text x="895" y="309" font-family="Arial" font-size="10" fill="#0d1525">Controlled</text>
      <rect x="870" y="330" width="160" height="1" fill="#93c5fd"/>
      <text x="950" y="360" font-family="Arial" font-size="10" fill="#64748b" text-anchor="middle">Active Outbreaks: 3</text>
      <text x="950" y="378" font-family="Arial" font-size="10" fill="#64748b" text-anchor="middle">Districts Affected: 12</text>
      <text x="950" y="396" font-family="Arial" font-size="10" fill="#14b8a6" text-anchor="middle">Last Updated: Now</text>
    </svg>`
  },
  {
    caption: "Community Health Workers in Action",
    svg: `<svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#0d1525"/>
      <rect x="0" y="480" width="1200" height="220" fill="#0d1117"/>
      <rect x="60" y="300" width="180" height="280" rx="8" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <rect x="280" y="340" width="180" height="240" rx="8" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <rect x="500" y="280" width="180" height="300" rx="8" fill="#1a3050" stroke="#14b8a6" stroke-width="1.5"/>
      <rect x="720" y="320" width="180" height="260" rx="8" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <rect x="940" y="360" width="180" height="220" rx="8" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <circle cx="150" cy="270" r="30" fill="#1a3050" stroke="#14b8a6" stroke-width="1.5"/>
      <circle cx="150" cy="255" r="14" fill="#93c5fd"/>
      <circle cx="370" cy="310" r="30" fill="#1a3050" stroke="#3b82f6" stroke-width="1.5"/>
      <circle cx="370" cy="295" r="14" fill="#93c5fd"/>
      <circle cx="590" cy="250" r="36" fill="#1a3050" stroke="#14b8a6" stroke-width="2"/>
      <circle cx="590" cy="234" r="16" fill="#93c5fd"/>
      <circle cx="810" cy="290" r="30" fill="#1a3050" stroke="#3b82f6" stroke-width="1.5"/>
      <circle cx="810" cy="275" r="14" fill="#93c5fd"/>
      <circle cx="1030" cy="330" r="28" fill="#1a3050" stroke="#93c5fd" stroke-width="1.5"/>
      <circle cx="1030" cy="316" r="13" fill="#93c5fd"/>
      <rect x="85" y="340" width="10" height="14" rx="3" fill="#14b8a6" opacity="0.8"/>
      <rect x="95" y="336" width="14" height="4" rx="2" fill="#14b8a6" opacity="0.8"/>
      <text x="600" y="620" font-family="Arial" font-size="13" fill="#64748b" text-anchor="middle">Frontline Community Health Surveillance Team</text>
    </svg>`
  },
  {
    caption: "Water Quality Testing — Rural India",
    svg: `<svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#1e3a5f"/>
      <ellipse cx="600" cy="560" rx="500" ry="80" fill="#163048" opacity="0.8"/>
      <path d="M300 400 Q450 200 600 380 Q750 200 900 400 Q1050 580 600 600 Q150 580 300 400Z" fill="#0a2540" stroke="#0e4d7a" stroke-width="2" opacity="0.6"/>
      <path d="M350 420 Q480 260 600 400 Q720 260 850 420" fill="none" stroke="#14b8a6" stroke-width="1.5" opacity="0.4" stroke-dasharray="8,4"/>
      <rect x="520" y="200" width="160" height="260" rx="80" fill="#0d1f3c" stroke="#14b8a6" stroke-width="2" opacity="0.7"/>
      <rect x="540" y="300" width="120" height="140" rx="60" fill="#93c5fd" opacity="0.8"/>
      <circle cx="600" cy="320" r="20" fill="#14b8a6" opacity="0.3"/>
      <circle cx="600" cy="340" r="10" fill="#14b8a6" opacity="0.6"/>
      <rect x="140" y="280" width="200" height="200" rx="10" fill="#163048" stroke="#14b8a6" stroke-width="1.5"/>
      <text x="240" y="308" font-family="Arial" font-size="11" fill="#14b8a6" text-anchor="middle">WATER QUALITY</text>
      <rect x="160" y="320" width="160" height="10" rx="5" fill="#93c5fd"/>
      <rect x="160" y="320" width="120" height="10" rx="5" fill="#14b8a6" opacity="0.8"/>
      <text x="240" y="355" font-family="Arial" font-size="10" fill="#64748b" text-anchor="middle">pH: 7.2 ✓ Safe</text>
      <text x="240" y="375" font-family="Arial" font-size="10" fill="#64748b" text-anchor="middle">Turbidity: Low ✓</text>
      <text x="240" y="395" font-family="Arial" font-size="10" fill="#22c55e" text-anchor="middle">Status: CLEAN</text>
      <rect x="860" y="280" width="200" height="200" rx="10" fill="#163048" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="960" y="308" font-family="Arial" font-size="11" fill="#3b82f6" text-anchor="middle">PATHOGEN SCAN</text>
      <circle cx="960" cy="360" r="40" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.5"/>
      <circle cx="960" cy="360" r="25" fill="none" stroke="#3b82f6" stroke-width="1" opacity="0.4"/>
      <circle cx="960" cy="360" r="5" fill="#22c55e"/>
      <text x="960" y="425" font-family="Arial" font-size="10" fill="#22c55e" text-anchor="middle">No Pathogens ✓</text>
    </svg>`
  },
  {
    caption: "Patient Symptom Reporting System",
    svg: `<svg viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#0d1525"/>
      <rect x="300" y="80" width="600" height="560" rx="40" fill="#0d1525" stroke="#0d1117" stroke-width="2"/>
      <rect x="320" y="120" width="560" height="80" rx="8" fill="#0d1525"/>
      <circle cx="360" cy="160" r="16" fill="#ef4444" opacity="0.8"/>
      <circle cx="400" cy="160" r="16" fill="#f97316" opacity="0.8"/>
      <circle cx="440" cy="160" r="16" fill="#22c55e" opacity="0.8"/>
      <text x="600" y="168" font-family="Arial" font-size="13" fill="#64748b" text-anchor="middle">HealthWatch — Symptom Report</text>
      <rect x="340" y="230" width="520" height="50" rx="8" fill="#1e3a5f" stroke="#93c5fd" stroke-width="1"/>
      <text x="360" y="261" font-family="Arial" font-size="13" fill="#64748b">Patient Name</text>
      <rect x="340" y="300" width="520" height="50" rx="8" fill="#1e3a5f" stroke="#14b8a6" stroke-width="1.5"/>
      <text x="360" y="331" font-family="Arial" font-size="13" fill="#0d1525">Kishore K.</text>
      <circle cx="830" cy="325" r="8" fill="#14b8a6"/>
      <rect x="340" y="370" width="240" height="50" rx="8" fill="#1e3a5f" stroke="#93c5fd" stroke-width="1"/>
      <text x="360" y="401" font-family="Arial" font-size="13" fill="#64748b">District</text>
      <rect x="600" y="370" width="260" height="50" rx="8" fill="#1e3a5f" stroke="#93c5fd" stroke-width="1"/>
      <text x="620" y="401" font-family="Arial" font-size="13" fill="#64748b">Hospital</text>
      <rect x="340" y="440" width="520" height="100" rx="8" fill="#1e3a5f" stroke="#93c5fd" stroke-width="1"/>
      <text x="360" y="465" font-family="Arial" font-size="11" fill="#64748b">Select Symptoms</text>
      <rect x="355" y="478" width="90" height="26" rx="13" fill="#14b8a6" opacity="0.2" stroke="#14b8a6" stroke-width="1"/>
      <text x="400" y="496" font-family="Arial" font-size="10" fill="#14b8a6" text-anchor="middle">Fever</text>
      <rect x="455" y="478" width="110" height="26" rx="13" fill="#14b8a6" opacity="0.2" stroke="#14b8a6" stroke-width="1"/>
      <text x="510" y="496" font-family="Arial" font-size="10" fill="#14b8a6" text-anchor="middle">Diarrhoea</text>
      <rect x="575" y="478" width="100" height="26" rx="13" fill="#93c5fd" stroke="#475569" stroke-width="1"/>
      <text x="625" y="496" font-family="Arial" font-size="10" fill="#64748b" text-anchor="middle">Vomiting</text>
      <rect x="340" y="560" width="520" height="50" rx="10" fill="#14b8a6"/>
      <text x="600" y="591" font-family="Arial" font-size="15" fill="#0d1117" text-anchor="middle" font-weight="bold">Submit Report</text>
    </svg>`
  },
  {
    caption: "Real-Time Health Alerts — India Network",
    svg: `<svg viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#1e3a5f"/>
      <circle cx="600" cy="350" r="280" fill="none" stroke="#14b8a6" stroke-width="0.5" opacity="0.2"/>
      <circle cx="600" cy="350" r="200" fill="none" stroke="#14b8a6" stroke-width="0.5" opacity="0.3"/>
      <circle cx="600" cy="350" r="120" fill="none" stroke="#14b8a6" stroke-width="0.5" opacity="0.4"/>
      <circle cx="600" cy="350" r="50" fill="#163048" stroke="#14b8a6" stroke-width="2"/>
      <text x="600" y="344" font-family="Arial" font-size="11" fill="#14b8a6" text-anchor="middle">HEALTH</text>
      <text x="600" y="362" font-family="Arial" font-size="11" fill="#14b8a6" text-anchor="middle">WATCH</text>
      <circle cx="350" cy="200" r="28" fill="#2d0f0f" stroke="#ef4444" stroke-width="1.5"/>
      <text x="350" y="197" font-family="Arial" font-size="9" fill="#ef4444" text-anchor="middle">ALERT</text>
      <text x="350" y="210" font-family="Arial" font-size="8" fill="#0d1525" text-anchor="middle">Chennai</text>
      <circle cx="750" cy="180" r="22" fill="#dcfce7" stroke="#22c55e" stroke-width="1.5"/>
      <text x="750" y="177" font-family="Arial" font-size="8" fill="#22c55e" text-anchor="middle">SAFE</text>
      <text x="750" y="190" font-family="Arial" font-size="8" fill="#0d1525" text-anchor="middle">Delhi</text>
      <circle cx="820" cy="420" r="25" fill="#2d1a08" stroke="#f97316" stroke-width="1.5"/>
      <text x="820" y="417" font-family="Arial" font-size="9" fill="#f97316" text-anchor="middle">WATCH</text>
      <text x="820" y="430" font-family="Arial" font-size="8" fill="#0d1525" text-anchor="middle">Mumbai</text>
      <circle cx="400" cy="500" r="22" fill="#dcfce7" stroke="#22c55e" stroke-width="1.5"/>
      <text x="400" y="497" font-family="Arial" font-size="8" fill="#22c55e" text-anchor="middle">SAFE</text>
      <text x="400" y="510" font-family="Arial" font-size="8" fill="#0d1525" text-anchor="middle">Kolkata</text>
      <circle cx="700" cy="520" r="20" fill="#2d0f0f" stroke="#ef4444" stroke-width="1.5"/>
      <text x="700" y="517" font-family="Arial" font-size="9" fill="#ef4444" text-anchor="middle">ALERT</text>
      <text x="700" y="530" font-family="Arial" font-size="8" fill="#0d1525" text-anchor="middle">Pune</text>
      <line x1="600" y1="300" x2="370" y2="225" stroke="#ef4444" stroke-width="1" stroke-dasharray="6,4" opacity="0.6"/>
      <line x1="600" y1="300" x2="735" y2="198" stroke="#22c55e" stroke-width="1" stroke-dasharray="6,4" opacity="0.6"/>
      <line x1="600" y1="400" x2="800" y2="400" stroke="#f97316" stroke-width="1" stroke-dasharray="6,4" opacity="0.6"/>
      <line x1="600" y1="400" x2="420" y2="490" stroke="#22c55e" stroke-width="1" stroke-dasharray="6,4" opacity="0.6"/>
      <line x1="600" y1="400" x2="685" y2="505" stroke="#ef4444" stroke-width="1" stroke-dasharray="6,4" opacity="0.6"/>
    </svg>`
  },
];

// No seed hospitals — each Health Minister adds their own
const HOSPITALS_SEED = [];

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL APP STATE
// ─────────────────────────────────────────────────────────────────────────────
const initState = {
  statePortals: {},
  hospitals: HOSPITALS_SEED,
  users: [],
  symptoms: [],
  alerts: [],
  hmCredentials: [],  // fetched from backend for Super Admin
};

// ─────────────────────────────────────────────────────────────────────────────
// DISEASE DETECTION
// ─────────────────────────────────────────────────────────────────────────────
function detectDisease(selectedSymptoms) {
  let best = null, bestScore = 0;
  for (const [disease, symptoms] of Object.entries(DISEASE_SYMPTOMS)) {
    const matches = selectedSymptoms.filter(s => symptoms.includes(s)).length;
    const score = matches / symptoms.length;
    if (score > bestScore && matches >= 2) { bestScore = score; best = disease; }
  }
  return best;
}

// Returns { disease, count, entries[] } when 3+ patients in same hospital's district share the same predicted disease
function checkOutbreakAlert(allSymptoms, hospitalId, district) {
  const relevant = allSymptoms.filter(s =>
    s.hospitalId === hospitalId &&
    s.district?.trim().toLowerCase() === district?.trim().toLowerCase() &&
    s.detectedDisease
  );
  const byDisease = {};
  relevant.forEach(s => {
    if (!byDisease[s.detectedDisease]) byDisease[s.detectedDisease] = [];
    byDisease[s.detectedDisease].push(s);
  });
  for (const [disease, entries] of Object.entries(byDisease)) {
    if (entries.length >= 3) return { disease, count: entries.length, entries };
  }
  return null;
}

// Get precise symptom entries for a given alert using its backend-provided entries
function getPatientEntriesForAlert(alertEntries, allSymptoms) {
  return (alertEntries || [])
    .map(e => {
      const local = allSymptoms.find(s => s.id === e.symptomReportId);
      if (local) return local;
      const r = e.symptomReport;
      if (!r) return null;
      return {
        id: r.id, patientId: r.patientId, 
        patientName: r.patient?.name || "Unknown Patient",
        hospitalId: r.hospitalId, district: r.district, area: r.area, state: r.state,
        selectedSymptoms: r.symptoms || [], date: r.submittedAt,
        detectedDisease: r.detectedDisease, alertSent: r.alertSent,
        isResolved: r.isResolved, patient: r.patient
      };
    })
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EXPORT (browser print trick — no external lib needed)
// ─────────────────────────────────────────────────────────────────────────────
function exportAlertPDF(alert, liveEntries, hospitals, users) {
  const hospital = hospitals.find(h => h.id === alert.hospitalId);
  const rows = liveEntries.map((e, i) => {
    const pu = users.find(u => u.id === e.patientId);
    const age = pu?.dob ? new Date().getFullYear() - new Date(pu.dob).getFullYear() : "—";
    const family = pu ? (+pu.familyMale||0)+(+pu.familyFemale||0) : "—";
    return `
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:8px 10px;font-weight:600;">${i+1}. ${e.patientName}</td>
        <td style="padding:8px 10px;">${e.area}</td>
        <td style="padding:8px 10px;">${age} yrs</td>
        <td style="padding:8px 10px;">${family}</td>
        <td style="padding:8px 10px;color:#c2410c;font-weight:700;">${e.detectedDisease}</td>
        <td style="padding:8px 10px;font-size:11px;">${e.selectedSymptoms.join(", ")}</td>
        <td style="padding:8px 10px;font-size:11px;">${new Date(e.date).toLocaleString()}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>Outbreak Alert Report — ${alert.disease}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px; }
  h1 { font-size: 22px; color: #991b1b; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
  .badge { display:inline-block; background:#fef2f2; border:1px solid #fca5a5; color:#991b1b; border-radius:999px; padding:2px 12px; font-size:12px; font-weight:700; margin-left:10px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { background:#f8fafc; text-align:left; padding:10px; font-size:11px; text-transform:uppercase; color:#94a3b8; letter-spacing:0.5px; }
  tr:nth-child(even) { background:#fafafa; }
  .footer { margin-top:32px; font-size:11px; color:#94a3b8; border-top:1px solid #1e293b; padding-top:12px; }
  @media print { body { padding: 16px; } }
</style>
</head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
  <div>
    <h1>🦠 Outbreak Alert Report <span class="badge">${liveEntries.length} CASES</span></h1>
    <div class="meta">
      Disease: <strong>${alert.disease}</strong> &nbsp;|&nbsp;
      Area: <strong>${alert.area}</strong> &nbsp;|&nbsp;
      Hospital: <strong>${hospital?.name || "—"}</strong><br/>
      First Detected: ${new Date(alert.date).toLocaleString()} &nbsp;|&nbsp;
      Report Generated: ${new Date().toLocaleString()}
    </div>
  </div>
</div>
<table>
  <thead><tr>
    <th>Patient</th><th>Area</th><th>Age</th><th>Family</th><th>Predicted Disease</th><th>Symptoms</th><th>Reported At</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">HealthWatch NE India · District Health Early Warning System · Auto-generated report</div>
</body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION BELL
// ─────────────────────────────────────────────────────────────────────────────
function NotificationBell({ alerts, symptoms, hospitals }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeAlerts = alerts.filter(a => a.active);
  const recentSymptoms = symptoms.slice().reverse().slice(0, 5);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifications = [
    ...activeAlerts.map(a => ({
      id: a.id, type: "alert",
      title: `🚨 Outbreak: ${a.disease}`,
      body: `${a.patientCount} cases in ${a.area}`,
      time: a.lastUpdated || a.date,
      color: C.red,
    })),
    ...recentSymptoms.map(s => ({
      id: s.id, type: "report",
      title: `📋 New report: ${s.detectedDisease || "Symptoms logged"}`,
      body: `${s.patientName} · ${s.area}`,
      time: s.date,
      color: C.blue,
    })),
  ].sort((a,b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={() => setOpen(o => !o)} style={{
        position:"relative", background:"none", border:`1px solid ${C.border2}`,
        borderRadius:10, width:38, height:38, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
        color: open ? C.teal : C.textM, transition:"all 0.15s",
      }}>
        🔔
        {activeAlerts.length > 0 && (
          <span style={{
            position:"absolute", top:4, right:4, width:8, height:8,
            borderRadius:"50%", background:C.red, border:`2px solid ${C.bg1}`,
            animation:"pulse 1.5s infinite",
          }} />
        )}
      </button>

      {open && (
        <div className="slide-in" style={{
          position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:999,
          width:320, background:"#0d1117", border:`1px solid ${C.border}`,
          borderRadius:14, boxShadow:`0 20px 60px rgba(255,255,255,0.7)`, overflow:"hidden",
        }}>
          <div style={{padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <span style={{fontSize:13, fontWeight:700, color:"#ffffff"}}>Notifications</span>
            {activeAlerts.length > 0 && <Tag color={C.red}>{activeAlerts.length} active alert{activeAlerts.length>1?"s":""}</Tag>}
          </div>
          <div style={{maxHeight:360, overflowY:"auto"}}>
            {notifications.length === 0 ? (
              <div style={{padding:24, textAlign:"center", color:"#64748b", fontSize:13}}>No notifications yet</div>
            ) : notifications.map(n => (
              <div key={n.id} style={{
                padding:"12px 16px", borderBottom:`1px solid ${C.border}`,
                borderLeft:`3px solid ${n.color}`, transition:"background 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.background="#1e293b"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontSize:13, fontWeight:700, color:"#ffffff", marginBottom:2}}>{n.title}</div>
                <div style={{fontSize:11, color:"#94a3b8"}}>{n.body}</div>
                <div style={{fontSize:10, color:"#94a3b8", marginTop:3, fontFamily:"'JetBrains Mono',monospace"}}>
                  {new Date(n.time).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:"10px 16px", borderTop:`1px solid ${C.border}`, textAlign:"center"}}>
            <span style={{fontSize:11, color:"#64748b", fontFamily:"'JetBrains Mono',monospace"}}>
              {notifications.length} RECENT EVENTS
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  teal:   "#0ea5e9",
  tealD:  "#0284c7",
  blue:   "#3b82f6",
  red:    "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green:  "#16a34a",
  purple: "#7c3aed",
  bg:     "#f8fafc",
  bg1:    "#0d1117",
  bg2:    "#0d1117",
  bg3:    "#f8fafc",
  bg4:    "#0d1117",
  text:   "#0d1117",
  textM:  "#475569",
  textD:  "#64748b",
  border: "#0d1117",
  border2:"#475569",
};

function Btn({ children, onClick, variant="primary", size="md", style={}, disabled=false, className="" }) {
  const base = {
    border:"none", cursor: disabled?"not-allowed":"pointer", borderRadius:10,
    fontWeight:700, transition:"all 0.18s", display:"inline-flex",
    alignItems:"center", justifyContent:"center", gap:8,
    opacity: disabled ? 0.5 : 1,
    ...( size==="sm" ? {padding:"6px 14px", fontSize:12} :
         size==="lg" ? {padding:"14px 32px", fontSize:16} :
                       {padding:"10px 22px", fontSize:14} ),
    ...( variant==="primary"   ? {background:`linear-gradient(135deg,${C.teal},${C.tealD})`, color:"#0d1117"} :
         variant==="danger"    ? {background:`linear-gradient(135deg,#dc2626,#b91c1c)`, color:"#0d1117"} :
         variant==="ghost"     ? {background:"transparent", color:"#475569", border:`1px solid ${C.border2}`} :
         variant==="glass"     ? {background:"rgba(14,165,233,0.08)", color:"#0d1117", border:`1px solid rgba(14,165,233,0.15)`} :
                                 {background:"#f8fafc", color:"#475569", border:`1px solid ${C.border}`} ),
    ...style,
  };
  return <button className={`btn-scale ${className}`} style={base} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, type, ...props }) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  const inputType  = isPassword ? (showPw ? "text" : "password") : (type || "text");
  return (
    <div style={{marginBottom:16}}>
      {label && <div style={{fontSize:11, color:"#6b7280", fontFamily:"'JetBrains Mono',monospace", letterSpacing:1.2, marginBottom:6, textTransform:"uppercase"}}>{label}</div>}
      <div style={{position:"relative"}}>
        <input style={{
          width:"100%", background:"#ffffff", border:"1px solid #d1d5db", borderRadius:10,
          padding: isPassword ? "11px 44px 11px 14px" : "11px 14px",
          color:"#0d1117", fontSize:14,
          transition:"border-color 0.2s", outline:"none", boxSizing:"border-box",
        }}
        type={inputType}
        onFocus={e=>{e.target.style.borderColor=C.teal; e.target.style.boxShadow=`0 0 0 3px ${C.teal}22`;}}
        onBlur={e=>{e.target.style.borderColor="#d1d5db"; e.target.style.boxShadow="none";}}
        {...props} />
        {isPassword && (
          <button type="button" onClick={()=>setShowPw(v=>!v)} style={{
            position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer", padding:4,
            color:"#6b7280", fontSize:16, display:"flex", alignItems:"center",
            lineHeight:1,
          }} title={showPw?"Hide password":"Show password"}>
            {showPw ? "🙈" : "👁"}
          </button>
        )}
      </div>
    </div>
  );
}

// Password strength checker
function checkPasswordStrength(pw) {
  const checks = {
    length:    pw.length >= 8,
    upper:     /[A-Z]/.test(pw),
    lower:     /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
    noSpaces:  !/\s/.test(pw) && pw.length > 0,
  };
  const score = Object.values(checks).filter(Boolean).length;
  const level = score <= 2 ? "weak" : score <= 4 ? "fair" : score === 5 ? "good" : "strong";
  const color = level==="weak"?C.red:level==="fair"?C.orange:level==="good"?C.teal:C.green;
  return { checks, score, level, color };
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const { checks, score, level, color } = checkPasswordStrength(password);
  const bars = 6;
  return (
    <div style={{marginTop:-8,marginBottom:16}}>
      {/* Strength bars */}
      <div style={{display:"flex",gap:4,marginBottom:6}}>
        {Array.from({length:bars}).map((_,i) => (
          <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<score?color:'#e2e8f0',transition:"background 0.3s"}} />
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:11,color:color,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>{level} password</span>
        {level==="strong" && <span style={{fontSize:11,color:C.green}}>✓ Strong</span>}
      </div>
      {/* Requirements checklist */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 16px"}}>
        {[
          {k:"length",  label:"At least 8 characters"},
          {k:"upper",   label:"Uppercase letter (A-Z)"},
          {k:"lower",   label:"Lowercase letter (a-z)"},
          {k:"number",  label:"Number (0-9)"},
          {k:"special", label:"Special character (!@#...)"},
          {k:"noSpaces",label:"No spaces"},
        ].map(({k,label}) => (
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
            <span style={{color:checks[k]?C.green:"#64748b",fontSize:12}}>{checks[k]?"✓":"○"}</span>
            <span style={{color:checks[k]?C.textM:"#64748b"}}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{marginBottom:16}}>
      {label && <div style={{fontSize:11, color:"#64748b", fontFamily:"'JetBrains Mono',monospace", letterSpacing:1.2, marginBottom:6, textTransform:"uppercase"}}>{label}</div>}
      <select style={{
        width:"100%", background:"#0d1117", border:`1px solid ${C.border2}`, borderRadius:10,
        padding:"11px 14px", color:"#0d1117", fontSize:14,
        transition:"border-color 0.2s",
      }}
      onFocus={e=>e.target.style.borderColor=C.teal}
      onBlur={e=>e.target.style.borderColor=C.border2}
      {...props}>{children}</select>
    </div>
  );
}

function Card({ children, style={}, className="", ...props }) {
  return <div className={className} style={{background:"#ffffff", border:"1px solid #e5e7eb", borderRadius:14, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", ...style}} {...props}>{children}</div>;
}

function Tag({ children, color=C.teal }) {
  return <span style={{background:`${color}22`, color, border:`1px solid ${color}44`, borderRadius:999, padding:"2px 10px", fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace"}}>{children}</span>;
}

function AlertBanner({ msg, type="danger", onClose }) {
  const colors = { danger:{bg:"#fef2f2",border:"#fecaca",text:"#dc2626"}, warning:{bg:"#fffbeb",border:"#fde68a",text:"#b45309"}, success:{bg:"#f0fdf4",border:"#bbf7d0",text:"#16a34a"}, info:{bg:"#eff6ff",border:"#bfdbfe",text:"#2563eb"} };
  const col = colors[type];
  return (
    <div style={{background:col.bg, border:`1px solid ${col.border}`, borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16}}>
      <span style={{color:col.text, fontSize:13, fontWeight:600, lineHeight:1.5}}>{msg}</span>
      {onClose && <button onClick={onClose} style={{background:"none",border:"none",color:col.text,cursor:"pointer",fontSize:18,lineHeight:1,marginLeft:12}}>×</button>}
    </div>
  );
}

function Spinner() {
  return <div style={{width:20,height:20,border:`2px solid ${C.border2}`,borderTop:`2px solid ${C.teal}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDESHOW LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LandingPage({ statePortals, onHMAdmin, onSuperAdmin, onLogin, onSignup }) {
  const [slide, setSlide] = useState(0);
  const unlockedList = Object.entries(statePortals).filter(([,v])=>v).map(([k])=>k);
  const anyUnlocked = unlockedList.length > 0;

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDESHOW_IMAGES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const img = SLIDESHOW_IMAGES[slide];

  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",background:"linear-gradient(135deg,#0a1628 0%,#0d1f3c 50%,#0a1628 100%)"}}>

      {/* ── SLIDESHOW ── */}
      {SLIDESHOW_IMAGES.map((im, i) => (
        <div key={i} style={{
          position:"absolute",inset:0,
          opacity: i === slide ? 1 : 0,
          transition:"opacity 1.2s ease",
          zIndex: i === slide ? 2 : 1,
        }}>
          <div
            className="slide-svg-wrap"
            style={{
              position:"absolute",inset:0,
              transform: i === slide ? "scale(1.05)" : "scale(1)",
              transition:"transform 4s ease-out",
              filter:"blur(4px) brightness(0.6) saturate(0.75)",
              opacity: 0.85,
            }}
            dangerouslySetInnerHTML={{__html: im.svg}}
          />
        </div>
      ))}

      <div style={{position:"absolute",inset:0,zIndex:3,background:"rgba(8,16,40,0.38)"}} />
      <div style={{position:"absolute",inset:0,zIndex:4,background:"linear-gradient(to bottom,rgba(8,16,40,0.25) 0%,transparent 35%,rgba(8,16,40,0.35) 100%)"}} />
      <div style={{position:"absolute",inset:0,zIndex:5,backgroundImage:"linear-gradient(rgba(14,165,233,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,0.07) 1px,transparent 1px)",backgroundSize:"50px 50px",pointerEvents:"none"}} />

      {/* ── TOP NAV ── */}
      <div style={{position:"absolute",top:0,left:0,right:0,padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:20,background:"rgba(10,20,50,0.4)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(14,165,233,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${C.teal},${C.tealD})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>💧</div>
          <div>
            <div style={{color:"#ffffff",fontWeight:800,fontSize:18,letterSpacing:-0.5}}>HealthWatch India</div>
            <div style={{color:C.teal,fontSize:9,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2}}>NATIONAL HEALTH SENTINEL</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={onSuperAdmin} style={{background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.4)",borderRadius:8,padding:"6px 14px",fontSize:11,color:"#c4b5fd",cursor:"pointer",fontWeight:700,fontFamily:"'Sora',sans-serif"}}>
            🛡️ Super Admin
          </button>
          <button onClick={onHMAdmin} style={{background:"rgba(14,165,233,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"6px 14px",fontSize:11,color:"#e2e8f0",cursor:"pointer",fontWeight:700,fontFamily:"'Sora',sans-serif"}}>
            🏥 Health Minister Login
          </button>
          <button onClick={onLogin} style={{background:"rgba(14,165,233,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"6px 14px",fontSize:11,color:"#e2e8f0",cursor:"pointer",fontWeight:700,fontFamily:"'Sora',sans-serif"}}>🔑 Login</button>
          <button onClick={onSignup} style={{background:`linear-gradient(135deg,${C.teal},${C.tealD})`,border:"none",borderRadius:8,padding:"6px 14px",fontSize:11,color:"#0d1117",cursor:"pointer",fontWeight:700,fontFamily:"'Sora',sans-serif"}}>✦ Sign Up</button>
        </div>
      </div>

      {/* ── HERO TEXT ── */}
      <div style={{position:"absolute",inset:0,zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}>
        <div className="slide-in">
          <div style={{fontSize:12,color:"#38bdf8",fontFamily:"'JetBrains Mono',monospace",letterSpacing:3,marginBottom:24}}>
            GOVERNMENT OF INDIA · HEALTH MINISTRY
          </div>
          <h1 style={{fontSize:"clamp(32px,5vw,68px)",fontWeight:800,letterSpacing:-2,lineHeight:1.05,maxWidth:900,margin:"0 auto 48px",textShadow:"0 4px 20px rgba(15,23,42,0.4)",textAlign:"center"}}>
            <span style={{color:"#ffffff"}}>Smart Community Health</span><br/>
            <span style={{background:"linear-gradient(135deg,#38bdf8,#3b82f6,#1d4ed8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",filter:"drop-shadow(0 2px 8px rgba(59,130,246,0.5))"}}>
              Early Warning System
            </span>
          </h1>
          <p style={{color:"rgba(226,232,240,0.9)",fontSize:16,maxWidth:740,margin:"0 auto 64px",lineHeight:2.0,textShadow:"0 2px 8px rgba(0,0,0,0.6))", textAlign:"center", letterSpacing:"0.4px"}}>
            Protecting communities across India from waterborne disease outbreaks through real-time surveillance, district-level monitoring, and rapid alert systems.
          </p>

          {/* Always show Login + Signup CTA */}
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap",marginBottom:64}}>
            <button onClick={onLogin} style={{background:`linear-gradient(135deg,${C.teal},${C.tealD})`,border:"none",borderRadius:12,padding:"16px 40px",fontSize:17,color:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"'Sora',sans-serif",boxShadow:`0 4px 24px ${C.teal}66`}}>🔑 Patient / Doctor Login</button>
            <button onClick={onSignup} style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:12,padding:"16px 40px",fontSize:17,color:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"'Sora',sans-serif",backdropFilter:"blur(8px)"}}>✦ Create Account</button>
          </div>

          {/* Active portals banner */}
          {anyUnlocked ? (
            <div style={{background:"rgba(14,165,233,0.08)",border:"1px solid rgba(14,165,233,0.25)",borderRadius:16,padding:"16px 28px",display:"inline-block",backdropFilter:"blur(12px)",maxWidth:"90%",margin:"0 auto"}}>
              <div style={{color:"#38bdf8",fontSize:11,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,marginBottom:12,textTransform:"uppercase",opacity:0.8}}>🟢 Active State Portals</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",alignItems:"center"}}>
                {unlockedList.map(s => (
                  <span key={s} style={{
                    background:"linear-gradient(135deg,rgba(14,165,233,0.15),rgba(14,165,233,0.05))",
                    border:"1px solid rgba(14,165,233,0.3)",
                    borderRadius:8,
                    padding:"5px 14px",
                    fontSize:13,
                    color:"#f8fafc",
                    fontWeight:600,
                    boxShadow:"0 2px 10px rgba(0,0,0,0.1)",
                    whiteSpace:"nowrap"
                  }}>{s}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{background:"rgba(10,20,50,0.5)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:12,padding:"12px 24px",display:"inline-block",backdropFilter:"blur(8px)"}}>
              <div style={{color:"#fca5a5",fontSize:13,fontWeight:600}}>🔒 No state portals are active yet</div>
              <div style={{color:"rgba(226,232,240,0.6)",fontSize:12,marginTop:4}}>A Health Minister must unlock their state portal first</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// HEALTH MINISTER LOGIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
function HealthMinisterModal({ onClose, onLogin }) {
  const [form, setForm] = useState({ id:"", pass:"" });
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true); setErr("");
    try {
      const res = await api.login({ role: "minister", id: form.id.trim(), password: form.pass.trim() });
      api.setToken(res.token);
      onLogin(res.minister);
    } catch (e) {
      setErr(e.message || "Invalid Health Minister ID or Password. Access denied.");
      setLoading(false);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(3,7,18,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={onClose}>
      <div className="slide-in glass" style={{width:"100%",maxWidth:460,background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:20,padding:36,boxShadow:`0 40px 120px rgba(20,184,166,0.15)`}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:64,height:64,borderRadius:20,background:`linear-gradient(135deg,${C.teal}22,${C.blue}22)`,border:`1px solid ${C.teal}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 14px"}}>🏥</div>
          <h2 style={{fontSize:20,fontWeight:800,color:"#ffffff",marginBottom:6}}>Health Minister Portal</h2>
          <p style={{color:"rgba(226,232,240,0.75)",fontSize:13}}>Enter your credentials issued by the Central Admin to access your state portal</p>
        </div>
        <Input label="Health Minister ID" placeholder="Enter your minister ID" value={form.id} onChange={e=>setForm({...form,id:e.target.value})} />
        <Input label="Secret Password" type="password" placeholder="••••••••••" value={form.pass} onChange={e=>setForm({...form,pass:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handle()} />
        {err && <AlertBanner msg={err} type="danger" onClose={()=>setErr("")} />}
        <Btn style={{width:"100%",justifyContent:"center",marginBottom:12}} onClick={handle} disabled={loading}>
          {loading ? <Spinner /> : "🔓 Enter State Dashboard"}
        </Btn>
        <Btn variant="ghost" style={{width:"100%",justifyContent:"center"}} onClick={onClose}>Cancel</Btn>
        <div style={{marginTop:16,background:"#f8fafc",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#6b7280"}}>🔐 Credentials are issued by the Central Admin (Ministry of Health). Contact them if you haven't received yours.</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN LOGIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SuperAdminModal({ onClose, onLogin }) {
  const [form, setForm] = useState({ id:"", pass:"" });
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true); setErr("");
    try {
      const res = await api.login({ role: "superadmin", id: form.id.trim(), password: form.pass.trim() });
      api.setToken(res.token);
      onLogin();
    } catch (e) {
      setErr(e.message || "Invalid Super Admin credentials.");
      setLoading(false);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(3,7,18,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={onClose}>
      <div className="slide-in glass" style={{width:"100%",maxWidth:440,background:"#0d1117",border:`1px solid ${C.purple}44`,borderRadius:20,padding:36,boxShadow:`0 40px 120px rgba(168,85,247,0.15)`}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:64,height:64,borderRadius:20,background:`linear-gradient(135deg,${C.purple}22,${C.blue}22)`,border:`1px solid ${C.purple}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 14px"}}>🇮🇳</div>
          <h2 style={{fontSize:20,fontWeight:800,color:"#ffffff",marginBottom:6}}>Central Admin Portal</h2>
          <p style={{color:"rgba(226,232,240,0.75)",fontSize:13}}>Ministry of Health & Family Welfare — All India Oversight Dashboard</p>
        </div>

        <Input label="Admin ID" placeholder="SA-INDIA-2024" value={form.id} onChange={e=>setForm({...form,id:e.target.value})} />
        <Input label="Secret Password" type="password" placeholder="••••••••••" value={form.pass} onChange={e=>setForm({...form,pass:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handle()} />
        {err && <AlertBanner msg={err} type="danger" onClose={()=>setErr("")} />}

        <Btn style={{width:"100%",justifyContent:"center",marginBottom:12,background:`linear-gradient(135deg,${C.purple},#7c3aed)`}} onClick={handle} disabled={loading}>
          {loading ? <Spinner /> : "🔓 Access National Dashboard"}
        </Btn>
        <Btn variant="ghost" style={{width:"100%",justifyContent:"center"}} onClick={onClose}>Cancel</Btn>

        <div style={{marginTop:18,background:"#f8fafc",borderRadius:10,padding:"12px 16px",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#6b7280"}}>🔐 Central Admin access is restricted to authorized Ministry of Health personnel only.</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO CAPTURE COMPONENT (camera + file upload)
// ─────────────────────────────────────────────────────────────────────────────
function PhotoCapture({ photo, onPhoto }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const fileRef    = useRef(null);
  const streamRef  = useRef(null);
  const [mode, setMode]     = useState("idle"); // idle | starting | camera | preview
  const [camErr, setCamErr] = useState("");
  const [facing, setFacing] = useState("user");
  const [uploading, setUploading] = useState(false);

  const uploadToImgbb = async (base64Str) => {
    setUploading(true);
    setCamErr("");
    try {
      const b64Data = base64Str.split(",")[1];
      const formData = new FormData();
      formData.append("image", b64Data);
      
      const res = await fetch("https://api.imgbb.com/1/upload?key=98685507b4e42c037a6da3038040916f", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success && data.data && data.data.url) {
        onPhoto(data.data.url);
      } else {
        setCamErr("Failed to upload image to Cloud. Please try again.");
      }
    } catch(err) {
      setCamErr("Upload error: " + err.message);
    } finally {
      setUploading(false);
      setMode("preview");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; } };
  }, []);

  // Attach stream to video element whenever mode becomes "camera"
  useEffect(() => {
    if (mode === "camera" && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.play().catch(() => {});
    }
  }, [mode]);

  const startCamera = async (facingMode) => {
    const fm = facingMode || facing;
    setCamErr("");
    // Stop existing stream
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamErr("Camera not supported. Use Chrome/Safari over HTTPS, or upload a photo.");
      return;
    }
    setMode("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: fm, width:{ideal:1280}, height:{ideal:720} }, audio: false });
      streamRef.current = stream;
      setMode("camera"); // triggers useEffect above to set srcObject
    } catch(err) {
      setMode("idle");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCamErr("Camera permission denied. To fix: click the 🔒 lock icon in your browser's address bar → Site settings → Camera → Allow, then reload the page.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCamErr("No camera found on this device. Use 'Upload Photo' instead.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setCamErr("Camera is in use by another app. Close other apps using the camera, then try again.");
      } else if (err.name === "OverconstrainedError") {
        // Retry with minimal constraints
        try {
          const stream2 = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream2;
          setMode("camera");
        } catch(e2) { setCamErr("Could not access camera. Please upload a photo instead."); }
      } else if (err.name === "SecurityError") {
        setCamErr("Camera blocked by browser security settings. Ensure the page is served over HTTPS.");
      } else {
        setCamErr(`Camera error: ${err.message || err.name}. Try uploading a photo instead.`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current = null; }
    setMode("idle");
  };

  const capture = () => {
    const v = videoRef.current; const c = canvasRef.current;
    if (!v || !c) return;
    const size = Math.min(v.videoWidth || 640, v.videoHeight || 480);
    const startX = ((v.videoWidth || 640) - size) / 2;
    const startY = ((v.videoHeight || 480) - size) / 2;
    c.width = 256; c.height = 256;
    c.getContext("2d").drawImage(v, startX, startY, size, size, 0, 0, 256, 256);
    stopCamera();
    uploadToImgbb(c.toDataURL("image/jpeg", 0.8));
  };

  const flipCamera = () => {
    const nf = facing === "user" ? "environment" : "user";
    setFacing(nf); startCamera(nf);
  };

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { 
      const img = new Image();
      img.onload = () => {
        const c = canvasRef.current;
        if (!c) { uploadToImgbb(ev.target.result); return; }
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        c.width = 256; c.height = 256;
        c.getContext("2d").drawImage(img, startX, startY, size, size, 0, 0, 256, 256);
        uploadToImgbb(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const retake = () => { onPhoto(null); setCamErr(""); setMode("idle"); };

  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.2,marginBottom:10,textTransform:"uppercase"}}>Profile Photo (Optional)</div>

      {uploading && (
        <div style={{marginBottom:12,borderRadius:14,background:"#1e293b",minHeight:120,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{color:"#38bdf8",fontSize:13,fontWeight:700}}>☁️ Uploading to Secure Cloud...</div>
        </div>
      )}

      {/* Saved preview */}
      {photo && mode !== "camera" && !uploading && (
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12,padding:"12px 16px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12}}>
          <img src={photo} alt="profile" style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",border:`3px solid ${C.teal}`,flexShrink:0}} />
          <div>
            <div style={{fontSize:13,color:C.green,fontWeight:700,marginBottom:6}}>✓ Photo saved</div>
            <button onClick={retake} style={{background:"none",border:"1px solid #d1d5db",borderRadius:8,color:"#374151",cursor:"pointer",fontSize:12,padding:"5px 14px"}}>🔄 Change</button>
          </div>
        </div>
      )}

      {/* Starting spinner */}
      {mode === "starting" && (
        <div style={{marginBottom:12,borderRadius:14,background:"#1e293b",minHeight:120,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{color:"#94a3b8",fontSize:13}}>📷 Starting camera…</div>
        </div>
      )}

      {/* Live camera viewfinder */}
      {mode === "camera" && (
        <div style={{marginBottom:12,borderRadius:14,overflow:"hidden",border:`2px solid ${C.teal}`,position:"relative",background:"#1e293b",minHeight:200}}>
          <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",maxHeight:260,display:"block",objectFit:"cover"}} />
          <canvas ref={canvasRef} style={{display:"none"}} />
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.6))",padding:"16px 12px 12px",display:"flex",justifyContent:"center",gap:10}}>
            <button onClick={flipCamera} style={{background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,color:"#fff",cursor:"pointer",padding:"8px 14px",fontSize:12,fontWeight:600}}>🔄 Flip</button>
            <button onClick={capture} style={{background:`linear-gradient(135deg,${C.teal},${C.tealD})`,border:"none",borderRadius:10,color:"#fff",cursor:"pointer",padding:"10px 28px",fontSize:14,fontWeight:800,boxShadow:`0 4px 16px ${C.teal}55`}}>📸 Capture</button>
            <button onClick={stopCamera} style={{background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,color:"#fff",cursor:"pointer",padding:"8px 14px",fontSize:12,fontWeight:600}}>✕ Cancel</button>
          </div>
        </div>
      )}

      {/* Hidden canvas when not in camera mode */}
      {mode !== "camera" && mode !== "starting" && <canvas ref={canvasRef} style={{display:"none"}} />}

      {/* Error message */}
      {camErr && (
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"12px 14px",fontSize:12,color:"#dc2626",marginBottom:12,lineHeight:1.7}}>
          ⚠️ {camErr}
          <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>startCamera()} style={{background:"#ffffff",border:"1px solid #fca5a5",borderRadius:8,color:"#dc2626",cursor:"pointer",fontSize:11,padding:"5px 14px",fontWeight:600}}>🔄 Try Again</button>
            <button onClick={()=>{setCamErr(""); fileRef.current?.click();}} style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,color:"#2563eb",cursor:"pointer",fontSize:11,padding:"5px 14px",fontWeight:600}}>📁 Upload Instead</button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!photo && mode !== "camera" && mode !== "starting" && (
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>startCamera()}
            style={{flex:1,background:"#f0f9ff",border:"1px solid #7dd3fc",borderRadius:10,color:"#0369a1",cursor:"pointer",padding:"11px",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            📷 Camera
          </button>
          <button onClick={()=>fileRef.current?.click()}
            style={{flex:1,background:"#f8fafc",border:"1px solid #d1d5db",borderRadius:10,color:"#374151",cursor:"pointer",padding:"11px",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            🖼️ Upload Photo
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile} />
    </div>
  );
}

function SignupPage({ hospitals, unlockedStates, onSignup, onLogin, onBack }) {
  const [selectedState, setSelectedState] = useState("");
  const activeState = selectedState;
  const [step, setStep]   = useState(1);
  const [method, setMethod] = useState("");
  const [form, setForm]   = useState({
    name:"", email:"", phone:"", password:"", role:"", district:"", area:"", hospitalId:"",
    joinDate:new Date().toISOString().split("T")[0],
    dob:"", gender:"", bloodGroup:"", familyMale:1, familyFemale:0, regularCondition:""
  });
  const [photo, setPhoto] = useState(null);
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const stateDistricts = INDIA_DISTRICTS[activeState] || [];
  // Hospitals filtered by state and then by selected district
  const stateHospitals = hospitals.filter(h => h.state === activeState && h.active);
  const districtHospitals = form.district ? stateHospitals.filter(h => h.district === form.district) : stateHospitals;

  const [googleStep, setGoogleStep] = useState(false);
  const [googleInfo, setGoogleInfo] = useState({ name:"", email:"" });

  const handleMethod = (m) => { setMethod(m); setStep(2); };
  const handleGoogleSignIn = () => { setGoogleStep(true); setErr(""); };
  const handleStep2 = () => {
    if (method==="email" && (!form.name || !form.email || !form.password)) { setErr("All fields are required."); return; }
    if (method==="phone" && (!form.name || !form.phone || !form.password)) { setErr("All fields are required."); return; }
    const { level } = checkPasswordStrength(form.password);
    if (level === "weak") { setErr("Password is too weak. Add uppercase, numbers, and special characters."); return; }
    setErr(""); setStep(3);
  };
  const handleSubmit = async () => {
    if (!form.role) { setErr("Please select your role."); return; }
    if (!form.district) { setErr("Please select your district."); return; }
    if (!form.hospitalId) { setErr("Please select a hospital."); return; }
    setLoading(true); setErr("");
    try {
      const payload = {
        name: form.name,
        email: (form.email || `${form.phone.replace(/\D/g,"")}@healthwatch.in`).toLowerCase(),
        phone: form.phone || "",
        password: form.password || "google-oauth",
        role: form.role,
        state: activeState,
        district: form.district,
        area: form.area || form.district,
        hospitalId: form.hospitalId,
        photo: photo || null,
        dob: form.dob,
        gender: form.gender,
        familyMale: parseInt(form.familyMale) || 0,
        familyFemale: parseInt(form.familyFemale) || 0,
        regularCondition: form.regularCondition,
      };
      console.log("[Signup] Payload:", JSON.stringify(payload, null, 2));
      const res = await api.signup(payload);
      api.setToken(res.token);
      // Auto-login after signup — take user straight to their dashboard
      onLogin({ ...res.user, profileComplete: true });
    } catch(e) {
      setErr(e.message || "Could not create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${C.teal}15 1px,transparent 1px),linear-gradient(90deg,${C.teal}15 1px,transparent 1px)`,backgroundSize:"50px 50px",pointerEvents:"none"}} />
      <div className="slide-in" style={{width:"100%",maxWidth:480,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:36,marginBottom:8}}>💧</div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#0d1b2e",marginBottom:4}}>Create Account</h1>
          <p style={{color:"#374151",fontSize:13}}>HealthWatch India</p>
        </div>

        {/* ── State selector (always shown first) ── */}
        {!activeState && (
          <div style={{marginBottom:24}}>
            {unlockedStates.length === 0 ? (
              <div style={{background:"#fff",borderRadius:16,padding:32,textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
                <div style={{fontSize:40,marginBottom:12}}>🔒</div>
                <h2 style={{fontSize:18,fontWeight:800,color:"#0d1117",marginBottom:8}}>No Portals Active</h2>
                <p style={{color:"#6b7280",fontSize:14,lineHeight:1.6,marginBottom:20}}>No state health portals are open yet. A <strong>Health Minister</strong> must log in and unlock their state portal first.</p>
                <button onClick={onBack} style={{background:`linear-gradient(135deg,${C.teal},${C.tealD})`,color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer"}}>← Back to Home</button>
              </div>
            ) : (
              <div style={{background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px rgba(0,0,0,0.06)"}}>
                <div style={{fontSize:15,fontWeight:700,color:"#0d1117",marginBottom:6}}>🗺️ Select Your State</div>
                <p style={{color:"#6b7280",fontSize:13,marginBottom:20}}>The following state portals are currently active. Choose the state you belong to.</p>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {unlockedStates.map(s => (
                    <button key={s} onClick={() => setSelectedState(s)} style={{background:`${C.teal}11`,border:`1px solid ${C.teal}44`,borderRadius:12,padding:"14px 20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=`${C.teal}22`}
                      onMouseLeave={e=>e.currentTarget.style.background=`${C.teal}11`}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:20}}>🏥</span>
                        <div style={{textAlign:"left"}}>
                          <div style={{fontSize:14,fontWeight:700,color:"#0d1117"}}>{s}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>Portal Active · Registration Open</div>
                        </div>
                      </div>
                      <span style={{fontSize:16,color:C.teal}}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Once state selected, show state chip + step wizard ── */}
        {activeState && (
          <>
            {/* State chip */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,background:`${C.teal}11`,border:`1px solid ${C.teal}33`,borderRadius:10,padding:"10px 16px"}}>
              <span>📍</span>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>SELECTED STATE</div>
                <div style={{fontSize:14,fontWeight:700,color:C.teal}}>{activeState}</div>
              </div>
              <button onClick={()=>setSelectedState("")} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:12}}>← Change</button>
            </div>

            {/* Steps indicator */}
            <div style={{display:"flex",gap:8,marginBottom:28,justifyContent:"center"}}>
              {[1,2,3].map(s => (
                <div key={s} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:step>=s?`linear-gradient(135deg,${C.teal},${C.tealD})`:"rgba(14,165,233,0.08)",border:step>=s?"none":"1px solid #cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:step>=s?"#0d1117":"#64748b"}}>
                    {step>s?"✓":s}
                  </div>
                  {s<3 && <div style={{width:40,height:1,background:step>s?C.teal:"#d1d5db"}} />}
                </div>
              ))}
            </div>

        <Card>
          {err && <AlertBanner msg={err} type="danger" onClose={()=>setErr("")} />}


          {step===1 && (
            <div className="fade-in">
              <div style={{fontSize:16,fontWeight:700,color:"#0d1117",marginBottom:20}}>Choose sign-up method</div>

              {googleStep ? (
                /* ── Google: inline name + Gmail form ── */
                <div style={{background:`${C.bg3}`,border:`1px solid ${C.teal}44`,borderRadius:14,padding:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                    <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#0d1117"}}>Sign up with Google</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>Enter your Google account details</div>
                    </div>
                  </div>
                  <Input label="Full Name" placeholder="Your name" value={googleInfo.name} onChange={e=>setGoogleInfo(g=>({...g,name:e.target.value}))} />
                  <Input label="Gmail Address" type="email" placeholder="you@gmail.com" value={googleInfo.email} onChange={e=>setGoogleInfo(g=>({...g,email:e.target.value}))} />
                  <div style={{display:"flex",gap:8}}>
                    <Btn variant="ghost" onClick={()=>{setGoogleStep(false);setGoogleInfo({name:"",email:""});}} style={{flex:1,justifyContent:"center"}}>← Back</Btn>
                    <Btn style={{flex:2,justifyContent:"center"}} onClick={()=>{
                      if (!googleInfo.name||!googleInfo.email){setErr("Please enter your name and Gmail.");return;}
                      if (!googleInfo.email.toLowerCase().includes("@")){setErr("Please enter a valid email address.");return;}
                      setForm(f=>({...f,name:googleInfo.name,email:googleInfo.email}));
                      setMethod("google"); setGoogleStep(false); setStep(3);
                    }}>Continue →</Btn>
                  </div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <button onClick={handleGoogleSignIn}
                    style={{background:"#0d1117",border:"1px solid #dadce0",borderRadius:12,padding:"14px 18px",color:"#3c4043",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontSize:14,fontWeight:600,transition:"box-shadow 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
                    Continue with Google
                  </button>
                  {[{fn:()=>handleMethod("phone"),icon:"📱",label:"Sign up with Phone Number"},
                    {fn:()=>handleMethod("email"),icon:"✉️",label:"Sign up with Email"}
                  ].map(({fn,icon,label}) => (
                    <button key={label} onClick={fn} style={{background:"#f8fafc",border:"1px solid #cbd5e1",borderRadius:12,padding:"14px 18px",color:"#0d1117",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontSize:14,fontWeight:600,transition:"all 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=C.teal} onMouseLeave={e=>e.currentTarget.style.borderColor="#475569"}>
                      <span style={{fontSize:20}}>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step===2 && (
            <div className="fade-in">
              <div style={{fontSize:16,fontWeight:700,color:"#0d1117",marginBottom:20}}>{method==="phone"?"📱 Phone Sign Up":"✉️ Email Sign Up"}</div>
              <Input label="Full Name" placeholder="Your full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
              {method==="email" && <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />}
              {method==="phone" && <Input label="Phone Number" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />}
              <Input label="Create Password" type="password" placeholder="Min 8 chars, uppercase, number, symbol" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              <PasswordStrength password={form.password} />
              <div style={{display:"flex",gap:10}}>
                <Btn variant="ghost" onClick={()=>setStep(1)} style={{flex:1,justifyContent:"center"}}>← Back</Btn>
                <Btn onClick={handleStep2} style={{flex:1,justifyContent:"center"}}>Next →</Btn>
              </div>
            </div>
          )}

          {step===3 && (
            <div className="fade-in">
              <div style={{fontSize:16,fontWeight:700,color:"#0d1117",marginBottom:20}}>Role, Photo & Hospital</div>

              {/* Profile Photo */}
              <PhotoCapture photo={photo} onPhoto={setPhoto} />

              {/* Role */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.2,marginBottom:10,textTransform:"uppercase"}}>I am a</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[{r:"patient",icon:"🤒",label:"Patient"},{r:"doctor",icon:"👨‍⚕️",label:"Doctor"},{r:"helper",icon:"💊",label:"Helper\n(Nurse)"}].map(({r,icon,label}) => (
                    <button key={r} onClick={()=>setForm({...form,role:r})} style={{
                      background:form.role===r?`${C.teal}22`:"#0d1117",
                      border:`1px solid ${form.role===r?C.teal:"#475569"}`,
                      borderRadius:12,padding:"14px 8px",cursor:"pointer",
                      display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all 0.15s",
                    }}>
                      <span style={{fontSize:24}}>{icon}</span>
                      <span style={{fontSize:11,fontWeight:700,color:form.role===r?C.teal:C.textM,textAlign:"center",whiteSpace:"pre-line"}}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* State display */}
              <div style={{background:`${C.teal}11`,border:`1px solid ${C.teal}33`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13}}>📍</span>
                <div>
                  <div style={{fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>STATE (SET BY HEALTH MINISTER)</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.teal}}>{activeState}</div>
                </div>
              </div>

              {/* District dropdown */}
              <Select label="Select Your District" value={form.district} onChange={e=>setForm({...form,district:e.target.value,hospitalId:""})}>
                <option value="">Choose district...</option>
                {stateDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>

              {/* Hospital — filtered by district */}
              {form.district && (
                <Select label={`Hospital in ${form.district}`} value={form.hospitalId} onChange={e=>setForm({...form,hospitalId:e.target.value})}>
                  <option value="">Choose hospital...</option>
                  {districtHospitals.length === 0
                    ? <option disabled>No hospitals added yet in {form.district}</option>
                    : districtHospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)
                  }
                </Select>
              )}

              {form.role==="patient" && (
                <>
                  <Input label="Date of joining hospital" type="date" value={form.joinDate} onChange={e=>setForm({...form,joinDate:e.target.value})} />
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
                    <Input label="Date of Birth" type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})} />
                    <Select label="Gender" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
                    <Input label="Family (Male)" type="number" min="0" value={form.familyMale} onChange={e=>setForm({...form,familyMale:+e.target.value})} />
                    <Input label="Family (Female)" type="number" min="0" value={form.familyFemale} onChange={e=>setForm({...form,familyFemale:+e.target.value})} />
                  </div>
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.2,marginBottom:6,textTransform:"uppercase"}}>Regular Health Conditions</div>
                    <textarea value={form.regularCondition} onChange={e=>setForm({...form,regularCondition:e.target.value})} placeholder="e.g. Diabetes, Hypertension..." rows={2} style={{width:"100%",background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:10,padding:"11px 14px",color:"#0d1117",fontSize:14,resize:"vertical"}} />
                  </div>
                </>
              )}

              <Input label="Your Area / Locality" placeholder="e.g. Anna Nagar, Tambaram..." value={form.area} onChange={e=>setForm({...form,area:e.target.value})} />

              <div style={{display:"flex",gap:10,marginTop:8}}>
                <Btn variant="ghost" onClick={()=>setStep(method==="google"?1:2)} style={{flex:1,justifyContent:"center"}}>← Back</Btn>
                <Btn onClick={handleSubmit} style={{flex:1,justifyContent:"center"}} disabled={loading}>
                  {loading?<Spinner />:"Create Account ✓"}
                </Btn>
              </div>
            </div>
          )}
        </Card>
          </>
        )}

        <div style={{textAlign:"center",marginTop:16}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13}}>← Back to Home</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage({ users, onLogin, onBack, onSignup }) {
  const [form, setForm]   = useState({ email:"", phone:"", password:"", method:"email" });
  const [err, setErr]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handle = async () => {
    setLoading(true); setErr("");
    try {
      const res = await api.login({ email: form.email.trim(), password: form.password });
      api.setToken(res.token);
      onLogin(res.user);
    } catch (e) {
      setErr(e.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const [googleLoginStep, setGoogleLoginStep] = useState(false);
  const [googleLoginEmail, setGoogleLoginEmail] = useState("");

  const handleGoogleLogin = () => { setGoogleLoginStep(true); setErr(""); };

  return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${C.teal}15 1px,transparent 1px),linear-gradient(90deg,${C.teal}15 1px,transparent 1px)`,backgroundSize:"50px 50px",pointerEvents:"none"}} />

      <div className="slide-in" style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:40,marginBottom:8}}>💧</div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#0d1b2e",marginBottom:4}}>Welcome Back</h1>
          <p style={{color:"#374151",fontSize:13}}>HealthWatch India</p>
        </div>

        <Card>
          {err && <AlertBanner msg={err} type="danger" onClose={()=>setErr("")} />}

          {/* Google login */}
          {googleLoginStep ? (
            <div style={{background:"#f8fafc",border:`1px solid ${C.teal}44`,borderRadius:14,padding:18,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#0d1117"}}>Sign in with Google</div>
                  <div style={{fontSize:11,color:"#6b7280"}}>Enter your registered Gmail address</div>
                </div>
              </div>
              <Input label="Gmail Address" type="email" placeholder="you@gmail.com" value={googleLoginEmail} onChange={e=>setGoogleLoginEmail(e.target.value)} />
              <div style={{display:"flex",gap:8}}>
                <Btn variant="ghost" onClick={()=>{setGoogleLoginStep(false);setGoogleLoginEmail("");}} style={{flex:1,justifyContent:"center"}}>← Back</Btn>
                <Btn style={{flex:2,justifyContent:"center"}} onClick={async ()=>{
                  if (!googleLoginEmail.trim()) { setErr("Please enter your Gmail address."); return; }
                  setGoogleLoading(true); setErr("");
                  try {
                    const res = await api.login({ email: googleLoginEmail.trim().toLowerCase(), password: "google-oauth" });
                    api.setToken(res.token);
                    onLogin(res.user);
                  } catch(e) {
                    setErr(`No account found for ${googleLoginEmail}. Please sign up first.`);
                    setGoogleLoginStep(false); setGoogleLoginEmail("");
                  } finally { setGoogleLoading(false); }
                }}>Sign In →</Btn>
              </div>
            </div>
          ) : (
            <button onClick={handleGoogleLogin} style={{width:"100%",background:"#0d1117",border:"1px solid #dadce0",borderRadius:12,padding:"13px 18px",color:"#3c4043",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontSize:14,fontWeight:600,marginBottom:16,transition:"box-shadow 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
              Sign in with Google
            </button>
          )}

          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{flex:1,height:1,background:"#374151"}} />
            <span style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace"}}>OR</span>
            <div style={{flex:1,height:1,background:"#374151"}} />
          </div>

          {/* Method toggle */}
          <div style={{display:"flex",background:"#f8fafc",borderRadius:10,padding:4,marginBottom:20}}>
            {[{m:"email",label:"Email"},{m:"phone",label:"Phone"}].map(({m,label}) => (
              <button key={m} onClick={()=>setForm({...form,method:m})} style={{
                flex:1, padding:"7px", borderRadius:8, border:"none", cursor:"pointer",
                background: form.method===m?`linear-gradient(135deg,${C.teal},${C.tealD})`:"transparent",
                color: form.method===m?"#0d1117":"#64748b", fontSize:13, fontWeight:600,
                transition:"all 0.2s",
              }}>{label}</button>
            ))}
          </div>

          {form.method==="email"
            ? <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            : <Input label="Phone Number" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
          }
          <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handle()} />

          <Btn style={{width:"100%",justifyContent:"center",marginBottom:14}} onClick={handle} disabled={loading}>
            {loading ? <Spinner /> : "Sign In →"}
          </Btn>
          <div style={{textAlign:"center",fontSize:13,color:"#64748b"}}>
            Don't have an account? <button onClick={onSignup} style={{background:"none",border:"none",color:C.teal,cursor:"pointer",fontWeight:700}}>Sign up</button>
          </div>
        </Card>

        <div style={{textAlign:"center",marginTop:16}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13}}>← Back to Home</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT PROFILE SETUP
// ─────────────────────────────────────────────────────────────────────────────
function PatientProfileSetup({ user, hospitals, onComplete }) {
  const hospital = hospitals.find(h => h.id === user.hospitalId);
  const stateDistricts = INDIA_DISTRICTS[user.state] || [];
  const [form, setForm] = useState({ district: user.district || "", area:"", dob:"", familyMale:1, familyFemale:0, regularCondition:"" });
  const [photo, setPhoto] = useState(user.photo || null);
  const [err, setErr]   = useState("");

  const handle = () => {
    if (!form.district) { setErr("Please select your district."); return; }
    if (!form.area || !form.dob) { setErr("Area/Village and Date of Birth are required."); return; }
    onComplete({ ...user, ...form, photo: photo||user.photo||null, profileComplete:true });
  };

  const roleLabel = user.role === "doctor" ? "Doctor" : user.role === "helper" ? "Helper / Nurse" : "Patient";

  return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="slide-in" style={{width:"100%",maxWidth:560}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          {photo
            ? <img src={photo} alt="profile" style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:`3px solid ${C.teal}`,margin:"0 auto 12px",display:"block"}} />
            : <div style={{fontSize:36,marginBottom:8}}>👤</div>
          }
          <h1 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>Complete Your Profile</h1>
          <p style={{color:"#64748b",fontSize:13}}>
            <span style={{background:`${C.teal}22`,color:C.teal,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{roleLabel.toUpperCase()}</span>
            &nbsp;· This information helps provide better care. Asked only once.
          </p>
          {hospital && <p style={{color:C.teal,fontSize:12,marginTop:6}}>🏥 {hospital.name} · {user.state}</p>}
        </div>
        <Card>
          {err && <AlertBanner msg={err} type="danger" onClose={()=>setErr("")} />}

          {/* Profile Photo */}
          <PhotoCapture photo={photo} onPhoto={setPhoto} />

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{gridColumn:"1/-1"}}>
              <Select label="Your District" value={form.district} onChange={e=>setForm({...form,district:e.target.value})}>
                <option value="">Select your district in {user.state}...</option>
                {stateDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Input label="Your Area / Village / Locality" placeholder="e.g. Anna Nagar, Coimbatore" value={form.area} onChange={e=>setForm({...form,area:e.target.value})} />
            </div>
            <Input label="Date of Birth" type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})} />
            <div />
            <Input label="Family Members — Male" type="number" min="0" value={form.familyMale} onChange={e=>setForm({...form,familyMale:+e.target.value})} />
            <Input label="Family Members — Female" type="number" min="0" value={form.familyFemale} onChange={e=>setForm({...form,familyFemale:+e.target.value})} />
            <div style={{gridColumn:"1/-1"}}>
              <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.2,marginBottom:6,textTransform:"uppercase",color:"#475569"}}>Current regular health condition (being treated)</div>
              <textarea value={form.regularCondition} onChange={e=>setForm({...form,regularCondition:e.target.value})} placeholder="e.g. Diabetes, Hypertension, Asthma... or None" rows={3} style={{width:"100%",background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:10,padding:"11px 14px",color:"#0d1117",fontSize:14,resize:"vertical"}} />
            </div>
          </div>
          <Btn style={{width:"100%",justifyContent:"center",marginTop:8}} onClick={handle}>Save Profile & Continue →</Btn>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE VIEW  (used by Patient, Doctor, Helper dashboards)
// ─────────────────────────────────────────────────────────────────────────────
function ProfileView({ user, hospitals, onUpdateProfile }) {
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Details form state
  const [form, setForm] = useState({
    name: user.name || "",
    dob: user.dob || "",
    area: user.area || "",
    familyMale: user.familyMale || 0,
    familyFemale: user.familyFemale || 0,
    regularCondition: user.regularCondition || "",
    phone: user.phone || ""
  });

  const [photo, setPhoto] = useState(user.photo || "");
  const [previewSrc, setPreviewSrc] = useState(user.photo || "");
  const fileRef = useRef();
  const hospital = hospitals.find(h => h.id === user.hospitalId);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPreviewSrc(ev.target.result);
      setPhoto(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = async () => {
    setLoading(true);
    try {
      await onUpdateProfile({ photo });
      setEditingPhoto(false);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveDetails = async () => {
    setLoading(true);
    try {
      await onUpdateProfile(form);
      setEditingDetails(false);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const roleColor = user.role==="doctor" ? C.teal : user.role==="helper" ? C.green : C.blue;
  const roleLabel = user.role==="doctor" ? "Doctor" : user.role==="helper" ? "Helper / Nurse" : "Patient";

  const info = [
    { icon:"📧", label:"Email",          val: user.email  || "—" },
    { icon:"📱", label:"Phone",          val: user.phone  || "—", key: "phone" },
    { icon:"🎂", label:"Date of Birth",  val: user.dob    || "—", key: "dob", type: "date" },
    { icon:"🏥", label:"Hospital",       val: hospital?.name || "—" },
    { icon:"📍", label:"District",       val: user.district || "—" },
    { icon:"🏘️", label:"Area / Village", val: user.area   || "—", key: "area" },
    { icon:"👨‍👩‍👦", label:"Family (Male)",  val: user.familyMale   || "0", key: "familyMale", type: "number" },
    { icon:"👩",  label:"Family (Female)",val: user.familyFemale || "0", key: "familyFemale", type: "number" },
    { icon:"💊",  label:"Condition",     val: user.regularCondition || "None", key: "regularCondition", isTextarea: true },
    { icon:"📅",  label:"Joined",        val: user.joinDate ? new Date(user.joinDate).toLocaleDateString() : "—" },
  ];

  return (
    <div className="fade-in" style={{maxWidth:700, margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:4}}>My Profile</h1>
          <p style={{color:"#6b7280",fontSize:13}}>View and manage your personal information</p>
        </div>
        {!editingDetails && (
          <Btn size="sm" onClick={() => setEditingDetails(true)}>✏️ Edit Details</Btn>
        )}
      </div>

      {/* Profile Card */}
      <Card style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:28,flexWrap:"wrap"}}>

          {/* Photo area */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,minWidth:140}}>
            <div style={{position:"relative"}}>
              {previewSrc
                ? <img src={previewSrc} alt={user.name}
                    style={{width:120,height:120,borderRadius:"50%",objectFit:"cover",
                            border:`4px solid ${roleColor}`,boxShadow:`0 0 0 4px ${roleColor}22`}} />
                : <div style={{width:120,height:120,borderRadius:"50%",
                               background:`linear-gradient(135deg,${roleColor}22,${roleColor}44)`,
                               border:`4px solid ${roleColor}`,display:"flex",alignItems:"center",
                               justifyContent:"center",fontSize:48}}>
                    {user.role==="doctor"?"👨‍⚕️":user.role==="helper"?"💊":"🤒"}
                  </div>
              }
              {/* Edit badge */}
              <button onClick={()=>setEditingPhoto(true)} style={{
                position:"absolute",bottom:4,right:4,
                width:32,height:32,borderRadius:"50%",
                background:`linear-gradient(135deg,${C.teal},${C.tealD})`,
                border:"2px solid #fff",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,boxShadow:"0 2px 8px rgba(0,0,0,0.2)",
              }} title="Edit photo">✏️</button>
            </div>
            <span style={{background:`${roleColor}18`,color:roleColor,fontSize:11,
                          fontWeight:700,padding:"3px 12px",borderRadius:999,
                          fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>
              {roleLabel.toUpperCase()}
            </span>
          </div>

          {/* Name & key info */}
          <div style={{flex:1,minWidth:200}}>
            {editingDetails ? (
              <div style={{marginBottom:12}}>
                <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
            ) : (
              <h2 style={{fontSize:24,fontWeight:800,color:"#0d1117",marginBottom:4}}>{user.name}</h2>
            )}
            <div style={{fontSize:13,color:"#6b7280",marginBottom:12}}>
              {hospital?.name && <span>🏥 {hospital.name}</span>}
              {user.district && <span> · 📍 {user.district}</span>}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {user.email && (
                <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,
                             padding:"6px 14px",fontSize:12,color:"#0369a1",fontWeight:600}}>
                   ✉️ {user.email}
                </div>
              )}
              {!editingDetails && user.phone && (
                <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,
                             padding:"6px 14px",fontSize:12,color:"#15803d",fontWeight:600}}>
                  📱 {user.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo edit panel */}
        {editingPhoto && (
          <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid #e5e7eb"}}>
            <PhotoCapture photo={photo} onPhoto={(b64) => { setPhoto(b64); setPreviewSrc(b64); }} />
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap", marginTop: 12}}>
              <Btn onClick={savePhoto} disabled={loading || !photo}>
                {loading ? <Spinner /> : "✓ Save Photo"}
              </Btn>
              <Btn variant="ghost" onClick={()=>{setPreviewSrc(user.photo||"");setPhoto(user.photo||"");setEditingPhoto(false);}}>✕ Cancel</Btn>
            </div>
          </div>
        )}
      </Card>

      {/* Details grid */}
      <Card>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
           <h3 style={{fontSize:15,fontWeight:800,color:"#0d1117"}}>Personal Details</h3>
           {editingDetails && (
             <div style={{display:"flex", gap:8}}>
               <Btn size="sm" variant="ghost" onClick={() => { setEditingDetails(false); setForm({
                  name: user.name || "",
                  dob: user.dob || "",
                  area: user.area || "",
                  familyMale: user.familyMale || 0,
                  familyFemale: user.familyFemale || 0,
                  regularCondition: user.regularCondition || "",
                  phone: user.phone || ""
               }); }}>✕ Cancel</Btn>
               <Btn size="sm" onClick={saveDetails} disabled={loading}>
                 {loading ? <Spinner /> : "✓ Save Changes"}
               </Btn>
             </div>
           )}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {info.map(({icon,label,val,key,type,isTextarea}) => (
            <div key={label} style={{
              background:"#f8fafc",borderRadius:10,padding:"12px 16px",
              border:`1px solid ${editingDetails && key ? C.teal : "#e5e7eb"}`,
              gridColumn: isTextarea ? "1/-1" : "auto"
            }}>
              <div style={{fontSize:11,color:"#9ca3af",fontFamily:"'JetBrains Mono',monospace",
                           letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>{icon} {label}</div>
              
              {editingDetails && key ? (
                isTextarea ? (
                  <textarea 
                    value={form[key]} 
                    onChange={e => setForm({...form, [key]: e.target.value})}
                    style={{width:"100%",background:"transparent",border:"none",color:"#0d1117",fontSize:14,fontWeight:700,resize:"none"}}
                    rows={2}
                  />
                ) : (
                  <input 
                    type={type || "text"}
                    value={form[key]}
                    onChange={e => setForm({...form, [key]: type === "number" ? +e.target.value : e.target.value})}
                    style={{width:"100%",background:"transparent",border:"none",color:"#0d1117",fontSize:14,fontWeight:700}}
                  />
                )
              ) : (
                <div style={{fontSize:14,fontWeight:700,color:"#0d1117",wordBreak:"break-word"}}>{val}</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function PatientDashboard({ user, hospitals, symptoms, onSubmitSymptoms, onLogout, onUpdateProfile }) {
  const [view, setView]              = useState("home");
  const [currentUser, setCurrentUser] = useState(user);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [submitted, setSubmitted]    = useState(false);
  const [result, setResult]          = useState(null);
  const [outbreakAlert, setOutbreakAlert] = useState(null);
  const hospital = hospitals.find(h => h.id === currentUser.hospitalId);
  const mySymptoms = symptoms.filter(s => s.patientId === currentUser.id);

  const toggleSym = (s) => setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s]);

  const handleSubmit = () => {
    if (selectedSymptoms.length < 2) return;
    const disease = detectDisease(selectedSymptoms);
    const entry = {
      id: `SYM${Date.now()}`, patientId:currentUser.id, patientName:currentUser.name,
      hospitalId:currentUser.hospitalId, district:currentUser.district, area:currentUser.area,
      state:currentUser.state,
      selectedSymptoms, date:new Date().toISOString(),
      detectedDisease: disease, alertSent: false,
    };
    const updatedSymptoms = [...symptoms, entry];
    const outbreak = checkOutbreakAlert(updatedSymptoms, currentUser.hospitalId, currentUser.district);
    onSubmitSymptoms(entry);
    setResult(disease);
    setOutbreakAlert(outbreak);
    setSubmitted(true);
  };

  const handleProfileUpdate = async (data) => {
    try {
      const updated = await onUpdateProfile(data);
      setCurrentUser(updated);
    } catch(e) { console.error(e); }
  };

  const NAV = [
    {id:"home",    icon:"🏠", label:"Home"},
    {id:"symptoms",icon:"🩺", label:"Report Symptoms"},
    {id:"history", icon:"📋", label:"My History"},
    {id:"profile", icon:"👤", label:"My Profile"},
  ];

  return (
    <div style={{display:"flex",height:"100vh",background:"#f0f4f8",overflow:"hidden"}}>
      {/* Sidebar */}
      <aside style={{width:220,background:"#ffffff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0,boxShadow:"2px 0 8px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"20px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>💧</span>
          <div>
            <div style={{color:"#0d1117",fontWeight:800,fontSize:14}}>HealthWatch</div>
            <div style={{color:C.teal,fontSize:9,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5}}>PATIENT</div>
          </div>
        </div>
        {/* User mini card */}
        <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
          {currentUser.photo
            ? <img src={currentUser.photo} alt={currentUser.name} style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.teal}`,flexShrink:0}} />
            : <div style={{width:38,height:38,borderRadius:"50%",background:`${C.teal}22`,border:`2px solid ${C.teal}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🤒</div>
          }
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,color:"#0d1117",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser.name}</div>
            <div style={{fontSize:10,color:"#6b7280",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{hospital?.name || "—"}</div>
          </div>
        </div>
        <nav style={{flex:1,padding:"10px 8px"}}>
          {NAV.map(n => (
            <button key={n.id} onClick={()=>setView(n.id)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 10px",
              borderRadius:10,border:"none",cursor:"pointer",marginBottom:2,textAlign:"left",
              background: view===n.id?`${C.teal}15`:"transparent",
              color: view===n.id?C.tealD:"#374151",
              borderLeft: view===n.id?`2px solid ${C.teal}`:"2px solid transparent",
              transition:"all 0.15s", fontFamily:"'Sora',sans-serif",
            }}>
              <span style={{fontSize:15}}>{n.icon}</span>
              <span style={{fontSize:13,fontWeight:600,flex:1}}>{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 8px",borderTop:"1px solid #f1f5f9"}}>
          <button onClick={onLogout} style={{width:"100%",background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:12,padding:"6px 10px",textAlign:"left",borderRadius:8,fontFamily:"'Sora',sans-serif"}}>⏻ Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
        {view==="profile" && (
          <ProfileView user={currentUser} hospitals={hospitals} onUpdateProfile={handleProfileUpdate} />
        )}

        {(view==="home"||view==="symptoms") && (
          <div>
            {/* Welcome card */}
            <div style={{background:`linear-gradient(135deg,${C.teal}18,${C.blue}10)`,border:`1px solid ${C.teal}33`,borderRadius:16,padding:24,marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div>
                  <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>Hello, {currentUser.name}</h2>
                  <p style={{color:"#475569",fontSize:13}}>🏥 {hospital?.name || "Hospital"} · 📍 {currentUser.area}</p>
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  {[{label:"Reports submitted",val:mySymptoms.length},{label:"Family members",val:+currentUser.familyMale+ +currentUser.familyFemale}].map(({label,val}) => (
                    <div key={label} style={{background:"rgba(255,255,255,0.6)",borderRadius:10,padding:"10px 18px",textAlign:"center"}}>
                      <div style={{fontSize:22,fontWeight:800,color:C.teal}}>{val}</div>
                      <div style={{fontSize:11,color:"#475569"}}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Submission result */}
            {submitted && (
              <div className="slide-in" style={{marginBottom:24}}>
                {outbreakAlert && <AlertBanner msg={`🚨 OUTBREAK ALERT: ${outbreakAlert.count}+ patients in your area have reported symptoms matching ${outbreakAlert.disease}. District medical teams have been alerted.`} type="danger" />}
                {result
                  ? <AlertBanner msg={`⚕️ Based on your symptoms, this may indicate: ${result}. Please consult your doctor at ${hospital?.name} immediately.`} type="warning" />
                  : <AlertBanner msg="✅ Your symptoms have been recorded. Our doctors will review soon." type="info" />
                }
              </div>
            )}
            {/* Symptom form */}
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <h3 style={{fontSize:16,fontWeight:800,color:"#0d1117",marginBottom:2}}>Report Current Symptoms</h3>
                  <p style={{fontSize:12,color:"#64748b"}}>Select all symptoms you are experiencing right now</p>
                </div>
                <Tag color={C.teal}>{selectedSymptoms.length} selected</Tag>
              </div>
              {Object.entries(DISEASE_SYMPTOMS).map(([disease, syms]) => (
                <div key={disease} style={{marginBottom:16}}>
                  <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>{disease}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {syms.map(s => {
                      const sel = selectedSymptoms.includes(s);
                      return <button key={s} onClick={()=>toggleSym(s)} style={{padding:"6px 14px",borderRadius:999,fontSize:12,cursor:"pointer",fontWeight:600,border:`1px solid ${sel?C.teal:C.border2}`,background:sel?`${C.teal}22`:"#ffffff",color:sel?C.tealD:"#374151",transition:"all 0.15s"}}>{sel?"✓ ":""}{s}</button>;
                    })}
                  </div>
                </div>
              ))}
              <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #e5e7eb"}}>
                <Btn onClick={handleSubmit} disabled={selectedSymptoms.length < 2 || submitted} style={{marginRight:12}}>
                  {submitted ? "✓ Submitted" : "Submit Symptoms"}
                </Btn>
                {submitted && <Btn variant="ghost" onClick={()=>{setSubmitted(false);setSelectedSymptoms([]);setResult(null);setOutbreakAlert(null);}}>Report Again</Btn>}
                <span style={{fontSize:12,color:"#64748b",marginLeft:12}}>Select at least 2 symptoms</span>
              </div>
            </Card>
          </div>
        )}

        {view==="history" && (
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:20}}>My Symptom History</h1>
            {mySymptoms.length === 0
              ? <Card><div style={{textAlign:"center",padding:40,color:"#6b7280"}}>No symptom reports yet. Go to Report Symptoms to get started.</div></Card>
              : <Card>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {mySymptoms.slice().reverse().map(s => (
                      <div key={s.id} style={{background:"#f8fafc",borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",border:"1px solid #e5e7eb"}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#0d1117"}}>{s.detectedDisease || "Symptoms recorded"}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{new Date(s.date).toLocaleDateString()} · {s.selectedSymptoms.slice(0,3).join(", ")}{s.selectedSymptoms.length>3?` +${s.selectedSymptoms.length-3} more`:""}</div>
                        </div>
                        {s.alertSent && <Tag color={C.red}>Alert Sent</Tag>}
                      </div>
                    ))}
                  </div>
                </Card>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR / HELPER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DoctorDashboard({ user, hospitals, users, symptoms, alerts, onLogout, onResolveCase, onUpdateProfile }) {
  const [view, setView]             = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(user);
  const [selPatient, setSelPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [filterDisease, setFilterDisease] = useState("");
  const [patientSort, setPatientSort] = useState("symptoms_new");
  const hospital = hospitals.find(h => h.id === currentUser.hospitalId);
  const myPatients = users.filter(u => u.role==="patient" && u.hospitalId===currentUser.hospitalId);
  const mySymptoms = symptoms.filter(s => s.hospitalId===currentUser.hospitalId);
  const myAlerts   = alerts.filter(a => a.hospitalId===currentUser.hospitalId && a.active && !a.isResolved);
  const allAlerts  = alerts.filter(a => a.active && !a.isResolved);

  const filteredPatients = myPatients.filter(p => {
    const matchName = p.name?.toLowerCase().includes(patientSearch.toLowerCase());
    const matchArea = p.area?.toLowerCase().includes(patientSearch.toLowerCase());
    if (!matchName && !matchArea) return false;
    if (filterDisease) {
      const pSymptoms = symptoms.filter(s => s.patientId === p.id);
      return pSymptoms.some(s => s.detectedDisease === filterDisease);
    }
    return true;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (patientSort === "name_asc") return (a.name || "").localeCompare(b.name || "");
    if (patientSort === "name_desc") return (b.name || "").localeCompare(a.name || "");
    const aSymps = symptoms.filter(s => s.patientId === a.id);
    const bSymps = symptoms.filter(s => s.patientId === b.id);
    const aDate = aSymps.length > 0 ? new Date(aSymps[aSymps.length - 1].date).getTime() : 0;
    const bDate = bSymps.length > 0 ? new Date(bSymps[bSymps.length - 1].date).getTime() : 0;
    return patientSort === "symptoms_new" ? bDate - aDate : aDate - bDate;
  });

  const todaySymptoms = mySymptoms.filter(s => new Date(s.date).toDateString()===new Date().toDateString());
  const diseaseCount = {};
  mySymptoms.forEach(s => { if(s.detectedDisease) diseaseCount[s.detectedDisease] = (diseaseCount[s.detectedDisease]||0)+1; });
  const pieData = Object.entries(diseaseCount).map(([name,value],i) => ({name,value,color:["#14b8a6","#3b82f6","#ef4444","#f97316","#8b5cf6","#eab308"][i%6]}));

  const handleProfileUpdate = async (data) => {
    try {
      const updated = await onUpdateProfile(data);
      setCurrentUser(updated);
    } catch(e) { console.error(e); }
  };

  const NAV = [{id:"dashboard",icon:"⬡",label:"Dashboard"},{id:"patients",icon:"👥",label:"Patients"},{id:"alerts",icon:"🚨",label:"District Alerts",badge:allAlerts.length},{id:"profile",icon:"👤",label:"My Profile"}];

  return (
    <div style={{display:"flex",height:"100vh",background:"#f0f4f8",overflow:"hidden"}}>
      {/* Sidebar */}
      <aside style={{width:220,background:"#ffffff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0,boxShadow:"2px 0 8px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"20px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24}}>💧</span>
          <div>
            <div style={{color:"#0d1117",fontWeight:800,fontSize:14}}>HealthWatch</div>
            <div style={{color:C.teal,fontSize:9,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5}}>{currentUser.role.toUpperCase()}</div>
          </div>
        </div>
        {/* User photo mini card */}
        <div style={{padding:"14px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
          {currentUser.photo
            ? <img src={currentUser.photo} alt={currentUser.name} style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.teal}`,flexShrink:0}} />
            : <div style={{width:38,height:38,borderRadius:"50%",background:`${C.teal}18`,border:`2px solid ${C.teal}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{currentUser.role==="doctor"?"👨‍⚕️":"💊"}</div>
          }
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,color:"#0d1117",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name}</div>
            <div style={{fontSize:10,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hospital?.name || "—"}</div>
          </div>
        </div>
        <nav style={{flex:1,padding:"10px 8px"}}>
          {NAV.map(n => (
            <button key={n.id} onClick={()=>{setView(n.id);setSelPatient(null);}} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 10px",
              borderRadius:10,border:"none",cursor:"pointer",marginBottom:2,textAlign:"left",
              background: view===n.id?`${C.teal}15`:"transparent",
              color: view===n.id?C.tealD:"#374151",
              borderLeft: view===n.id?`2px solid ${C.teal}`:"2px solid transparent",
              transition:"all 0.15s", fontFamily:"'Sora',sans-serif",
            }}>
              <span style={{fontSize:15}}>{n.icon}</span>
              <span style={{fontSize:13,fontWeight:600,flex:1}}>{n.label}</span>
              {n.badge>0 && <span style={{background:C.red,color:"#fff",borderRadius:999,fontSize:10,padding:"1px 6px",fontWeight:700}}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 8px",borderTop:"1px solid #f1f5f9"}}>
          <button onClick={onLogout} style={{width:"100%",background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:12,padding:"6px 10px",textAlign:"left",borderRadius:8,fontFamily:"'Sora',sans-serif"}}>⏻ Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        {/* Top bar */}
        <div style={{background:"#ffffff",borderBottom:"1px solid #e5e7eb",padding:"0 32px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0d1117"}}>
            {view==="dashboard"&&"Dashboard"}{view==="patients"&&"Patients"}{view==="alerts"&&"District Alerts"}{view==="profile"&&"My Profile"}
          </div>
          <NotificationBell alerts={alerts} symptoms={mySymptoms} hospitals={hospitals} />
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>

        {/* ── Profile ── */}
        {view==="profile" && (
          <ProfileView user={currentUser} hospitals={hospitals} onUpdateProfile={handleProfileUpdate} />
        )}

        {/* ── Dashboard ── */}
        {view==="dashboard" && (
          <div className="fade-in">
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:4}}>Welcome, Dr. {user.name}</h1>
              <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>🏥 {hospital?.name} · {hospital?.district}, {hospital?.state}</p>
            </div>

            {/* Active alerts at top */}
            {myAlerts.filter(a => !a.isResolved).length > 0 && (
              <div style={{marginBottom:20}}>
                {myAlerts.filter(a => !a.isResolved).map(a => (
                  <AlertBanner key={a.id} msg={`🚨 OUTBREAK ALERT: ${a.disease} spreading in ${a.area} — ${a.patientCount} cases reported in last 7 days. Immediate response required.`} type="danger" />
                ))}
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
              {[
                {label:"My Patients",val:myPatients.length,color:C.teal},
                {label:"Today's Reports",val:todaySymptoms.filter(s=>!s.isResolved).length,color:C.blue},
                {label:"Active Alerts",val:myAlerts.filter(a=>!a.isResolved).length,color:C.red},
                {label:"Active Reports",val:mySymptoms.filter(s=>!s.isResolved).length,color:C.purple},
              ].map(({label,val,color}) => (
                <div key={label} style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px"}}>
                  <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{label}</div>
                  <div style={{fontSize:32,fontWeight:800,color}}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              {/* Disease breakdown */}
              <Card>
                <div style={{fontSize:12,fontWeight:700,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:16,textTransform:"uppercase"}}>Disease Reports</div>
                {pieData.length===0 ? <p style={{color:"#64748b",fontSize:13}}>No reports yet.</p> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                        {pieData.map((d,i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:8,color:"#374151",fontSize:12}} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
                  {pieData.map(d => (
                    <span key={d.name} style={{fontSize:11,color:"#475569",display:"flex",alignItems:"center",gap:4}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:d.color,display:"inline-block"}} />{d.name}: {d.value}
                    </span>
                  ))}
                </div>
              </Card>

              {/* Recent patient reports */}
              <Card>
                <div style={{fontSize:12,fontWeight:700,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:16,textTransform:"uppercase"}}>Recent Patient Reports</div>
                {mySymptoms.length===0 ? <p style={{color:"#64748b",fontSize:13}}>No reports yet.</p> :
                  mySymptoms.slice(-5).reverse().map(s => (
                    <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#0d1117"}}>{s.patientName || s.patient?.name || "Patient"}</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{s.detectedDisease || "Unclassified"} · {s.area || s.district}</div>
                      </div>
                      {s.alertSent && <Tag color={C.red}>Alert</Tag>}
                    </div>
                  ))
                }
              </Card>
            </div>
          </div>
        )}

        {/* ── Patients ── */}
        {view==="patients" && !selPatient && (
          <div className="fade-in">
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>My Patients</h2>
              <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{myPatients.length} REGISTERED PATIENTS</p>
            </div>

            {/* Search + Filter bar */}
            <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:220,position:"relative"}}>
                <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#64748b"}}>🔍</span>
                <input
                  placeholder="Search by name or area..."
                  value={patientSearch}
                  onChange={e=>setPatientSearch(e.target.value)}
                  style={{width:"100%",background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:10,padding:"10px 14px 10px 36px",color:"#0d1117",fontSize:13}}
                />
              </div>
              <select
                value={filterDisease}
                onChange={e=>setFilterDisease(e.target.value)}
                style={{background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:10,padding:"10px 14px",color:filterDisease?C.orange:C.textD,fontSize:13,minWidth:180}}
              >
                <option value="">All Diseases</option>
                {Object.keys(DISEASE_SYMPTOMS).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={patientSort}
                onChange={e=>setPatientSort(e.target.value)}
                style={{background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:10,padding:"10px 14px",color:"#0d1117",fontSize:13,minWidth:160}}
              >
                <option value="symptoms_new">Symptoms: Newest</option>
                <option value="symptoms_old">Symptoms: Oldest</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
              {(patientSearch||filterDisease||patientSort!=="symptoms_new") && (
                <Btn variant="ghost" size="sm" onClick={()=>{setPatientSearch("");setFilterDisease("");setPatientSort("symptoms_new");}}>✕ Clear</Btn>
              )}
            </div>

            {/* Result count */}
            {(patientSearch||filterDisease) && (
              <p style={{color:"#64748b",fontSize:12,marginBottom:12,fontFamily:"'JetBrains Mono',monospace"}}>
                SHOWING {filteredPatients.length} OF {myPatients.length} PATIENTS
              </p>
            )}

            {filteredPatients.length===0 ? (
              <Card style={{textAlign:"center",padding:48}}>
                <div style={{fontSize:40,marginBottom:12}}>🔍</div>
                <p style={{color:"#64748b"}}>{myPatients.length===0?"No patients registered yet.":"No patients match your search."}</p>
              </Card>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
                {sortedPatients.map(p => {
                  const pSymptoms = symptoms.filter(s=>s.patientId===p.id);
                  const lastReport = pSymptoms.slice(-1)[0];
                  const hasAlert = alerts.some(a => a.area?.toLowerCase()===p.area?.toLowerCase() && a.hospitalId===p.hospitalId && a.active);
                  return (
                    <div key={p.id} className="card-lift" onClick={()=>setSelPatient(p)} style={{
                      background:"#0d1117",border:`1px solid ${hasAlert?"rgba(239,68,68,0.4)":C.border}`,
                      borderRadius:14,padding:18,cursor:"pointer",transition:"all 0.2s",
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:"#0d1117",display:"flex",alignItems:"center",gap:6}}>
                            {p.name}
                            {hasAlert && <span style={{fontSize:10,background:`${C.red}22`,color:C.red,borderRadius:999,padding:"1px 7px",fontWeight:700}}>⚠ ALERT</span>}
                          </div>
                          <div style={{fontSize:11,color:"#6b7280"}}>📍 {p.area}</div>
                        </div>
                        <div style={{width:36,height:36,borderRadius:"50%",background:`${C.teal}22`,border:`1px solid ${C.teal}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:C.teal}}>
                          {p.name?.[0]}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                        {p.dob && <Tag color={C.blue}>{new Date().getFullYear()-new Date(p.dob).getFullYear()} yrs</Tag>}
                        <Tag color={C.purple}>Family: {(+p.familyMale)+(+p.familyFemale)}</Tag>
                        <Tag color={C.teal}>{pSymptoms.length} report{pSymptoms.length!==1?"s":""}</Tag>
                      </div>
                      {lastReport && (
                        <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#475569"}}>
                          Last: <span style={{color:lastReport.detectedDisease?C.orange:C.textM}}>{lastReport.detectedDisease||"Unclassified"}</span>
                          <span style={{color:"#64748b"}}> · {new Date(lastReport.date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Patient Detail ── */}
        {view==="patients" && selPatient && (
          <div className="fade-in">
            <button onClick={()=>setSelPatient(null)} style={{background:"none",border:"none",color:C.teal,cursor:"pointer",fontSize:13,marginBottom:20,display:"flex",alignItems:"center",gap:4}}>← Back to Patients</button>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
              {/* Patient info */}
              <Card>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
                  <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${C.teal},${C.tealD})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#0d1117"}}>
                    {selPatient.name?.[0]}
                  </div>
                  <div>
                    <div style={{fontSize:18,fontWeight:800,color:"#0d1117"}}>{selPatient.name}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>Patient · {hospital?.name}</div>
                  </div>
                </div>
                {[
                  {k:"Area / Location", v:selPatient.area},
                  {k:"Date of Birth",   v:selPatient.dob ? new Date(selPatient.dob).toLocaleDateString() : "—"},
                  {k:"Age",             v:selPatient.dob ? `${new Date().getFullYear()-new Date(selPatient.dob).getFullYear()} years` : "—"},
                  {k:"Family (Male)",   v:selPatient.familyMale},
                  {k:"Family (Female)", v:selPatient.familyFemale},
                  {k:"Regular Condition", v:selPatient.regularCondition || "None"},
                  {k:"Joined Hospital", v:selPatient.joinDate},
                ].map(({k,v}) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                    <span style={{fontSize:12,color:"#64748b",fontFamily:"'JetBrains Mono',monospace"}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#0d1117"}}>{v}</span>
                  </div>
                ))}
              </Card>

              {/* Map placeholder with location pin */}
              <Card style={{display:"flex",flexDirection:"column"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>Patient Location</div>
                <div style={{flex:1,background:"#f0f9ff",borderRadius:10,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:200,position:"relative",overflow:"hidden"}}>
                  {/* Grid lines */}
                  <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.teal}10 1px,transparent 1px),linear-gradient(90deg,${C.teal}10 1px,transparent 1px)`,backgroundSize:"30px 30px"}} />
                  <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
                    <div style={{fontSize:40,marginBottom:8}}>📍</div>
                    <div style={{fontSize:16,fontWeight:800,color:C.teal}}>{selPatient.area}</div>
                    <div style={{fontSize:12,color:"#475569",marginTop:4}}>{hospital?.district}, {hospital?.state}</div>
                    <div style={{marginTop:12,background:`${C.teal}22`,border:`1px solid ${C.teal}44`,borderRadius:8,padding:"6px 16px",fontSize:11,color:C.teal,fontFamily:"'JetBrains Mono',monospace"}}>
                      📡 LOCATION TRACKED
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Symptom history */}
            <Card>
              <div style={{fontSize:13,fontWeight:800,color:"#0d1117",marginBottom:16}}>Symptom Report History</div>
              {symptoms.filter(s=>s.patientId===selPatient.id).length===0 ? (
                <p style={{color:"#64748b",fontSize:13}}>No reports submitted yet.</p>
              ) : symptoms.filter(s=>s.patientId===selPatient.id).slice().reverse().map(s => {
                const isResolved = s.isResolved;
                return (
                  <div key={s.id} style={{background:isResolved?`${C.green}0a`:C.bg3,border:`1px solid ${isResolved?C.green+"44":C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:isResolved?C.green:s.detectedDisease?C.orange:C.textM}}>
                          {isResolved?"✅ ":""}{s.detectedDisease || "No specific disease detected"}
                        </div>
                        <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace"}}>
                          {new Date(s.date).toLocaleString()}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                        {s.alertSent && <Tag color={C.red}>⚠️ Alert</Tag>}
                        {isResolved
                          ? <Tag color={C.green}>✓ Resolved</Tag>
                          : s.detectedDisease && (
                            <Btn size="sm" variant="ghost" onClick={()=>onResolveCase(s.id)}
                              style={{fontSize:11,color:C.green,borderColor:`${C.green}44`}}>
                              ✓ Mark Resolved
                            </Btn>
                          )
                        }
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {s.selectedSymptoms.map(sym => <Tag key={sym} color={C.blue}>{sym}</Tag>)}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* ── District Alerts ── */}
        {view==="alerts" && (
          <div className="fade-in">
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>District Outbreak Alerts</h2>
              <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>REAL-TIME ALERTS FROM ALL HOSPITALS IN THE DISTRICT</p>
            </div>
            {allAlerts.length===0 ? (
              <Card style={{textAlign:"center",padding:48}}>
                <div style={{fontSize:48,marginBottom:12}}>✅</div>
                <div style={{fontSize:18,fontWeight:700,color:C.green}}>No active outbreak alerts</div>
                <p style={{color:"#64748b",marginTop:4}}>All areas within safe thresholds</p>
              </Card>
            ) : allAlerts.map(a => {
              // Use precise entries tied to this alert from backend
              const liveEntries = getPatientEntriesForAlert(a.entries, symptoms);
              return (
                <div key={a.id} style={{
                  background:"#0d0505",border:"1px solid rgba(239,68,68,0.35)",
                  borderLeft:"4px solid #ef4444",borderRadius:16,marginBottom:20,overflow:"hidden",
                }}>
                  {/* Alert header */}
                  <div style={{background:"#450a0a",padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                        <span style={{width:10,height:10,borderRadius:"50%",background:C.red,display:"inline-block",animation:"pulse 1.5s infinite"}} />
                        <span style={{color:C.red,fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:1.5}}>OUTBREAK ALERT</span>
                        <span style={{background:"#ef444422",color:"#dc2626",border:"1px solid #ef444444",borderRadius:999,padding:"1px 10px",fontSize:11,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>
                          {liveEntries.length} PATIENTS
                        </span>
                      </div>
                      <div style={{fontSize:20,fontWeight:800,color:"#dc2626",marginBottom:4}}>🦠 {a.disease}</div>
                      <div style={{display:"flex",gap:16,fontSize:12,color:"#64748b",flexWrap:"wrap"}}>
                        <span>📍 Area: <strong style={{color:"#dc2626"}}>{a.area}</strong></span>
                        <span>🏥 {hospitals.find(h=>h.id===a.hospitalId)?.name}</span>
                        <span>📅 First detected: {new Date(a.date).toLocaleDateString()}</span>
                        {a.lastUpdated && a.lastUpdated!==a.date && <span>🔄 Updated: {new Date(a.lastUpdated).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                      <div style={{background:"#ef444422",border:"1px solid #ef444444",borderRadius:12,padding:"12px 20px",textAlign:"center"}}>
                        <div style={{fontSize:36,fontWeight:800,color:"#ef4444"}}>{liveEntries.length}</div>
                        <div style={{fontSize:10,color:"#dc2626",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>CONFIRMED CASES</div>
                      </div>
                      <Btn size="sm" variant="ghost" onClick={()=>exportAlertPDF(a, liveEntries, hospitals, users)}
                        style={{fontSize:11,borderColor:`${C.teal}44`,color:C.teal}}>
                        📄 Export PDF
                      </Btn>
                    </div>
                  </div>

                  {/* Patient list with full details */}
                  <div style={{padding:"16px 22px"}}>
                    <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>
                      Patient Records — {liveEntries.length} patient{liveEntries.length!==1?"s":""} with predicted {a.disease}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {liveEntries.map((entry, idx) => {
                        const patientUser = users.find(u => u.id === entry.patientId);
                        return (
                          <div key={entry.id} style={{
                            background:"#0d1117", border:`1px solid ${C.border}`,
                            borderRadius:12, padding:"14px 16px",
                          }}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.red}44,${C.orange}44)`,border:`1px solid ${C.red}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#ef4444",flexShrink:0}}>
                                  {idx+1}
                                </div>
                                <div>
                                  <div style={{fontSize:14,fontWeight:700,color:"#ffffff"}}>{patientUser?.name || entry.patientName || entry.patient?.name || "Unknown Patient"}</div>
                                  <div style={{fontSize:11,color:"#94a3b8"}}>
                                    📍 {entry.area || "General Area"}
                                    {patientUser?.dob && ` · Age: ${new Date().getFullYear()-new Date(patientUser.dob).getFullYear()}`}
                                    {patientUser && ` · Family: ${(+patientUser.familyMale||0)+(+patientUser.familyFemale||0)} members`}
                                  </div>
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{background:`${C.orange}22`,border:`1px solid ${C.orange}44`,borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:800,color:C.orange,marginBottom:3}}>
                                  ⚕️ {entry.detectedDisease}
                                </div>
                                <div style={{fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace"}}>
                                  {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
                                </div>
                              </div>
                            </div>

                            {/* Symptoms selected by this patient */}
                            <div>
                              <div style={{fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:6}}>SYMPTOMS REPORTED ({entry.selectedSymptoms.length})</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {entry.selectedSymptoms.map(sym => {
                                  // Highlight symptoms that directly match the detected disease
                                  const isMatchingDisease = DISEASE_SYMPTOMS[entry.detectedDisease]?.includes(sym);
                                  return (
                                    <span key={sym} style={{
                                      background: isMatchingDisease?`${C.red}18`:`${C.bg3}`,
                                      border: `1px solid ${isMatchingDisease?C.red+"55":C.border}`,
                                      color: isMatchingDisease?"#dc2626":C.textM,
                                      borderRadius:999, padding:"3px 10px", fontSize:11, fontWeight:600,
                                    }}>{sym}</span>
                                  );
                                })}
                              </div>
                            </div>

                            {patientUser?.regularCondition && patientUser.regularCondition!=="None" && (
                              <div style={{marginTop:8,fontSize:11,color:"#6b7280"}}>
                                <span style={{fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5}}>PRE-EXISTING: </span>
                                <span style={{color:"#475569"}}>{patientUser.regularCondition}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>{/* end inner scroll */}
      </div>{/* end main column */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH MINISTER DASHBOARD  (state-scoped, full control)
// ─────────────────────────────────────────────────────────────────────────────
function HealthMinisterDashboard({ minister, appState, onAddHospital, onRemoveHospital, onToggleHospital, onUnlockPortal, onLockPortal, onMarkAlertViewed, onLogout }) {
  const [view, setView] = useState("overview");
  const [showAddHosp, setShowAddHosp] = useState(false);
  const [newHosp, setNewHosp] = useState({ name:"", district:"", address:"", phone:"", beds:100 });
  const [err, setErr] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);

  const { state, name: minName } = minister;
  const { hospitals, users, symptoms, alerts } = appState;

  // Everything scoped to this minister's state (robust case-insensitive check)
  const sLower = state?.trim().toLowerCase();
  const stateHospitals  = hospitals.filter(h => h.state?.trim().toLowerCase() === sLower);
  const stateUsers      = users.filter(u => u.state?.trim().toLowerCase() === sLower);
  const stateSymptoms   = symptoms.filter(s => stateUsers.some(u => u.id === s.patientId));
  const stateAlertsAll     = alerts.filter(a => a.state?.trim().toLowerCase() === sLower);
  const stateAlerts        = stateAlertsAll.filter(a => !a.isResolved);
  const resolvedAlerts     = stateAlertsAll.filter(a => a.isResolved);
  
  // Find key in INDIA_DISTRICTS that matches (case-insensitive)
  const districtsKey    = Object.keys(INDIA_DISTRICTS).find(k => k.trim().toLowerCase() === sLower) || state;
  const stateDistricts  = INDIA_DISTRICTS[districtsKey] || [];
  const statePortalActive = appState.statePortals?.[districtsKey] || false;
  const [selProfile, setSelProfile] = useState(null);

  const statePatients = stateUsers.filter(u => u.role==="patient");
  const stateDoctors  = stateUsers.filter(u => u.role==="doctor");
  const stateHelpers  = stateUsers.filter(u => u.role==="helper");

  // Mark alerts as viewed when opening the alerts tab
  useEffect(() => {
    if (view === "alerts" && stateAlerts.length > 0) {
      stateAlerts.forEach(a => {
        if (!a.isViewedByAdmin) {
          onMarkAlertViewed(a.id);
        }
      });
    }
  }, [view, stateAlerts.length, onMarkAlertViewed]);

  const handleAddHosp = () => {
    if (!newHosp.name || !newHosp.district) { setErr("Hospital name and district are required."); return; }
    onAddHospital({
      ...newHosp, id:`H${Date.now()}`, state, active:true, beds:+newHosp.beds,
    });
    setShowAddHosp(false);
    setNewHosp({ name:"", district:"", address:"", phone:"", beds:100 });
    setErr("");
  };

  const NAV = [
    {id:"overview",  icon:"⬡",  label:"Overview"},
    {id:"hospitals", icon:"🏥", label:"Hospitals"},
    {id:"doctors",   icon:"👨‍⚕️", label:"Doctors"},
    {id:"helpers",   icon:"💊", label:"Helpers"},
    {id:"patients",  icon:"🤒", label:"Patients"},
    {id:"alerts",    icon:"🚨", label:"Active Alerts", badge:stateAlerts.filter(a=>!a.isViewedByAdmin).length},
    {id:"inbox",     icon:"📥", label:"Inbox",  badge:resolvedAlerts.filter(a=>!a.isViewedByAdmin).length},
    {id:"profile",   icon:"👤", label:"My Profile"},
  ];

  return (
    <div style={{display:"flex",height:"100vh",background:"#f0f4f8",overflow:"hidden"}}>
      {/* Sidebar */}
      <aside style={{width:230,background:"#ffffff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0,boxShadow:"2px 0 8px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"18px 16px 12px",borderBottom:"1px solid #f1f5f9"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${C.teal}22,${C.blue}18)`,border:`1px solid ${C.teal}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏥</div>
            <div>
              <div style={{color:"#0d1117",fontWeight:800,fontSize:13}}>{minName}</div>
              <div style={{color:C.teal,fontSize:9,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.2}}>HEALTH MINISTER</div>
            </div>
          </div>
          <div style={{background:`${C.teal}12`,border:`1px solid ${C.teal}33`,borderRadius:8,padding:"5px 10px",fontSize:11,color:C.tealD,fontFamily:"'JetBrains Mono',monospace",marginBottom:6,fontWeight:600}}>
            📍 {state}
          </div>
          <div style={{
            background: statePortalActive?"#f0fdf4":"#fef2f2",
            border:`1px solid ${statePortalActive?"#bbf7d0":"#fecaca"}`,
            borderRadius:8, padding:"5px 10px", fontSize:10,
            color:statePortalActive?"#16a34a":"#dc2626",
            fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
          }}>
            {statePortalActive?"✅ PORTAL ACTIVE":"🔒 PORTAL LOCKED"}
          </div>
        </div>
        <nav style={{flex:1,padding:"10px 8px",overflowY:"auto"}}>
          {NAV.map(n => (
            <button key={n.id} onClick={()=>setView(n.id)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 10px",
              borderRadius:10,border:"none",cursor:"pointer",marginBottom:2,textAlign:"left",
              background:view===n.id?`${C.teal}15`:"transparent",
              color:view===n.id?C.tealD:"#374151",
              borderLeft:view===n.id?`2px solid ${C.teal}`:"2px solid transparent",
              transition:"all 0.15s", fontFamily:"'Sora',sans-serif",
            }}>
              <span style={{fontSize:14}}>{n.icon}</span>
              <span style={{fontSize:13,fontWeight:600,flex:1}}>{n.label}</span>
              {n.badge>0 && <span style={{background:C.red,color:"#fff",borderRadius:999,fontSize:10,padding:"1px 6px",fontWeight:700}}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1px solid #f1f5f9"}}>
          <button onClick={statePortalActive ? onLockPortal : onUnlockPortal} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${statePortalActive?"#fecaca":"#bbf7d0"}`,background:statePortalActive?"#fef2f2":"#f0fdf4",color:statePortalActive?"#dc2626":"#16a34a",cursor:"pointer",fontSize:12,fontWeight:700,marginBottom:6,fontFamily:"'Sora',sans-serif"}}>
            {statePortalActive ? "🔒 Lock Portal" : "🔓 Activate Portal"}
          </button>
          <button onClick={onLogout} style={{width:"100%",background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:12,padding:"6px 10px",textAlign:"left",borderRadius:8,fontFamily:"'Sora',sans-serif"}}>⏻ Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{background:"#ffffff",borderBottom:"1px solid #e5e7eb",padding:"0 32px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0d1117"}}>
            {state} Health Portal &nbsp;·&nbsp; <span style={{color:C.tealD}}>{stateHospitals.length} hospitals · {statePatients.length} patients</span>
          </div>
          <NotificationBell alerts={stateAlerts} symptoms={stateSymptoms} hospitals={stateHospitals} />
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>

          {/* ── HM PROFILE ── */}
          {view==="profile" && (
            <div className="fade-in" style={{maxWidth:700,margin:"0 auto"}}>
              <div style={{marginBottom:24}}>
                <h1 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:4}}>My Profile</h1>
                <p style={{color:"#6b7280",fontSize:13}}>Health Minister credentials and state information</p>
              </div>
              <Card style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
                  <div style={{width:90,height:90,borderRadius:"50%",background:`linear-gradient(135deg,${C.teal}22,${C.blue}18)`,border:`3px solid ${C.teal}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,flexShrink:0}}>🏥</div>
                  <div style={{flex:1}}>
                    <h2 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:4}}>{minName}</h2>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                      <span style={{background:`${C.teal}15`,color:C.tealD,fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:999,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>HEALTH MINISTER</span>
                      <span style={{background:statePortalActive?"#f0fdf4":"#fef2f2",color:statePortalActive?"#16a34a":"#dc2626",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:999,border:`1px solid ${statePortalActive?"#bbf7d0":"#fecaca"}`}}>{statePortalActive?"✅ Portal Active":"🔒 Portal Locked"}</span>
                    </div>
                    <div style={{fontSize:13,color:"#6b7280"}}>📍 State: <strong style={{color:"#0d1117"}}>{state}</strong></div>
                  </div>
                </div>
              </Card>
              <Card style={{marginBottom:20}}>
                <h3 style={{fontSize:15,fontWeight:800,color:"#0d1117",marginBottom:16}}>State Statistics</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                  {[
                    {icon:"🏥",label:"Hospitals",val:stateHospitals.length,color:C.teal},
                    {icon:"👨‍⚕️",label:"Doctors",val:stateDoctors.length,color:C.blue},
                    {icon:"💊",label:"Helpers",val:stateHelpers.length,color:C.green},
                    {icon:"🤒",label:"Patients",val:statePatients.length,color:C.orange},
                    {icon:"🚨",label:"Active Alerts",val:stateAlerts.length,color:C.red},
                    {icon:"🗺️",label:"Districts",val:stateDistricts.length,color:C.purple},
                  ].map(({icon,label,val,color}) => (
                    <div key={label} style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                      <div style={{fontSize:22,fontWeight:800,color,marginBottom:2}}>{val}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{label}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 style={{fontSize:15,fontWeight:800,color:"#0d1117",marginBottom:16}}>Jurisdiction Districts</h3>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {stateDistricts.map(d => (
                    <span key={d} style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"4px 12px",fontSize:12,color:"#0369a1",fontWeight:600}}>📍 {d}</span>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── Overview ── */}
          {view==="overview" && (
            <div className="fade-in">
              <div style={{marginBottom:24}}>
                <h1 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:4}}>{state} — Health Overview</h1>
                <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>HEALTH MINISTER DASHBOARD · STATE PORTAL</p>
              </div>

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:24}}>
                {[
                  {l:"Hospitals",    v:stateHospitals.filter(h=>h.active).length, c:C.teal},
                  {l:"Doctors",      v:stateDoctors.length,   c:C.blue},
                  {l:"Helpers",      v:stateHelpers.length,   c:C.purple},
                  {l:"Patients",     v:statePatients.length,  c:C.orange},
                  {l:"Active Reports",v:stateSymptoms.filter(s=>!s.isResolved).length, c:C.purple},
                  {l:"Active Alerts",v:stateAlerts.length,    c:C.red},
                ].map(({l,v,c}) => (
                  <div key={l} style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px"}}>
                    <div style={{fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>{l}</div>
                    <div style={{fontSize:28,fontWeight:800,color:c}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Active alerts */}
              {stateAlerts.length > 0 && (
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Active Outbreak Alerts</div>
                  {stateAlerts.map(a => (
                    <div key={a.id} style={{background:"#450a0a",border:"1px solid rgba(239,68,68,0.4)",borderLeft:"4px solid #ef4444",borderRadius:12,padding:"14px 18px",marginBottom:8}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#dc2626",marginBottom:4}}>🚨 {a.disease} — {a.district}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{hospitals.find(h=>h.id===a.hospitalId)?.name} · {a.patientCount} cases · {new Date(a.date).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hospitals by district */}
              <Card>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase"}}>Hospitals in {state}</div>
                  <Btn size="sm" onClick={()=>setView("hospitals")}>Manage →</Btn>
                </div>
                {stateHospitals.length === 0 ? (
                  <p style={{color:"#64748b",fontSize:13}}>No hospitals added yet. Go to Hospitals tab to add.</p>
                ) : stateHospitals.map(h => (
                  <div key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#0d1117"}}>{h.name}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{h.district} · {h.beds} beds</div>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <Tag color={h.active?C.green:C.red}>{h.active?"ACTIVE":"INACTIVE"}</Tag>
                      <span style={{fontSize:11,color:"#6b7280"}}>{stateUsers.filter(u=>u.hospitalId===h.id&&u.role==="patient").length} pts</span>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ── Hospitals Management ── */}
          {view==="hospitals" && (
            <div className="fade-in">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
                <div>
                  <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>Hospital Management</h2>
                  <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{state.toUpperCase()} · ADD · ACTIVATE · REMOVE HOSPITALS</p>
                </div>
                <Btn onClick={()=>setShowAddHosp(!showAddHosp)}>{showAddHosp?"✕ Cancel":"+ Add Hospital"}</Btn>
              </div>

              {/* Add hospital form */}
              {showAddHosp && (
                <Card style={{marginBottom:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#475569",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:16,textTransform:"uppercase"}}>New Hospital in {state}</div>
                  {err && <AlertBanner msg={err} type="danger" onClose={()=>setErr("")} />}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div style={{gridColumn:"1/-1"}}>
                      <Input label="Hospital Name *" placeholder={`e.g. Government Hospital ${state}`} value={newHosp.name} onChange={e=>setNewHosp({...newHosp,name:e.target.value})} />
                    </div>
                    <div>
                      <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.2,marginBottom:6,textTransform:"uppercase",color:"#475569"}}>District *</div>
                      <select value={newHosp.district} onChange={e=>setNewHosp({...newHosp,district:e.target.value})}
                        style={{width:"100%",background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:10,padding:"11px 14px",color:"#0d1117",fontSize:14}}>
                        <option value="">Select district...</option>
                        {stateDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <Input label="Total Beds" type="number" min="10" value={newHosp.beds} onChange={e=>setNewHosp({...newHosp,beds:e.target.value})} />
                    <Input label="Address" placeholder="Hospital Road..." value={newHosp.address} onChange={e=>setNewHosp({...newHosp,address:e.target.value})} />
                    <Input label="Phone" placeholder="044-..." value={newHosp.phone} onChange={e=>setNewHosp({...newHosp,phone:e.target.value})} />
                  </div>
                  <Btn onClick={handleAddHosp}>✓ Add Hospital</Btn>
                </Card>
              )}

              {/* Hospital list */}
              {stateHospitals.length === 0 ? (
                <Card style={{textAlign:"center",padding:48}}>
                  <div style={{fontSize:40,marginBottom:12}}>🏥</div>
                  <p style={{color:"#64748b"}}>No hospitals added yet in {state}.</p>
                </Card>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {stateHospitals.map(h => {
                    const hPatients = stateUsers.filter(u=>u.hospitalId===h.id&&u.role==="patient").length;
                    const hDoctors  = stateUsers.filter(u=>u.hospitalId===h.id&&u.role==="doctor").length;
                    return (
                      <Card key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                            <div style={{fontSize:15,fontWeight:800,color:"#0d1117"}}>{h.name}</div>
                            <Tag color={h.active?C.green:C.red}>{h.active?"ACTIVE":"INACTIVE"}</Tag>
                          </div>
                          <div style={{display:"flex",gap:16,fontSize:12,color:"#64748b",flexWrap:"wrap"}}>
                            <span>📍 {h.district}, {state}</span>
                            {h.address && <span>🗺️ {h.address}</span>}
                            {h.phone && <span>📞 {h.phone}</span>}
                            <span>🛏️ {h.beds} beds</span>
                            <span>👥 {hPatients} patients · {hDoctors} doctors</span>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <Btn variant={h.active?"danger":"primary"} size="sm" onClick={()=>onToggleHospital(h.id)}>
                            {h.active?"Deactivate":"Activate"}
                          </Btn>
                          <Btn variant="ghost" size="sm" onClick={()=>setConfirmRemove(h)}
                            style={{color:C.red,borderColor:`${C.red}44`,fontSize:12}}>
                            🗑 Remove
                          </Btn>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Confirm remove modal */}
              {confirmRemove && (
                <div style={{position:"fixed",inset:0,background:"rgba(3,7,18,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
                  <div className="slide-in" style={{background:"#0d1117",border:`1px solid ${C.red}44`,borderRadius:16,padding:32,maxWidth:420,width:"100%"}}>
                    <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>⚠️</div>
                    <h3 style={{fontSize:16,fontWeight:800,color:"#ffffff",textAlign:"center",marginBottom:8}}>Remove Hospital?</h3>
                    <p style={{color:"#94a3b8",fontSize:13,textAlign:"center",marginBottom:20}}>
                      Are you sure you want to remove <strong style={{color:"#ffffff"}}>{confirmRemove.name}</strong>? This cannot be undone.
                    </p>
                    <div style={{display:"flex",gap:10}}>
                      <Btn variant="ghost" style={{flex:1,justifyContent:"center"}} onClick={()=>setConfirmRemove(null)}>Cancel</Btn>
                      <Btn variant="danger" style={{flex:1,justifyContent:"center"}} onClick={()=>{onRemoveHospital(confirmRemove.id);setConfirmRemove(null);}}>Yes, Remove</Btn>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Doctors / Helpers / Patients ── */}
          {["doctors","helpers","patients"].includes(view) && (
            <div className="fade-in">
              <div style={{marginBottom:24}}>
                <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>
                  {view==="doctors"?"Doctors":view==="helpers"?"Helpers / Nurses":"Patients"} in {state}
                </h2>
              </div>
              {(() => {
                const role = view==="doctors"?"doctor":view==="helpers"?"helper":"patient";
                const list = stateUsers.filter(u=>u.role===role);
                if (list.length===0) return <Card style={{textAlign:"center",padding:40}}><p style={{color:"#64748b"}}>No {view} registered yet in {state}.</p></Card>;
                return (
                  <div style={{background:"#ffffff",border:"1px solid #e5e7eb",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead>
                        <tr style={{background:"#f8fafc"}}>
                          {["","Name","Contact","Hospital","District","Area",...(role==="patient"?["Family","Condition"]:[]),"Action"].map(h => (
                            <th key={h} style={{padding:"12px 14px",textAlign:"left",color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:1,fontWeight:600,borderBottom:"1px solid #e5e7eb"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {list.map(u => (
                          <tr key={u.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                            <td style={{padding:"10px 14px",width:48}}>
                              {u.photo
                                ? <img src={u.photo} alt={u.name} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:`2px solid ${role==="doctor"?C.teal:role==="helper"?C.green:C.blue}`,display:"block"}} />
                                : <div style={{width:36,height:36,borderRadius:"50%",background:`${role==="doctor"?C.teal:role==="helper"?C.green:C.blue}18`,border:`2px solid ${role==="doctor"?C.teal:role==="helper"?C.green:C.blue}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                                    {role==="doctor"?"👨‍⚕️":role==="helper"?"💊":"🤒"}
                                  </div>
                              }
                            </td>
                            <td style={{padding:"10px 14px",fontWeight:700,color:"#0d1117"}}>{u.name}</td>
                            <td style={{padding:"10px 14px",color:"#475569",fontSize:12}}>{u.email||u.phone||"—"}</td>
                            <td style={{padding:"10px 14px",color:"#475569",fontSize:12}}>{stateHospitals.find(h=>h.id===u.hospitalId)?.name||"—"}</td>
                            <td style={{padding:"10px 14px",color:"#475569",fontSize:12}}>{u.district||"—"}</td>
                            <td style={{padding:"10px 14px",color:"#475569",fontSize:12}}>{u.area||"—"}</td>
                            {role==="patient" && <>
                              <td style={{padding:"10px 14px",color:"#475569",fontSize:12}}>{(+u.familyMale||0)+(+u.familyFemale||0)}</td>
                              <td style={{padding:"10px 14px",color:"#475569",fontSize:12}}>{u.regularCondition||"—"}</td>
                            </>}
                            <td style={{padding:"10px 14px"}}>
                              <Btn size="sm" variant="ghost" onClick={() => setSelProfile(u)} style={{fontSize:11}}>👤 View</Btn>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Alerts ── */}
          {view==="alerts" && (
            <div className="fade-in">
              <div style={{marginBottom:24}}>
                <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>Outbreak Alerts — {state}</h2>
                <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>DISTRICT-LEVEL OUTBREAK TRACKING · FULL PATIENT BREAKDOWN</p>
              </div>
              {stateAlerts.length===0 ? (
                <Card style={{textAlign:"center",padding:48}}>
                  <div style={{fontSize:48,marginBottom:12}}>✅</div>
                  <div style={{fontSize:18,fontWeight:700,color:C.green}}>No active outbreaks in {state}</div>
                  <p style={{color:"#64748b",marginTop:4}}>All districts within safe thresholds</p>
                </Card>
              ) : stateAlerts.map(a => {
                const liveEntries = getPatientEntriesForAlert(a.entries, stateSymptoms);
                return (
                  <div key={a.id} style={{background:"#0d0505",border:"1px solid rgba(239,68,68,0.35)",borderLeft:"4px solid #ef4444",borderRadius:16,marginBottom:20,overflow:"hidden"}}>
                    <div style={{background:"#450a0a",padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                          {!a.isViewedByAdmin && <span style={{width:10,height:10,borderRadius:"50%",background:C.red,display:"inline-block",animation:"pulse 1.5s infinite"}} />}
                          <span style={{color:C.red,fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:1.5}}>
                            {a.isViewedByAdmin ? "ACKNOWLEDGED ALERT" : "NEW OUTBREAK ALERT"}
                          </span>
                          <span style={{background:"#ef444422",color:"#dc2626",border:"1px solid #ef444444",borderRadius:999,padding:"1px 10px",fontSize:11,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>{liveEntries.length} PATIENTS</span>
                        </div>
                        <div style={{fontSize:20,fontWeight:800,color:"#dc2626",marginBottom:4}}>🦠 {a.disease}</div>
                        <div style={{display:"flex",gap:16,fontSize:12,color:"#64748b",flexWrap:"wrap"}}>
                          <span>🗺️ District: <strong style={{color:"#dc2626"}}>{a.district}</strong></span>
                          <span>🏥 {stateHospitals.find(h=>h.id===a.hospitalId)?.name}</span>
                          <span>📅 {new Date(a.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                        <div style={{background:"#ef444422",border:"1px solid #ef444444",borderRadius:12,padding:"12px 20px",textAlign:"center"}}>
                          <div style={{fontSize:36,fontWeight:800,color:"#ef4444"}}>{liveEntries.length}</div>
                          <div style={{fontSize:10,color:"#dc2626",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>CASES</div>
                        </div>
                        <Btn size="sm" variant="ghost" onClick={()=>exportAlertPDF(a, liveEntries, stateHospitals, stateUsers)} style={{fontSize:11,borderColor:`${C.teal}44`,color:C.teal}}>📄 Export PDF</Btn>
                      </div>
                    </div>
                    {liveEntries.length > 0 && (
                      <div style={{padding:"16px 22px"}}>
                        <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>
                          Patient records — {liveEntries.length} patient{liveEntries.length!==1?"s":""} predicted {a.disease} in {a.district}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:10}}>
                          {liveEntries.map((entry, idx) => {
                            const pu = stateUsers.find(u => u.id === entry.patientId);
                            return (
                              <div key={entry.id} style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
                                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                                    <div style={{width:32,height:32,borderRadius:"50%",background:`${C.red}33`,border:`1px solid ${C.red}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#ef4444"}}>{idx+1}</div>
                                    <div>
                                      <div style={{fontSize:14,fontWeight:700,color:"#ffffff"}}>{pu?.name || entry.patientName || entry.patient?.name || "Unknown Patient"}</div>
                                      <div style={{fontSize:11,color:"#94a3b8"}}>
                                        🗺️ District: {entry.district} &nbsp;·&nbsp; 📍 Area: {entry.area}
                                        {pu?.dob && ` · Age: ${new Date().getFullYear()-new Date(pu.dob).getFullYear()}`}
                                        {pu && ` · Family: ${(+pu.familyMale||0)+(+pu.familyFemale||0)}`}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{textAlign:"right"}}>
                                    {entry.isResolved && <div style={{background:`${C.green}22`,border:`1px solid ${C.green}44`,borderRadius:8,padding:"2px 10px",fontSize:10,fontWeight:800,color:C.green,marginBottom:4,display:"inline-block"}}>✅ RESOLVED</div>}
                                    <div style={{background:`${C.orange}22`,border:`1px solid ${C.orange}44`,borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:800,color:C.orange,marginBottom:3}}>⚕️ {entry.detectedDisease}</div>
                                    <div style={{fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace"}}>{new Date(entry.date).toLocaleString()}</div>
                                  </div>
                                </div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                  {entry.selectedSymptoms.map(sym => {
                                    const match = DISEASE_SYMPTOMS[entry.detectedDisease]?.includes(sym);
                                    return <span key={sym} style={{background:match?`${C.red}18`:C.bg3,border:`1px solid ${match?C.red+"55":C.border}`,color:match?"#dc2626":C.textM,borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:600}}>{sym}</span>;
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Inbox ── */}
          {view==="inbox" && (
            <div className="fade-in" style={{maxWidth:800}}>
              <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                <div>
                  <h1 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:4}}>Inbox — Auto-Resolved Alerts</h1>
                  <p style={{color:"#6b7280",fontSize:13}}>Alerts closed because doctors treated all contributing patients</p>
                </div>
                <Tag color={C.green}>📥 {resolvedAlerts.length} Messages</Tag>
              </div>
              {resolvedAlerts.length === 0 ? (
                <Card style={{textAlign:"center",padding:64}}>
                  <div style={{fontSize:48,marginBottom:16}}>📥</div>
                  <h3 style={{fontSize:18,fontWeight:800,color:"#0d1117",marginBottom:8}}>Your inbox is empty</h3>
                  <p style={{color:"#64748b"}}>When outbreaks are contained by hospital staff, a record will appear here.</p>
                </Card>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {resolvedAlerts.map(a => (
                    <Card key={a.id} style={{borderLeft:`4px solid ${C.green}`,background:"#ffffff",padding:24}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                            <span style={{background:`${C.green}12`,color:C.green,padding:"2px 10px",borderRadius:6,fontSize:10,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,border:`1px solid ${C.green}33`}}>SYSTEM MESSAGE</span>
                            <span style={{fontSize:18,fontWeight:800,color:"#0d1117"}}>🚨 {a.disease} Contained in {a.district}</span>
                          </div>
                          <div style={{fontSize:13,color:"#64748b",display:"flex",gap:12}}>
                            <span>🏥 {stateHospitals.find(h=>h.id===a.hospitalId)?.name}</span>
                            <span>⏱️ Resolved: {new Date(a.lastUpdated).toLocaleString()}</span>
                          </div>
                        </div>
                        <div style={{width:12,height:12,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}></div>
                      </div>
                      <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:16,padding:20}}>
                        <p style={{fontSize:14,color:"#166534",lineHeight:1.6,marginBottom:16}}>
                          The Ministry is hereby notified that the potential outbreak of <strong>{a.disease}</strong> in <strong>{a.district}</strong> has been successfully managed. All <strong>{a.patientCount}</strong> identified patients have received medical attention and their cases are marked as <strong>Resolved</strong> by the attending doctors.
                        </p>
                        
                        <div style={{marginBottom:20}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#166534",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Resolved Patient Records:</div>
                          <div style={{display:"flex",flexDirection:"column",gap:6}}>
                            {(a.entries || []).map((ent, i) => (
                              <div key={i} style={{background:"#ffffff",border:"1px solid #d1fae5",borderRadius:8,padding:"8px 12px",display:"flex",flexDirection:"column",gap:6}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <div style={{fontSize:13,fontWeight:700,color:"#065f46"}}>{ent.symptomReport?.patient?.name || "Anonymous Patient"}</div>
                                  <div style={{fontSize:11,color:"#059669"}}>📍 {ent.symptomReport?.area || "General Area"} · {ent.symptomReport?.district}</div>
                                </div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                                  {(ent.symptomReport?.symptoms || []).map(sym => (
                                    <span key={sym} style={{background:"#d1fae5",color:"#065f46",padding:"2px 8px",borderRadius:999,fontSize:10,fontWeight:600}}>{sym}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{display:"flex",gap:24}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:36,height:36,borderRadius:10,background:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 2px 4px rgba(0,0,0,0.05)"}}>👨‍⚕️</div>
                            <div>
                              <div style={{fontSize:14,fontWeight:800,color:"#065f46"}}>{a.patientCount}</div>
                              <div style={{fontSize:9,color:"#166534",textTransform:"uppercase",fontWeight:700}}>Patients Recovered</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Profile Detail Modal */}
      {selProfile && (
        <div style={{position:"fixed",inset:0,background:"rgba(3,7,18,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
          <div className="card-lift" style={{background:"#ffffff",border:`1px solid ${C.border}`,borderRadius:20,padding:32,maxWidth:500,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                {selProfile.photo
                  ? <img src={selProfile.photo} alt={selProfile.name} style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:`3px solid ${selProfile.role==="doctor"?C.teal:selProfile.role==="helper"?C.green:C.blue}`}} />
                  : <div style={{width:64,height:64,borderRadius:"50%",background:`${selProfile.role==="doctor"?C.teal:selProfile.role==="helper"?C.green:C.blue}18`,border:`3px solid ${selProfile.role==="doctor"?C.teal:selProfile.role==="helper"?C.green:C.blue}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
                      {selProfile.role==="doctor"?"👨‍⚕️":selProfile.role==="helper"?"💊":"🤒"}
                    </div>
                }
                <div>
                  <h3 style={{fontSize:20,fontWeight:800,color:"#0d1117"}}>{selProfile.name}</h3>
                  <Tag color={selProfile.role==="doctor"?C.blue:selProfile.role==="helper"?C.purple:C.orange}>{selProfile.role.toUpperCase()}</Tag>
                </div>
              </div>
              <button onClick={()=>setSelProfile(null)} style={{background:"none",border:"none",fontSize:24,color:"#6b7280",cursor:"pointer"}}>×</button>
            </div>
            
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {[
                {k:"Email / Phone", v:selProfile.email || selProfile.phone || "—"},
                {k:"State", v:selProfile.state},
                {k:"District", v:selProfile.district},
                {k:"Area / Village", v:selProfile.area},
                {k:"Date of Birth", v:selProfile.dob || "—"},
                {k:"Gender", v:selProfile.gender || "—"},
                {k:"Hospital", v:stateHospitals.find(h=>h.id===selProfile.hospitalId)?.name || "—"},
                {k:"Joined On", v:selProfile.joinDate || "—"},
              ].map(({k,v}) => (
                <div key={k} style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:"10px 14px"}}>
                  <div style={{fontSize:10,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5,marginBottom:4,textTransform:"uppercase"}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#0d1117"}}>{v}</div>
                </div>
              ))}
              {selProfile.role === "patient" && (
                <>
                  <div style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:"10px 14px"}}>
                    <div style={{fontSize:10,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5,marginBottom:4,textTransform:"uppercase"}}>Family Size</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#0d1117"}}>{(+selProfile.familyMale||0)+(+selProfile.familyFemale||0)} members</div>
                  </div>
                  <div style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:"10px 14px",gridColumn:"1 / -1"}}>
                    <div style={{fontSize:10,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:0.5,marginBottom:4,textTransform:"uppercase"}}>Regular Condition</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#0d1117"}}>{selProfile.regularCondition || "None"}</div>
                  </div>
                </>
              )}
            </div>
            
            <Btn style={{marginTop:24,width:"100%",justifyContent:"center"}} onClick={()=>setSelProfile(null)}>Close Profile</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN DASHBOARD  (read-only, all India view)
// ─────────────────────────────────────────────────────────────────────────────
function SuperAdminDashboard({ appState, onUpdateState, onMarkAlertViewed, onLogout }) {
  const { hospitals, users, symptoms, alerts, statePortals, hmCredentials } = appState;
  const [view, setView]         = useState("overview");
  const [selState, setSelState] = useState(null);
  const [selStateTab, setSelStateTab] = useState("hospitals");

  useEffect(() => {
    if (view === "alerts") {
      alerts.forEach(a => {
        if (!a.isResolved && !a.isViewedByAdmin) {
          onMarkAlertViewed(a.id);
        }
      });
    }
  }, [view, alerts.filter(a=>!a.isResolved).length, onMarkAlertViewed]);
  const [searchQ, setSearchQ]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  // Credential management state
  const [credSearch, setCredSearch]   = useState("");
  const [showCredForm, setShowCredForm] = useState(false);
  const [editCred, setEditCred]       = useState(null); // null = new, object = editing
  const [credForm, setCredForm]       = useState({ state:"", name:"", id:"", pass:"" });
  const [credErr, setCredErr]         = useState("");
  const [showPass, setShowPass]       = useState({});
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  // People search
  const [peopleSearch, setPeopleSearch] = useState("");
  const [peopleRole, setPeopleRole]   = useState("all");

  const activeStates = Object.keys(statePortals).filter(s => statePortals[s]);
  const allStates    = Object.keys(INDIA_DISTRICTS);

  const statsFor = (st) => {
    const sLower = st?.trim().toLowerCase();
    return {
      hospitals: hospitals.filter(h=>h.state?.trim().toLowerCase() === sLower).length,
      patients:  users.filter(u=>u.state?.trim().toLowerCase() === sLower && u.role==="patient").length,
      doctors:   users.filter(u=>u.state?.trim().toLowerCase() === sLower && u.role==="doctor").length,
      helpers:   users.filter(u=>u.state?.trim().toLowerCase() === sLower && u.role==="helper").length,
      reports:   symptoms.filter(s=>s.state?.trim().toLowerCase() === sLower && !s.isResolved).length,
      alerts:    alerts.filter(a=>a.state?.trim().toLowerCase() === sLower && !a.isResolved).length,
    };
  };

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkRevoke = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to revoke ${selectedIds.length} ministers?`)) return;
    
    setIsBulkLoading(true);
    try {
      await api.bulkDeleteMinisters(selectedIds);
      const revokedMinisters = hmCredentials.filter(m => selectedIds.includes(m.id));
      const newPortals = { ...statePortals };
      revokedMinisters.forEach(m => { newPortals[m.state] = false; });
      
      onUpdateState({
        hmCredentials: hmCredentials.filter(m => !selectedIds.includes(m.id)),
        statePortals: newPortals
      });
      setSelectedIds([]);
    } catch (e) {
      alert("Bulk revoke failed: " + e.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleCleanupTestData = async () => {
    const testMinisters = hmCredentials.filter(m => 
      m.state.toLowerCase().includes("test") || 
      m.name.toLowerCase().includes("verify") ||
      m.state.toLowerCase().includes("verify")
    );
    
    if (testMinisters.length === 0) {
      alert("No test data found to cleanup.");
      return;
    }

    if (!window.confirm(`Cleanup will revoke ${testMinisters.length} test ministers. Continue?`)) return;
    
    const ids = testMinisters.map(m => m.id);
    setIsBulkLoading(true);
    try {
      await api.bulkDeleteMinisters(ids);
      const newPortals = { ...statePortals };
      testMinisters.forEach(m => { newPortals[m.state] = false; });
      
      onUpdateState({
        hmCredentials: hmCredentials.filter(m => !ids.includes(m.id)),
        statePortals: newPortals
      });
      alert("Test data cleanup complete.");
    } catch (e) {
      alert("Cleanup failed: " + e.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  // ── Filtered states for overview/states tab ──
  const filteredStates = allStates.filter(st => {
    const matchQ = st.toLowerCase().includes(searchQ.toLowerCase());
    const s = statsFor(st);
    if (filterStatus==="active")   return matchQ && statePortals[st];
    if (filterStatus==="locked")   return matchQ && !statePortals[st];
    if (filterStatus==="alerts")   return matchQ && s.alerts > 0;
    return matchQ;
  });

  // ── Filtered people ──
  const allPeople = users.filter(u => {
    const matchRole = peopleRole==="all" || u.role===peopleRole;
    const matchSearch = !peopleSearch ||
      u.name?.toLowerCase().includes(peopleSearch.toLowerCase()) ||
      u.state?.toLowerCase().includes(peopleSearch.toLowerCase()) ||
      u.district?.toLowerCase().includes(peopleSearch.toLowerCase()) ||
      u.area?.toLowerCase().includes(peopleSearch.toLowerCase());
    return matchRole && matchSearch;
  });

  // ── Credential handlers ──
  const openNewCred = () => {
    setCredForm({ state:"", name:"", id:"", pass:"" });
    setEditCred(null); setCredErr(""); setShowCredForm(true);
    setView("ministers"); setSelState(null);
  };
  const openEditCred = (m) => {
    setCredForm({ state:m.state, name:m.name, id:m.id, pass: "" });
    setEditCred(m); setCredErr(""); setShowCredForm(true);
    setView("ministers"); setSelState(null);
    setTimeout(() => {
      const el = document.getElementById("cred-form-anchor");
      if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
    }, 50);
  };
  const saveCred = async () => {
    const trimmedId = credForm.id.trim();
    if (!credForm.state || !credForm.name.trim() || !trimmedId) { 
      setCredErr("State, Name, and ID are required."); return; 
    }
    if (!editCred && !credForm.pass) {
      setCredErr("Password is required for new credentials."); return;
    }
    
    // Check duplicate ID (excluding self when editing)
    const dup = hmCredentials.find(m => m.id === trimmedId && (!editCred || m.id !== editCred.id));
    if (dup) { setCredErr("That Minister ID already exists. Choose a unique one."); return; }
    
    try {
      const payload = { 
        ...credForm, 
        id: trimmedId,
        name: credForm.name.trim()
      };
      if (credForm.pass) {
        payload.password = credForm.pass;
      }
      delete payload.pass;

      if (editCred) {
        await api.updateMinister(editCred.id, payload);
        const updated = hmCredentials.map(m => m.id === editCred.id ? { ...m, ...payload, title: `Health Minister, ${credForm.state}`, pass: credForm.pass || m.pass, isActive: true } : m);
        onUpdateState({ hmCredentials: updated });
      } else {
        await api.createMinister(payload);
        onUpdateState({ 
          hmCredentials: [...hmCredentials, { ...payload, title: `Health Minister, ${credForm.state}`, isActive: true, pass: credForm.pass }],
          statePortals: { ...statePortals, [credForm.state]: false } // Default locked for new portal
        });
      }
      setShowCredForm(false); setCredErr(""); setEditCred(null);
    } catch (e) {
      setCredErr(e.message || "Failed to save credentials.");
    }
  };
  const revokeCred = async (m) => {
    try {
      await api.deleteMinister(m.id);
      onUpdateState({ 
        hmCredentials: hmCredentials.filter(c => c.id !== m.id),
        statePortals: { ...statePortals, [m.state]: false } // Auto-lock on revoke
      });
      setConfirmRevoke(null);
    } catch (e) {
      alert("Failed to revoke credentials: " + e.message);
    }
  };

  const NAV = [
    {id:"overview",  icon:"🇮🇳", label:"National Overview"},
    {id:"states",    icon:"🗺️",  label:"All States"},
    {id:"people",    icon:"👥",  label:"All People"},
    {id:"alerts",    icon:"🚨",  label:"Active Alerts", badge:alerts.filter(a=>!a.isResolved && !a.isViewedByAdmin).length},
    {id:"inbox",     icon:"📥",  label:"Inbox", badge:alerts.filter(a=>a.isResolved && !a.isViewedByAdmin).length},
    {id:"ministers", icon:"🔑",  label:"Minister Credentials", badge:0},
    {id:"profile",   icon:"👤",  label:"My Profile"},
  ];

  const inputSm = {background:"#ffffff",border:"1px solid #d1d5db",borderRadius:8,padding:"8px 12px",color:"#0d1117",fontSize:13,width:"100%"};

  return (
    <div style={{display:"flex",height:"100vh",background:"#f0f4f8",overflow:"hidden"}}>
      {/* Sidebar */}
      <aside style={{width:230,background:"#ffffff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0,boxShadow:"2px 0 8px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"18px 16px 12px",borderBottom:"1px solid #f1f5f9"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${C.purple}22,${C.blue}18)`,border:`1px solid ${C.purple}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🇮🇳</div>
            <div>
              <div style={{color:"#0d1117",fontWeight:800,fontSize:13}}>Central Admin</div>
              <div style={{color:C.purple,fontSize:9,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.2}}>MoHFW · ALL INDIA</div>
            </div>
          </div>
          <div style={{background:`${C.purple}12`,border:`1px solid ${C.purple}33`,borderRadius:8,padding:"5px 10px",fontSize:10,color:C.purple,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>
            🛡️ FULL ACCESS
          </div>
        </div>
        <nav style={{flex:1,padding:"10px 8px",overflowY:"auto"}}>
          {NAV.map(n => (
            <button key={n.id} onClick={()=>{setView(n.id);setSelState(null);setSearchQ("");}} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 10px",
              borderRadius:10,border:"none",cursor:"pointer",marginBottom:2,textAlign:"left",
              background:view===n.id?`${C.purple}12`:"transparent",
              color:view===n.id?C.purple:"#374151",
              borderLeft:view===n.id?`2px solid ${C.purple}`:"2px solid transparent",
              transition:"all 0.15s", fontFamily:"'Sora',sans-serif",
            }}>
              <span style={{fontSize:14}}>{n.icon}</span>
              <span style={{fontSize:13,fontWeight:600,flex:1}}>{n.label}</span>
              {n.badge>0 && <span style={{background:C.red,color:"#fff",borderRadius:999,fontSize:10,padding:"1px 6px",fontWeight:700}}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1px solid #f1f5f9"}}>
          <button onClick={onLogout} style={{width:"100%",background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:12,padding:"6px 10px",textAlign:"left",borderRadius:8,fontFamily:"'Sora',sans-serif"}}>⏻ Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:"#ffffff",borderBottom:"1px solid #e5e7eb",padding:"0 32px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0d1117"}}>
            Ministry of Health & Family Welfare &nbsp;·&nbsp;
            <span style={{color:C.purple}}>{activeStates.length} active state portals</span>
          </div>
          <NotificationBell alerts={alerts} symptoms={symptoms} hospitals={hospitals} />
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>

          {/* ── SA PROFILE ── */}
          {view==="profile" && (
            <div className="fade-in" style={{maxWidth:700,margin:"0 auto"}}>
              <div style={{marginBottom:24}}>
                <h1 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:4}}>Super Admin Profile</h1>
                <p style={{color:"#6b7280",fontSize:13}}>Central Administration — Ministry of Health & Family Welfare</p>
              </div>
              <Card style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
                  <div style={{width:90,height:90,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple}22,${C.blue}18)`,border:`3px solid ${C.purple}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,flexShrink:0}}>🇮🇳</div>
                  <div style={{flex:1}}>
                    <h2 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:6}}>Central Administrator</h2>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                      <span style={{background:`${C.purple}12`,color:C.purple,fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:999,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>SUPER ADMIN</span>
                      <span style={{background:"#f0fdf4",color:"#16a34a",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:999,border:"1px solid #bbf7d0"}}>🛡️ FULL ACCESS</span>
                    </div>
                    <div style={{fontSize:13,color:"#6b7280"}}>Ministry of Health & Family Welfare, Government of India</div>
                  </div>
                </div>
              </Card>
              <Card style={{marginBottom:20}}>
                <h3 style={{fontSize:15,fontWeight:800,color:"#0d1117",marginBottom:16}}>National Statistics</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
                  {[
                    {icon:"🗺️",label:"Active State Portals",val:activeStates.length,color:C.teal},
                    {icon:"🔒",label:"Locked Portals",val:allStates.length-activeStates.length,color:"#6b7280"},
                    {icon:"🏥",label:"Total Hospitals",val:hospitals.length,color:C.blue},
                    {icon:"👨‍⚕️",label:"Total Doctors",val:users.filter(u=>u.role==="doctor").length,color:C.teal},
                    {icon:"🤒",label:"Total Patients",val:users.filter(u=>u.role==="patient").length,color:C.orange},
                    {icon:"🚨",label:"Active Alerts",val:alerts.filter(a=>!a.isResolved).length,color:C.red},
                    {icon:"🔑",label:"HM Credentials",val:hmCredentials.length,color:C.purple},
                    {icon:"🌐",label:"States/UTs",val:allStates.length,color:C.green},
                  ].map(({icon,label,val,color}) => (
                    <div key={label} style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                      <div style={{fontSize:22,fontWeight:800,color,marginBottom:2}}>{val}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{label}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 style={{fontSize:15,fontWeight:800,color:"#0d1117",marginBottom:16}}>Active State Portals</h3>
                {activeStates.length===0
                  ? <p style={{color:"#6b7280",fontSize:13}}>No state portals are currently active.</p>
                  : <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {activeStates.map(st => (
                        <span key={st} style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"4px 12px",fontSize:12,color:"#16a34a",fontWeight:600}}>✅ {st}</span>
                      ))}
                    </div>
                }
              </Card>
            </div>
          )}

          {/* ── NATIONAL OVERVIEW ── */}
          {view==="overview" && (
            <div className="fade-in">
              <div style={{marginBottom:24}}>
                <h1 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:4}}>National Health Dashboard</h1>
                <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>ALL INDIA · CENTRAL MONITORING</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:28}}>
                {[
                  {l:"Active State Portals", v:activeStates.length,                       c:C.teal},
                  {l:"Total Hospitals",       v:hospitals.length,                           c:C.blue},
                  {l:"Total Patients",        v:users.filter(u=>u.role==="patient").length, c:C.orange},
                  {l:"Active Reports",        v:symptoms.filter(s=>!s.isResolved).length,   c:C.purple},
                  {l:"Active Alerts",         v:alerts.filter(a=>!a.isResolved).length,          c:C.red},
                ].map(({l,v,c}) => (
                  <div key={l} style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px"}}>
                    <div style={{fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>{l}</div>
                    <div style={{fontSize:32,fontWeight:800,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Search + filter bar */}
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <input placeholder="🔍 Search state..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  style={{...inputSm,flex:1,minWidth:180}} />
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...inputSm,width:"auto"}}>
                  <option value="all">All States</option>
                  <option value="active">Active Portals</option>
                  <option value="locked">Locked Portals</option>
                  <option value="alerts">Has Alerts</option>
                </select>
                <div style={{background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:8,padding:"8px 14px",fontSize:12,color:"#64748b",display:"flex",alignItems:"center"}}>
                  {filteredStates.length} of {allStates.length} states
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10}}>
                {filteredStates.map(st => {
                  const s = statsFor(st); const active = statePortals[st];
                  const hm = hmCredentials.find(m=>m.state===st);
                  return (
                    <div key={st} className="card-lift" onClick={()=>{setSelState(st);setView("states");setSelStateTab("hospitals");}} style={{
                      background:"#0d1117",border:`1px solid ${active?"rgba(20,184,166,0.3)":C.border}`,
                      borderLeft:`3px solid ${active?C.teal:C.border}`,
                      borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all 0.2s",
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#ffffff"}}>{st}</div>
                        <Tag color={active?C.green:C.textD}>{active?"ACTIVE":"LOCKED"}</Tag>
                      </div>
                      {hm && <div style={{fontSize:10,color:"#64748b",marginBottom:8,fontStyle:"italic"}}>👤 {hm.name}</div>}
                      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:"#475569"}}>🏥 {s.hospitals}</span>
                        <span style={{fontSize:11,color:"#475569"}}>🤒 {s.patients}</span>
                        <span style={{fontSize:11,color:"#475569"}}>👨‍⚕️ {s.doctors}</span>
                        {s.reports>0 && <span style={{fontSize:11,color:C.purple}}>📋 {s.reports}</span>}
                        {s.alerts>0 && <span style={{fontSize:11,color:C.red}}>🚨 {s.alerts}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ALL STATES / STATE DRILL-DOWN ── */}
          {view==="states" && (
            <div className="fade-in">
              {!selState ? (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:12}}>
                    <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117"}}>All States</h2>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <input placeholder="🔍 Search state..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                        style={{...inputSm,width:200}} />
                      <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...inputSm,width:"auto"}}>
                        <option value="all">All</option><option value="active">Active</option>
                        <option value="locked">Locked</option><option value="alerts">Has Alerts</option>
                      </select>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
                    {filteredStates.map(st => {
                      const s = statsFor(st); const active = statePortals[st];
                      return (
                        <div key={st} className="card-lift" onClick={()=>{setSelState(st);setSelStateTab("hospitals");}} style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:12,padding:"16px",cursor:"pointer"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#ffffff"}}>{st}</div>
                            <Tag color={active?C.green:C.textD}>{active?"ACTIVE":"LOCKED"}</Tag>
                          </div>
                          <div style={{display:"flex",gap:10,fontSize:12,color:"#475569",flexWrap:"wrap"}}>
                            <span>🏥 {s.hospitals}</span><span>🤒 {s.patients}</span><span>👨‍⚕️ {s.doctors}</span>
                          </div>
                          {s.alerts>0 && <div style={{marginTop:8}}><Tag color={C.red}>🚨 {s.alerts} alerts</Tag></div>}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                // ── STATE DRILL-DOWN ──
                (() => {
                  const sLower    = selState?.trim().toLowerCase();
                  const stHosp    = hospitals.filter(h=>h.state?.trim().toLowerCase() === sLower);
                  const stUsers   = users.filter(u=>u.state?.trim().toLowerCase() === sLower);
                  const stDocs    = stUsers.filter(u=>u.role==="doctor");
                  const stPats    = stUsers.filter(u=>u.role==="patient");
                  const stHelpers = stUsers.filter(u=>u.role==="helper");
                  const stAlerts  = alerts.filter(a=>a.state?.trim().toLowerCase() === sLower && a.active);
                  const hm        = hmCredentials.find(m=>m.state?.trim().toLowerCase() === sLower);
                  const active    = statePortals[selState];

                  const tabs = [
                    {id:"hospitals", label:`🏥 Hospitals (${stHosp.length})`},
                    {id:"doctors",   label:`👨‍⚕️ Doctors (${stDocs.length})`},
                    {id:"helpers",   label:`💊 Helpers (${stHelpers.length})`},
                    {id:"patients",  label:`🤒 Patients (${stPats.length})`},
                    {id:"alerts",    label:`🚨 Alerts (${stAlerts.length})`},
                  ];

                  return (
                    <>
                      <button onClick={()=>setSelState(null)} style={{background:"none",border:"none",color:C.purple,cursor:"pointer",fontSize:13,marginBottom:20,display:"flex",alignItems:"center",gap:4}}>← Back to All States</button>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                            <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117"}}>{selState}</h2>
                            <Tag color={active?C.green:C.red}>{active?"PORTAL ACTIVE":"PORTAL LOCKED"}</Tag>
                          </div>
                          {hm && <div style={{color:"#64748b",fontSize:12}}>👤 Health Minister: <span style={{color:C.teal,fontWeight:600}}>{hm.name}</span> &nbsp;·&nbsp; ID: <span style={{fontFamily:"'JetBrains Mono',monospace",color:"#475569"}}>{hm.id}</span></div>}
                        </div>
                      </div>
                      {/* Stat row */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
                        {[{l:"Hospitals",v:stHosp.length,c:C.teal},{l:"Doctors",v:stDocs.length,c:C.blue},{l:"Helpers",v:stHelpers.length,c:C.purple},{l:"Patients",v:stPats.length,c:C.orange},{l:"Active Alerts",v:stAlerts.length,c:C.red}].map(({l,v,c}) => (
                          <div key={l} style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
                            <div style={{fontSize:9,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                            <div style={{fontSize:26,fontWeight:800,color:c}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {/* Tabs */}
                      <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:`1px solid ${C.border}`,paddingBottom:0,flexWrap:"wrap"}}>
                        {tabs.map(t => (
                          <button key={t.id} onClick={()=>setSelStateTab(t.id)} style={{
                            background:"none",border:"none",borderBottom:selStateTab===t.id?`2px solid ${C.purple}`:"2px solid transparent",
                            color:selStateTab===t.id?C.purple:C.textD,cursor:"pointer",padding:"8px 14px",fontSize:12,fontWeight:600,
                            marginBottom:-1,transition:"all 0.15s",
                          }}>{t.label}</button>
                        ))}
                      </div>

                      {/* Hospitals tab */}
                      {selStateTab==="hospitals" && (
                        stHosp.length===0 ? <Card style={{textAlign:"center",padding:32}}><p style={{color:"#64748b"}}>No hospitals added yet.</p></Card>
                        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                          {stHosp.map(h => (
                            <Card key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                              <div>
                                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                  <div style={{fontSize:14,fontWeight:700,color:"#0d1117"}}>{h.name}</div>
                                  <Tag color={h.active?C.green:C.red}>{h.active?"ACTIVE":"INACTIVE"}</Tag>
                                </div>
                                <div style={{fontSize:12,color:"#64748b",display:"flex",gap:16,flexWrap:"wrap"}}>
                                  <span>📍 {h.district}</span>
                                  {h.address && <span>🗺️ {h.address}</span>}
                                  {h.phone && <span>📞 {h.phone}</span>}
                                  <span>🛏️ {h.beds} beds</span>
                                  <span>🤒 {users.filter(u=>u.hospitalId===h.id&&u.role==="patient").length} patients</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Doctors tab */}
                      {selStateTab==="doctors" && (
                        stDocs.length===0 ? <Card style={{textAlign:"center",padding:32}}><p style={{color:"#64748b"}}>No doctors registered yet.</p></Card>
                        : <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr style={{background:C.bg3}}>
                            {["Name","Phone/Email","Hospital","District","Area","Joined"].map(h => (
                              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${C.border}`}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>{stDocs.map(u => (
                            <tr key={u.id} style={{borderBottom:`1px solid ${C.border}`}}>
                              <td style={{padding:"12px 14px",fontWeight:700,color:"#0d1117"}}>{u.name}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.email||u.phone||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{hospitals.find(h=>h.id===u.hospitalId)?.name||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.district||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.area||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.joinDate||"—"}</td>
                            </tr>
                          ))}</tbody>
                        </table></div>
                      )}

                      {/* Helpers tab */}
                      {selStateTab==="helpers" && (
                        stHelpers.length===0 ? <Card style={{textAlign:"center",padding:32}}><p style={{color:"#64748b"}}>No helpers registered yet.</p></Card>
                        : <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr style={{background:C.bg3}}>
                            {["Name","Phone/Email","Hospital","District","Area"].map(h => (
                              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${C.border}`}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>{stHelpers.map(u => (
                            <tr key={u.id} style={{borderBottom:`1px solid ${C.border}`}}>
                              <td style={{padding:"12px 14px",fontWeight:700,color:"#0d1117"}}>{u.name}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.email||u.phone||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{hospitals.find(h=>h.id===u.hospitalId)?.name||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.district||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.area||"—"}</td>
                            </tr>
                          ))}</tbody>
                        </table></div>
                      )}

                      {/* Patients tab */}
                      {selStateTab==="patients" && (
                        stPats.length===0 ? <Card style={{textAlign:"center",padding:32}}><p style={{color:"#64748b"}}>No patients registered yet.</p></Card>
                        : <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr style={{background:C.bg3}}>
                            {["Name","Phone/Email","Hospital","District","Area / Village","DOB","Family","Condition","Joined"].map(h => (
                              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase",fontWeight:600,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>{stPats.map(u => (
                            <tr key={u.id} style={{borderBottom:`1px solid ${C.border}`}}>
                              <td style={{padding:"12px 14px",fontWeight:700,color:"#0d1117",whiteSpace:"nowrap"}}>{u.name}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.email||u.phone||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12,whiteSpace:"nowrap"}}>{hospitals.find(h=>h.id===u.hospitalId)?.name||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.district||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12}}>{u.area||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12,whiteSpace:"nowrap"}}>{u.dob||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12,textAlign:"center"}}>{(+u.familyMale||0)+(+u.familyFemale||0)}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.regularCondition||"—"}</td>
                              <td style={{padding:"12px 14px",color:"#475569",fontSize:12,whiteSpace:"nowrap"}}>{u.joinDate||"—"}</td>
                            </tr>
                          ))}</tbody>
                        </table></div>
                      )}

                      {/* Alerts tab */}
                      {selStateTab==="alerts" && (
                        stAlerts.length===0 ? <Card style={{textAlign:"center",padding:32}}><div style={{fontSize:32,marginBottom:8}}>✅</div><p style={{color:C.green,fontWeight:700}}>No active alerts in {selState}</p></Card>
                        : stAlerts.map(a => (
                          <div key={a.id} style={{background:"#450a0a",border:"1px solid rgba(239,68,68,0.4)",borderLeft:"4px solid #ef4444",borderRadius:12,padding:"16px 20px",marginBottom:12}}>
                            <div style={{fontSize:15,fontWeight:800,color:"#dc2626",marginBottom:6}}>🦠 {a.disease}</div>
                            <div style={{fontSize:12,color:"#64748b",display:"flex",gap:16,flexWrap:"wrap"}}>
                              <span>📍 {a.district}</span>
                              <span>🏥 {hospitals.find(h=>h.id===a.hospitalId)?.name||"—"}</span>
                              <span>👥 {a.patientCount} cases</span>
                              <span>📅 {new Date(a.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  );
                })()
              )}
            </div>
          )}

          {/* ── ALL PEOPLE ── */}
          {view==="people" && (
            <div className="fade-in">
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>All Registered People</h2>
                <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>ALL STATES · DOCTORS · HELPERS · PATIENTS</p>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <input placeholder="🔍 Search by name, state, district, area..." value={peopleSearch} onChange={e=>setPeopleSearch(e.target.value)}
                  style={{...inputSm,flex:1,minWidth:240}} />
                <select value={peopleRole} onChange={e=>setPeopleRole(e.target.value)} style={{...inputSm,width:"auto"}}>
                  <option value="all">All Roles</option>
                  <option value="doctor">Doctors</option>
                  <option value="helper">Helpers</option>
                  <option value="patient">Patients</option>
                </select>
                <div style={{background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:8,padding:"8px 14px",fontSize:12,color:"#64748b",display:"flex",alignItems:"center"}}>
                  {allPeople.length} results
                </div>
              </div>
              {allPeople.length===0 ? (
                <Card style={{textAlign:"center",padding:48}}><p style={{color:"#64748b"}}>No people match your search.</p></Card>
              ) : (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr style={{background:"#f8fafc"}}>
                      {["","Name","Role","State","District","Hospital","Phone/Email","DOB"].map(h => (
                        <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,textTransform:"uppercase",fontWeight:600,borderBottom:"1px solid #e5e7eb",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{allPeople.map(u => (
                      <tr key={u.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{padding:"10px 14px",width:48}}>
                          {u.photo
                            ? <img src={u.photo} alt={u.name} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:`2px solid ${u.role==="doctor"?C.teal:u.role==="helper"?C.green:C.blue}`,display:"block"}} />
                            : <div style={{width:36,height:36,borderRadius:"50%",background:`${u.role==="doctor"?C.teal:u.role==="helper"?C.green:C.blue}15`,border:`2px solid ${u.role==="doctor"?C.teal:u.role==="helper"?C.green:C.blue}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                                {u.role==="doctor"?"👨‍⚕️":u.role==="helper"?"💊":"🤒"}
                              </div>
                          }
                        </td>
                        <td style={{padding:"10px 14px",fontWeight:700,color:"#0d1117",whiteSpace:"nowrap"}}>{u.name}</td>
                        <td style={{padding:"10px 14px"}}><Tag color={u.role==="doctor"?C.blue:u.role==="helper"?C.purple:C.orange}>{u.role.toUpperCase()}</Tag></td>
                        <td style={{padding:"10px 14px",color:C.tealD,fontSize:12,fontWeight:600}}>{u.state||"—"}</td>
                        <td style={{padding:"10px 14px",color:"#475569",fontSize:12}}>{u.district||"—"}</td>
                        <td style={{padding:"10px 14px",color:"#475569",fontSize:12,whiteSpace:"nowrap"}}>{hospitals.find(h=>h.id===u.hospitalId)?.name||"—"}</td>
                        <td style={{padding:"10px 14px",color:"#475569",fontSize:12}}>{u.email||u.phone||"—"}</td>
                        <td style={{padding:"10px 14px",color:"#475569",fontSize:12}}>{u.dob||"—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ALL ALERTS ── */}
          {view==="alerts" && (
            <div className="fade-in">
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>All India — Active Alerts</h2>
                <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>REAL-TIME OUTBREAK MONITORING · ALL STATES</p>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:16}}>
                <input placeholder="🔍 Search by disease, state, district..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                  style={{...inputSm,flex:1}} />
              </div>
              {(() => {
                const filtered = alerts.filter(a=>!a.isResolved && (
                  !searchQ || a.disease.toLowerCase().includes(searchQ.toLowerCase()) ||
                  a.state?.toLowerCase().includes(searchQ.toLowerCase()) ||
                  a.district?.toLowerCase().includes(searchQ.toLowerCase())
                ));
                return filtered.length===0 ? (
                  <Card style={{textAlign:"center",padding:48}}>
                    <div style={{fontSize:48,marginBottom:12}}>✅</div>
                    <div style={{fontSize:18,fontWeight:700,color:C.green}}>No active outbreaks across India</div>
                  </Card>
                ) : filtered.map(a => (
                  <div key={a.id} style={{background:a.isViewedByAdmin?"#1e1e2e":"#450a0a",border:`1px solid ${a.isViewedByAdmin?"#313244":"rgba(239,68,68,0.4)"}`,borderLeft:`4px solid ${a.isViewedByAdmin?C.teal:"#ef4444"}`,borderRadius:12,padding:"16px 20px",marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          {!a.isViewedByAdmin && <span style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:"pulse 1.5s infinite"}} />}
                          <div style={{fontSize:15,fontWeight:800,color:a.isViewedByAdmin?C.teal:"#dc2626"}}>🦠 {a.disease}</div>
                          {a.isViewedByAdmin && <span style={{fontSize:9,color:C.teal,opacity:0.8,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>· ACKNOWLEDGED</span>}
                        </div>
                        <div style={{display:"flex",gap:16,fontSize:12,color:"#64748b",flexWrap:"wrap"}}>
                          <span>🗺️ {a.district}, <strong style={{color:C.teal}}>{a.state}</strong></span>
                          <span>🏥 {hospitals.find(h=>h.id===a.hospitalId)?.name||"—"}</span>
                          <span>👥 {a.patientCount} cases</span>
                          <span>📅 {new Date(a.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Tag color={C.red}>{a.patientCount} CASES</Tag>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* ── Inbox ── */}
          {view==="inbox" && (
            <div className="fade-in" style={{maxWidth:900}}>
              <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                <div>
                  <h1 style={{fontSize:22,fontWeight:800,color:"#0d1117",marginBottom:4}}>National Inbox — Contained Outbreaks</h1>
                  <p style={{color:"#6b7280",fontSize:13}}>National record of alerts successfully resolved by medical teams across India</p>
                </div>
                <Tag color={C.purple}>📪 {alerts.filter(a=>a.isResolved).length} Total Messages</Tag>
              </div>
              {alerts.filter(a=>a.isResolved).length === 0 ? (
                <Card style={{textAlign:"center",padding:64}}>
                  <div style={{fontSize:48,marginBottom:16}}>📪</div>
                  <h3 style={{fontSize:18,fontWeight:800,color:"#0d1117",marginBottom:8}}>No resolved outbreaks yet</h3>
                  <p style={{color:"#64748b"}}>All registered alerts are either active or no outbreaks have been reported.</p>
                </Card>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {alerts.filter(a=>a.isResolved).map(a => (
                    <Card key={a.id} style={{borderLeft:`4px solid ${C.green}`,background:"#ffffff",padding:20}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                            <span style={{background:`${C.green}12`,color:C.green,padding:"2px 10px",borderRadius:6,fontSize:10,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,border:`1px solid ${C.green}33`}}>SYSTEM ARCHIVE</span>
                            <span style={{fontSize:16,fontWeight:800,color:"#0d1117"}}>🚨 {a.disease} Resolved in {a.district}, {a.state}</span>
                          </div>
                          <div style={{fontSize:12,color:"#64748b",display:"flex",gap:12}}>
                            <span>🏥 {hospitals.find(h=>h.id===a.hospitalId)?.name||"—"}</span>
                            <span>⏱️ Contained At: {new Date(a.lastUpdated).toLocaleString()}</span>
                          </div>
                        </div>
                        <div style={{width:10,height:10,borderRadius:"50%",background:C.green}}></div>
                      </div>
                      <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:14}}>
                        <p style={{fontSize:13,color:"#334155",lineHeight:1.5,marginBottom:12}}>
                          Outbreak contained in <strong>{a.state}</strong>. <strong>{a.patientCount}</strong> patients were identified and successfully treated. 
                        </p>
                        <div style={{display:"flex",flexDirection:"column",gap:4,borderTop:"1px solid #e2e8f0",paddingTop:8}}>
                          <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",marginBottom:4}}>Patient Records:</div>
                          {(a.entries || []).map((ent, i) => (
                            <div key={i} style={{fontSize:11,color:"#475569",display:"flex",justifyContent:"space-between"}}>
                              <span>• {ent.symptomReport?.patient?.name || "Patient"}</span>
                              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{ent.symptomReport?.district}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          {view==="ministers" && (
            <div className="fade-in">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:12}}>
                <div>
                  <h2 style={{fontSize:20,fontWeight:800,color:"#0d1117",marginBottom:4}}>Health Minister Credentials</h2>
                  <p style={{color:"#64748b",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>CREATE · EDIT · REVOKE ACCESS FOR ALL STATES</p>
                </div>
                <Btn onClick={openNewCred} style={{background:`linear-gradient(135deg,${C.purple},#7c3aed)`}}>+ Issue New Credentials</Btn>
              </div>

              {/* Bulk Action Bar */}
              {selectedIds.length > 0 && (
                <div style={{background:C.purple,borderRadius:12,padding:"10px 20px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",color:"#fff",boxShadow:`0 8px 24px ${C.purple}44`}}>
                  <div style={{fontSize:13,fontWeight:700}}>⚡ {selectedIds.length} ministers selected</div>
                  <div style={{display:"flex",gap:12}}>
                    <button onClick={()=>setSelectedIds([])} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>Cancel</button>
                    <button onClick={handleBulkRevoke} disabled={isBulkLoading} style={{background:"#fff",border:"none",color:C.purple,borderRadius:8,padding:"6px 16px",fontSize:12,fontWeight:800,cursor:"pointer"}}>
                      {isBulkLoading ? "Revoking..." : "🗑 Revoke Selected"}
                    </button>
                  </div>
                </div>
              )}

              {/* Create / Edit form */}
              {showCredForm && (
                <Card id="cred-form-anchor" style={{marginBottom:24,border:`1px solid ${C.purple}44`}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.purple,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:16,textTransform:"uppercase"}}>
                    {editCred ? `✏️ Edit Credentials — ${editCred.state}` : "➕ Issue New Minister Credentials"}
                  </div>
                  {credErr && <AlertBanner msg={credErr} type="danger" onClose={()=>setCredErr("")} />}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div style={{gridColumn:"1/-1"}}>
                      <div style={{fontSize:11,color:"#6b7280",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.2,marginBottom:6,textTransform:"uppercase",color:"#475569"}}>State *</div>
                      <select value={credForm.state} onChange={e=>setCredForm({...credForm,state:e.target.value})}
                        style={{width:"100%",background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:10,padding:"11px 14px",color:"#0d1117",fontSize:14}}>
                        <option value="">Select state...</option>
                        {Object.keys(INDIA_DISTRICTS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <Input label="Health Minister Full Name *" placeholder="e.g. Ma. Subramanian" value={credForm.name} onChange={e=>setCredForm({...credForm,name:e.target.value})} />
                    </div>
                    <Input label="Minister ID *" placeholder="e.g. HM-TN-001" value={credForm.id} onChange={e=>setCredForm({...credForm,id:e.target.value})} />
                    <Input label="Secret Password *" type="password" placeholder="Set a strong password" value={credForm.pass} onChange={e=>setCredForm({...credForm,pass:e.target.value})} />
                  </div>
                  <div style={{display:"flex",gap:10,marginTop:16}}>
                    <Btn variant="ghost" onClick={()=>{setShowCredForm(false);setCredErr("");}} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
                    <Btn onClick={saveCred} style={{flex:2,justifyContent:"center",background:`linear-gradient(135deg,${C.purple},#7c3aed)`}}>
                      {editCred ? "✓ Save Changes" : "✓ Issue Credentials"}
                    </Btn>
                  </div>
                </Card>
              )}

              {/* Search */}
              <div style={{display:"flex",gap:10,marginBottom:16}}>
                <input placeholder="🔍 Search by state or minister name..." value={credSearch} onChange={e=>setCredSearch(e.target.value)}
                  style={{...inputSm,flex:1}} />
                <div style={{background:"#f8fafc",border:`1px solid ${C.border2}`,borderRadius:8,padding:"8px 14px",fontSize:12,color:"#64748b",display:"flex",alignItems:"center",whiteSpace:"nowrap"}}>
                  {hmCredentials.filter(m=>!credSearch||m.state.toLowerCase().includes(credSearch.toLowerCase())||m.name.toLowerCase().includes(credSearch.toLowerCase())).length} of {hmCredentials.length} ministers
                </div>
              </div>

              {/* Credentials list */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {hmCredentials
                  .filter(m => !credSearch || m.state.toLowerCase().includes(credSearch.toLowerCase()) || m.name.toLowerCase().includes(credSearch.toLowerCase()))
                  .map(m => {
                    const portalActive = statePortals[m.state];
                    const isSelected = selectedIds.includes(m.id);
                    return (
                      <Card key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,padding:"16px 20px",border:isSelected?`1px solid ${C.purple}`:`1px solid ${C.border}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:16,flex:1}}>
                          <input type="checkbox" checked={isSelected} onChange={()=>toggleSelect(m.id)} style={{width:18,height:18,cursor:"pointer",accentColor:C.purple}} />
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                              <div style={{fontSize:14,fontWeight:800,color:"#0d1117"}}>{m.name}</div>
                              <Tag color={C.purple}>{m.state}</Tag>
                              <Tag color={portalActive?C.green:C.textD}>{portalActive?"PORTAL ACTIVE":"PORTAL LOCKED"}</Tag>
                            </div>
                            <div style={{display:"flex",gap:20,fontSize:12,flexWrap:"wrap"}}>
                              <div>
                                <span style={{color:"#64748b",fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:1}}>MINISTER ID &nbsp;</span>
                                <span style={{color:C.teal,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{m.id}</span>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <span style={{color:"#64748b",fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:1}}>PASSWORD &nbsp;</span>
                                <span style={{fontFamily:"'JetBrains Mono',monospace",color:"#475569"}}>
                                  {showPass[m.id] ? (m.pass || "SECRET") : "•".repeat(8)}
                                </span>
                                <button onClick={()=>setShowPass(p=>({...p,[m.id]:!p[m.id]}))} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",fontSize:12,padding:0}}>
                                  {showPass[m.id]?"🙈":"👁️"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <Btn size="sm" variant="ghost" onClick={()=>openEditCred(m)} style={{fontSize:11}}>✏️ Edit</Btn>
                          <Btn size="sm" variant="ghost" onClick={()=>setConfirmRevoke(m)} style={{color:C.red,borderColor:`${C.red}44`,fontSize:11}}>🗑 Revoke</Btn>
                        </div>
                      </Card>
                    );
                  })}
                {hmCredentials.filter(m=>!credSearch||m.state.toLowerCase().includes(credSearch.toLowerCase())||m.name.toLowerCase().includes(credSearch.toLowerCase())).length===0 && (
                  <Card style={{textAlign:"center",padding:32}}><p style={{color:"#64748b"}}>No ministers match your search.</p></Card>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Revoke confirm modal */}
      {confirmRevoke && (
        <div style={{position:"fixed",inset:0,background:"rgba(3,7,18,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
          <div className="slide-in" style={{background:"#0d1117",border:`1px solid ${C.red}44`,borderRadius:16,padding:32,maxWidth:420,width:"100%"}}>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>⚠️</div>
            <h3 style={{fontSize:16,fontWeight:800,color:"#ffffff",textAlign:"center",marginBottom:8}}>Revoke Credentials?</h3>
            <p style={{color:"#94a3b8",fontSize:13,textAlign:"center",lineHeight:1.6,marginBottom:20}}>
              This will permanently revoke access for <strong style={{color:"#ffffff"}}>{confirmRevoke.name}</strong> ({confirmRevoke.state}). They will no longer be able to log in. This cannot be undone.
            </p>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="ghost" style={{flex:1,justifyContent:"center"}} onClick={()=>setConfirmRevoke(null)}>Cancel</Btn>
              <Btn variant="danger" style={{flex:1,justifyContent:"center"}} onClick={()=>revokeCred(confirmRevoke)}>Yes, Revoke</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useState(initState);
  const [screen, setScreen]     = useState("landing");
  const [currentUser, setCurrentUser]   = useState(null);
  const [currentHM, setCurrentHM]       = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showHMModal, setShowHMModal]   = useState(false);
  const [showSAModal, setShowSAModal]   = useState(false);
  const [apiToken, setApiToken] = useState(() => api.getToken());
  const [authLoading, setAuthLoading] = useState(false);

  const updateState = (patch) => setAppState(s => ({...s, ...patch}));
  const handleResolveCase = async (id) => {
    // Optimistic local update for "instant" response
    setAppState(prev => ({
      ...prev,
      symptoms: prev.symptoms.map(s => s.id === id ? { ...s, isResolved: true } : s)
    }));
    
    try {
      await api.resolveSymptom(id, true);
    } catch (err) {
      console.error("Failed to resolve case:", err);
      alert("Note: Resolution could not be saved to server: " + (err.message || "Unknown error"));
      // Rollback on error
      setAppState(prev => ({
        ...prev,
        symptoms: prev.symptoms.map(s => s.id === id ? { ...s, isResolved: false } : s)
      }));
    }
  };

  const handleMarkAlertViewed = async (id) => {
    setAppState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => a.id === id ? { ...a, isViewedByAdmin: true } : a)
    }));
    try {
      await api.viewAlert(id);
    } catch (err) {
      console.error("Failed to mark alert as viewed:", err);
    }
  };

  // ── Load portals + hospitals from DB on mount ──────────────────────────────
  useEffect(() => {
    api.getPortals()
      .then(portals => updateState({ statePortals: portals }))
      .catch(() => {});
    api.getHospitals()
      .then(hospitals => {
        const mapped = hospitals.map(h => ({ ...h, active: h.isActive }));
        updateState({ hospitals: mapped });
      })
      .catch(() => {});

    // ── Auto-login ───────────────────────────────────────────
    const token = api.getToken();
    if (token) {
      setAuthLoading(true);
      api.getProfile()
        .then(user => {
          if (user.role === "superadmin") {
            handleSALogin();
          } else if (user.role === "minister") {
            handleHMLogin(user);
          } else {
            handleLogin(user);
          }
        })
        .catch(() => {
          api.clearToken();
          setApiToken(null);
        })
        .finally(() => setAuthLoading(false));
    }
  }, []);

  // ── Load ministers for Super Admin ──────────────────────────────────────────
  useEffect(() => {
    if (screen === "superadmin") {
      api.getMinisters()
        .then(data => updateState({ hmCredentials: data }))
        .catch(err => console.error("Failed to fetch ministers:", err));
    }
  }, [screen]);

  // ── If token exists and user is logged in, load live symptoms + alerts + users ──────
  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch symptoms
    api.getSymptoms()
      .then(data => {
        const mapped = data.map(r => ({
          id: r.id, patientId: r.patientId, 
          patientName: r.patient?.name || (r.patientId === currentUser.id ? currentUser.name : "Unknown Patient"),
          hospitalId: r.hospitalId, district: r.district, area: r.area, state: r.state,
          selectedSymptoms: r.symptoms, date: r.submittedAt,
          detectedDisease: r.detectedDisease, alertSent: r.alertSent,
          isResolved: r.isResolved,
          patient: r.patient // Keep the patient object for more robust lookups
        }));
        updateState({ symptoms: mapped });
      })
      .catch(() => {});

    // Fetch alerts
    api.getAlerts()
      .then(data => {
        const mapped = data.map(a => ({
          id: a.id, disease: a.disease, hospitalId: a.hospitalId,
          district: a.district, area: a.area, state: a.state,
          patientCount: a.patientCount, date: a.createdAt,
          lastUpdated: a.lastUpdated, active: a.isActive,
          isResolved: a.isResolved, isViewedByAdmin: a.isViewedByAdmin,
          entries: a.entries, // Keep entries for details
        }));
        updateState({ alerts: mapped });
      })
      .catch(() => {});

    // Fetch all users for staff to populate departments and alert details
    if (currentUser.role !== "patient") {
      api.getUsers()
        .then(users => updateState({ users }))
        .catch(err => console.error("Failed to fetch users:", err));
    }
  }, [currentUser]);

  // Derived portal state
  const unlockedStates = Object.keys(appState.statePortals).filter(s => appState.statePortals[s]);
  const anyUnlocked = unlockedStates.length > 0;
  const activeSignupState = unlockedStates.length === 1 ? unlockedStates[0] : (unlockedStates[0] || "");

  // ── Health Minister handlers ──────────────────────────────────────────────
  const handleHMLogin = (hm) => {
    setCurrentHM(hm);
    setShowHMModal(false);
    setScreen("hm");
    // Reload hospitals, users, symptoms + alerts for this state
    api.getHospitals(hm.state)
      .then(hospitals => {
        const mapped = hospitals.map(h => ({ ...h, active: h.isActive }));
        updateState({ hospitals: [...appState.hospitals.filter(h => h.state !== hm.state), ...mapped] });
      })
      .catch(() => {});
    
    api.getUsers()
      .then(users => updateState({ users }))
      .catch(() => {});

    api.getSymptoms()
      .then(data => {
        const mapped = data.map(r => ({
          id: r.id, patientId: r.patientId, 
          patientName: r.patient?.name || "Patient",
          hospitalId: r.hospitalId, district: r.district, area: r.area, state: r.state,
          selectedSymptoms: r.symptoms, date: r.submittedAt,
          detectedDisease: r.detectedDisease, alertSent: r.alertSent,
          isResolved: r.isResolved,
          patient: r.patient
        }));
        updateState({ symptoms: mapped });
      })
      .catch(() => {});

    api.getAlerts()
      .then(data => {
        const mapped = data.map(a => ({
          id: a.id, disease: a.disease, hospitalId: a.hospitalId,
          district: a.district, area: a.area, state: a.state,
          patientCount: a.patientCount, date: a.createdAt,
          lastUpdated: a.lastUpdated, active: a.isActive,
          isResolved: a.isResolved, isViewedByAdmin: a.isViewedByAdmin,
          entries: a.entries,
        }));
        updateState({ alerts: mapped });
      })
      .catch(() => {});
  };

  const handleHMLogout = () => {
    api.clearToken();
    setApiToken(null);
    setCurrentHM(null);
    setScreen("landing");
  };

  const handleUnlockPortal = async (state) => {
    try {
      await api.unlockPortal(state, api.getToken());
      updateState({ statePortals: {...appState.statePortals, [state]: true} });
    } catch(e) { console.error(e); }
  };

  const handleLockPortal = async (state) => {
    try {
      await api.lockPortal(state, api.getToken());
      updateState({ statePortals: {...appState.statePortals, [state]: false} });
    } catch(e) { console.error(e); }
  };

  const handleAddHospital = async (hosp) => {
    try {
      const created = await api.addHospital({ ...hosp, isActive: true }, api.getToken());
      updateState({ hospitals: [...appState.hospitals, { ...created, active: true }] });
    } catch(e) {
      updateState({ hospitals: [...appState.hospitals, { ...hosp, active: true }] });
    }
  };

  const handleToggleHospital = async (id) => {
    try {
      await api.toggleHospital(id, api.getToken());
    } catch(e) { console.error(e); }
    updateState({ hospitals: appState.hospitals.map(h => h.id===id ? {...h, active: !h.active, isActive: !h.isActive} : h) });
  };

  const handleRemoveHospital = async (id) => {
    try {
      await api.deleteHospital(id, api.getToken());
    } catch(e) { console.error(e); }
    updateState({ hospitals: appState.hospitals.filter(h => h.id!==id) });
  };

  // ── Super Admin handlers ──────────────────────────────────────────────────
  const handleSALogin = () => {
    setIsSuperAdmin(true);
    setShowSAModal(false);
    setScreen("superadmin");
  };

  const handleSALogout = () => {
    api.clearToken();
    setApiToken(null);
    setIsSuperAdmin(false);
    setScreen("landing");
  };

  const handleUpdateHMCredentials = (updated) => updateState({ hmCredentials: updated });

  // ── Patient / Doctor / Helper handlers ───────────────────────────────────
  const handleSignup = (userData) => {
    updateState({ users: [...appState.users, userData] });
    setScreen("login");
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setApiToken(api.getToken());
    setScreen("app");
  };

  const handleLogout = () => {
    api.clearToken();
    setApiToken(null);
    setCurrentUser(null);
    setScreen("landing");
  };

  const handleSubmitSymptoms = async (entry) => {
    // Optimistic local update
    updateState({ symptoms: [...appState.symptoms, entry] });
    try {
      const res = await api.postSymptom({
        hospitalId: entry.hospitalId,
        state: entry.state,
        district: entry.district,
        area: entry.area,
        symptoms: entry.selectedSymptoms,
      });
      // Reload alerts in case outbreak was triggered
      const alerts = await api.getAlerts();
      updateState({
        alerts: alerts.map(a => ({
          id: a.id, disease: a.disease, hospitalId: a.hospitalId,
          district: a.district, area: a.area, state: a.state,
          patientCount: a.patientCount, date: a.createdAt,
          lastUpdated: a.lastUpdated, active: a.isActive,
          isResolved: a.isResolved, isViewedByAdmin: a.isViewedByAdmin,
          entries: a.entries,
        }))
      });
    } catch(e) { console.error(e); }
  };

  const handleUpdateProfile = async (data) => {
    try {
      const updated = await api.updateProfile(data);
      setCurrentUser(updated);
      updateState({ users: appState.users.map(u => u.id===updated.id ? updated : u) });
      return updated;
    } catch(e) {
      console.error("Profile update error:", e);
      throw e;
    }
  };

  const handleProfileComplete = (updatedUser) => handleUpdateProfile(updatedUser);
  const handlePhotoUpdate = (photo) => handleUpdateProfile({ photo });

  if (authLoading) {
    return (
      <div style={{height:"100vh",background:"#0d1117",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#ffffff"}}>
        <Spinner />
        <div style={{marginTop:16,fontSize:14,color:C.teal,letterSpacing:1,fontWeight:600}}>RESTORING SESSION...</div>
      </div>
    );
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* ── LANDING ── */}
      {screen==="landing" && (
        <LandingPage
          statePortals={appState.statePortals}
          onHMAdmin={() => setShowHMModal(true)}
          onSuperAdmin={() => setShowSAModal(true)}
          onLogin={() => setScreen("login")}
          onSignup={() => setScreen("signup")}
        />
      )}

      {/* Health Minister modal */}
      {showHMModal && (
        <HealthMinisterModal
          onClose={() => setShowHMModal(false)}
          onLogin={handleHMLogin}
        />
      )}

      {/* Super Admin modal */}
      {showSAModal && (
        <SuperAdminModal
          onClose={() => setShowSAModal(false)}
          onLogin={handleSALogin}
        />
      )}

      {screen==="hm" && currentHM && (
        <HealthMinisterDashboard
          minister={currentHM}
          appState={appState}
          onAddHospital={handleAddHospital}
          onToggleHospital={handleToggleHospital}
          onRemoveHospital={handleRemoveHospital}
          onUnlockPortal={() => handleUnlockPortal(currentHM.state)}
          onLockPortal={() => handleLockPortal(currentHM.state)}
          onMarkAlertViewed={handleMarkAlertViewed}
          onLogout={handleHMLogout}
        />
      )}

      {/* ── SUPER ADMIN DASHBOARD ── */}
      {screen==="superadmin" && isSuperAdmin && (
        <SuperAdminDashboard
          appState={appState}
          onUpdateState={updateState}
          onMarkAlertViewed={handleMarkAlertViewed}
          onLogout={handleSALogout}
        />
      )}

      {/* ── SIGNUP ── */}
      {screen==="signup" && (
        <SignupPage
          hospitals={appState.hospitals}
          unlockedStates={Object.entries(appState.statePortals).filter(([,v])=>v).map(([k])=>k)}
          onSignup={handleSignup}
          onLogin={handleLogin}
          onBack={() => setScreen("landing")}
        />
      )}


      {/* ── LOGIN ── */}
      {screen==="login" && (
        <LoginPage
          users={appState.users}
          onLogin={handleLogin}
          onBack={() => setScreen("landing")}
          onSignup={() => setScreen("signup")}
        />
      )}

      {/* ── PATIENT / DOCTOR / HELPER APP ── */}
      {screen==="app" && currentUser && (() => {
        if (currentUser.role==="patient") {
          if (!currentUser.profileComplete) {
            return <PatientProfileSetup user={currentUser} hospitals={appState.hospitals} onComplete={handleProfileComplete} />;
          }
          return (
            <PatientDashboard
              user={currentUser}
              hospitals={appState.hospitals}
              symptoms={appState.symptoms}
              onSubmitSymptoms={handleSubmitSymptoms}
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          );
        }
        if (currentUser.role==="doctor" || currentUser.role==="helper") {
          return (
            <DoctorDashboard
              user={currentUser}
              hospitals={appState.hospitals}
              users={appState.users}
              symptoms={appState.symptoms}
              alerts={appState.alerts}
              onResolveCase={handleResolveCase}
              onLogout={handleLogout}
              onUpdatePhoto={handlePhotoUpdate}
            />
          );
        }
      })()}
    </>
  );
}

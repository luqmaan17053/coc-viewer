import { NextRequest, NextResponse } from "next/server";

const PROXY_URL = process.env.PROXY_URL;
const PROXY_SECRET = process.env.PROXY_SECRET;

/** Static mapping: ISO alpha-2 country code → CoC location ID */
const COUNTRY_TO_LOCATION: Record<string, number> = {
  AX:32000008,AL:32000009,DZ:32000010,AS:32000011,AD:32000012,AO:32000013,
  AI:32000014,AQ:32000015,AG:32000016,AR:32000017,AM:32000018,AW:32000019,
  AC:32000020,AU:32000021,AT:32000022,AZ:32000023,BS:32000024,BH:32000025,
  BD:32000026,BB:32000027,BY:32000028,BE:32000029,BZ:32000030,BJ:32000031,
  BM:32000032,BT:32000033,BO:32000034,BA:32000035,BW:32000036,BV:32000037,
  BR:32000038,IO:32000039,VG:32000040,BN:32000041,BG:32000042,BF:32000043,
  BI:32000044,KH:32000045,CM:32000046,CA:32000047,IC:32000048,CV:32000049,
  BQ:32000050,KY:32000051,CF:32000052,EA:32000053,TD:32000054,CL:32000055,
  CN:32000056,CX:32000057,CC:32000058,CO:32000059,KM:32000060,CG:32000061,
  CD:32000062,CK:32000063,CR:32000064,CI:32000065,HR:32000066,CU:32000067,
  CW:32000068,CY:32000069,CZ:32000070,DK:32000071,DG:32000072,DJ:32000073,
  DM:32000074,DO:32000075,EC:32000076,EG:32000077,SV:32000078,GQ:32000079,
  ER:32000080,EE:32000081,ET:32000082,FK:32000083,FO:32000084,FJ:32000085,
  FI:32000086,FR:32000087,GF:32000088,PF:32000089,TF:32000090,GA:32000091,
  GM:32000092,GE:32000093,DE:32000094,GH:32000095,GI:32000096,GR:32000097,
  GL:32000098,GD:32000099,GP:32000100,GU:32000101,GT:32000102,GG:32000103,
  GN:32000104,GW:32000105,GY:32000106,HT:32000107,HM:32000108,HN:32000109,
  HK:32000110,HU:32000111,IS:32000112,IN:32000113,ID:32000114,IR:32000115,
  IQ:32000116,IE:32000117,IM:32000118,IL:32000119,IT:32000120,JM:32000121,
  JP:32000122,JE:32000123,JO:32000124,KZ:32000125,KE:32000126,KI:32000127,
  XK:32000128,KW:32000129,KG:32000130,LA:32000131,LV:32000132,LB:32000133,
  LS:32000134,LR:32000135,LY:32000136,LI:32000137,LT:32000138,LU:32000139,
  MO:32000140,MK:32000141,MG:32000142,MW:32000143,MY:32000144,MV:32000145,
  ML:32000146,MT:32000147,MH:32000148,MQ:32000149,MR:32000150,MU:32000151,
  YT:32000152,MX:32000153,FM:32000154,MD:32000155,MC:32000156,MN:32000157,
  ME:32000158,MS:32000159,MA:32000160,MZ:32000161,MM:32000162,NA:32000163,
  NR:32000164,NP:32000165,NL:32000166,NC:32000167,NZ:32000168,NI:32000169,
  NE:32000170,NG:32000171,NU:32000172,NF:32000173,KP:32000174,MP:32000175,
  NO:32000176,OM:32000177,PK:32000178,PW:32000179,PS:32000180,PA:32000181,
  PG:32000182,PY:32000183,PE:32000184,PH:32000185,PN:32000186,PL:32000187,
  PT:32000188,PR:32000189,QA:32000190,RE:32000191,RO:32000192,RU:32000193,
  RW:32000194,BL:32000195,SH:32000196,KN:32000197,LC:32000198,MF:32000199,
  PM:32000200,WS:32000201,SM:32000202,ST:32000203,SA:32000204,SN:32000205,
  RS:32000206,SC:32000207,SL:32000208,SG:32000209,SX:32000210,SK:32000211,
  SI:32000212,SB:32000213,SO:32000214,ZA:32000215,KR:32000216,SS:32000217,
  ES:32000218,LK:32000219,VC:32000220,SD:32000221,SR:32000222,SJ:32000223,
  SZ:32000224,SE:32000225,CH:32000226,SY:32000227,TW:32000228,TJ:32000229,
  TZ:32000230,TH:32000231,TL:32000232,TG:32000233,TK:32000234,TO:32000235,
  TT:32000236,TA:32000237,TN:32000238,TR:32000239,TM:32000240,TC:32000241,
  TV:32000242,UM:32000243,VI:32000244,UG:32000245,UA:32000246,AE:32000247,
  GB:32000248,US:32000249,UY:32000250,UZ:32000251,VU:32000252,VA:32000253,
  VE:32000254,VN:32000255,WF:32000256,EH:32000257,YE:32000258,ZM:32000259,
  ZW:32000260,
};

/** Static mapping: ISO alpha-2 country code → display name */
const COUNTRY_NAMES: Record<string, string> = {
  AX:"Åland Islands",AL:"Albania",DZ:"Algeria",AS:"American Samoa",AD:"Andorra",
  AO:"Angola",AI:"Anguilla",AQ:"Antarctica",AG:"Antigua and Barbuda",AR:"Argentina",
  AM:"Armenia",AW:"Aruba",AC:"Ascension Island",AU:"Australia",AT:"Austria",
  AZ:"Azerbaijan",BS:"Bahamas",BH:"Bahrain",BD:"Bangladesh",BB:"Barbados",
  BY:"Belarus",BE:"Belgium",BZ:"Belize",BJ:"Benin",BM:"Bermuda",BT:"Bhutan",
  BO:"Bolivia",BA:"Bosnia and Herzegovina",BW:"Botswana",BR:"Brazil",
  IO:"British Indian Ocean Territory",VG:"British Virgin Islands",BN:"Brunei",
  BG:"Bulgaria",BF:"Burkina Faso",BI:"Burundi",KH:"Cambodia",CM:"Cameroon",
  CA:"Canada",IC:"Canary Islands",CV:"Cape Verde",BQ:"Caribbean Netherlands",
  KY:"Cayman Islands",CF:"Central African Republic",EA:"Ceuta and Melilla",
  TD:"Chad",CL:"Chile",CN:"China",CX:"Christmas Island",CC:"Cocos (Keeling) Islands",
  CO:"Colombia",KM:"Comoros",CG:"Congo (DRC)",CD:"Congo (Republic)",CK:"Cook Islands",
  CR:"Costa Rica",CI:"Côte d'Ivoire",HR:"Croatia",CU:"Cuba",CW:"Curaçao",CY:"Cyprus",
  CZ:"Czech Republic",DK:"Denmark",DG:"Diego Garcia",DJ:"Djibouti",DM:"Dominica",
  DO:"Dominican Republic",EC:"Ecuador",EG:"Egypt",SV:"El Salvador",
  GQ:"Equatorial Guinea",ER:"Eritrea",EE:"Estonia",ET:"Ethiopia",FK:"Falkland Islands",
  FO:"Faroe Islands",FJ:"Fiji",FI:"Finland",FR:"France",GF:"French Guiana",
  PF:"French Polynesia",TF:"French Southern Territories",GA:"Gabon",GM:"Gambia",
  GE:"Georgia",DE:"Germany",GH:"Ghana",GI:"Gibraltar",GR:"Greece",GL:"Greenland",
  GD:"Grenada",GP:"Guadeloupe",GU:"Guam",GT:"Guatemala",GG:"Guernsey",GN:"Guinea",
  GW:"Guinea-Bissau",GY:"Guyana",HT:"Haiti",HN:"Honduras",HK:"Hong Kong",
  HU:"Hungary",IS:"Iceland",IN:"India",ID:"Indonesia",IR:"Iran",IQ:"Iraq",
  IE:"Ireland",IM:"Isle of Man",IL:"Israel",IT:"Italy",JM:"Jamaica",JP:"Japan",
  JE:"Jersey",JO:"Jordan",KZ:"Kazakhstan",KE:"Kenya",KI:"Kiribati",XK:"Kosovo",
  KW:"Kuwait",KG:"Kyrgyzstan",LA:"Laos",LV:"Latvia",LB:"Lebanon",LS:"Lesotho",
  LR:"Liberia",LY:"Libya",LI:"Liechtenstein",LT:"Lithuania",LU:"Luxembourg",
  MO:"Macau",MK:"North Macedonia",MG:"Madagascar",MW:"Malawi",MY:"Malaysia",
  MV:"Maldives",ML:"Mali",MT:"Malta",MH:"Marshall Islands",MQ:"Martinique",
  MR:"Mauritania",MU:"Mauritius",YT:"Mayotte",MX:"Mexico",FM:"Micronesia",
  MD:"Moldova",MC:"Monaco",MN:"Mongolia",ME:"Montenegro",MS:"Montserrat",
  MA:"Morocco",MZ:"Mozambique",MM:"Myanmar (Burma)",NA:"Namibia",NR:"Nauru",
  NP:"Nepal",NL:"Netherlands",NC:"New Caledonia",NZ:"New Zealand",NI:"Nicaragua",
  NE:"Niger",NG:"Nigeria",NU:"Niue",NF:"Norfolk Island",KP:"North Korea",
  MP:"Northern Mariana Islands",NO:"Norway",OM:"Oman",PK:"Pakistan",PW:"Palau",
  PS:"Palestine",PA:"Panama",PG:"Papua New Guinea",PY:"Paraguay",PE:"Peru",
  PH:"Philippines",PN:"Pitcairn Islands",PL:"Poland",PT:"Portugal",PR:"Puerto Rico",
  QA:"Qatar",RE:"Réunion",RO:"Romania",RU:"Russia",RW:"Rwanda",
  BL:"Saint Barthélemy",SH:"Saint Helena",KN:"Saint Kitts and Nevis",
  LC:"Saint Lucia",MF:"Saint Martin",PM:"Saint Pierre and Miquelon",WS:"Samoa",
  SM:"San Marino",ST:"São Tomé and Príncipe",SA:"Saudi Arabia",SN:"Senegal",
  RS:"Serbia",SC:"Seychelles",SL:"Sierra Leone",SG:"Singapore",SX:"Sint Maarten",
  SK:"Slovakia",SI:"Slovenia",SB:"Solomon Islands",SO:"Somalia",ZA:"South Africa",
  KR:"South Korea",SS:"South Sudan",ES:"Spain",LK:"Sri Lanka",
  VC:"St. Vincent & Grenadines",SD:"Sudan",SR:"Suriname",SJ:"Svalbard and Jan Mayen",
  SZ:"Swaziland",SE:"Sweden",CH:"Switzerland",SY:"Syria",TW:"Taiwan",TJ:"Tajikistan",
  TZ:"Tanzania",TH:"Thailand",TL:"Timor-Leste",TG:"Togo",TK:"Tokelau",TO:"Tonga",
  TT:"Trinidad and Tobago",TA:"Tristan da Cunha",TN:"Tunisia",TR:"Türkiye",
  TM:"Turkmenistan",TC:"Turks and Caicos Islands",TV:"Tuvalu",
  UM:"U.S. Outlying Islands",VI:"U.S. Virgin Islands",UG:"Uganda",UA:"Ukraine",
  AE:"United Arab Emirates",GB:"United Kingdom",US:"United States",UY:"Uruguay",
  UZ:"Uzbekistan",VU:"Vanuatu",VA:"Vatican City",VE:"Venezuela",VN:"Vietnam",
  WF:"Wallis and Futuna",EH:"Western Sahara",YE:"Yemen",ZM:"Zambia",ZW:"Zimbabwe",
};

interface LeaderboardPlayer {
  tag: string;
  name: string;
  trophies: number;
  expLevel: number;
  rank: number;
}

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 300;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLeaderboardsBatched(
  codes: string[],
  limit: number
): Promise<PromiseSettledResult<{ code: string; players: LeaderboardPlayer[] }>[]> {
  const results: PromiseSettledResult<{ code: string; players: LeaderboardPlayer[] }>[] = [];
  for (let i = 0; i < codes.length; i += BATCH_SIZE) {
    const batch = codes.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((code) =>
        fetchLeaderboard(COUNTRY_TO_LOCATION[code], limit).then((players) => ({ code, players }))
      )
    );
    results.push(...batchResults);
    if (i + BATCH_SIZE < codes.length) {
      await delay(BATCH_DELAY_MS);
    }
  }
  return results;
}

async function fetchLeaderboard(
  locationId: number,
  limit: number
): Promise<LeaderboardPlayer[]> {
  const res = await fetch(
    `${PROXY_URL}/v1/locations/${locationId}/rankings/players?limit=${limit}`,
    {
      headers: {
        "x-proxy-secret": PROXY_SECRET!,
        accept: "application/json",
      },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((p: Record<string, unknown>) => ({
    tag: p.tag as string,
    name: p.name as string,
    trophies: p.trophies as number,
    expLevel: p.expLevel as number,
    rank: p.rank as number,
  }));
}

export async function POST(req: NextRequest) {
  if (!PROXY_URL || !PROXY_SECRET) {
    return NextResponse.json(
      { error: "Server misconfigured: proxy not set." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { clanTag, countryCodes, topCount, searchAll } = body as {
    clanTag: string;
    countryCodes: string[];
    topCount: number;
    searchAll?: boolean;
  };

  if (!clanTag) {
    return NextResponse.json({ error: "Clan tag is required." }, { status: 400 });
  }
  if (!searchAll && (!Array.isArray(countryCodes) || countryCodes.length === 0)) {
    return NextResponse.json({ error: "At least one country is required." }, { status: 400 });
  }
  if (!searchAll && countryCodes.length > 10) {
    return NextResponse.json({ error: "Maximum 10 countries allowed." }, { status: 400 });
  }

  const clampedTop = Math.max(1, Math.min(200, topCount || 200));

  // 1. Fetch clan member list
  const encodedClan = encodeURIComponent(
    clanTag.startsWith("#") ? clanTag : `#${clanTag}`
  );
  const clanRes = await fetch(`${PROXY_URL}/v1/clans/${encodedClan}`, {
    headers: { "x-proxy-secret": PROXY_SECRET, accept: "application/json" },
  });

  if (!clanRes.ok) {
    const err = await clanRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as Record<string, string>).message || "Failed to fetch clan." },
      { status: clanRes.status }
    );
  }

  const clanData = await clanRes.json();
  const memberList: { tag: string; name: string; expLevel: number; trophies: number }[] =
    clanData.memberList ?? [];
  const memberTagSet = new Set(memberList.map((m) => m.tag));
  const totalMembers = memberList.length;

  // 2. Fetch leaderboards — all countries (batched) or selected subset (parallel)
  const codesToSearch = searchAll
    ? Object.keys(COUNTRY_TO_LOCATION)
    : countryCodes.filter((c) => COUNTRY_TO_LOCATION[c]);

  const leaderboardResults = searchAll
    ? await fetchLeaderboardsBatched(codesToSearch, clampedTop)
    : await Promise.allSettled(
        codesToSearch.map((code) =>
          fetchLeaderboard(COUNTRY_TO_LOCATION[code], clampedTop).then((players) => ({
            code,
            players,
          }))
        )
      );

  // 3. Cross-reference: find clan members in each country's leaderboard
  const matchedTags = new Set<string>();

  interface CountryCluster {
    countryCode: string;
    countryName: string;
    players: { name: string; tag: string; trophies: number; expLevel: number }[];
  }

  const countries: CountryCluster[] = [];

  for (const result of leaderboardResults) {
    if (result.status !== "fulfilled") continue;
    const { code, players } = result.value;

    const matched = players.filter((p) => memberTagSet.has(p.tag));
    if (matched.length > 0) {
      countries.push({
        countryCode: code,
        countryName: COUNTRY_NAMES[code] || code,
        players: matched.map((p) => ({
          name: p.name,
          tag: p.tag,
          trophies: p.trophies,
          expLevel: p.expLevel,
          rank: p.rank,
        })),
      });
      matched.forEach((p) => matchedTags.add(p.tag));
    }
  }

  // Sort countries by player count descending
  countries.sort((a, b) => b.players.length - a.players.length);

  // 4. Build unknown list: clan members not matched in any leaderboard
  const unknownPlayers = memberList
    .filter((m) => !matchedTags.has(m.tag))
    .map((m) => ({
      name: m.name,
      tag: m.tag,
      trophies: m.trophies,
      expLevel: m.expLevel,
    }));

  return NextResponse.json({
    countries,
    unknownCount: unknownPlayers.length,
    unknownPlayers,
    totalMembers,
    searchedCountries: codesToSearch,
  });
}

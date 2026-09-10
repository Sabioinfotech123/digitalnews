import type { NewsType } from '@/types/content'

export interface SampleNewsArticle {
  id: string
  slug: string
  title: { en: string; te: string }
  excerpt: { en: string; te: string }
  category: { en: string; te: string }
  publishedLabel: { en: string; te: string }
  newsType: NewsType
  accent: string
  imageUrl?: string
  isBreaking?: boolean
}

/** @deprecated use SampleNewsArticle */
export type NewsItem = SampleNewsArticle

/** Fictional sample data for UI — replace with public news API later */
export const SAMPLE_NEWS: SampleNewsArticle[] = [
  {
    id: 'n1',
    slug: 'cabinet-clears-city-metro-phase',
    title: {
      en: 'Cabinet clears next metro phase for the capital region',
      te: 'రాజధాని ప్రాంతం మెట్రో తదుపరి దశకు కేబినెట్ ఆమోదం',
    },
    excerpt: {
      en: 'Officials say construction tenders will open this quarter, with stations planned across major corridors.',
      te: 'అధికారులు ఈ త్రైమాసికంలో టెండర్లు వేస్తామని, ప్రధాన కారిడార్లలో స్టేషన్లు ఉంటాయని చెప్పారు.',
    },
    category: { en: 'Politics', te: 'రాజకీయాలు' },
    publishedLabel: { en: '35 mins ago', te: '35 నిమిషాల క్రితం' },
    newsType: 'featured',
    accent: 'linear-gradient(135deg, #1a1a1a 0%, #D71920 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1544620341-65cdc2fa015e?w=900&h=560&fit=crop',
    isBreaking: true,
  },
  {
    id: 'n2',
    slug: 'heavy-rain-flood-alert',
    title: {
      en: 'Heavy rain triggers flood alert in low-lying neighborhoods',
      te: 'అధిక వర్షాలతో నీటి ముంపు ప్రాంతాలకు వరద హెచ్చరిక',
    },
    excerpt: {
      en: 'Rescue teams are on standby as overnight showers swell local canals and underpasses.',
      te: 'రాత్రి వర్షాలతో కాలువలు నిండడంతో రక్షణ బృందాలు సిద్ధంగా ఉన్నాయి.',
    },
    category: { en: 'Cities', te: 'నగరాలు' },
    publishedLabel: { en: '1 hour ago', te: '1 గంట క్రితం' },
    newsType: 'featured',
    accent: 'linear-gradient(135deg, #0f3d5c 0%, #1a1a1a 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=900&h=560&fit=crop',
  },
  {
    id: 'n3',
    slug: 'school-exam-calendar',
    title: {
      en: 'Board announces revised school exam calendar',
      te: 'పాఠశాల పరీక్షల క్యాలెండర్‌ను బోర్డు సవరించింది',
    },
    excerpt: {
      en: 'Parents and schools get clearer timelines after last year’s weather-related delays.',
      te: 'గతేడాది వాతావరణ ఆలస్యాల తర్వాత తల్లిదండ్రులకు స్పష్టమైన షెడ్యూల్.',
    },
    category: { en: 'Education', te: 'విద్య' },
    publishedLabel: { en: '2 hours ago', te: '2 గంటల క్రితం' },
    newsType: 'latest',
    accent: 'linear-gradient(135deg, #1f4d3a 0%, #111111 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&h=560&fit=crop',
  },
  {
    id: 'n4',
    slug: 'market-prices-ease',
    title: {
      en: 'Vegetable prices ease as fresh stocks reach city markets',
      te: 'తాజా సరుకు రాకతో కూరగాయల ధరలు తగ్గాయి',
    },
    excerpt: {
      en: 'Traders report better supply of tomato and onion after weekend arrivals.',
      te: 'వారాంత రాకల తర్వాత టమాట, ఉల్లి సరఫరా మెరుగైందని వ్యాపారులు.',
    },
    category: { en: 'Business', te: 'బిజినెస్' },
    publishedLabel: { en: '3 hours ago', te: '3 గంటల క్రితం' },
    newsType: 'latest',
    accent: 'linear-gradient(135deg, #5c3d0f 0%, #222222 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&h=560&fit=crop',
  },
  {
    id: 'n5',
    slug: 'state-cricket-final',
    title: {
      en: 'State cricket final set for packed weekend crowd',
      te: 'రాష్ట్ర క్రికెట్ ఫైనల్‌కు వారాంతం భారీ ప్రేక్షకులు',
    },
    excerpt: {
      en: 'Both sides confirmed squads as ticket counters opened at the main stadium.',
      te: 'ప్రధాన స్టేడియంలో టికెట్ కౌంటర్లు తెరిచాయి; జట్లు స్క్వాడ్లు ఖరారు చేశాయి.',
    },
    category: { en: 'Sports', te: 'స్పోర్ట్స్' },
    publishedLabel: { en: '4 hours ago', te: '4 గంటల క్రితం' },
    newsType: 'latest',
    accent: 'linear-gradient(135deg, #D71920 0%, #1a1a1a 90%)',
    imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=900&h=560&fit=crop',
  },
  {
    id: 'n6',
    slug: 'hospital-new-wing',
    title: {
      en: 'City hospital opens new emergency wing',
      te: 'నగర ఆసుపత్రిలో కొత్త ఎమర్జెన్సీ విభాగం ప్రారంభం',
    },
    excerpt: {
      en: 'Additional ICU beds and trauma bays aim to cut waiting times for critical cases.',
      te: 'అదనపు ICU బెడ్లు, ట్రామా బేలతో క్లిష్ట కేసుల వేచివుండే సమయం తగ్గే అవకాశం.',
    },
    category: { en: 'Health', te: 'ఆరోగ్యం' },
    publishedLabel: { en: '5 hours ago', te: '5 గంటల క్రితం' },
    newsType: 'latest',
    accent: 'linear-gradient(135deg, #0d3b4c 0%, #111111 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&h=560&fit=crop',
  },
  {
    id: 'n7',
    slug: 'tech-park-hiring',
    title: {
      en: 'Tech park announces fresh hiring drive for graduates',
      te: 'గ్రాడ్యుయేట్లకు టెక్ పార్క్ కొత్త నియామకాలు ప్రకటించింది',
    },
    excerpt: {
      en: 'Campus interviews start next month across engineering and design roles.',
      te: 'ఇంజనీరింగ్, డిజైన్ పాత్రలకు వచ్చే నెల నుంచి క్యాంపస్ ఇంటర్వ్యూలు.',
    },
    category: { en: 'Technology', te: 'టెక్నాలజీ' },
    publishedLabel: { en: 'Yesterday', te: 'నిన్న' },
    newsType: 'trending',
    accent: 'linear-gradient(135deg, #1a2744 0%, #333333 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=560&fit=crop',
  },
  {
    id: 'n8',
    slug: 'festival-traffic-plan',
    title: {
      en: 'Police share festival-week traffic diversion plan',
      te: 'పండుగ వారం ట్రాఫిక్ మళ్లింపు ప్రణాళికను పోలీసులు విడుదల',
    },
    excerpt: {
      en: 'Commuters are advised to use alternate routes near temple and market zones.',
      te: 'దేవాలయాలు, మార్కెట్ జోన్ల దగ్గర ప్రత్యామ్నాయ మార్గాలు వాడాలని సలహా.',
    },
    category: { en: 'Cities', te: 'నగరాలు' },
    publishedLabel: { en: 'Yesterday', te: 'నిన్న' },
    newsType: 'trending',
    accent: 'linear-gradient(135deg, #3d1a1a 0%, #111111 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900&h=560&fit=crop',
  },
  {
    id: 'n9',
    slug: 'farmers-support-scheme',
    title: {
      en: 'New support scheme opens for small and marginal farmers',
      te: 'చిన్న, సన్నకారు రైతులకు కొత్త సహాయ పథకం ప్రారంభం',
    },
    excerpt: {
      en: 'Applications can be filed online or at local agriculture offices through the month.',
      te: 'ఈ నెలలో ఆన్‌లైన్ లేదా స్థానిక వ్యవసాయ కార్యాలయాల్లో దరఖాస్తు చేయవచ్చు.',
    },
    category: { en: 'Agriculture', te: 'వ్యవసాయం' },
    publishedLabel: { en: '2 days ago', te: '2 రోజుల క్రితం' },
    newsType: 'more',
    accent: 'linear-gradient(135deg, #2d4a1f 0%, #1a1a1a 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3859?w=900&h=560&fit=crop',
  },
  {
    id: 'n10',
    slug: 'film-festival-lineup',
    title: {
      en: 'Regional film festival unveils opening-night lineup',
      te: 'ప్రాంతీయ చలనచిత్రోత్సవం ప్రారంభ రాత్రి లైనప్ వెల్లడి',
    },
    excerpt: {
      en: 'Documentaries and short features from debut directors headline the first weekend.',
      te: 'మొదటి వారాంతానికి కొత్త దర్శకుల డాక్యుమెంటరీలు, షార్ట్ ఫీచర్లు ముఖ్యాంశం.',
    },
    category: { en: 'Entertainment', te: 'వినోదం' },
    publishedLabel: { en: '2 days ago', te: '2 రోజుల క్రితం' },
    newsType: 'more',
    accent: 'linear-gradient(135deg, #4a1a3d 0%, #111111 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3dd?w=900&h=560&fit=crop',
  },
]

export function sampleNewsByType(type: NewsType): SampleNewsArticle[] {
  return SAMPLE_NEWS.filter((item) => item.newsType === type)
}

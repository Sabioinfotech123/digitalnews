export type VideoSource = 'website' | 'youtube' | 'tv'

export interface VideoItem {
  id: string
  slug: string
  title: { en: string; te: string }
  description: { en: string; te: string }
  duration: string
  category: { en: string; te: string }
  source: VideoSource
  isLive?: boolean
  isShort?: boolean
  publishedLabel: { en: string; te: string }
  /** CSS gradient placeholder until real thumbnails exist */
  accent: string
}

/** Fictional sample data for UI — replace with API in Phase 6 */
export const SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: '1',
    slug: 'evening-bulletin',
    title: {
      en: 'Evening Bulletin: Top headlines of the day',
      te: 'సాయంత్రం బులెటిన్: ఈరోజు ముఖ్య వార్తలు',
    },
    description: {
      en: 'Full bulletin covering politics, cities, and weather.',
      te: 'రాజకీయాలు, నగరాలు, వాతావరణం — పూర్తి బులెటిన్.',
    },
    duration: '18:42',
    category: { en: 'Bulletin', te: 'బులెటిన్' },
    source: 'tv',
    publishedLabel: { en: '2 hours ago', te: '2 గంటల క్రితం' },
    accent: 'linear-gradient(135deg, #D71920 0%, #111111 100%)',
  },
  {
    id: '2',
    slug: 'city-flood-alert',
    title: {
      en: 'City flood alert: What residents must know',
      te: 'నగర వరద హెచ్చరిక: పౌరులు తెలుసుకోవాల్సినవి',
    },
    description: {
      en: 'On-ground report from affected localities.',
      te: 'ప్రభావిత ప్రాంతాల నుంచి గ్రౌండ్ రిపోర్ట్.',
    },
    duration: '08:15',
    category: { en: 'Cities', te: 'నగరాలు' },
    source: 'website',
    publishedLabel: { en: '4 hours ago', te: '4 గంటల క్రితం' },
    accent: 'linear-gradient(135deg, #8f1016 0%, #2a2a2a 100%)',
  },
  {
    id: '3',
    slug: 'assembly-highlights',
    title: {
      en: 'Assembly highlights: Key debates today',
      te: 'అసెంబ్లీ హైలైట్స్: ఈరోజు ముఖ్య చర్చలు',
    },
    description: {
      en: 'Clips from the floor and expert reaction.',
      te: 'అసెంబ్లీ క్లిప్స్ మరియు నిపుణుల స్పందన.',
    },
    duration: '12:03',
    category: { en: 'Politics', te: 'రాజకీయాలు' },
    source: 'youtube',
    publishedLabel: { en: '6 hours ago', te: '6 గంటల క్రితం' },
    accent: 'linear-gradient(135deg, #111111 0%, #D71920 80%)',
  },
  {
    id: '4',
    slug: 'sports-roundup',
    title: {
      en: 'Sports roundup: Match of the week',
      te: 'స్పోర్ట్స్ రౌండప్: ఈ వారం మ్యాచ్',
    },
    description: {
      en: 'Scores, moments, and post-match analysis.',
      te: 'స్కోర్లు, కీలక క్షణాలు, విశ్లేషణ.',
    },
    duration: '09:50',
    category: { en: 'Sports', te: 'క్రీడలు' },
    source: 'youtube',
    publishedLabel: { en: 'Yesterday', te: 'నిన్న' },
    accent: 'linear-gradient(135deg, #3a0a0c 0%, #D71920 100%)',
  },
  {
    id: '5',
    slug: 'tech-gadgets-minute',
    title: {
      en: 'Tech in 60 seconds',
      te: '60 సెకన్లలో టెక్',
    },
    description: {
      en: 'Quick gadget and app updates.',
      te: 'గాడ్జెట్ మరియు యాప్ అప్‌డేట్స్.',
    },
    duration: '0:58',
    category: { en: 'Tech', te: 'టెక్' },
    source: 'youtube',
    isShort: true,
    publishedLabel: { en: '1 hour ago', te: '1 గంట క్రితం' },
    accent: 'linear-gradient(180deg, #D71920 0%, #111111 100%)',
  },
  {
    id: '6',
    slug: 'street-voice',
    title: {
      en: 'Street voice: Public reaction',
      te: 'వీధి స్వరం: ప్రజా స్పందన',
    },
    description: {
      en: 'Short interviews from the ground.',
      te: 'గ్రౌండ్ నుంచి చిన్న ఇంటర్వ్యూలు.',
    },
    duration: '0:45',
    category: { en: 'Viral', te: 'వైరల్' },
    source: 'youtube',
    isShort: true,
    publishedLabel: { en: '3 hours ago', te: '3 గంటల క్రితం' },
    accent: 'linear-gradient(180deg, #111111 20%, #D71920 100%)',
  },
  {
    id: '7',
    slug: 'weather-alert-short',
    title: {
      en: 'Weather alert — watch now',
      te: 'వాతావరణ హెచ్చరిక — ఇప్పుడే చూడండి',
    },
    description: {
      en: 'Rain forecast for coastal districts.',
      te: 'తీర ప్రాంతాలకు వర్ష సూచన.',
    },
    duration: '0:36',
    category: { en: 'Weather', te: 'వాతావరణం' },
    source: 'website',
    isShort: true,
    publishedLabel: { en: '5 hours ago', te: '5 గంటల క్రితం' },
    accent: 'linear-gradient(180deg, #6b0f14 0%, #1a1a1a 100%)',
  },
  {
    id: '8',
    slug: 'market-open',
    title: {
      en: 'Markets open: What moved today',
      te: 'మార్కెట్ ఓపెన్: ఈరోజు మార్పులు',
    },
    description: {
      en: 'Indices, stocks, and commodity watch.',
      te: 'సూచీలు, స్టాక్స్, కమోడిటీలు.',
    },
    duration: '06:22',
    category: { en: 'Business', te: 'వ్యాపారం' },
    source: 'website',
    publishedLabel: { en: 'Today', te: 'ఈరోజు' },
    accent: 'linear-gradient(135deg, #D71920 10%, #444 100%)',
  },
]

export const LIVE_PLAYLIST: VideoItem[] = [
  SAMPLE_VIDEOS[0],
  SAMPLE_VIDEOS[1],
  SAMPLE_VIDEOS[2],
  SAMPLE_VIDEOS[3],
]

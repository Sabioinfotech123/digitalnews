export const speech = {
  listen: 'ఈ వ్యాసాన్ని వినండి',
  resume: 'కొనసాగించు',
  pause: 'పాజ్',
  stop: 'ఆపు',
  previous: 'మునుపటి',
  next: 'తదుపరి',
  speed: 'వేగం',
  minListen: 'నిమి వినడం',
  playing: 'ప్లే అవుతోంది',
  paused: 'పాజ్',
  loading: 'ఆడియో సిద్ధం అవుతోంది…',
  enginePolly: 'HD వాయిస్ (క్లౌడ్)',
  engineBrowser: 'డివైస్ వాయిస్',
  notSupported: 'ఈ బ్రౌజర్‌లో వినడం మద్దతు లేదు.',
  noTeluguVoice:
    'ఈ పరికరంలో తెలుగు వాయిస్ లేదు. తెలుగు కోసం APIలో AWS Polly అవసరం (Run.txt చూడండి).',
  teRequiresPolly:
    'తెలుగు వినడానికి backend/.envలో AWS Polly (S3 keys + polly:SynthesizeSpeech) అవసరం. API restart చేయండి.',
  invalidAwsCredentials:
    'backend/.envలో AWS keys చెల్లనివి లేదా expired. keys మార్చి API restart చేయండి.',
  pollyAccessDenied:
    'IAM userకు polly:SynthesizeSpeech permission లేదు (docs/aws-s3-iam-policy.json).',
  noVoice: 'ఈ భాషకు వాయిస్ అందుబాటులో లేదు.',
  pollyFailed: 'క్లౌడ్ ఆడియో లోడ్ కాలేదు. AWS Polly లేదా మళ్లీ ప్రయత్నించండి.',
  browserFailed: 'ప్లేబ్యాక్ ఆగిపోయింది.',
  playBlocked: 'మళ్లీ ప్లే నొక్కండి — బ్రౌజర్ ఆటోప్లే నిరోధించింది.',
} as const

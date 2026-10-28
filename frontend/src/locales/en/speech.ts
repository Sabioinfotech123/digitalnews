export const speech = {
  listen: 'Listen to this article',
  resume: 'Resume',
  pause: 'Pause',
  stop: 'Stop',
  previous: 'Previous',
  next: 'Next',
  speed: 'Speed',
  minListen: 'min listen',
  playing: 'Playing',
  paused: 'Paused',
  loading: 'Preparing audio…',
  enginePolly: 'HD voice (cloud)',
  engineBrowser: 'Device voice',
  notSupported: 'Listening is not supported in this browser.',
  noTeluguVoice:
    'No Telugu voice on this device. Telugu uses cloud HD voice — enable AWS Polly on the API (see Run.txt).',
  teRequiresPolly:
    'Telugu listen needs AWS Polly on the backend (same keys as S3 + polly:SynthesizeSpeech). Restart the API after updating backend/.env.',
  invalidAwsCredentials:
    'AWS keys in backend/.env are invalid or expired. Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, then restart the API.',
  pollyAccessDenied:
    'AWS user can reach Polly but lacks permission. Add polly:SynthesizeSpeech to the IAM policy (docs/aws-s3-iam-policy.json).',
  noVoice: 'No voice is available for this language on this device.',
  pollyFailed: 'Could not load cloud audio. Check AWS Polly access or try again.',
  browserFailed: 'Playback stopped unexpectedly.',
  playBlocked: 'Tap play again — your browser blocked autoplay.',
} as const

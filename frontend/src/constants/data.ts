export const MOODS = [
  { label: 'Calm', emoji: '🌊', color: '#5BB8D4' },
  { label: 'Balanced', emoji: '⚖️', color: '#78C5A0' },
  { label: 'Joyful', emoji: '☀️', color: '#F0C96A' },
  { label: 'Motivated', emoji: '🔥', color: '#FF8C42' },
  { label: 'Chaotic', emoji: '🌪️', color: '#C4622D' },
  { label: 'Overwhelmed', emoji: '🌊', color: '#7B6EAF' },
  { label: 'Anxious', emoji: '💭', color: '#A8A0C8' },
  { label: 'Stressed', emoji: '⚡', color: '#E05C5C' },
  { label: 'Sad', emoji: '🌧️', color: '#6B9DC2' },
];

export const RESET_CARDS: Record<string, { quote: string; tip: string; focus: string }> = {
  Calm: {
    quote: 'Because I can be the peace the world needs to feel.',
    tip: 'Savor this stillness — let it anchor into your body through slow, deliberate breath.',
    focus: 'Gratitude · Somatic Grounding',
  },
  Balanced: {
    quote: 'My progress shines even in silence.',
    tip: 'Acknowledge your nervous system's wisdom in finding center. Continue with mindful intention.',
    focus: 'Self-Compassion · Regulation',
  },
  Joyful: {
    quote: 'I am worthy of all the good things coming my way.',
    tip: 'Let joy move through your body — shake your hands, feel your feet. Share this energy.',
    focus: 'Somatic Joy · Expansion',
  },
  Motivated: {
    quote: 'I channel my fire with focused intention.',
    tip: 'Harness this energy constructively. Set one clear intention and move from your body first.',
    focus: 'Embodied Action · Purpose',
  },
  Chaotic: {
    quote: 'I breathe in peace, I breathe out chaos.',
    tip: 'Box breathing: inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 4 cycles to regulate.',
    focus: 'Nervous System · Prioritization',
  },
  Overwhelmed: {
    quote: 'I set boundaries with love and strength.',
    tip: 'Name 5 things you can see. Feel your feet on the floor. You are safe in this moment.',
    focus: 'DBT Grounding · Boundaries',
  },
  Anxious: {
    quote: 'This feeling is temporary, and I am safe.',
    tip: '5-4-3-2-1: 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.',
    focus: 'Somatic Safety · Presence',
  },
  Stressed: {
    quote: 'I choose calm over chaos.',
    tip: 'Place one hand on heart, one on belly. Feel the warmth. Sigh it out audibly.',
    focus: 'Co-regulation · Stress Release',
  },
  Sad: {
    quote: 'I honor my feelings — they carry wisdom.',
    tip: 'Grief is love with nowhere to go. Let yourself feel it fully for 90 seconds — it will pass.',
    focus: 'Emotional Processing · Self-Compassion',
  },
};

export const DEFAULT_AFFIRMATIONS = [
  'I am the peace the world needs to feel.',
  'My progress shines even in silence.',
  'I set boundaries with love and strength.',
  'I am worthy of all the good things coming my way.',
  'I honor my body's wisdom in every moment.',
  'I choose calm over chaos, again and again.',
  'I release what no longer serves me.',
  'My healing is happening, even when I cannot see it.',
  'I am deserving of rest, joy, and abundance.',
  'Every breath I take grounds me deeper into my power.',
];

export const DECLUTTER_ITEMS = [
  'Clear one physical surface',
  'Organize one drawer or shelf',
  'Meditate for 5 minutes',
  'Write down worries for 10 minutes',
  'Practice box breathing (4 cycles)',
  'Digital detox — 1 hour off social media',
  'Drink a full glass of water mindfully',
  'Step outside for 5 minutes',
];
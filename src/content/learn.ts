// ---------------------------------------------------------------------------
// Educational copy for the Learn screen and inline rationale tooltips.
// ---------------------------------------------------------------------------

export interface LearnSection {
  id: string;
  icon: string;
  title: string;
  paragraphs: string[];
}

export const LEARN_SECTIONS: LearnSection[] = [
  {
    id: 'why-lmnt',
    icon: '🧂',
    title: 'Why LMNT Citrus Salt & Watermelon Salt',
    paragraphs: [
      'During an extended water fast your body sheds sodium rapidly as insulin falls — the classic cause of the fasting headache, dizziness, and fatigue people wrongly blame on "low blood sugar."',
      'LMNT Citrus Salt and Watermelon Salt are chosen deliberately: they carry sodium, potassium, and magnesium with zero sugar, zero carbohydrates, and no amino acids. That matters because even small amounts of protein or sugar can nudge the mTOR growth pathway and blunt autophagy. These packets keep insulin flat and the fast intact while replacing the electrolytes you lose.',
      'Two packets per day — one with your morning cup, one in the evening — keep sodium steady through the day and overnight, when cramps and headaches most often strike.',
    ],
  },
  {
    id: 'why-magnesium',
    icon: '🧬',
    title: 'Why BioEmblem Triple Magnesium',
    paragraphs: [
      'BioEmblem Triple Magnesium combines three highly bioavailable forms — glycinate, malate, and citrate. Glycinate calms the nervous system and supports sleep, malate supports cellular energy, and citrate aids absorption.',
      'Magnesium is one of the first minerals depleted during a fast, and low magnesium is a leading driver of muscle cramps and restless, poor sleep. A capsule with each electrolyte cup keeps levels topped up without any calories, sugar, or protein — so it never breaks the fast.',
    ],
  },
  {
    id: 'why-coffee',
    icon: '☕',
    title: 'Why black coffee is allowed (before 2 PM)',
    paragraphs: [
      'Black coffee — no milk, cream, or sugar — contains only 2–5 calories and does not break a fast. If anything, it supports it: coffee’s chlorogenic acid helps suppress mTOR and its caffeine activates AMPK, the same cellular energy sensor that drives autophagy.',
      'The one rule is timing. Caffeine has a 5–6 hour half-life, so a cup at 2 PM can still be circulating at bedtime, fragmenting deep sleep. Puranova hard-caps every coffee window at 2:00 PM so you get the fast-supporting benefits without sabotaging the recovery that happens while you sleep.',
      'The moment you add milk, cream, or sweetener you introduce protein and sugar — which spikes insulin and shuts down autophagy. Keep it black.',
    ],
  },
  {
    id: 'hydration-math',
    icon: '💧',
    title: 'How your water target is calculated',
    paragraphs: [
      'Your daily fluid baseline is your body weight in pounds × 0.45, in ounces — a modified high-end target designed to offset the extra metabolic and fluid demands of a multi-day fast.',
      'That total is divided by your container size to give a whole number of cups, spread across your waking hours and anchored to your own wake and sleep times. Cup 1 and your evening cup carry the electrolytes and magnesium; the cups between are plain water; a final optional cup is an overnight buffer you can skip if it disturbs sleep.',
    ],
  },
  {
    id: 'projection',
    icon: '📉',
    title: 'How your weight projection works',
    paragraphs: [
      'Your projected loss is the sum of three separate processes, each modeled from fasting research. First, glycogen and its water: your liver and muscles store roughly 400–500 grams of carbohydrate, and every gram holds 3–4 grams of water with it. That whole pool — several pounds — drains quickly at first and is mostly gone by hour 24 to 36. Second, your digestive tract finishes clearing what was already in transit over the first day and a half. Third, fat: your body burns its daily energy from stored fat, at roughly 3,500 calories per pound.',
      'Your daily burn is estimated from your weight using a power law, not a straight line — because a heavier body does not burn proportionally more. A simple "calories per pound" rule badly overestimates larger bodies; the curve Puranova uses is validated for higher body weights and gives a realistic figure.',
      'This is also why the app shows two different numbers. The big projected loss is scale weight — real, but mostly glycogen water that returns after you refeed. The violet "stays off" number is the fat portion: the honest, keep-it-off figure. We show both because trust matters more than hype.',
      'The dashed target line is set once, from your starting weight, the moment your fast begins — and it never moves. It is the goal you race, not a forecast that chases you. What updates with every weigh-in is your position against it: the app compares your actual loss to the target at that same hour and tells you exactly how many pounds ahead or behind you are.',
    ],
  },
  {
    id: 'stages',
    icon: '🔬',
    title: 'The stages of a 72-hour fast',
    paragraphs: [
      'Hours 0–12: insulin falls and your liver releases stored glycogen. Hours 12–24: glycogen runs low, fat becomes the dominant fuel, and the "metabolic switch" flips toward ketone production.',
      'Hours 24–48: ketosis deepens and autophagy ramps up — cells recycle damaged proteins and worn-out mitochondria as mTOR stays suppressed. Hours 48–72: growth hormone rises to protect lean muscle, and prolonged fasting begins triggering immune-cell turnover and stem-cell activation.',
      'These transitions are anchored to hours elapsed, not to the length of your fast — so a 24-hour fast and a 72-hour fast pass the same early milestones at the same clock times.',
    ],
  },
  {
    id: 'refeed',
    icon: '🍳',
    title: 'Breaking the fast — the refeed protocol',
    paragraphs: [
      'How you break a long fast matters as much as the fast itself. Start gently: 1–2 cups of bone broth or a single soft-boiled egg wakes the resting digestive tract with easy protein and minimal insulin response.',
      'Then wait. Puranova locks a mandatory 45-minute window before your first solid meal — enough time for the gut to come back online. When it unlocks, eat clean protein and healthy fats, going easy on carbohydrates and total volume. Overloading a rested digestive system is the fastest way to feel terrible after a great fast.',
    ],
  },
];

export const SAFETY_DISCLAIMER =
  'Puranova is an educational and tracking tool, not medical advice. Extended fasting is not appropriate for everyone — including people who are pregnant or breastfeeding, under 18, underweight, or managing diabetes, blood-pressure, or other conditions, or taking medication affected by fasting. Talk to a qualified physician before beginning an extended fast, and stop and seek care if you feel faint, have heart palpitations, or become unwell.';

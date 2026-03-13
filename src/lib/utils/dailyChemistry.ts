// ══════════════════════════════════════════════════════════
// Daily Chemistry Score Engine
// Deterministic daily score for any two birth data sets.
// Changes daily, consistent for same inputs on same day.
// ══════════════════════════════════════════════════════════

interface BirthData {
  year: number;
  month: number;
  day: number;
}

type ChemistryStatus = "harmony" | "volatile" | "danger";

interface DailyChemistry {
  score: number; // 1-100
  status: ChemistryStatus;
  message: string;
}

const HARMONY_MESSAGES = [
  "Energy alignment is strong today. Lean in.",
  "The frequencies resonate. Great day for deep conversation.",
  "Your energies amplify each other. Make the most of today.",
  "Cosmic support is peaking. Trust the connection.",
  "Both forces are in sync. Rare alignment — don't waste it.",
];

const VOLATILE_MESSAGES = [
  "Mixed signals today. Tread carefully.",
  "Energy is unpredictable. Stay flexible and observant.",
  "Friction is brewing beneath the surface. Stay grounded.",
  "Not the day for big decisions together. Wait it out.",
  "The balance is fragile. Small gestures go a long way.",
];

const DANGER_MESSAGES = [
  "High friction. Do not initiate contact.",
  "Energy clash detected. Give each other space today.",
  "Forces are opposing. Avoid confrontation at all costs.",
  "The worst day this cycle for this connection. Lay low.",
  "Cosmic tension is maxed. Silence is your best move.",
];

/** Simple deterministic hash from string → number */
function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

export function getDailyChemistry(
  userBirth: BirthData,
  targetBirth: BirthData,
  date: Date = new Date()
): DailyChemistry {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const hashInput = [
    userBirth.year, userBirth.month, userBirth.day,
    targetBirth.year, targetBirth.month, targetBirth.day,
    dateStr,
  ].join("-");

  const hash = simpleHash(hashInput);
  const score = (hash % 100) + 1; // 1-100

  let status: ChemistryStatus;
  let messages: string[];

  if (score >= 70) {
    status = "harmony";
    messages = HARMONY_MESSAGES;
  } else if (score >= 40) {
    status = "volatile";
    messages = VOLATILE_MESSAGES;
  } else {
    status = "danger";
    messages = DANGER_MESSAGES;
  }

  const message = messages[score % 5];

  return { score, status, message };
}

import type { PaymentMethod, Transaction, TransactionStatus } from './types';

/** Last day of the dataset. Fixed so the demo (and the tests) always show the same numbers. */
export const ANCHOR_DAY = '2026-10-31';

const DAY_MS = 86_400_000;
const HISTORY_DAYS = 180;

const FIRST_NAMES = [
  'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Lucas', 'Sophia', 'Mateo', 'Mia', 'Ethan',
  'Isabella', 'Leo', 'Amelia', 'Hugo', 'Chloe', 'Daniel', 'Nora', 'Gabriel', 'Lena', 'Samuel',
];
const LAST_NAMES = [
  'Smith', 'Garcia', 'Silva', 'Müller', 'Johnson', 'Rossi', 'Brown', 'Costa', 'Martin', 'Lee',
  'Novak', 'Walker', 'Santos', 'Dubois', 'Kim', 'Nielsen', 'Clark', 'Moreau', 'Lopez', 'Weber',
];

const METHOD_WEIGHTS: Record<PaymentMethod, number> = {
  card_credit: 0.45,
  card_debit: 0.25,
  bank_transfer: 0.18,
  wallet: 0.12,
};

const STATUS_WEIGHTS: Record<TransactionStatus, number> = {
  approved: 0.88,
  declined: 0.07,
  pending: 0.03,
  refunded: 0.02,
};

/** Small seeded PRNG (mulberry32): same seed, same dataset. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pickWeighted<T extends string>(random: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  let roll = random();
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

/**
 * Generates ~14k realistic-looking transactions over the 180 days ending at ANCHOR_DAY:
 * weekday/weekend seasonality, steady growth and a log-normal ticket size.
 * Returned newest first.
 */
export function generateTransactions(seed = 42): Transaction[] {
  const random = createRandom(seed);
  const gaussian = () => {
    const u = 1 - random();
    const v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const lastDayStart = Date.parse(`${ANCHOR_DAY}T00:00:00Z`);
  const transactions: Transaction[] = [];
  let sequence = 0;

  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const dayStart = lastDayStart - daysAgo * DAY_MS;
    const date = new Date(dayStart);
    const weekday = date.getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const growth = 1 + ((HISTORY_DAYS - daysAgo) / HISTORY_DAYS) * 0.35;
    const count = Math.max(10, Math.round((isWeekend ? 45 : 70) * growth + gaussian() * 8));
    const day = date.toISOString().slice(0, 10);

    for (let i = 0; i < count; i++) {
      sequence++;
      transactions.push({
        id: `TX-${100_000 + sequence}`,
        timestamp: dayStart + Math.floor(random() * DAY_MS),
        day,
        amountCents: Math.max(150, Math.round(Math.exp(3.7 + 0.85 * gaussian()) * 100)),
        customer: `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`,
        method: pickWeighted(random, METHOD_WEIGHTS),
        status: pickWeighted(random, STATUS_WEIGHTS),
      });
    }
  }

  return transactions.sort((a, b) => b.timestamp - a.timestamp);
}

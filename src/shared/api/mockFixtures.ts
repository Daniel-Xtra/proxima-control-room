/** Deterministic fixtures shared by the mock APIs so ids line up across features. */
export function seeded(seed: number) {
  // Scramble the seed first: neighbouring seeds otherwise give near-identical first values.
  let state = Math.imul(seed + 1, 2654435761) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** UUID-shaped id. URLs never carry numeric ids or sensitive values. */
export function fixtureId(group: number, index: number): string {
  const g = group.toString(16).padStart(4, "0");
  const i = index.toString(16).padStart(8, "0");
  return `00000000-0000-4000-8000-${g}${i}`;
}

const FIRST = [
  "Adaeze",
  "Chinedu",
  "Funke",
  "Ibrahim",
  "Ngozi",
  "Tunde",
  "Zainab",
  "Emeka",
  "Halima",
  "Kemi",
  "Segun",
  "Aisha",
  "Obinna",
  "Bisi",
  "Yusuf",
  "Amara",
];
const LAST = [
  "Okafor",
  "Adeyemi",
  "Bello",
  "Nwosu",
  "Balogun",
  "Eze",
  "Lawal",
  "Ogunleye",
  "Mohammed",
  "Okonkwo",
  "Salami",
  "Umar",
];

export interface FixtureCustomer {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
}

export const FIXTURE_CUSTOMERS: FixtureCustomer[] = Array.from({ length: 60 }, (_, index) => {
  const rand = seeded(1000 + index);
  const firstName = FIRST[index % FIRST.length]!;
  const lastName = LAST[Math.floor(rand() * LAST.length)]!;
  const prefix = ["0803", "0805", "0813", "0902", "0706"][index % 5]!;
  const digits = String(Math.floor(rand() * 9_000_000) + 1_000_000);
  return {
    id: fixtureId(1, index + 1),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    phone: `${prefix}${digits}`,
    email: `${firstName}.${lastName}${index + 1}@example.com`.toLowerCase(),
  };
});

export function fixtureCustomer(id: string): FixtureCustomer | undefined {
  return FIXTURE_CUSTOMERS.find((customer) => customer.id === id);
}

/** Days ago as an ISO string, anchored on the app's "today" for stable mock data. */
export function daysAgo(days: number, hour = 10): string {
  const base = new Date("2026-11-15T00:00:00.000Z");
  base.setUTCDate(base.getUTCDate() - days);
  base.setUTCHours(hour, 0, 0, 0);
  return base.toISOString();
}

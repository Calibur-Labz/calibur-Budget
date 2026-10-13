export interface Category {
  name: string;
  /** Key into the icon registry in components/CategoryIcon */
  icon: string;
  /** 1–8, picks the --series-N colour */
  slot: number;
}

export const ICON_NAMES = [
  "food",
  "transport",
  "groceries",
  "bills",
  "shopping",
  "health",
  "fun",
  "other",
  "home",
  "fuel",
  "coffee",
  "travel",
  "gift",
  "education",
  "fitness",
  "phone",
  "pets",
  "clothes",
] as const;

export const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const MAX_CATEGORIES = 12;

export const DEFAULT_CATEGORIES: Category[] = [
  { name: "Food", icon: "food", slot: 1 },
  { name: "Transport", icon: "transport", slot: 2 },
  { name: "Groceries", icon: "groceries", slot: 3 },
  { name: "Bills", icon: "bills", slot: 4 },
  { name: "Shopping", icon: "shopping", slot: 5 },
  { name: "Health", icon: "health", slot: 6 },
  { name: "Fun", icon: "fun", slot: 7 },
  { name: "Other", icon: "other", slot: 8 },
];

export const CURRENCIES = ["LKR", "USD", "EUR", "GBP", "INR", "AUD", "NZD", "CAD", "SGD", "JPY"] as const;

export function findCategory(categories: Category[], name: string): Category | undefined {
  return categories.find((c) => c.name === name);
}

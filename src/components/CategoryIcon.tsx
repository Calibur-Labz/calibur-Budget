import {
  Bus,
  Coffee,
  Dumbbell,
  Ellipsis,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  PartyPopper,
  PawPrint,
  Plane,
  ReceiptText,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/categories";

const ICONS: Record<string, LucideIcon> = {
  food: Utensils,
  transport: Bus,
  groceries: ShoppingBasket,
  bills: ReceiptText,
  shopping: ShoppingBag,
  health: HeartPulse,
  fun: PartyPopper,
  other: Ellipsis,
  home: House,
  fuel: Fuel,
  coffee: Coffee,
  travel: Plane,
  gift: Gift,
  education: GraduationCap,
  fitness: Dumbbell,
  phone: Smartphone,
  pets: PawPrint,
  clothes: Shirt,
};

export function slotColor(slot: number | undefined): string {
  return slot ? `var(--series-${slot})` : "var(--muted)";
}

/** Round colour chip with the category's icon. Unknown categories fall back to grey. */
export function CategoryIcon({
  category,
  size = 40,
}: {
  category: Pick<Category, "icon" | "slot"> | undefined;
  size?: number;
}) {
  const Icon = ICONS[category?.icon ?? "other"] ?? Ellipsis;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{ width: size, height: size, background: slotColor(category?.slot) }}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.48)} strokeWidth={2.2} />
    </span>
  );
}

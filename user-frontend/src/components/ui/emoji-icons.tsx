import type { ComponentType } from "react";

type EmojiIconProps = {
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
  role?: string;
  title?: string;
};

function createIcon(emoji: string): ComponentType<EmojiIconProps> {
  function EmojiIcon({
    className,
    "aria-hidden": ariaHidden = true,
    role,
    title,
  }: EmojiIconProps) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center leading-none ${className ?? ""}`}
        aria-hidden={ariaHidden}
        role={role}
        title={title}
      >
        {emoji}
      </span>
    );
  }

  EmojiIcon.displayName = `EmojiIcon(${emoji})`;
  return EmojiIcon;
}

export const ArrowUp = createIcon("⬆️");
export const Check = createIcon("✅");
export const ChevronDown = createIcon("🔽");
export const ChevronLeft = createIcon("⬅️");
export const ChevronRight = createIcon("➡️");
export const Heart = createIcon("❤️");
export const Headphones = createIcon("🎧");
export const KeyRound = createIcon("🔑");
export const Loader2 = createIcon("⏳");
export const Lock = createIcon("🔒");
export const Mail = createIcon("✉️");
export const MapPin = createIcon("📍");
export const Minus = createIcon("➖");
export const Moon = createIcon("🌙");
export const Package = createIcon("📦");
export const Phone = createIcon("📞");
export const Pause = createIcon("⏸️");
export const Play = createIcon("▶️");
export const Plus = createIcon("➕");
export const Search = createIcon("🔍");
export const ShieldCheck = createIcon("🛡️");
export const Settings2 = createIcon("⚙️");
export const ShoppingBag = createIcon("🛍️");
export const ShoppingCart = createIcon("🛒");
export const Star = createIcon("⭐");
export const Sun = createIcon("☀️");
export const Trash2 = createIcon("🗑️");
export const User = createIcon("👤");
export const UserRound = createIcon("👤");
export const X = createIcon("✖️");

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

export const AlertTriangle = createIcon("⚠️");
export const ArrowDown = createIcon("⬇️");
export const ArrowUp = createIcon("⬆️");
export const ArrowUpRight = createIcon("↗️");
export const BarChart3 = createIcon("📊");
export const Bell = createIcon("🔔");
export const Boxes = createIcon("📦");
export const Check = createIcon("✅");
export const ChevronDown = createIcon("🔽");
export const Download = createIcon("⬇️");
export const Eye = createIcon("👁️");
export const GripVertical = createIcon("↕️");
export const LayoutDashboard = createIcon("📋");
export const Loader2 = createIcon("⏳");
export const Menu = createIcon("☰");
export const Monitor = createIcon("🖥️");
export const Moon = createIcon("🌙");
export const Package = createIcon("📦");
export const PanelLeftClose = createIcon("◀️");
export const PanelLeftOpen = createIcon("▶️");
export const PanelsTopLeft = createIcon("🗂️");
export const Pencil = createIcon("✏️");
export const Plus = createIcon("➕");
export const RotateCcw = createIcon("🔄");
export const Save = createIcon("💾");
export const Search = createIcon("🔍");
export const Settings = createIcon("⚙️");
export const Settings2 = createIcon("⚙️");
export const ShoppingBag = createIcon("🛍️");
export const ShoppingCart = createIcon("🛒");
export const Sun = createIcon("☀️");
export const Tag = createIcon("🏷️");
export const Trash2 = createIcon("🗑️");
export const TrendingUp = createIcon("📈");
export const Upload = createIcon("⬆️");
export const UserCog = createIcon("👤⚙️");
export const Users = createIcon("👥");
export const Wallet = createIcon("💳");
export const X = createIcon("✖️");

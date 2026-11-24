import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  /** Visual height of the logo image in pixels */
  height?: number;
  priority?: boolean;
  showAdminLabel?: boolean;
};

export function Logo({
  href = "/",
  className = "",
  height = 40,
  priority = true,
  showAdminLabel = true,
}: LogoProps) {
  const width = Math.round(height * (2042 / 768));

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label="Afiya Shope Admin home"
    >
      <Image
        src="/images/logo_v2005.png"
        alt="Afiya Shope"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto rounded-md object-contain"
        style={{ height, width: "auto" }}
      />
      {showAdminLabel ? (
        <span className="hidden text-sm font-medium uppercase tracking-wider text-muted-foreground sm:inline">
          Admin
        </span>
      ) : null}
    </Link>
  );
}

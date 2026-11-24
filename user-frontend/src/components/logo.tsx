import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  height?: number;
  priority?: boolean;
};

export function Logo({
  href = "/",
  className = "",
  height = 40,
  priority = true,
}: LogoProps) {
  const width = Math.round(height * (2042 / 768));

  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="Afiya Shope home"
    >
      <Image
        src="/images/logo_v2005.png"
        alt="Afiya Shope"
        width={width}
        height={height}
        priority={priority}
        className="rounded-md object-contain"
        style={{ width: "auto", height }}
      />
    </Link>
  );
}

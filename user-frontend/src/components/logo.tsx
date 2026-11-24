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
  const width = Math.round(height * (2045 / 769));

  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="Afiya Shope home"
    >
      <Image
        src="/images/afiyashope_logo.png"
        alt="Afiya Shope"
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className="rounded-md object-contain"
        style={{ width: "auto", height }}
      />
    </Link>
  );
}

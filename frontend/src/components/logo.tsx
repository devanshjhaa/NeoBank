import Link from "next/link";

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className = "" }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="72" cy="60" r="42" fill="#2563EB" />
      <circle cx="82" cy="38" r="5" fill="white" />
      <circle cx="92" cy="56" r="4" fill="white" />
      <circle cx="82" cy="72" r="6" fill="white" />
      <rect x="38" y="30" width="34" height="8" rx="4" fill="#2563EB" />
      <rect x="22" y="42" width="42" height="8" rx="4" fill="#2563EB" />
      <rect x="30" y="54" width="30" height="8" rx="4" fill="#2563EB" />
      <rect x="16" y="66" width="44" height="8" rx="4" fill="#2563EB" />
      <rect x="38" y="78" width="28" height="8" rx="4" fill="#2563EB" />
      <rect x="38" y="30" width="34" height="8" rx="4" fill="white" fillOpacity="0" />
      <rect x="30" y="30" width="5" height="8" rx="2.5" fill="#2563EB" />
      <rect x="12" y="42" width="6" height="8" rx="3" fill="#2563EB" />
      <rect x="20" y="54" width="5" height="8" rx="2.5" fill="#2563EB" />
      <rect x="6" y="66" width="6" height="8" rx="3" fill="#2563EB" />
      <rect x="28" y="78" width="5" height="8" rx="2.5" fill="#2563EB" />
    </svg>
  );
}

interface LogoProps {
  href?: string;
  size?: number;
  textClassName?: string;
  className?: string;
  showText?: boolean;
}

export function Logo({
  href = "/",
  size = 32,
  textClassName = "font-bold text-xl text-slate-900 tracking-tight",
  className = "",
  showText = true,
}: LogoProps) {
  const content = (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={size} />
      {showText && <span className={textClassName}>NeoBank</span>}
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

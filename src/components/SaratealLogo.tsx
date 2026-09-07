type SaratealLogoSize = "nav" | "hero" | "footer" | "state" | "default";

interface SaratealLogoProps {
  size?: SaratealLogoSize;
  className?: string;
}

export function SaratealLogo({ size = "default", className }: SaratealLogoProps) {
  return <span className={className ? `${className} sarateal-logo is-${size}` : `sarateal-logo is-${size}`}>Sarateal</span>;
}
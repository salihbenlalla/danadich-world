import styles from "./GlassCard.module.css";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
}

export default function GlassCard({
  children,
  className,
  onClick,
  glow = false,
}: GlassCardProps) {
  return (
    <div
      className={`${styles.card} ${glow ? styles.glow : ""} ${className || ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

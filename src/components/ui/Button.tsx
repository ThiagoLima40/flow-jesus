import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

type Variant = "pink" | "outline" | "yellow";

const variantClass: Record<Variant, string> = {
  pink: "btn-pink",
  outline: "btn-outline",
  yellow: "btn-yellow",
};

export function Button({
  children,
  href,
  variant = "pink",
  arrow = true,
  onClick,
  type = "button",
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  arrow?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  ariaLabel?: string;
}) {
  const cls = `btn ${variantClass[variant]} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      {arrow && <ArrowRight className="h-4 w-4" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

import { cn } from "@/lib/utils"
import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Avatar/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 19
//
// INVARIANTS (meta.yaml):
//   rounded-full always
//   bg-muted fallback background
//   text-muted-foreground fallback text color

type AvatarSize = "sm" | "md" | "lg"

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
}

/** Extracts up to two initials from a display name */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

interface AvatarProps {
  /** Display name used for fallback initials and alt text */
  name: string
  /** URL to the avatar image */
  src?: string
  size?: AvatarSize
  className?: string
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: AvatarProps) {
  return (
    <ShadcnAvatar
      className={cn(
        "rounded-full",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="rounded-full bg-muted text-muted-foreground font-semibold">
        {getInitials(name)}
      </AvatarFallback>
    </ShadcnAvatar>
  )
}

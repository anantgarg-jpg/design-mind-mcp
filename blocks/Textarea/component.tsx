import { cn } from "@/lib/utils"
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Textarea/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20
//
// INVARIANTS (meta.yaml):
//   Root: rounded-md border border-input bg-background px-3 py-2 text-base
//   Focus: focus-visible:ring-2 ring-ring
//   Min height: min-h-[80px]

interface TextareaProps {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  /** Displays border-destructive when true (rule 13) */
  error?: boolean
  disabled?: boolean
  rows?: number
  className?: string
}

export function Textarea({
  value,
  onChange,
  placeholder,
  error = false,
  disabled = false,
  rows = 3,
  className,
}: TextareaProps) {
  return (
    <ShadcnTextarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={cn(
        "rounded-md border border-input bg-background px-3 py-2 text-base",
        "min-h-[80px] resize-y",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        error && "border-destructive",
        className,
      )}
    />
  )
}

import { cn } from "@/lib/utils"
import { Switch as ShadcnSwitch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Switch/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Root: h-5 w-9 rounded-full
//   Track: bg-subtle checked:bg-primary
//   Thumb: h-4 w-4 rounded-full bg-card shadow-sm

interface SwitchProps {
  id?: string
  label: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({
  id,
  label,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: SwitchProps) {
  const switchId = id ?? `switch-${label.toLowerCase().replace(/\s+/g, "-")}`

  return (
    <div
      className={cn(
        "flex items-center gap-3 min-h-[44px]", // 44px touch target (rule 21)
        className,
      )}
    >
      <ShadcnSwitch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Label htmlFor={switchId} className="text-base cursor-pointer">
        {label}
      </Label>
    </div>
  )
}

import { cn } from "@/lib/utils"
import {
  InputOTP as ShadcnInputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/InputOTP/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20, 21
//
// INVARIANTS (meta.yaml):
//   Slots: gap-2 between slots
//   Each slot: h-10 w-10 rounded-md border border-input text-center font-mono
//   Min 44px touch target per slot (rule 21)
//   Auto-focus next slot; paste support

interface InputOTPBlockProps {
  /** Total number of character slots (default 6) */
  maxLength?: number
  value?: string
  onChange?: (value: string) => void
  /** When true, applies error styling (border-destructive) */
  error?: boolean
  /** Group sizes for visual grouping (e.g. [3, 3] for 3-3 layout) */
  groups?: number[]
  className?: string
}

export function InputOTPBlock({
  maxLength = 6,
  value,
  onChange,
  error = false,
  groups,
  className,
}: InputOTPBlockProps) {
  // Default: single group with all slots
  const slotGroups = groups ?? [maxLength]

  let slotIndex = 0

  return (
    <ShadcnInputOTP
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      className={cn(className)}
    >
      {slotGroups.map((groupSize, gi) => (
        <div key={gi} className="flex items-center gap-2">
          {gi > 0 && <InputOTPSeparator />}
          <InputOTPGroup className="gap-2">
            {Array.from({ length: groupSize }).map((_, si) => {
              const idx = slotIndex++
              return (
                <InputOTPSlot
                  key={idx}
                  index={idx}
                  className={cn(
                    "h-10 w-10 rounded-md border border-input text-center font-mono text-base",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    error && "border-destructive focus-visible:ring-ring-destructive"
                  )}
                />
              )
            })}
          </InputOTPGroup>
        </div>
      ))}
    </ShadcnInputOTP>
  )
}

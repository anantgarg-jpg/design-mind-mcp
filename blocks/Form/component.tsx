import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Form as FormRoot,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@blocks/Button/component"
import { UseFormReturn, FieldValues } from "react-hook-form"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Form/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 12, 13, 14, 20
//
// INVARIANTS (meta.yaml):
//   Container: flex flex-col gap-4
//   Field: flex flex-col gap-2
//   Error: text-sm text-destructive (rule 13)
//   Submit section: border-t pt-4 mt-4

interface FormLayoutProps<T extends FieldValues> {
  form: UseFormReturn<T>
  onSubmit: (values: T) => void | Promise<void>
  children: React.ReactNode
  /** Label for the primary submit button */
  submitLabel?: string
  /** When true, submit button shows loading state */
  isSubmitting?: boolean
  /** Additional actions rendered beside the submit button */
  secondaryAction?: React.ReactNode
  className?: string
}

export function FormLayout<T extends FieldValues>({
  form,
  onSubmit,
  children,
  submitLabel = "Submit",
  isSubmitting = false,
  secondaryAction,
  className,
}: FormLayoutProps<T>) {
  return (
    <FormRoot {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-4", className)}
      >
        {children}

        {/* Submit section — single primary CTA (rule 14) */}
        <div className="flex items-center gap-3 border-t pt-4 mt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={!form.formState.isValid || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
          {secondaryAction}
        </div>
      </form>
    </FormRoot>
  )
}

// Re-export form field primitives for convenience
export { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage }

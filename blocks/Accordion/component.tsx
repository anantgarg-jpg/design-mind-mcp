import { cn } from "@/lib/utils"
import {
  Accordion as ShadcnAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Accordion/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   border-b border-border dividers between items
//   py-4 vertical padding on each item
//   font-semibold trigger text

interface AccordionItemData {
  /** Unique value used internally to track open state */
  value: string
  /** Heading text rendered in the trigger */
  title: string
  /** Content revealed when the item is expanded */
  children: React.ReactNode
}

interface AccordionProps {
  items: AccordionItemData[]
  /** "single" allows one open at a time; "multiple" allows many */
  type?: "single" | "multiple"
  /** Value of the initially open item (single mode) or items (multiple mode) */
  defaultValue?: string | string[]
  className?: string
}

export function Accordion({
  items,
  type = "single",
  defaultValue,
  className,
}: AccordionProps) {
  const accordionProps =
    type === "single"
      ? { type: "single" as const, collapsible: true, defaultValue: defaultValue as string | undefined }
      : { type: "multiple" as const, defaultValue: defaultValue as string[] | undefined }

  return (
    <ShadcnAccordion {...accordionProps} className={cn("w-full", className)}>
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className="border-b border-border py-0"
        >
          <AccordionTrigger className="py-4 font-semibold text-base hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm text-muted-foreground">
            {item.children}
          </AccordionContent>
        </AccordionItem>
      ))}
    </ShadcnAccordion>
  )
}

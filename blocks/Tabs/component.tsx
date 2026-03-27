import { cn } from "@/lib/utils"
import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Tabs/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 20
//
// INVARIANTS (meta.yaml):
//   Trigger: text-sm font-semibold text-muted-foreground
//   Active: text-foreground border-b-2 border-primary
//   List: border-b border-border

interface TabItem {
  value: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  items: TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  className,
}: TabsProps) {
  const resolvedDefault = defaultValue ?? items[0]?.value

  return (
    <ShadcnTabs
      defaultValue={resolvedDefault}
      value={value}
      onValueChange={onValueChange}
      className={cn(className)}
    >
      <TabsList className="border-b border-border bg-transparent rounded-none w-full justify-start gap-0 h-auto p-0">
        {items.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "text-sm font-semibold text-muted-foreground rounded-none border-b-2 border-transparent",
              "px-4 py-2 min-h-11",
              "data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:shadow-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </ShadcnTabs>
  )
}

import { cn } from "@/lib/utils"
import {
  Command as CommandRoot,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Command/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: rounded-lg shadow-lg z-40 border border-border bg-card
//   Input: h-10 border-b px-3 text-sm
//   Item: py-2 px-3 rounded-md

interface CommandAction {
  /** Unique identifier for the action */
  id: string
  label: string
  /** Optional icon rendered before the label */
  icon?: React.ReactNode
  onSelect: () => void
  /** Keywords for search matching beyond the visible label */
  keywords?: string[]
}

interface CommandGroup {
  heading: string
  actions: CommandAction[]
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: CommandGroup[]
  /** Placeholder text for the search input */
  placeholder?: string
  className?: string
}

export function CommandPalette({
  open,
  onOpenChange,
  groups,
  placeholder = "Type a command or search...",
  className,
}: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandRoot
        className={cn(
          "rounded-lg border border-border bg-card shadow-lg",
          className
        )}
      >
        <CommandInput
          placeholder={placeholder}
          className="h-10 border-b px-3 text-sm"
        />
        <CommandList>
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>
          {groups.map((group, i) => (
            <div key={group.heading}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group.heading}>
                {group.actions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    keywords={action.keywords}
                    onSelect={action.onSelect}
                    className="py-2 px-3 rounded-md min-h-11 flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandRoot>
    </CommandDialog>
  )
}

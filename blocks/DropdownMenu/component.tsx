import { cn } from "@/lib/utils"
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/DropdownMenu/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 19, 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: rounded-md shadow-md z-20 bg-popover py-1 min-w-[8rem]
//   Destructive items: text-destructive
//   Keyboard navigable; never the primary action path

export interface DropdownMenuItemConfig {
  label: string
  /** Optional icon rendered before the label */
  icon?: React.ReactNode
  onClick?: () => void
  /** Marks the item as destructive — rendered in text-destructive */
  destructive?: boolean
  disabled?: boolean
}

export interface DropdownMenuGroupConfig {
  label?: string
  items: DropdownMenuItemConfig[]
}

interface DropdownMenuBlockProps {
  /** Element that opens the menu on click */
  trigger: React.ReactNode
  groups: DropdownMenuGroupConfig[]
  align?: "start" | "center" | "end"
  className?: string
}

export function DropdownMenuBlock({
  trigger,
  groups,
  align = "end",
  className,
}: DropdownMenuBlockProps) {
  return (
    <ShadcnDropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className={cn(
          "rounded-md shadow-md bg-popover py-1 min-w-32",
          className
        )}
      >
        {groups.map((group, gi) => (
          <DropdownMenuGroup key={gi}>
            {group.label && (
              <DropdownMenuLabel className="px-3 py-1.5 text-sm font-semibold text-muted-foreground">
                {group.label}
              </DropdownMenuLabel>
            )}

            {group.items.map((item, ii) => (
              <DropdownMenuItem
                key={ii}
                disabled={item.disabled}
                onClick={item.onClick}
                className={cn(
                  "px-3 py-2 text-base cursor-pointer min-h-11 flex items-center gap-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.destructive && "text-destructive focus:text-destructive"
                )}
              >
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            ))}

            {gi < groups.length - 1 && <DropdownMenuSeparator />}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </ShadcnDropdownMenu>
  )
}

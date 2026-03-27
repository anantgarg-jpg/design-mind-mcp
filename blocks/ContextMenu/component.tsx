import { cn } from "@/lib/utils"
import {
  ContextMenu as ShadcnContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/ContextMenu/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 9, 20, 21
//
// INVARIANTS (meta.yaml):
//   rounded-md shadow-md z-20
//   bg-popover text-popover-foreground
//   py-1 item padding
//   min-w-[8rem]
//
// Actions in context menu must also be reachable through other UI paths.

interface ContextMenuItemData {
  label: string
  onSelect: () => void
  /** Renders item with text-destructive for delete/remove actions */
  destructive?: boolean
  disabled?: boolean
  /** Optional icon rendered before the label */
  icon?: React.ReactNode
}

interface ContextMenuGroup {
  items: ContextMenuItemData[]
}

interface ContextMenuProps {
  /** Element that receives the right-click trigger */
  children: React.ReactNode
  /** Groups of items — separators are rendered between groups */
  groups: ContextMenuGroup[]
  className?: string
}

export function ContextMenu({
  children,
  groups,
  className,
}: ContextMenuProps) {
  return (
    <ShadcnContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        className={cn(
          "rounded-md shadow-md z-20 bg-popover text-popover-foreground min-w-32",
          className,
        )}
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && <ContextMenuSeparator />}
            {group.items.map((item) => (
              <ContextMenuItem
                key={item.label}
                onSelect={item.onSelect}
                disabled={item.disabled}
                className={cn(
                  "py-1 text-sm cursor-pointer min-h-11 flex items-center gap-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.destructive && "text-destructive focus:text-destructive",
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </ContextMenuItem>
            ))}
          </div>
        ))}
      </ContextMenuContent>
    </ShadcnContextMenu>
  )
}

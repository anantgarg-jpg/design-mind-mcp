import { cn } from "@/lib/utils"
import {
  NavigationMenu as ShadcnNavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/NavigationMenu/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19, 20
//
// INVARIANTS (meta.yaml):
//   Layout: flex items-center gap-1
//   Trigger: text-base font-semibold
//   Active item visually distinct (not color-only)
//   Max 5-7 top-level items

export interface NavLinkItem {
  label: string
  href: string
  description?: string
  active?: boolean
}

export interface NavMenuItem {
  label: string
  href?: string
  active?: boolean
  /** Sub-items render as a dropdown panel */
  children?: NavLinkItem[]
}

interface NavigationMenuBlockProps {
  items: NavMenuItem[]
  className?: string
}

export function NavigationMenuBlock({
  items,
  className,
}: NavigationMenuBlockProps) {
  return (
    <ShadcnNavigationMenu className={cn(className)}>
      <NavigationMenuList className="flex items-center gap-1">
        {items.map((item) => (
          <NavigationMenuItem key={item.label}>
            {item.children ? (
              <>
                <NavigationMenuTrigger
                  className={cn(
                    "text-base font-semibold",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    item.active && "text-primary underline underline-offset-4"
                  )}
                >
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  {/* TODO: replace w-96 with design token when nav dropdown width scale is added (was w-[400px] = 400px; w-96 = 384px, closest standard value) */}
                  <ul className="grid gap-3 p-4 w-96">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <NavigationMenuLink
                          href={child.href}
                          className={cn(
                            "block rounded-md p-3 hover:bg-muted",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            child.active && "bg-muted"
                          )}
                        >
                          <div className="text-base font-semibold text-foreground">
                            {child.label}
                          </div>
                          {child.description && (
                            <p className="text-sm text-muted-foreground leading-snug mt-1">
                              {child.description}
                            </p>
                          )}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink
                href={item.href}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "text-base font-semibold",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.active && "text-primary underline underline-offset-4"
                )}
              >
                {item.label}
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </ShadcnNavigationMenu>
  )
}

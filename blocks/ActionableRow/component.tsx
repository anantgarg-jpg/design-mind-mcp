import { cn } from "@/lib/utils"
import { Badge } from "@blocks/Badge/component"
import { Button } from "@blocks/Button/component"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@blocks/DropdownMenu/component"
import { ChevronRight, MoreHorizontal } from "lucide-react"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/ActionableRow/meta.yaml
// Safety:   safety/hard-constraints.md rule 10
//
// STRUCTURAL CONSTRAINTS (frozen):
//   container: row variant → shared bg-card container with divide-y
//              card variant → standalone rounded-lg border
//   interaction: scan-and-act only — no drag, no multi-select, no inline edit
//   slot positions: title always left, primary action always right
//   border-l-2 accent stripe always present on row variant
//   primary action: Button variant outline or default, h-7 text-sm
//
// INVARIANTS:
//   row:  flex items-start gap-3 px-4 py-3.5 border-b border-border/40 last:border-0 bg-card border-l-2
//   card: flex items-start justify-between gap-4 p-4 bg-card border border-border/60 rounded-lg shadow-sm

type StatusKey = string

interface MetaItem {
  icon?: React.ReactNode
  text: string
  urgent?: boolean
  success?: boolean
}

interface SecondaryAction {
  label: string
  onClick: () => void
  destructive?: boolean
}

interface ActionableRowProps {
  variant?: "row" | "card"
  title: string
  titleMono?: boolean
  label?: string
  labelMono?: boolean
  contextLabel?: string
  status?: StatusKey
  accent?: "warning" | "accent" | "success" | "none"
  meta?: MetaItem[]
  primaryAction?: { label: string; onClick: () => void }
  secondaryActions?: SecondaryAction[]
  onExpand?: () => void
  onRowClick?: () => void
  dimmed?: boolean
  className?: string
}

const ACCENT_BORDER: Record<string, string> = {
  warning: "border-l-warning",
  accent:  "border-l-accent",
  success: "border-l-success",
  none:    "border-l-transparent",
}

// What shadcn defaults this overrides: n/a — ActionableRow is a plain <div>.
// VARIANT_CLASSES replaces inline conditional arrays (isRow && [...], isCard && [...]).
// Declaring variants as a named map makes them auditable and overridable via className.
// hover:bg-muted/60 (row) and hover:bg-accent/50 (card) are explicit here rather than inlined.
const VARIANT_CLASSES: Record<"row" | "card", string> = {
  row:  "px-4 py-3.5 bg-card border-b border-border/40 last:border-0 border-l-2 hover:bg-muted/60",
  card: "p-4 bg-card border border-border/60 rounded-lg shadow-sm hover:bg-accent/50",
}

export function ActionableRow({
  variant = "row",
  title,
  titleMono,
  label,
  labelMono,
  contextLabel,
  status,
  accent = "none",
  meta = [],
  primaryAction,
  secondaryActions = [],
  onExpand,
  onRowClick,
  dimmed,
  className,
}: ActionableRowProps) {
  return (
    <div
      role={onRowClick ? "button" : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      onClick={onRowClick}
      onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") onRowClick() } : undefined}
      className={cn(
        "group flex items-start gap-3 transition-colors",
        VARIANT_CLASSES[variant],
        variant === "row" && (ACCENT_BORDER[accent] ?? "border-l-transparent"),
        onRowClick && "cursor-pointer",
        dimmed && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Left — title stack */}
      <div className="flex-1 min-w-0">
        {label && (
          <span className={cn(
            "inline-block text-xs text-muted-foreground mb-0.5",
            labelMono && "font-mono"
          )}>
            {label}
          </span>
        )}
        {contextLabel && (
          <p className="text-xs text-muted-foreground truncate mb-0.5">{contextLabel}</p>
        )}
        <p className={cn(
          "text-base font-semibold text-foreground leading-tight truncate",
          titleMono && "font-mono"
        )}>
          {title}
        </p>
        {/* Meta items */}
        {meta.length > 0 && (
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {meta.map((item, i) => (
              <span key={i} className={cn(
                "flex items-center gap-1 text-sm",
                item.urgent  ? "text-warning"           : null,
                item.success ? "text-success"           : null,
                !item.urgent && !item.success ? "text-muted-foreground" : null,
              )}>
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                {item.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right — status + actions */}
      <div className="flex items-center gap-2 flex-shrink-0 self-center">
        {status && <Badge statusKey={status} />}

        {primaryAction && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-sm"
            onClick={(e) => { e.stopPropagation(); primaryAction.onClick() }}
          >
            {primaryAction.label}
          </Button>
        )}

        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="transparent"
                size="sm"
                iconOnly
                onClick={(e) => e.stopPropagation()}
                aria-label="More actions"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryActions.map((action, i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={(e) => { e.stopPropagation(); action.onClick() }}
                  className={cn(action.destructive && "text-destructive")}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onExpand && (
          <Button
            variant="transparent"
            size="sm"
            iconOnly
            onClick={(e) => { e.stopPropagation(); onExpand() }}
            aria-label={`Expand ${title}`}
            className="h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  )
}

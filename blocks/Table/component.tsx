import { cn } from "@/lib/utils"
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Table/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
//
// INVARIANTS (meta.yaml):
//   Root: w-full text-base
//   Header: text-sm font-semibold text-muted-foreground uppercase tracking-wide
//   Cell: py-3 px-4 border-b
//   Row hover: hover:bg-muted/50

interface Column<T> {
  key: keyof T & string
  label: string
  /** Right-align for numeric columns (uses tabular-nums) */
  numeric?: boolean
  className?: string
}

interface TableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  /** Enables sticky header for scrollable containers */
  stickyHeader?: boolean
  className?: string
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  stickyHeader = false,
  className,
}: TableProps<T>) {
  return (
    <ShadcnTable className={cn("w-full text-base", className)}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={cn(
                "text-sm font-semibold text-muted-foreground uppercase tracking-wide py-3 px-4",
                col.numeric && "text-right",
                stickyHeader && "sticky top-0 bg-background z-10",
                col.className,
              )}
            >
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={idx} className="hover:bg-muted/50">
            {columns.map((col) => (
              <TableCell
                key={col.key}
                className={cn(
                  "py-3 px-4 border-b",
                  col.numeric && "text-right tabular-nums",
                  col.className,
                )}
              >
                {String(row[col.key] ?? "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </ShadcnTable>
  )
}

import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@blocks/Button/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/DataTable/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19, 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: w-full rounded-lg border border-border overflow-hidden
//   Header: sticky top-0 bg-muted/50 text-sm font-medium text-muted-foreground
//   Footer: border-t px-4 py-3 with pagination

type SortDirection = "asc" | "desc" | null

interface ColumnDef<T> {
  id: string
  header: string
  /** Accessor function to get cell value from row data */
  accessor: (row: T) => React.ReactNode
  /** When true, column content uses tabular-nums and right alignment */
  numeric?: boolean
  /** When true, column header is clickable for sorting */
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  /** Unique key extractor for each row */
  rowKey: (row: T) => string
  /** Current page (1-indexed) */
  page?: number
  /** Total number of pages */
  pageCount?: number
  onPageChange?: (page: number) => void
  onSort?: (columnId: string, direction: SortDirection) => void
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  page = 1,
  pageCount = 1,
  onPageChange,
  onSort,
  className,
}: DataTableProps<T>) {
  const [sortState, setSortState] = React.useState<{
    columnId: string | null
    direction: SortDirection
  }>({ columnId: null, direction: null })

  function handleSort(columnId: string) {
    const next: SortDirection =
      sortState.columnId === columnId
        ? sortState.direction === "asc"
          ? "desc"
          : sortState.direction === "desc"
            ? null
            : "asc"
        : "asc"
    setSortState({ columnId: next ? columnId : null, direction: next })
    onSort?.(columnId, next)
  }

  function renderSortIcon(columnId: string) {
    if (sortState.columnId !== columnId) return <ArrowUpDown className="h-4 w-4" />
    if (sortState.direction === "asc") return <ArrowUp className="h-4 w-4" />
    return <ArrowDown className="h-4 w-4" />
  }

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-border overflow-hidden",
        className
      )}
    >
      <div className="overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    "text-sm font-medium text-muted-foreground",
                    col.numeric && "text-right"
                  )}
                >
                  {col.sortable ? (
                    <Button
                      variant="transparent"
                      size="sm"
                      onClick={() => handleSort(col.id)}
                      className={cn(
                        "-ml-2",
                        col.numeric && "ml-auto"
                      )}
                    >
                      {col.header}
                      {renderSortIcon(col.id)}
                    </Button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={cn(
                        "text-sm",
                        col.numeric && "text-right tabular-nums font-mono"
                      )}
                    >
                      {col.accessor(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

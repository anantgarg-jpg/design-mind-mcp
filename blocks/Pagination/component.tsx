import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Pagination/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: flex items-center gap-1
//   Item: h-9 w-9 rounded-md text-sm
//   Active: bg-primary text-primary-foreground font-medium

interface PaginationBarProps {
  /** Current active page (1-indexed) */
  page: number
  /** Total number of pages */
  pageCount: number
  onPageChange: (page: number) => void
  /** Number of sibling pages to show around current page */
  siblingCount?: number
  className?: string
}

function generatePages(
  current: number,
  total: number,
  siblings: number
): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = []

  const leftSibling = Math.max(current - siblings, 2)
  const rightSibling = Math.min(current + siblings, total - 1)

  pages.push(1)

  if (leftSibling > 2) {
    pages.push("ellipsis")
  }

  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== total) {
      pages.push(i)
    }
  }

  if (rightSibling < total - 1) {
    pages.push("ellipsis")
  }

  if (total > 1) {
    pages.push(total)
  }

  return pages
}

export function PaginationBar({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationBarProps) {
  if (pageCount <= 1) return null

  const pages = generatePages(page, pageCount, siblingCount)

  return (
    <PaginationRoot className={className}>
      <PaginationContent className="flex items-center gap-1">
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && onPageChange(page - 1)}
            aria-disabled={page <= 1}
            className={cn(
              "min-w-11 min-h-11",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              page <= 1 && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                onClick={() => p !== page && onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "h-9 w-9 rounded-md text-sm",
                  "min-w-11 min-h-11",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  p === page && "bg-primary text-primary-foreground font-medium pointer-events-none"
                )}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => page < pageCount && onPageChange(page + 1)}
            aria-disabled={page >= pageCount}
            className={cn(
              "min-w-11 min-h-11",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              page >= pageCount && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  )
}

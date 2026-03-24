import React from 'react'
import { StatusBadge } from '@blocks/StatusBadge/component'
import type { StatusKey } from '@blocks/StatusBadge/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function StatusBadgePage() {
  return (
    <div>
      <PageHeader
        name="StatusBadge"
        level="primitive"
        confidence={0.95}
        description="The atomic unit of status display. Every entity state in the platform is rendered through this component. It is the most-used component and the highest-stakes for semantic consistency."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Task states">
          <div className="flex flex-wrap gap-2">
            {(['open', 'in_progress', 'completed', 'overdue', 'cancelled'] as StatusKey[]).map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </Fixture>

        <Fixture label="Care gap states — open is amber (not neutral)">
          <div className="flex flex-wrap gap-2">
            {(['care_gap_open', 'in_outreach', 'closed', 'excluded'] as StatusKey[]).map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </Fixture>

        <Fixture label="Alert severity">
          <div className="flex flex-wrap gap-2">
            {(['critical', 'high', 'medium', 'low'] as StatusKey[]).map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </Fixture>

        <Fixture label="Protocol states">
          <div className="flex flex-wrap gap-2">
            {(['active', 'draft', 'inactive', 'archived', 'coming_soon'] as StatusKey[]).map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </Fixture>

        <Fixture label="Size comparison — md vs sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-4">md</span>
              <StatusBadge status="in_progress" size="md" />
              <StatusBadge status="critical" size="md" />
              <StatusBadge status="active" size="md" />
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-4">sm</span>
              <StatusBadge status="in_progress" size="sm" />
              <StatusBadge status="critical" size="sm" />
              <StatusBadge status="active" size="sm" />
            </div>
          </div>
        </Fixture>
      </div>
    </div>
  )
}

import React from 'react'
import { StatCard } from '@blocks/StatCard/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function StatCardPage() {
  return (
    <div>
      <PageHeader
        name="StatCard"
        level="primitive"
        confidence={0.88}
        description="Metric display card for dashboard summary rows. Shows a label, a large numeric value, and an optional subtitle. Used in the artifact content header area to give coordinators their daily snapshot at a glance."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="All 4 variants" bg="bg-background">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Patients" value={1240} variant="default" />
            <StatCard label="Needs Attention" value={12} variant="urgent" />
            <StatCard label="Tasks Overdue" value={7} variant="warning" />
            <StatCard label="Closed Today" value={23} variant="success" />
          </div>
        </Fixture>

        <Fixture label="With subtitle — urgent variant" bg="bg-background">
          <div className="max-w-xs">
            <StatCard
              label="Active Care Gaps"
              value={89}
              subtitle="Across 1,240 patients"
              variant="urgent"
            />
          </div>
        </Fixture>

        <Fixture label="Clickable card (onClick logs to console)" bg="bg-background">
          <div className="max-w-xs">
            <StatCard
              label="Total Patients"
              value={1240}
              onClick={() => console.log('StatCard clicked')}
            />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

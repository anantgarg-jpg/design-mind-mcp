import React from 'react'
import { EntityRow } from '@blocks/EntityRow/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function EntityRowPage() {
  return (
    <div>
      <PageHeader
        name="EntityRow"
        level="composite"
        confidence={0.92}
        description="A list row for displaying an entity with identity (avatar + name), a numeric score/metric, a tier/level classification, and a context-specific primary action. Designed for high-density scan-and-act worklists."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="High tier — overdue — trend up">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <EntityRow
              initials="TJ"
              name="Taylor, James"
              subtitle="HbA1c overdue · 90 days"
              score={82}
              tier="high"
              band={1}
              primaryAction="Start Outreach"
              isOverdue={true}
              trend="up"
            />
          </div>
        </Fixture>

        <Fixture label="Medium tier — stable">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <EntityRow
              initials="LP"
              name="Lopes, Patricia"
              subtitle="Annual wellness due · 14 days"
              score={61}
              tier="medium"
              band={2}
              primaryAction="Schedule Visit"
              primaryActionVariant="outline"
              trend="stable"
            />
          </div>
        </Fixture>

        <Fixture label="Low tier — trend down — outline action">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <EntityRow
              initials="KC"
              name="Kim, Christine"
              subtitle="Diabetes management · on track"
              score={34}
              tier="low"
              band={3}
              primaryAction="Review"
              primaryActionVariant="outline"
              trend="down"
            />
          </div>
        </Fixture>

        <Fixture label="All three rows in a list">
          <div className="bg-card rounded-lg border border-border overflow-hidden divide-y divide-border">
            <EntityRow
              initials="TJ"
              name="Taylor, James"
              subtitle="HbA1c overdue · 90 days"
              score={82}
              tier="high"
              band={1}
              primaryAction="Start Outreach"
              isOverdue={true}
              trend="up"
            />
            <EntityRow
              initials="LP"
              name="Lopes, Patricia"
              subtitle="Annual wellness due · 14 days"
              score={61}
              tier="medium"
              band={2}
              primaryAction="Schedule Visit"
              primaryActionVariant="outline"
              trend="stable"
            />
            <EntityRow
              initials="KC"
              name="Kim, Christine"
              subtitle="Diabetes management · on track"
              score={34}
              tier="low"
              band={3}
              primaryAction="Review"
              primaryActionVariant="outline"
              trend="down"
            />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

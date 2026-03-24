import React from 'react'
import { PatientRow } from '@blocks/PatientRow/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function PatientRowPage() {
  return (
    <div>
      <PageHeader
        name="PatientRow"
        level="composite"
        confidence={0.92}
        description="The primary list item for population-level patient worklists. Shows patient identity, risk signal, band, and a context-specific primary action. Used in priority patient lists, outreach queues, and any surface where coordinators scan and act on patients."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="High risk — overdue — trend up">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <PatientRow
              initials="TJ"
              name="Taylor, James"
              condition="HbA1c overdue · 90 days"
              riskScore={82}
              riskTier="high"
              band={1}
              primaryAction="Start Outreach"
              isOverdue={true}
              riskTrend="up"
            />
          </div>
        </Fixture>

        <Fixture label="Medium risk — stable">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <PatientRow
              initials="LP"
              name="Lopes, Patricia"
              condition="Annual wellness due · 14 days"
              riskScore={61}
              riskTier="medium"
              band={2}
              primaryAction="Schedule Visit"
              primaryActionVariant="outline"
              riskTrend="stable"
            />
          </div>
        </Fixture>

        <Fixture label="Low risk — trend down — outline action">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <PatientRow
              initials="KC"
              name="Kim, Christine"
              condition="Diabetes management · on track"
              riskScore={34}
              riskTier="low"
              band={3}
              primaryAction="Review"
              primaryActionVariant="outline"
              riskTrend="down"
            />
          </div>
        </Fixture>

        <Fixture label="All three rows in a list">
          <div className="bg-card rounded-lg border border-border overflow-hidden divide-y divide-border">
            <PatientRow
              initials="TJ"
              name="Taylor, James"
              condition="HbA1c overdue · 90 days"
              riskScore={82}
              riskTier="high"
              band={1}
              primaryAction="Start Outreach"
              isOverdue={true}
              riskTrend="up"
            />
            <PatientRow
              initials="LP"
              name="Lopes, Patricia"
              condition="Annual wellness due · 14 days"
              riskScore={61}
              riskTier="medium"
              band={2}
              primaryAction="Schedule Visit"
              primaryActionVariant="outline"
              riskTrend="stable"
            />
            <PatientRow
              initials="KC"
              name="Kim, Christine"
              condition="Diabetes management · on track"
              riskScore={34}
              riskTier="low"
              band={3}
              primaryAction="Review"
              primaryActionVariant="outline"
              riskTrend="down"
            />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

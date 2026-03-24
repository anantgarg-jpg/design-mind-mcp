import React from 'react'
import { AlertBanner } from '@blocks/AlertBanner/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function AlertBannerPage() {
  return (
    <div>
      <PageHeader
        name="AlertBanner"
        level="composite"
        confidence={0.93}
        description="A severity-driven alert banner for displaying alerts that require user attention or action. Severity is always visible. Permitted actions are determined by severity level. This component is the most safety-critical in the library."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Critical — drug interaction (requires acknowledge)" bg="bg-background">
          <AlertBanner
            severity="critical"
            title="Drug interaction: Warfarin + Aspirin"
            body="Concurrent use increases bleeding risk significantly."
            contextLabel="Rivera, Maria"
            triggeredAt="Triggered Jan 15, 2025 · 09:42"
            onAcknowledge={() => console.log('Acknowledged')}
            onAuditEvent={(event, sev) => console.log('Audit:', event, sev)}
          />
        </Fixture>

        <Fixture label="High — INR elevated (acknowledge + escalate + dismiss)" bg="bg-background">
          <AlertBanner
            severity="high"
            title="INR elevated: 4.2 (normal 2.0–3.0)"
            body="Last reading taken Jan 14, 2025."
            onAcknowledge={() => console.log('Acknowledged')}
            onEscalate={() => console.log('Escalated')}
            onDismiss={() => console.log('Dismissed')}
            onAuditEvent={(event, sev) => console.log('Audit:', event, sev)}
          />
        </Fixture>

        <Fixture label="Medium — follow-up overdue (dismiss only)" bg="bg-background">
          <AlertBanner
            severity="medium"
            title="Follow-up overdue: 45 days"
            onDismiss={() => console.log('Dismissed')}
            onAuditEvent={(event, sev) => console.log('Audit:', event, sev)}
          />
        </Fixture>

        <Fixture label="Low — informational (dismiss only)" bg="bg-background">
          <AlertBanner
            severity="low"
            title="Appointment scheduled for Jan 22, 2025."
            onDismiss={() => console.log('Dismissed')}
          />
        </Fixture>
      </div>
    </div>
  )
}

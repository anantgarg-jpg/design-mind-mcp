import React from 'react'
import { ClinicalAlertBanner } from '@blocks/ClinicalAlertBanner/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function ClinicalAlertBannerPage() {
  return (
    <div>
      <PageHeader
        name="ClinicalAlertBanner"
        level="composite"
        confidence={0.93}
        description="The primary surface for displaying clinical alerts that require attention or action. Severity is always visible. Permitted actions are determined by severity level. This component is the most safety-critical in the library."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Critical — drug interaction (requires acknowledge)" bg="bg-background">
          <ClinicalAlertBanner
            severity="critical"
            title="Drug interaction: Warfarin + Aspirin"
            body="Concurrent use increases bleeding risk significantly."
            patientName="Rivera, Maria"
            triggeredAt="Triggered Jan 15, 2025 · 09:42"
            onAcknowledge={() => console.log('Acknowledged')}
          />
        </Fixture>

        <Fixture label="High — INR elevated (acknowledge + escalate + dismiss)" bg="bg-background">
          <ClinicalAlertBanner
            severity="high"
            title="INR elevated: 4.2 (normal 2.0–3.0)"
            body="Last reading taken Jan 14, 2025."
            onAcknowledge={() => console.log('Acknowledged')}
            onEscalate={() => console.log('Escalated')}
            onDismiss={() => console.log('Dismissed')}
          />
        </Fixture>

        <Fixture label="Medium — follow-up overdue (dismiss only)" bg="bg-background">
          <ClinicalAlertBanner
            severity="medium"
            title="Follow-up overdue: 45 days"
            onDismiss={() => console.log('Dismissed')}
          />
        </Fixture>

        <Fixture label="Low — informational (dismiss only)" bg="bg-background">
          <ClinicalAlertBanner
            severity="low"
            title="Appointment scheduled for Jan 22, 2025."
            onDismiss={() => console.log('Dismissed')}
          />
        </Fixture>
      </div>
    </div>
  )
}

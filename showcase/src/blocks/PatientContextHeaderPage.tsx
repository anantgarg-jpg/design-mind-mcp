import React from 'react'
import { PatientContextHeader } from '@blocks/PatientContextHeader/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function PatientContextHeaderPage() {
  return (
    <div>
      <PageHeader
        name="PatientContextHeader"
        level="composite"
        confidence={0.90}
        description="Displays the current patient context at the top of any clinical workflow surface. Ensures the clinician always knows who they are acting on behalf of. The most visible component on any patient-scoped surface — inconsistency here breaks clinician trust immediately."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Required fields only" bg="bg-background">
          <PatientContextHeader
            lastName="Rivera"
            firstName="Maria"
            mrn="00123456"
            dateOfBirth="Jan 5, 1968"
          />
        </Fixture>

        <Fixture label="With risk tier + payer + age" bg="bg-background">
          <PatientContextHeader
            lastName="Rivera"
            firstName="Maria"
            mrn="00123456"
            dateOfBirth="Jan 5, 1968"
            age={57}
            riskTier="medium"
            primaryPayer="Medicare"
          />
        </Fixture>

        <Fixture label="With active alerts — critical severity" bg="bg-background">
          <PatientContextHeader
            lastName="Rivera"
            firstName="Maria"
            mrn="00123456"
            dateOfBirth="Jan 5, 1968"
            age={57}
            riskTier="high"
            primaryPayer="Medicare"
            activeAlertCount={2}
            highestAlertSeverity="critical"
            onAlertClick={() => console.log('Alert clicked')}
          />
        </Fixture>

        <Fixture label="With active alerts — high severity + care team" bg="bg-background">
          <PatientContextHeader
            lastName="Rivera"
            firstName="Maria"
            mrn="00123456"
            dateOfBirth="Jan 5, 1968"
            age={57}
            riskTier="high"
            careTeamName="Care Team A"
            activeAlertCount={1}
            highestAlertSeverity="high"
            onAlertClick={() => console.log('Alert clicked')}
          />
        </Fixture>
      </div>
    </div>
  )
}

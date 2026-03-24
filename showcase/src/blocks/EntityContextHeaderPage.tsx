import React from 'react'
import { EntityContextHeader } from '@blocks/EntityContextHeader/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function EntityContextHeaderPage() {
  return (
    <div>
      <PageHeader
        name="EntityContextHeader"
        level="composite"
        confidence={0.90}
        description="Displays the current entity context at the top of any scoped workflow surface. Ensures the user always knows which entity they are acting on. The most visible component on any entity-scoped surface — inconsistency here breaks user trust immediately."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Required fields only" bg="bg-background">
          <EntityContextHeader
            name="Rivera, Maria"
            primaryId="00123456"
            primaryIdLabel="MRN"
            secondaryId="01/05/1968"
            secondaryIdLabel="DOB"
          />
        </Fixture>

        <Fixture label="With tier + tertiary label" bg="bg-background">
          <EntityContextHeader
            name="Rivera, Maria"
            primaryId="00123456"
            primaryIdLabel="MRN"
            secondaryId="01/05/1968"
            secondaryIdLabel="DOB"
            tier="medium"
            tertiaryLabel="Medicare"
          />
        </Fixture>

        <Fixture label="With active alerts — critical severity" bg="bg-background">
          <EntityContextHeader
            name="Rivera, Maria"
            primaryId="00123456"
            primaryIdLabel="MRN"
            secondaryId="01/05/1968"
            secondaryIdLabel="DOB"
            tier="high"
            tertiaryLabel="Medicare"
            alertCount={2}
            alertSeverity="critical"
            onAlertClick={() => console.log('Alert clicked')}
          />
        </Fixture>

        <Fixture label="With active alerts — high severity + team" bg="bg-background">
          <EntityContextHeader
            name="Rivera, Maria"
            primaryId="00123456"
            primaryIdLabel="MRN"
            secondaryId="01/05/1968"
            secondaryIdLabel="DOB"
            tier="high"
            teamName="Care Team A"
            alertCount={1}
            alertSeverity="high"
            onAlertClick={() => console.log('Alert clicked')}
          />
        </Fixture>
      </div>
    </div>
  )
}

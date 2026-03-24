import React from 'react'
import { Card } from '@blocks/Card/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function CardPage() {
  return (
    <div>
      <PageHeader
        name="Card"
        level="primitive"
        confidence={0.85}
        description="A contained surface for grouping related content with an optional header, body, and footer."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="With header, content, and footer">
          <Card
            title="Patient Summary"
            description="Overview of current care status"
            footer={<span className="text-sm text-muted-foreground">Last updated 2 hours ago</span>}
          >
            <p className="text-sm">3 active care gaps, 1 overdue task, next appointment on March 28.</p>
          </Card>
        </Fixture>

        <Fixture label="Content only">
          <Card>
            <p className="text-sm">A minimal card with no header or footer, used for simple content grouping.</p>
          </Card>
        </Fixture>

        <Fixture label="Interactive card (clickable)">
          <Card
            title="Protocol: HbA1c Monitoring"
            description="Tap to view details"
            onClick={() => {}}
          >
            <p className="text-sm">12 enrolled patients, 4 pending outreach.</p>
          </Card>
        </Fixture>
      </div>
    </div>
  )
}

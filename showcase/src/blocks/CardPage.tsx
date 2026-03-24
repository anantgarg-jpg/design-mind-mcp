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
        {/* ── Elevation variants ──────────────────────────────── */}
        <Fixture label="Flat (no shadow — white-on-white)">
          <Card
            title="Patient Summary"
            description="Overview of current care status"
            footer={<span className="text-sm text-muted-foreground">Last updated 2 hours ago</span>}
          >
            <p className="text-sm">3 active care gaps, 1 overdue task, next appointment on March 28.</p>
          </Card>
        </Fixture>

        <Fixture label="Shadow SM (raised — for muted backgrounds)">
          <div className="rounded-lg bg-background p-4">
            <Card
              elevation="sm"
              title="Care Gap: HbA1c Screening"
              description="Last completed 14 months ago"
            >
              <p className="text-sm">Patient is overdue for HbA1c lab work. Next eligible date: April 2.</p>
            </Card>
          </div>
        </Fixture>

        <Fixture label="Shadow MD (expressive — onboarding flows)">
          <div className="rounded-lg bg-background p-6">
            <Card
              elevation="md"
              title="Welcome to CareOS"
              description="Get started in 3 simple steps"
            >
              <p className="text-sm">Complete your profile, connect your EHR, and invite your care team.</p>
            </Card>
          </div>
        </Fixture>

        {/* ── Interactive states ──────────────────────────────── */}
        <Fixture label="Interactive — hover and press">
          <Card
            elevation="sm"
            title="Protocol: HbA1c Monitoring"
            description="Tap to view details"
            onClick={() => {}}
          >
            <p className="text-sm">12 enrolled patients, 4 pending outreach.</p>
          </Card>
        </Fixture>

        <Fixture label="Interactive — focused (tab to see ring)">
          <Card
            elevation="sm"
            title="Protocol: Diabetes Management"
            description="Use Tab key to focus this card"
            onClick={() => {}}
          >
            <p className="text-sm">8 enrolled patients, 2 pending outreach.</p>
          </Card>
        </Fixture>

        <Fixture label="Interactive — selected">
          <Card
            elevation="sm"
            title="Protocol: HbA1c Monitoring"
            description="Currently selected"
            onClick={() => {}}
            selected
          >
            <p className="text-sm">12 enrolled patients, 4 pending outreach.</p>
          </Card>
        </Fixture>

        <Fixture label="Interactive — disabled">
          <Card
            elevation="sm"
            title="Protocol: Deprecated Workflow"
            description="This protocol is no longer active"
            onClick={() => {}}
            disabled
          >
            <p className="text-sm">Archived on March 1. Contact admin to reactivate.</p>
          </Card>
        </Fixture>
      </div>
    </div>
  )
}

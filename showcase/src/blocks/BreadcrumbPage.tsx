import React from 'react'
import { Breadcrumb } from '@blocks/Breadcrumb/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function BreadcrumbPage() {
  return (
    <div>
      <PageHeader
        name="Breadcrumb"
        level="primitive"
        confidence={0.85}
        description="A navigation aid that shows the user's current location within a hierarchical page structure."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Three-level trail">
          <Breadcrumb
            segments={[
              { label: 'Dashboard', href: '/' },
              { label: 'Patients', href: '/patients' },
              { label: 'John Doe' },
            ]}
          />
        </Fixture>

        <Fixture label="Two-level trail">
          <Breadcrumb
            segments={[
              { label: 'Settings', href: '/settings' },
              { label: 'Notifications' },
            ]}
          />
        </Fixture>

        <Fixture label="Collapsed trail (more than 5 segments)">
          <Breadcrumb
            maxVisible={4}
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Organization', href: '/org' },
              { label: 'Teams', href: '/org/teams' },
              { label: 'Clinical', href: '/org/teams/clinical' },
              { label: 'Protocols', href: '/org/teams/clinical/protocols' },
              { label: 'HbA1c Monitoring' },
            ]}
          />
        </Fixture>
      </div>
    </div>
  )
}

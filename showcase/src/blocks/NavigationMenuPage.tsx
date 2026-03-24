import React from 'react'
import { NavigationMenuBlock } from '@blocks/NavigationMenu/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function NavigationMenuPage() {
  return (
    <div>
      <PageHeader
        name="NavigationMenu"
        level="primitive"
        confidence={0.85}
        description="Top-level navigation bar with plain links and dropdown sub-menus."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Plain links with active item">
          <NavigationMenuBlock
            items={[
              { label: 'Dashboard', href: '#', active: true },
              { label: 'Patients', href: '#' },
              { label: 'Reports', href: '#' },
            ]}
          />
        </Fixture>

        <Fixture label="With dropdown sub-menu">
          <NavigationMenuBlock
            items={[
              { label: 'Home', href: '#' },
              {
                label: 'Workflows',
                children: [
                  { label: 'Care Plans', href: '#', description: 'Manage patient care plans' },
                  { label: 'Assessments', href: '#', description: 'Run clinical assessments' },
                  { label: 'Scheduling', href: '#', description: 'Appointment scheduling' },
                ],
              },
              { label: 'Settings', href: '#' },
            ]}
          />
        </Fixture>
      </div>
    </div>
  )
}

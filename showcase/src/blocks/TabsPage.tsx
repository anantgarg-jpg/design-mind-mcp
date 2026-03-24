import React from 'react'
import { Tabs } from '@blocks/Tabs/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function TabsPage() {
  return (
    <div>
      <PageHeader
        name="Tabs"
        level="primitive"
        confidence={0.85}
        description="A horizontal tab bar for switching between content panels with active-state underline indicator."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Three tabs with content panels" bg="bg-background">
          <Tabs
            items={[
              { value: 'overview', label: 'Overview', content: <p className="text-sm text-muted-foreground">Patient overview and summary metrics are displayed here.</p> },
              { value: 'history', label: 'History', content: <p className="text-sm text-muted-foreground">Visit history and past encounters appear in this tab.</p> },
              { value: 'notes', label: 'Notes', content: <p className="text-sm text-muted-foreground">Clinical notes and documentation are shown here.</p> },
            ]}
          />
        </Fixture>

        <Fixture label="With a disabled tab" bg="bg-background">
          <Tabs
            items={[
              { value: 'active', label: 'Active', content: <p className="text-sm text-muted-foreground">Active items listed here.</p> },
              { value: 'archived', label: 'Archived', content: <p className="text-sm text-muted-foreground">Archived items listed here.</p> },
              { value: 'deleted', label: 'Deleted', content: <p className="text-sm text-muted-foreground">Deleted items listed here.</p>, disabled: true },
            ]}
          />
        </Fixture>
      </div>
    </div>
  )
}

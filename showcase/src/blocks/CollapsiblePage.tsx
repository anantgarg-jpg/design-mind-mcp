import React from 'react'
import { Collapsible } from '@blocks/Collapsible/component'
import { Button } from '@blocks/Button/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function CollapsiblePage() {
  return (
    <div>
      <PageHeader
        name="Collapsible"
        level="primitive"
        confidence={0.85}
        description="A component that toggles the visibility of its content behind a trigger element."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default collapsed">
          <Collapsible
            trigger={
              <Button variant="outline">
                Show additional details
              </Button>
            }
          >
            <div className="mt-2 rounded-md border border-border p-3 text-sm text-muted-foreground">
              These are the additional details that were hidden. They include supplementary context about the patient record and care history.
            </div>
          </Collapsible>
        </Fixture>

        <Fixture label="Initially open">
          <Collapsible
            defaultOpen
            trigger={
              <Button variant="outline">
                Toggle notes section
              </Button>
            }
          >
            <div className="mt-2 rounded-md border border-border p-3 text-sm text-muted-foreground">
              This section starts open by default. It contains clinical notes that the user can collapse to save space.
            </div>
          </Collapsible>
        </Fixture>
      </div>
    </div>
  )
}

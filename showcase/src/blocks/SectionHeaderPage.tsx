import React from 'react'
import { SectionHeader } from '@blocks/SectionHeader/component'
import { Button } from '@blocks/Button/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function SectionHeaderPage() {
  return (
    <div>
      <PageHeader
        name="SectionHeader"
        level="primitive"
        confidence={0.90}
        description="Artifact content section label with optional count and action. Used to divide Panel 3 content into named groups — 'NEEDS ATTENTION', 'COMING UP', 'CARE GAPS'. Muted and small — organizes without competing."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Basic — title only">
          <div className="border border-border rounded">
            <SectionHeader title="NEEDS ATTENTION" />
          </div>
        </Fixture>

        <Fixture label="With count — default variant">
          <div className="border border-border rounded">
            <SectionHeader title="NEEDS ATTENTION" count={3} />
          </div>
        </Fixture>

        <Fixture label="With count — urgent variant">
          <div className="border border-border rounded">
            <SectionHeader title="CARE GAPS" count={5} countVariant="urgent" />
          </div>
        </Fixture>

        <Fixture label="With count — warning variant">
          <div className="border border-border rounded">
            <SectionHeader title="OVERDUE" count={2} countVariant="warning" />
          </div>
        </Fixture>

        <Fixture label="With action">
          <div className="border border-border rounded">
            <SectionHeader
              title="COMING UP"
              action={
                <Button variant="link" size="sm">
                  View all
                </Button>
              }
            />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

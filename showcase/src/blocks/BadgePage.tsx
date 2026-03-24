import React from 'react'
import { Badge } from '@blocks/Badge/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function BadgePage() {
  return (
    <div>
      <PageHeader
        name="Badge"
        level="primitive"
        confidence={0.85}
        description="A small label used to highlight status, category, or metadata inline with other content."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="All variants">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Fixture>

        <Fixture label="Contextual usage">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Active</Badge>
            <Badge variant="secondary">Pending review</Badge>
            <Badge variant="destructive">Overdue</Badge>
            <Badge variant="outline">Draft</Badge>
          </div>
        </Fixture>
      </div>
    </div>
  )
}

import React from 'react'
import { Badge } from '@blocks/Badge/component'
import { Fixture, PageHeader } from '@/components/Fixture'

const colors = ["blue", "red", "yellow", "orange", "green", "grey"] as const

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
        {/* ── Colors ───────────────────────────────────────────── */}
        <Fixture label="Colors">
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <Badge key={color} color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Badge>
            ))}
          </div>
        </Fixture>

        {/* ── With left dot ────────────────────────────────────── */}
        <Fixture label="With left dot">
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <Badge key={color} color={color} dot>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Badge>
            ))}
          </div>
        </Fixture>

        {/* ── Contextual usage ───────────────────────────────── */}
        <Fixture label="Contextual usage">
          <div className="flex flex-wrap gap-2">
            <Badge color="green" dot>Active</Badge>
            <Badge color="yellow" dot>Pending review</Badge>
            <Badge color="red" dot>Overdue</Badge>
            <Badge color="grey">Draft</Badge>
            <Badge color="orange">Urgent</Badge>
            <Badge color="blue">New</Badge>
          </div>
        </Fixture>
      </div>
    </div>
  )
}

import React from 'react'
import { Calendar } from '@blocks/Calendar/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function CalendarPage() {
  return (
    <div>
      <PageHeader
        name="Calendar"
        level="primitive"
        confidence={0.85}
        description="A date picker component that displays a month grid for selecting a single date."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="With selected date">
          <Calendar selected={new Date(2026, 2, 15)} />
        </Fixture>

        <Fixture label="No selection">
          <Calendar />
        </Fixture>
      </div>
    </div>
  )
}

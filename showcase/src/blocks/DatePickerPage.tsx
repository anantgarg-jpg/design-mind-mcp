import React, { useState } from 'react'
import { DatePicker } from '@blocks/DatePicker/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function DatePickerPage() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [presetDate, setPresetDate] = useState<Date | undefined>(new Date(2025, 0, 15))

  return (
    <div>
      <PageHeader
        name="DatePicker"
        level="composite"
        confidence={0.80}
        description="A calendar-based date selector with popover display and configurable date formatting."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default — no date selected" bg="bg-background">
          <div className="max-w-xs">
            <DatePicker value={date} onValueChange={setDate} />
          </div>
        </Fixture>

        <Fixture label="With pre-selected date" bg="bg-background">
          <div className="max-w-xs">
            <DatePicker value={presetDate} onValueChange={setPresetDate} />
          </div>
        </Fixture>

        <Fixture label="Error state" bg="bg-background">
          <div className="max-w-xs">
            <DatePicker value={undefined} onValueChange={() => {}} hasError placeholder="Date required" />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

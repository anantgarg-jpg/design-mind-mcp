import React from 'react'
import { Checkbox } from '@blocks/Checkbox/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function CheckboxPage() {
  return (
    <div>
      <PageHeader
        name="Checkbox"
        level="primitive"
        confidence={0.85}
        description="A control that allows the user to toggle a boolean value on or off, with support for indeterminate state."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Checked and unchecked">
          <div className="flex flex-col gap-2">
            <Checkbox id="cb-checked" label="Receive email notifications" checked />
            <Checkbox id="cb-unchecked" label="Enable dark mode" checked={false} />
          </div>
        </Fixture>

        <Fixture label="Disabled state">
          <div className="flex flex-col gap-2">
            <Checkbox id="cb-disabled-on" label="Mandatory consent (locked)" checked disabled />
            <Checkbox id="cb-disabled-off" label="Feature unavailable" checked={false} disabled />
          </div>
        </Fixture>

        <Fixture label="Error state">
          <Checkbox id="cb-error" label="You must accept the terms" checked={false} error />
        </Fixture>

        <Fixture label="Indeterminate state">
          <Checkbox id="cb-indeterminate" label="Select all tasks" indeterminate />
        </Fixture>
      </div>
    </div>
  )
}

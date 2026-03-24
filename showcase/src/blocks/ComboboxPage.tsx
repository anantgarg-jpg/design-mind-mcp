import React, { useState } from 'react'
import { Combobox } from '@blocks/Combobox/component'
import { Fixture, PageHeader } from '@/components/Fixture'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'discharged', label: 'Discharged' },
]

export function ComboboxPage() {
  const [value, setValue] = useState('')
  const [preselected, setPreselected] = useState('active')

  return (
    <div>
      <PageHeader
        name="Combobox"
        level="composite"
        confidence={0.80}
        description="A searchable dropdown selector with type-ahead filtering and clear functionality."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default — empty" bg="bg-background">
          <div className="max-w-xs">
            <Combobox
              options={statusOptions}
              value={value}
              onValueChange={setValue}
              placeholder="Select status..."
            />
          </div>
        </Fixture>

        <Fixture label="With pre-selected value" bg="bg-background">
          <div className="max-w-xs">
            <Combobox
              options={statusOptions}
              value={preselected}
              onValueChange={setPreselected}
              placeholder="Select status..."
            />
          </div>
        </Fixture>

        <Fixture label="Error state" bg="bg-background">
          <div className="max-w-xs">
            <Combobox
              options={statusOptions}
              value=""
              onValueChange={() => {}}
              placeholder="Required field"
              hasError
            />
          </div>
        </Fixture>

        <Fixture label="Disabled" bg="bg-background">
          <div className="max-w-xs">
            <Combobox
              options={statusOptions}
              value="active"
              onValueChange={() => {}}
              disabled
            />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

import React from 'react'
import { Select } from '@blocks/Select/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function SelectPage() {
  return (
    <div>
      <PageHeader
        name="Select"
        level="primitive"
        confidence={0.85}
        description="Dropdown selector with options, placeholder, disabled, and error states."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default with placeholder">
          <div className="max-w-xs">
            <Select
              placeholder="Choose a status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
          </div>
        </Fixture>

        <Fixture label="Disabled">
          <div className="max-w-xs">
            <Select
              disabled
              placeholder="Cannot change"
              options={[
                { value: 'a', label: 'Option A' },
                { value: 'b', label: 'Option B' },
              ]}
            />
          </div>
        </Fixture>

        <Fixture label="Error state">
          <div className="max-w-xs">
            <Select
              error
              placeholder="Select required"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

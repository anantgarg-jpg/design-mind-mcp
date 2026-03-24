import React from 'react'
import { RadioGroupBlock } from '@blocks/RadioGroup/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function RadioGroupPage() {
  return (
    <div>
      <PageHeader
        name="RadioGroup"
        level="primitive"
        confidence={0.85}
        description="Single-select option group with accessible labels, descriptions, and error state."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Vertical — 3 options">
          <RadioGroupBlock
            options={[
              { value: 'low', label: 'Low priority' },
              { value: 'medium', label: 'Medium priority' },
              { value: 'high', label: 'High priority' },
            ]}
          />
        </Fixture>

        <Fixture label="With descriptions">
          <RadioGroupBlock
            options={[
              { value: 'email', label: 'Email', description: 'Receive notifications via email' },
              { value: 'sms', label: 'SMS', description: 'Receive notifications via text message' },
              { value: 'none', label: 'None', description: 'Opt out of notifications' },
            ]}
          />
        </Fixture>

        <Fixture label="Horizontal layout">
          <RadioGroupBlock
            orientation="horizontal"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'maybe', label: 'Maybe' },
            ]}
          />
        </Fixture>
      </div>
    </div>
  )
}

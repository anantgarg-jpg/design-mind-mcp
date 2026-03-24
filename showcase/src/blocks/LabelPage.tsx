import React from 'react'
import { LabelBlock } from '@blocks/Label/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function LabelPage() {
  return (
    <div>
      <PageHeader
        name="Label"
        level="primitive"
        confidence={0.85}
        description="Form label with optional required indicator and error styling."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default label">
          <LabelBlock>Patient Name</LabelBlock>
        </Fixture>

        <Fixture label="Required indicator">
          <LabelBlock required>Email Address</LabelBlock>
        </Fixture>

        <Fixture label="Error state">
          <LabelBlock error>Date of Birth</LabelBlock>
        </Fixture>

        <Fixture label="Required + error">
          <LabelBlock required error>Phone Number</LabelBlock>
        </Fixture>
      </div>
    </div>
  )
}

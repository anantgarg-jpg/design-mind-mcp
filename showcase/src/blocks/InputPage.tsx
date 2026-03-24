import React from 'react'
import { InputBlock } from '@blocks/Input/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function InputPage() {
  return (
    <div>
      <PageHeader
        name="Input"
        level="primitive"
        confidence={0.85}
        description="Text input field with support for placeholder, disabled, and error states."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default">
          <div className="max-w-sm">
            <InputBlock />
          </div>
        </Fixture>

        <Fixture label="With placeholder">
          <div className="max-w-sm">
            <InputBlock placeholder="Enter your email" />
          </div>
        </Fixture>

        <Fixture label="Disabled">
          <div className="max-w-sm">
            <InputBlock placeholder="Cannot edit" disabled />
          </div>
        </Fixture>

        <Fixture label="Error state">
          <div className="max-w-sm">
            <InputBlock placeholder="Invalid value" error />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

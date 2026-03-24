import React from 'react'
import { Textarea } from '@blocks/Textarea/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function TextareaPage() {
  return (
    <div>
      <PageHeader
        name="Textarea"
        level="primitive"
        confidence={0.85}
        description="A multi-line text input with placeholder, error, and disabled states."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default with placeholder" bg="bg-background">
          <div className="max-w-md">
            <Textarea placeholder="Enter clinical notes here..." />
          </div>
        </Fixture>

        <Fixture label="Error state" bg="bg-background">
          <div className="max-w-md">
            <Textarea placeholder="Required field" error />
          </div>
        </Fixture>

        <Fixture label="Disabled state" bg="bg-background">
          <div className="max-w-md">
            <Textarea placeholder="This field is disabled" disabled value="Read-only content that cannot be edited." />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

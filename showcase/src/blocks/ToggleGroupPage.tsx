import React from 'react'
import { ToggleGroup } from '@blocks/ToggleGroup/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function ToggleGroupPage() {
  return (
    <div>
      <PageHeader
        name="ToggleGroup"
        level="primitive"
        confidence={0.85}
        description="A group of toggle buttons supporting single or multiple selection modes."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Single selection mode" bg="bg-background">
          <ToggleGroup
            type="single"
            value="center"
            onValueChange={() => {}}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </Fixture>

        <Fixture label="Multiple selection mode" bg="bg-background">
          <ToggleGroup
            type="multiple"
            value={['bold', 'italic']}
            onValueChange={() => {}}
            options={[
              { value: 'bold', label: 'Bold' },
              { value: 'italic', label: 'Italic' },
              { value: 'underline', label: 'Underline' },
              { value: 'strikethrough', label: 'Strike' },
            ]}
          />
        </Fixture>

        <Fixture label="With a disabled option" bg="bg-background">
          <ToggleGroup
            type="single"
            options={[
              { value: 'a', label: 'Option A' },
              { value: 'b', label: 'Option B' },
              { value: 'c', label: 'Option C', disabled: true },
            ]}
          />
        </Fixture>
      </div>
    </div>
  )
}

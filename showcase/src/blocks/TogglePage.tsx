import React from 'react'
import { Toggle } from '@blocks/Toggle/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function TogglePage() {
  return (
    <div>
      <PageHeader
        name="Toggle"
        level="primitive"
        confidence={0.85}
        description="A pressable toggle button for binary states with default and outline variants."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default — unpressed" bg="bg-background">
          <Toggle>Bold</Toggle>
        </Fixture>

        <Fixture label="Pressed state" bg="bg-background">
          <Toggle pressed onPressedChange={() => {}}>Bold</Toggle>
        </Fixture>

        <Fixture label="Outline variant" bg="bg-background">
          <div className="flex gap-2">
            <Toggle variant="outline">Italic</Toggle>
            <Toggle variant="outline" pressed onPressedChange={() => {}}>Underline</Toggle>
          </div>
        </Fixture>

        <Fixture label="Disabled" bg="bg-background">
          <Toggle disabled>Disabled</Toggle>
        </Fixture>
      </div>
    </div>
  )
}

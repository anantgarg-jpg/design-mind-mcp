import React from 'react'
import { Slider } from '@blocks/Slider/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function SliderPage() {
  return (
    <div>
      <PageHeader
        name="Slider"
        level="primitive"
        confidence={0.85}
        description="Draggable range input for selecting numeric values within a defined min-max range."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default at 25">
          <div className="max-w-sm">
            <Slider value={[25]} />
          </div>
        </Fixture>

        <Fixture label="At 50 with step of 10">
          <div className="max-w-sm">
            <Slider value={[50]} step={10} />
          </div>
        </Fixture>

        <Fixture label="At 75">
          <div className="max-w-sm">
            <Slider value={[75]} ariaValueText="75 percent" />
          </div>
        </Fixture>

        <Fixture label="Disabled">
          <div className="max-w-sm">
            <Slider value={[40]} disabled />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

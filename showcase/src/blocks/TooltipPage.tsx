import React from 'react'
import { Tooltip } from '@blocks/Tooltip/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function TooltipPage() {
  return (
    <div>
      <PageHeader
        name="Tooltip"
        level="primitive"
        confidence={0.85}
        description="A hover-triggered tooltip overlay that displays contextual help text on any element."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default — top placement" bg="bg-background">
          <Tooltip content="This action saves the current record.">
            <button className="rounded-md border px-4 py-2 text-sm">Hover me</button>
          </Tooltip>
        </Fixture>

        <Fixture label="Side variations" bg="bg-background">
          <div className="flex gap-4 items-center">
            <Tooltip content="Top tooltip" side="top">
              <button className="rounded-md border px-3 py-2 text-sm">Top</button>
            </Tooltip>
            <Tooltip content="Right tooltip" side="right">
              <button className="rounded-md border px-3 py-2 text-sm">Right</button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" side="bottom">
              <button className="rounded-md border px-3 py-2 text-sm">Bottom</button>
            </Tooltip>
            <Tooltip content="Left tooltip" side="left">
              <button className="rounded-md border px-3 py-2 text-sm">Left</button>
            </Tooltip>
          </div>
        </Fixture>
      </div>
    </div>
  )
}

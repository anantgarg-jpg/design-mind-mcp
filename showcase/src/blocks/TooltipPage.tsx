import React from 'react'
import { Tooltip } from '@blocks/Tooltip/component'
import { Button } from '@blocks/Button/component'
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
            <Button variant="outline">Hover me</Button>
          </Tooltip>
        </Fixture>

        <Fixture label="Side variations" bg="bg-background">
          <div className="flex gap-4 items-center">
            <Tooltip content="Top tooltip" side="top">
              <Button variant="outline" size="sm">Top</Button>
            </Tooltip>
            <Tooltip content="Right tooltip" side="right">
              <Button variant="outline" size="sm">Right</Button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" side="bottom">
              <Button variant="outline" size="sm">Bottom</Button>
            </Tooltip>
            <Tooltip content="Left tooltip" side="left">
              <Button variant="outline" size="sm">Left</Button>
            </Tooltip>
          </div>
        </Fixture>
      </div>
    </div>
  )
}

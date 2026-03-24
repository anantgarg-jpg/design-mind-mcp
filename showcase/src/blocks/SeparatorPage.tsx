import React from 'react'
import { Separator } from '@blocks/Separator/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function SeparatorPage() {
  return (
    <div>
      <PageHeader
        name="Separator"
        level="primitive"
        confidence={0.85}
        description="Visual divider rendered as a horizontal or vertical line using the border color token."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Horizontal separator">
          <div className="space-y-3">
            <p className="text-sm">Content above</p>
            <Separator />
            <p className="text-sm">Content below</p>
          </div>
        </Fixture>

        <Fixture label="Vertical separator">
          <div className="flex items-center gap-3 h-8">
            <span className="text-sm">Left</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Right</span>
          </div>
        </Fixture>
      </div>
    </div>
  )
}

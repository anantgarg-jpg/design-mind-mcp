import React from 'react'
import { PopoverBlock } from '@blocks/Popover/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function PopoverPage() {
  return (
    <div>
      <PageHeader
        name="Popover"
        level="primitive"
        confidence={0.85}
        description="Floating content panel anchored to a trigger element, dismissed on outside click or Escape."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default (bottom-center)">
          <PopoverBlock trigger={<button className="px-3 py-2 rounded-md border text-sm">Open Popover</button>}>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Popover Content</p>
              <p className="text-sm text-muted-foreground">This is a popover panel with arbitrary content.</p>
            </div>
          </PopoverBlock>
        </Fixture>

        <Fixture label="Aligned to start">
          <PopoverBlock
            align="start"
            trigger={<button className="px-3 py-2 rounded-md border text-sm">Start-aligned</button>}
          >
            <p className="text-sm">Content aligned to the start of the trigger.</p>
          </PopoverBlock>
        </Fixture>
      </div>
    </div>
  )
}

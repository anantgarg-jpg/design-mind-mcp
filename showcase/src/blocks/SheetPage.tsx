import React from 'react'
import { Sheet } from '@blocks/Sheet/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function SheetPage() {
  return (
    <div>
      <PageHeader
        name="Sheet"
        level="primitive"
        confidence={0.85}
        description="Slide-in side panel overlay with title, description, and arbitrary content."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Right sheet (default)">
          <Sheet
            title="Patient Details"
            description="Review and update patient information."
            trigger={<button className="px-3 py-2 rounded-md border text-sm">Open Sheet</button>}
          >
            <div className="p-4 space-y-2">
              <p className="text-sm">Sheet body content goes here.</p>
            </div>
          </Sheet>
        </Fixture>

        <Fixture label="Left sheet">
          <Sheet
            title="Navigation"
            side="left"
            trigger={<button className="px-3 py-2 rounded-md border text-sm">Open Left Sheet</button>}
          >
            <div className="p-4 space-y-2">
              <p className="text-sm">Side navigation content.</p>
            </div>
          </Sheet>
        </Fixture>
      </div>
    </div>
  )
}

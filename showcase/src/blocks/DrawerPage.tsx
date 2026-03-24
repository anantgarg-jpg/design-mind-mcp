import React from 'react'
import { DrawerBlock } from '@blocks/Drawer/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function DrawerPage() {
  return (
    <div>
      <PageHeader
        name="Drawer"
        level="primitive"
        confidence={0.85}
        description="A panel that slides up from the bottom of the screen, commonly used for mobile-friendly interactions."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Drawer with header and footer">
          <DrawerBlock
            trigger={<button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm">Open drawer</button>}
            title="Filter patients"
            description="Narrow down the patient list by status and care team."
            footer={
              <div className="flex w-full gap-3">
                <button className="flex-1 rounded-md border border-border px-4 py-2 text-sm">Reset</button>
                <button className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm">Apply filters</button>
              </div>
            }
          >
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Select your filter criteria below to refine the results.</p>
              <div className="h-24 rounded-md border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                Filter controls placeholder
              </div>
            </div>
          </DrawerBlock>
        </Fixture>

        <Fixture label="Minimal drawer (content only)">
          <DrawerBlock
            trigger={<button className="rounded-md border border-border px-4 py-2 text-sm">Show details</button>}
          >
            <p className="text-sm text-muted-foreground">
              A minimal drawer with just content and the drag handle. Useful for quick previews.
            </p>
          </DrawerBlock>
        </Fixture>
      </div>
    </div>
  )
}

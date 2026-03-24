import React from 'react'
import { DrawerBlock } from '@blocks/Drawer/component'
import { Button } from '@blocks/Button/component'
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
            trigger={<Button variant="primary">Open drawer</Button>}
            title="Filter patients"
            description="Narrow down the patient list by status and care team."
            footer={
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1">Reset</Button>
                <Button variant="primary" className="flex-1">Apply filters</Button>
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
            trigger={<Button variant="outline">Show details</Button>}
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

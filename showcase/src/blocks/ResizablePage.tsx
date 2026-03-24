import React from 'react'
import { ResizableBlock } from '@blocks/Resizable/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function ResizablePage() {
  return (
    <div>
      <PageHeader
        name="Resizable"
        level="primitive"
        confidence={0.85}
        description="Resizable split-panel layout with draggable handle for adjustable content areas."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Horizontal two-panel">
          <div className="h-48 border rounded-md overflow-hidden">
            <ResizableBlock
              panels={[
                {
                  defaultSize: 40,
                  minSize: 20,
                  children: <div className="p-4 text-sm text-muted-foreground">Left panel</div>,
                },
                {
                  defaultSize: 60,
                  minSize: 20,
                  children: <div className="p-4 text-sm text-muted-foreground">Right panel</div>,
                },
              ]}
            />
          </div>
        </Fixture>

        <Fixture label="Vertical two-panel">
          <div className="h-64 border rounded-md overflow-hidden">
            <ResizableBlock
              direction="vertical"
              panels={[
                {
                  defaultSize: 50,
                  minSize: 20,
                  children: <div className="p-4 text-sm text-muted-foreground">Top panel</div>,
                },
                {
                  defaultSize: 50,
                  minSize: 20,
                  children: <div className="p-4 text-sm text-muted-foreground">Bottom panel</div>,
                },
              ]}
            />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

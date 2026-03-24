import React from 'react'
import { ContextMenu } from '@blocks/ContextMenu/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function ContextMenuPage() {
  return (
    <div>
      <PageHeader
        name="ContextMenu"
        level="primitive"
        confidence={0.85}
        description="A menu that appears on right-click, providing contextual actions for the targeted element."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Right-click target area">
          <ContextMenu
            groups={[
              {
                items: [
                  { label: 'View details', onSelect: () => {} },
                  { label: 'Edit', onSelect: () => {} },
                  { label: 'Duplicate', onSelect: () => {} },
                ],
              },
              {
                items: [
                  { label: 'Delete', onSelect: () => {}, destructive: true },
                ],
              },
            ]}
          >
            <div className="flex h-32 items-center justify-center rounded-md border-2 border-dashed border-border text-sm text-muted-foreground">
              Right-click anywhere in this area
            </div>
          </ContextMenu>
        </Fixture>

        <Fixture label="With disabled items">
          <ContextMenu
            groups={[
              {
                items: [
                  { label: 'Open', onSelect: () => {} },
                  { label: 'Share', onSelect: () => {}, disabled: true },
                  { label: 'Export', onSelect: () => {} },
                ],
              },
            ]}
          >
            <div className="flex h-32 items-center justify-center rounded-md border-2 border-dashed border-border text-sm text-muted-foreground">
              Right-click here (Share is disabled)
            </div>
          </ContextMenu>
        </Fixture>
      </div>
    </div>
  )
}

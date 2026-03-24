import React from 'react'
import { DropdownMenuBlock } from '@blocks/DropdownMenu/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function DropdownMenuPage() {
  return (
    <div>
      <PageHeader
        name="DropdownMenu"
        level="primitive"
        confidence={0.85}
        description="A menu triggered by a button click, presenting a list of actions organized into groups."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Grouped actions with labels">
          <DropdownMenuBlock
            trigger={<button className="rounded-md border border-border px-4 py-2 text-sm">Actions</button>}
            groups={[
              {
                label: 'Patient',
                items: [
                  { label: 'View profile', onClick: () => {} },
                  { label: 'Edit details', onClick: () => {} },
                ],
              },
              {
                label: 'Danger zone',
                items: [
                  { label: 'Remove from panel', onClick: () => {}, destructive: true },
                ],
              },
            ]}
          />
        </Fixture>

        <Fixture label="Simple flat menu">
          <DropdownMenuBlock
            trigger={<button className="rounded-md border border-border px-4 py-2 text-sm">Options</button>}
            groups={[
              {
                items: [
                  { label: 'Copy link', onClick: () => {} },
                  { label: 'Export as PDF', onClick: () => {} },
                  { label: 'Print', onClick: () => {}, disabled: true },
                ],
              },
            ]}
          />
        </Fixture>
      </div>
    </div>
  )
}

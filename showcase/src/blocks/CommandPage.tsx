import React, { useState } from 'react'
import { CommandPalette } from '@blocks/Command/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function CommandPage() {
  const [open, setOpen] = useState(false)

  const groups = [
    {
      heading: 'Navigation',
      actions: [
        { id: 'dashboard', label: 'Go to Dashboard', onSelect: () => console.log('Dashboard') },
        { id: 'patients', label: 'View Patients', onSelect: () => console.log('Patients') },
        { id: 'settings', label: 'Open Settings', onSelect: () => console.log('Settings'), keywords: ['preferences', 'config'] },
      ],
    },
    {
      heading: 'Actions',
      actions: [
        { id: 'new-patient', label: 'Create New Patient', onSelect: () => console.log('New patient') },
        { id: 'export', label: 'Export Report', onSelect: () => console.log('Export'), keywords: ['download', 'csv'] },
      ],
    },
  ]

  return (
    <div>
      <PageHeader
        name="Command"
        level="composite"
        confidence={0.80}
        description="A searchable command palette dialog with grouped actions for quick navigation and task execution."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Command palette (click button to open)" bg="bg-background">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Open Command Palette
          </button>
          <CommandPalette
            open={open}
            onOpenChange={setOpen}
            groups={groups}
            placeholder="Search commands..."
          />
        </Fixture>
      </div>
    </div>
  )
}

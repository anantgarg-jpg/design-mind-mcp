import React from 'react'
import { AlertDialog } from '@blocks/AlertDialog/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function AlertDialogPage() {
  return (
    <div>
      <PageHeader
        name="AlertDialog"
        level="primitive"
        confidence={0.85}
        description="A modal dialog that interrupts the user with important content and expects a response before continuing."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Destructive action confirmation">
          <AlertDialog
            trigger={<button className="rounded-md border border-destructive text-destructive px-4 py-2 text-sm">Remove patient</button>}
            title="This will remove the patient from your panel"
            description="The patient will be unassigned from your care team and all pending tasks will be reassigned. This action cannot be undone."
            actionLabel="Remove patient"
            variant="destructive"
            onAction={() => {}}
          />
        </Fixture>

        <Fixture label="Default confirmation">
          <AlertDialog
            trigger={<button className="rounded-md border border-border px-4 py-2 text-sm">Archive protocol</button>}
            title="This will archive the protocol"
            description="Archived protocols are hidden from the active list but can be restored at any time from the archives."
            actionLabel="Archive"
            variant="default"
            onAction={() => {}}
          />
        </Fixture>
      </div>
    </div>
  )
}

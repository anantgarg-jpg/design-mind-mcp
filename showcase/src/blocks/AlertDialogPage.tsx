import React from 'react'
import { AlertDialog } from '@blocks/AlertDialog/component'
import { Button } from '@blocks/Button/component'
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
            trigger={<Button variant="destructive">Remove patient</Button>}
            title="This will remove the patient from your panel"
            description="The patient will be unassigned from your care team and all pending tasks will be reassigned. This action cannot be undone."
            actionLabel="Remove patient"
            variant="destructive"
            onAction={() => {}}
          />
        </Fixture>

        <Fixture label="Default confirmation">
          <AlertDialog
            trigger={<Button variant="outline">Archive protocol</Button>}
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

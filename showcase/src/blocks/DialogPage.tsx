import React from 'react'
import { DialogBlock } from '@blocks/Dialog/component'
import { Button } from '@blocks/Button/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function DialogPage() {
  return (
    <div>
      <PageHeader
        name="Dialog"
        level="primitive"
        confidence={0.85}
        description="A modal overlay that focuses user attention on a single task or piece of content."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Basic dialog with title and description">
          <DialogBlock
            trigger={<Button variant="primary">Open dialog</Button>}
            title="Edit patient name"
            description="Update the display name for this patient record."
            footer={
              <div className="flex gap-3">
                <Button variant="outline">Cancel</Button>
                <Button variant="primary">Save changes</Button>
              </div>
            }
          >
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Full name</label>
              <input className="rounded-md border border-input px-3 py-2 text-sm" defaultValue="John Doe" />
            </div>
          </DialogBlock>
        </Fixture>

        <Fixture label="Informational dialog (no footer)">
          <DialogBlock
            trigger={<Button variant="outline">View policy</Button>}
            title="Data retention policy"
            description="How we handle patient data storage and archival."
          >
            <p className="text-sm text-muted-foreground">
              Patient records are retained for a minimum of 7 years in compliance with regulatory requirements.
              Archived records can be restored by an administrator within 90 days of archival.
            </p>
          </DialogBlock>
        </Fixture>
      </div>
    </div>
  )
}

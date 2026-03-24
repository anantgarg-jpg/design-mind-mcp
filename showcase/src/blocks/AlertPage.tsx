import React from 'react'
import { Alert } from '@blocks/Alert/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function AlertPage() {
  return (
    <div>
      <PageHeader
        name="Alert"
        level="primitive"
        confidence={0.85}
        description="Displays a callout message to attract the user's attention without interrupting their workflow."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default variant">
          <Alert title="Heads up">
            Your care plan has been updated with new recommendations from the clinical team.
          </Alert>
        </Fixture>

        <Fixture label="Default variant without title">
          <Alert>
            Remember to complete your daily health assessment before 5 PM.
          </Alert>
        </Fixture>

        <Fixture label="Destructive variant">
          <Alert variant="destructive" title="Action required">
            Your session has expired. Please save your work and sign in again.
          </Alert>
        </Fixture>

        <Fixture label="Destructive variant without title">
          <Alert variant="destructive">
            Unable to sync patient records. Check your network connection and try again.
          </Alert>
        </Fixture>
      </div>
    </div>
  )
}

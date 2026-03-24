import React from 'react'
import { ProgressBlock } from '@blocks/Progress/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function ProgressPage() {
  return (
    <div>
      <PageHeader
        name="Progress"
        level="primitive"
        confidence={0.85}
        description="Horizontal progress bar indicating completion percentage with optional label."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="25% progress">
          <ProgressBlock value={25} />
        </Fixture>

        <Fixture label="50% progress with label">
          <ProgressBlock value={50} showLabel />
        </Fixture>

        <Fixture label="75% progress with label">
          <ProgressBlock value={75} showLabel ariaLabel="Task completion" />
        </Fixture>
      </div>
    </div>
  )
}

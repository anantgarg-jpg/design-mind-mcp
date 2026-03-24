import React from 'react'
import { HoverCardBlock } from '@blocks/HoverCard/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function HoverCardPage() {
  return (
    <div>
      <PageHeader
        name="HoverCard"
        level="primitive"
        confidence={0.85}
        description="A non-modal popup that appears on hover or focus, providing supplementary preview information."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="User profile preview">
          <HoverCardBlock
            trigger={
              <button className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                Dr. Sarah Chen
              </button>
            }
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Dr. Sarah Chen</p>
              <p className="text-sm text-muted-foreground">Primary Care Physician</p>
              <p className="text-sm text-muted-foreground">Active since Jan 2024 — 48 patients</p>
            </div>
          </HoverCardBlock>
        </Fixture>

        <Fixture label="Protocol tooltip">
          <p className="text-sm">
            Patient is enrolled in{' '}
            <HoverCardBlock
              trigger={
                <button className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                  HbA1c Monitoring
                </button>
              }
              align="start"
            >
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">HbA1c Monitoring Protocol</p>
                <p className="text-sm text-muted-foreground">Tracks glycated hemoglobin levels quarterly for diabetic patients.</p>
                <p className="text-sm text-muted-foreground">12 enrolled — 4 pending outreach</p>
              </div>
            </HoverCardBlock>
            {' '}protocol.
          </p>
        </Fixture>
      </div>
    </div>
  )
}

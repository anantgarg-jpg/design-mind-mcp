import React from 'react'
import { Switch } from '@blocks/Switch/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function SwitchPage() {
  return (
    <div>
      <PageHeader
        name="Switch"
        level="primitive"
        confidence={0.85}
        description="A toggle switch for binary on/off settings with label support and accessible touch targets."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default — unchecked" bg="bg-background">
          <Switch label="Enable notifications" />
        </Fixture>

        <Fixture label="Checked state" bg="bg-background">
          <Switch label="Dark mode" checked={true} onCheckedChange={() => {}} />
        </Fixture>

        <Fixture label="Disabled — unchecked" bg="bg-background">
          <Switch label="Unavailable feature" disabled />
        </Fixture>

        <Fixture label="Disabled — checked" bg="bg-background">
          <Switch label="Locked setting" checked={true} disabled />
        </Fixture>
      </div>
    </div>
  )
}

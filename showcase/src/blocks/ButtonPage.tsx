import React from 'react'
import { Button } from '@blocks/Button/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function ButtonPage() {
  return (
    <div>
      <PageHeader
        name="Button"
        level="primitive"
        confidence={0.85}
        description="The primary interactive element for triggering actions, available in multiple variants and sizes."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </Fixture>

        <Fixture label="Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">+</Button>
          </div>
        </Fixture>

        <Fixture label="Disabled state">
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled default</Button>
            <Button variant="destructive" disabled>Disabled destructive</Button>
            <Button variant="outline" disabled>Disabled outline</Button>
          </div>
        </Fixture>
      </div>
    </div>
  )
}

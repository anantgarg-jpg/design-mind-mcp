import React from 'react'
import { ScrollAreaBlock } from '@blocks/ScrollArea/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function ScrollAreaPage() {
  return (
    <div>
      <PageHeader
        name="ScrollArea"
        level="primitive"
        confidence={0.85}
        description="Custom-styled scrollable container with native scrolling behavior and styled scrollbar."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Vertical scroll list">
          <ScrollAreaBlock height={200}>
            <div className="space-y-2 p-2">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="rounded-md border border-border p-3 text-sm">
                  Item {i + 1}
                </div>
              ))}
            </div>
          </ScrollAreaBlock>
        </Fixture>

        <Fixture label="Horizontal scroll">
          <ScrollAreaBlock orientation="horizontal" width={400}>
            <div className="flex gap-3 p-2">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-32 h-20 rounded-md border border-border flex items-center justify-center text-sm text-muted-foreground"
                >
                  Card {i + 1}
                </div>
              ))}
            </div>
          </ScrollAreaBlock>
        </Fixture>
      </div>
    </div>
  )
}

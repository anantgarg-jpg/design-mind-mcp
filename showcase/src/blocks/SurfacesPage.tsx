import React from 'react'

export const SURFACES = [
  { id: 'card' },
  { id: 'popover' },
  { id: 'dialog' },
  { id: 'sheet' },
  { id: 'drawer' },
]

export function SurfaceDetailPane({ surfaceId }: { surfaceId: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 capitalize">{surfaceId}</h2>
      <p className="text-sm text-muted-foreground">Surface detail view coming soon.</p>
    </div>
  )
}

import React from 'react'
import _surfacesData from 'virtual:surfaces'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Fixture } from '@/components/Fixture'

export interface Surface {
  id: string
  user_type: string[]
  intent: string
  what_it_omits: { item: string; reason: string }[]
  empty_state_meaning: string
  ordering: string
  actions: { label: string; stage: string; constraint: string }[]
  never: string[]
}

export const SURFACES: Surface[] = _surfacesData as Surface[]

// Auto-discover previews placed alongside surface YAML files (.preview.tsx)
const _discovered = import.meta.glob(
  '../../../surfaces/*.preview.tsx',
  { eager: true }
) as Record<string, { default: React.FC }>

const SURFACE_PREVIEW_MAP: Partial<Record<string, React.FC>> = Object.fromEntries(
  Object.entries(_discovered)
    .map(([path, mod]) => {
      const id = path.match(/([^/]+)\.preview\.tsx$/)?.[1] ?? ''
      return [id, mod.default] as [string, React.FC]
    })
    .filter(([id]) => !!id)
)

// ── Surface detail pane ───────────────────────────────────────────────────────

export function SurfaceDetailPane({ surfaceId }: { surfaceId: string }) {
  const surface = SURFACES.find((s) => s.id === surfaceId)
  if (!surface) return null

  const PreviewComponent = SURFACE_PREVIEW_MAP[surface.id]

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-foreground">{surface.id}</h1>
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">surface</Badge>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {surface.user_type.map((u) => (
            <Badge key={u} variant="secondary" className="text-xs capitalize">{u}</Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Preview */}
      <Fixture label="Preview">
        {PreviewComponent
          ? <PreviewComponent />
          : <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">No preview — add a <code className="mx-1 text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{surface.id}.preview.tsx</code> in surfaces/.</div>
        }
      </Fixture>

      {/* Intent */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Intent</h2>
        <p className="text-base text-foreground leading-relaxed">{surface.intent}</p>
      </section>

      {/* Ordering */}
      {surface.ordering && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ordering</h2>
          <p className="text-base text-foreground leading-relaxed">{surface.ordering}</p>
        </section>
      )}

      {/* Empty state */}
      {surface.empty_state_meaning && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Empty State</h2>
          <p className="text-base text-foreground leading-relaxed">{surface.empty_state_meaning}</p>
        </section>
      )}

      {/* Actions */}
      {surface.actions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actions</h2>
          <div className="space-y-2">
            {surface.actions.map((a, i) => (
              <div key={i} className="rounded-md border border-border bg-card px-4 py-3">
                <p className="text-sm font-medium text-foreground mb-1">{a.label}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Stage:</span> {a.stage}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Constraint:</span> {a.constraint}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What it omits */}
      {surface.what_it_omits.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">What It Omits</h2>
          <div className="space-y-3">
            {surface.what_it_omits.map((o, i) => (
              <div key={i} className="rounded-md border border-border bg-card px-4 py-3">
                <p className="text-sm font-medium text-foreground mb-1">{o.item}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{o.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Never */}
      {surface.never.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Never</h2>
          <ul className="space-y-1">
            {surface.never.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-destructive mt-0.5 shrink-0">✕</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  )
}

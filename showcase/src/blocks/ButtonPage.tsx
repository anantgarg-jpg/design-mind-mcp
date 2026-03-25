import React from 'react'
import { ArrowRight, ChevronLeft, Settings } from 'lucide-react'
import { Button } from '@blocks/Button/component'
import { Fixture, PageHeader } from '@/components/Fixture'

// ── State simulation helpers ──────────────────────────────────────────────────
// These className overrides force the visual appearance of CSS interactive
// states for documentation purposes. Real states are driven by CSS pseudo-classes.

const HOVER_CLASSES: Record<string, string> = {
  primary:     '!bg-primary/90',
  destructive: '!bg-destructive/90',
  basic:       '!bg-foreground/[0.1] !text-foreground',
  outline:     '!bg-foreground/[0.04]',
  transparent: '!bg-foreground/[0.06] !text-foreground',
  link:        'underline !text-primary/80',
}

const PRESSED_CLASSES: Record<string, string> = {
  primary:     '!bg-primary/85 scale-[0.97]',
  destructive: '!bg-destructive/85 scale-[0.97]',
  basic:       '!bg-foreground/[0.14] scale-[0.97]',
  outline:     '!bg-foreground/[0.08] scale-[0.97]',
  transparent: '!bg-foreground/[0.1] scale-[0.97]',
  link:        '!text-primary/70',
}

const FOCUSED_CLASSES: Record<string, string> = {
  primary:     'ring-2 ring-ring ring-offset-1 outline-none',
  destructive: 'ring-2 ring-ring-destructive ring-offset-1 outline-none',
  basic:       'ring-2 ring-ring ring-offset-1 outline-none',
  outline:     'ring-2 ring-ring ring-offset-1 outline-none',
  transparent: 'ring-2 ring-ring ring-offset-1 outline-none',
  link:        'ring-2 ring-ring ring-offset-1 outline-none',
}

type Variant = 'primary' | 'destructive' | 'basic' | 'outline' | 'transparent' | 'link'

function StateCell({ label, className, variant, disabled }: {
  label: string
  className?: string
  variant: Variant
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button
        variant={variant}
        size="default"
        className={className}
        disabled={disabled}
      >
        Action
      </Button>
      <span className="text-[10px] text-muted-foreground font-mono">{label}</span>
    </div>
  )
}

function StateRow({ variant, label }: { variant: Variant; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex flex-wrap gap-4">
        <StateCell label="Default"  variant={variant} />
        <StateCell label="Hover"    variant={variant} className={HOVER_CLASSES[variant]} />
        <StateCell label="Pressed"  variant={variant} className={PRESSED_CLASSES[variant]} />
        <StateCell label="Focused"  variant={variant} className={FOCUSED_CLASSES[variant]} />
        <StateCell label="Disabled" variant={variant} disabled />
      </div>
    </div>
  )
}

// ── Content variant helpers ───────────────────────────────────────────────────

function ContentRow({ variant, size, label }: {
  variant: Variant
  size: 'sm' | 'default' | 'lg'
  label: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground font-mono">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant={variant} size={size}>Action</Button>
        <Button variant={variant} size={size} leftIcon={<ChevronLeft />}>Action</Button>
        <Button variant={variant} size={size} rightIcon={<ArrowRight />}>Action</Button>
        {variant !== 'link' && (
          <Button variant={variant} size={size} iconOnly aria-label="Settings">
            <Settings />
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function ButtonPage() {
  return (
    <div>
      <PageHeader
        name="Button"
        level="primitive"
        confidence={0.85}
        description="Interactive trigger for user actions. Six types, three sizes (24/32/40px), four content layouts, and five states."
      />

      <div className="flex flex-col gap-6">

        {/* ── Types ── */}
        <Fixture label="Types">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="basic">Basic</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="transparent">Transparent</Button>
            <Button variant="link">Link</Button>
          </div>
        </Fixture>

        {/* ── Sizes ── */}
        <Fixture label="Sizes">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <Button variant="primary" size="sm">Small</Button>
              <span className="text-[10px] text-muted-foreground font-mono">sm · 24px</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Button variant="primary" size="default">Default</Button>
              <span className="text-[10px] text-muted-foreground font-mono">default · 32px</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Button variant="primary" size="lg">Large</Button>
              <span className="text-[10px] text-muted-foreground font-mono">lg · 40px</span>
            </div>
          </div>
        </Fixture>

        {/* ── Content variants × Sizes ── */}
        <Fixture label="Content variants × Sizes">
          <div className="flex flex-col gap-5">
            <ContentRow variant="primary" size="sm"      label="sm (24px) — text / left icon / right icon / icon only" />
            <ContentRow variant="primary" size="default" label="default (32px) — text / left icon / right icon / icon only" />
            <ContentRow variant="primary" size="lg"      label="lg (40px) — text / left icon / right icon / icon only" />
          </div>
        </Fixture>

        {/* ── Content variants × Types ── */}
        <Fixture label="Content variants × Types (default size)">
          <div className="flex flex-col gap-5">
            {(
              [
                ['primary',     'Primary'],
                ['destructive', 'Destructive'],
                ['basic',       'Basic'],
                ['outline',     'Outline'],
                ['transparent', 'Transparent'],
                ['link',        'Link'],
              ] as [Variant, string][]
            ).map(([variant, label]) => (
              <div key={variant} className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground font-mono">{label}</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant={variant}>Action</Button>
                  <Button variant={variant} leftIcon={<ChevronLeft />}>Action</Button>
                  <Button variant={variant} rightIcon={<ArrowRight />}>Action</Button>
                  {variant !== 'link' && (
                    <Button variant={variant} iconOnly aria-label="Settings">
                      <Settings />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Fixture>

        {/* ── States ── */}
        <Fixture label="States × Types">
          <div className="flex flex-col gap-6">
            <StateRow variant="primary"     label="Primary" />
            <StateRow variant="destructive" label="Destructive" />
            <StateRow variant="basic"       label="Basic" />
            <StateRow variant="outline"     label="Outline" />
            <StateRow variant="transparent" label="Transparent" />
            <StateRow variant="link"        label="Link" />
          </div>
        </Fixture>

      </div>
    </div>
  )
}

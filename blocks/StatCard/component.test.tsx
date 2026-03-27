import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StatCard } from './component'

function getValueClass(ui: React.ReactElement): string {
  const { container } = render(ui)
  // The value <p> is the second <p> inside the flex column
  const paragraphs = container.querySelectorAll('p')
  // First p is label, second p is value
  return paragraphs[1]?.className ?? ''
}

describe('StatCard', () => {
  describe('VARIANT_CLASSES — text colour on value element', () => {
    it('default — has text-foreground', () => {
      const cls = getValueClass(<StatCard label="Count" value={42} variant="default" />)
      expect(cls).toContain('text-foreground')
    })

    it('urgent — has text-destructive', () => {
      const cls = getValueClass(<StatCard label="Count" value={42} variant="urgent" />)
      expect(cls).toContain('text-destructive')
    })

    it('warning — has text-warning', () => {
      const cls = getValueClass(<StatCard label="Count" value={42} variant="warning" />)
      expect(cls).toContain('text-warning')
    })

    it('success — has text-success', () => {
      const cls = getValueClass(<StatCard label="Count" value={42} variant="success" />)
      expect(cls).toContain('text-success')
    })
  })

  describe('value element — invariants', () => {
    it('has text-4xl font-medium tabular-nums leading-none', () => {
      const cls = getValueClass(<StatCard label="Count" value={42} />)
      expect(cls).toContain('text-4xl')
      expect(cls).toContain('font-medium')
      expect(cls).toContain('tabular-nums')
      expect(cls).toContain('leading-none')
    })

    it('does not have arbitrary text-[32px]', () => {
      const cls = getValueClass(<StatCard label="Count" value={42} />)
      expect(cls).not.toContain('text-[32px]')
    })
  })

  describe('caller className override', () => {
    it('className passed to Card container', () => {
      const { container } = render(
        <StatCard label="Count" value={42} className="custom-class" />
      )
      // className goes to the Card wrapper — check within rendered output
      expect(container.innerHTML).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    const variants = ['default', 'urgent', 'warning', 'success'] as const
    variants.forEach((variant) => {
      it(`variant=${variant}`, () => {
        const { container } = render(
          <StatCard label="Overdue" value={12} variant={variant} subtitle="Last 30 days" />
        )
        expect(container.firstChild).toMatchSnapshot()
      })
    })
  })
})

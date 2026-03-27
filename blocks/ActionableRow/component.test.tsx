import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ActionableRow } from './component'

function getClass(ui: React.ReactElement): string {
  const { container } = render(ui)
  return (container.firstChild as HTMLElement).className
}

describe('ActionableRow', () => {
  describe('VARIANT_CLASSES — row (default)', () => {
    it('has px-4 py-3.5', () => {
      const cls = getClass(<ActionableRow title="Test" />)
      expect(cls).toContain('px-4')
      expect(cls).toContain('py-3.5')
    })

    it('has bg-card', () => {
      const cls = getClass(<ActionableRow title="Test" />)
      expect(cls).toContain('bg-card')
    })

    it('has border-l-2', () => {
      const cls = getClass(<ActionableRow title="Test" />)
      expect(cls).toContain('border-l-2')
    })

    it('has hover:bg-muted/60', () => {
      const cls = getClass(<ActionableRow title="Test" />)
      expect(cls).toContain('hover:bg-muted/60')
    })

    it('does not have rounded-lg (card-specific)', () => {
      const cls = getClass(<ActionableRow title="Test" />)
      expect(cls).not.toContain('rounded-lg')
    })
  })

  describe('VARIANT_CLASSES — card', () => {
    it('has p-4', () => {
      const cls = getClass(<ActionableRow variant="card" title="Test" />)
      expect(cls).toContain('p-4')
    })

    it('has rounded-lg shadow-sm', () => {
      const cls = getClass(<ActionableRow variant="card" title="Test" />)
      expect(cls).toContain('rounded-lg')
      expect(cls).toContain('shadow-sm')
    })

    it('has hover:bg-accent/50', () => {
      const cls = getClass(<ActionableRow variant="card" title="Test" />)
      expect(cls).toContain('hover:bg-accent/50')
    })

    it('does not have border-l-2 (row-specific)', () => {
      const cls = getClass(<ActionableRow variant="card" title="Test" />)
      expect(cls).not.toContain('border-l-2')
    })

    it('does not have hover:bg-muted/60 (row-specific)', () => {
      const cls = getClass(<ActionableRow variant="card" title="Test" />)
      expect(cls).not.toContain('hover:bg-muted/60')
    })
  })

  describe('ACCENT_BORDER — row variant only', () => {
    it('warning accent — has border-l-warning', () => {
      const cls = getClass(<ActionableRow accent="warning" title="Test" />)
      expect(cls).toContain('border-l-warning')
    })

    it('success accent — has border-l-success', () => {
      const cls = getClass(<ActionableRow accent="success" title="Test" />)
      expect(cls).toContain('border-l-success')
    })

    it('accent accent — has border-l-accent', () => {
      const cls = getClass(<ActionableRow accent="accent" title="Test" />)
      expect(cls).toContain('border-l-accent')
    })

    it('none accent — has border-l-transparent', () => {
      const cls = getClass(<ActionableRow accent="none" title="Test" />)
      expect(cls).toContain('border-l-transparent')
    })

    it('card variant ignores accent', () => {
      const cls = getClass(<ActionableRow variant="card" accent="warning" title="Test" />)
      expect(cls).not.toContain('border-l-warning')
    })
  })

  describe('dimmed state', () => {
    it('has opacity-50 pointer-events-none when dimmed', () => {
      const cls = getClass(<ActionableRow dimmed title="Test" />)
      expect(cls).toContain('opacity-50')
      expect(cls).toContain('pointer-events-none')
    })
  })

  describe('caller className override', () => {
    it('appends caller className', () => {
      const cls = getClass(<ActionableRow title="Test" className="custom-class" />)
      expect(cls).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    const accents = ['warning', 'accent', 'success', 'none'] as const

    accents.forEach((accent) => {
      it(`row variant / accent=${accent}`, () => {
        const { container } = render(
          <ActionableRow variant="row" accent={accent} title="Test Row" />
        )
        expect(container.firstChild).toMatchSnapshot()
      })
    })

    it('card variant', () => {
      const { container } = render(<ActionableRow variant="card" title="Test Card" />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

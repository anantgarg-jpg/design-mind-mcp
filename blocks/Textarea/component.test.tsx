import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Textarea } from './component'

function getClass(ui: React.ReactElement): string {
  const { container } = render(ui)
  return (container.firstChild as HTMLElement).className
}

describe('Textarea', () => {
  describe('min-height — min-h-20 (replaces min-h-[80px])', () => {
    it('has min-h-20', () => {
      const cls = getClass(<Textarea />)
      expect(cls).toContain('min-h-20')
    })

    it('does not have arbitrary min-h-[80px]', () => {
      const { container } = render(<Textarea />)
      expect(container.innerHTML).not.toContain('min-h-[80px]')
    })
  })

  describe('invariants', () => {
    it('has rounded-md border border-subtle bg-card px-3 py-2 text-base', () => {
      const cls = getClass(<Textarea />)
      expect(cls).toContain('rounded-md')
      expect(cls).toContain('border-subtle')
      expect(cls).toContain('bg-card')
      expect(cls).toContain('px-3')
      expect(cls).toContain('py-2')
      expect(cls).toContain('text-base')
    })

    it('has resize-y', () => {
      const cls = getClass(<Textarea />)
      expect(cls).toContain('resize-y')
    })

    it('has focus-visible:ring-2 focus-visible:ring-ring', () => {
      const cls = getClass(<Textarea />)
      expect(cls).toContain('focus-visible:ring-2')
      expect(cls).toContain('focus-visible:ring-ring')
    })
  })

  describe('error state', () => {
    it('has border-destructive when error=true', () => {
      const cls = getClass(<Textarea error />)
      expect(cls).toContain('border-destructive')
    })
  })

  describe('caller className override', () => {
    it('appends caller className', () => {
      const cls = getClass(<Textarea className="custom-class" />)
      expect(cls).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    it('default', () => {
      const { container } = render(<Textarea placeholder="Enter text..." />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('with error', () => {
      const { container } = render(<Textarea error placeholder="Required" />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

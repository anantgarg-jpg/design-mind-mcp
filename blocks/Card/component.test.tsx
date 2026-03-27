import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Card } from './component'

function getClass(ui: React.ReactElement): string {
  const { container } = render(ui)
  return (container.firstChild as HTMLElement).className
}

describe('Card', () => {
  describe('interactive state classes', () => {
    it('has hover:bg-foreground/5 when interactive', () => {
      const cls = getClass(<Card onClick={() => {}}>content</Card>)
      expect(cls).toContain('hover:bg-foreground/5')
    })

    it('does not have hover:bg-foreground/[0.04]', () => {
      const cls = getClass(<Card onClick={() => {}}>content</Card>)
      expect(cls).not.toContain('hover:bg-foreground/[0.04]')
    })

    it('has active:bg-foreground/10 when interactive', () => {
      const cls = getClass(<Card onClick={() => {}}>content</Card>)
      expect(cls).toContain('active:bg-foreground/10')
    })

    it('does not have active:bg-foreground/[0.08]', () => {
      const cls = getClass(<Card onClick={() => {}}>content</Card>)
      expect(cls).not.toContain('active:bg-foreground/[0.08]')
    })

    it('has focus-visible:ring-2 when interactive', () => {
      const cls = getClass(<Card onClick={() => {}}>content</Card>)
      expect(cls).toContain('focus-visible:ring-2')
    })
  })

  describe('non-interactive card — no hover/active', () => {
    it('does not have hover:bg-foreground/5 when not interactive', () => {
      const cls = getClass(<Card>content</Card>)
      expect(cls).not.toContain('hover:bg-foreground/5')
    })

    it('does not have active:bg-foreground/10 when not interactive', () => {
      const cls = getClass(<Card>content</Card>)
      expect(cls).not.toContain('active:bg-foreground/10')
    })
  })

  describe('elevation classes', () => {
    it('flat — no shadow class', () => {
      const cls = getClass(<Card elevation="flat">content</Card>)
      expect(cls).not.toContain('shadow-sm')
      expect(cls).not.toContain('shadow-md')
    })

    it('sm — has shadow-sm', () => {
      const cls = getClass(<Card elevation="sm">content</Card>)
      expect(cls).toContain('shadow-sm')
    })

    it('md — has shadow-md', () => {
      const cls = getClass(<Card elevation="md">content</Card>)
      expect(cls).toContain('shadow-md')
    })
  })

  describe('caller className override', () => {
    it('appends caller className', () => {
      const cls = getClass(<Card className="custom-class">content</Card>)
      expect(cls).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    it('flat (default)', () => {
      const { container } = render(<Card>content</Card>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('interactive with sm elevation', () => {
      const { container } = render(
        <Card elevation="sm" onClick={() => {}}>content</Card>
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('selected', () => {
      const { container } = render(<Card selected>content</Card>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('disabled', () => {
      const { container } = render(<Card disabled>content</Card>)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

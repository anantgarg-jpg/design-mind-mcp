import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Alert } from './component'

function getClass(ui: React.ReactElement): string {
  const { container } = render(ui)
  return (container.firstChild as HTMLElement).className
}

describe('Alert', () => {
  describe('VARIANT_CLASSES — default', () => {
    it('has border-border', () => {
      const cls = getClass(<Alert>Message</Alert>)
      expect(cls).toContain('border-border')
    })

    it('does not have border-destructive', () => {
      const cls = getClass(<Alert>Message</Alert>)
      expect(cls).not.toContain('border-destructive')
    })
  })

  describe('VARIANT_CLASSES — destructive', () => {
    it('has border-destructive', () => {
      const cls = getClass(<Alert variant="destructive">Message</Alert>)
      expect(cls).toContain('border-destructive')
    })

    it('has text-destructive', () => {
      const cls = getClass(<Alert variant="destructive">Message</Alert>)
      expect(cls).toContain('text-destructive')
    })

    it('does not have border-border', () => {
      const cls = getClass(<Alert variant="destructive">Message</Alert>)
      expect(cls).not.toContain('border-border')
    })
  })

  describe('invariants always present', () => {
    it('has rounded-lg border p-4 on default', () => {
      const cls = getClass(<Alert>Message</Alert>)
      expect(cls).toContain('rounded-lg')
      expect(cls).toContain('border')
      expect(cls).toContain('p-4')
    })

    it('has rounded-lg border p-4 on destructive', () => {
      const cls = getClass(<Alert variant="destructive">Message</Alert>)
      expect(cls).toContain('rounded-lg')
      expect(cls).toContain('border')
      expect(cls).toContain('p-4')
    })
  })

  describe('caller className override', () => {
    it('appends caller className', () => {
      const cls = getClass(<Alert className="custom-class">Message</Alert>)
      expect(cls).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    it('default variant', () => {
      const { container } = render(<Alert title="Info">Message body</Alert>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('destructive variant', () => {
      const { container } = render(
        <Alert variant="destructive" title="Error">Something went wrong</Alert>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

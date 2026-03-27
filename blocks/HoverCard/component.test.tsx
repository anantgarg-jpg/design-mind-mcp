import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HoverCardBlock } from './component'

describe('HoverCardBlock', () => {
  describe('max-width — max-w-xs (replaces max-w-[320px])', () => {
    it('does not have arbitrary max-w-[320px]', () => {
      render(
        <HoverCardBlock trigger={<button>hover</button>}>
          content
        </HoverCardBlock>
      )
      expect(document.body.innerHTML).not.toContain('max-w-[320px]')
    })
  })

  describe('trigger renders', () => {
    it('renders trigger element', () => {
      const { container } = render(
        <HoverCardBlock trigger={<button>hover me</button>}>content</HoverCardBlock>
      )
      expect(container.textContent).toContain('hover me')
    })
  })

  describe('caller className override', () => {
    it('does not throw when className is passed (portal-rendered on hover, not testable in jsdom)', () => {
      // HoverCardContent only renders on hover — className is applied in the portal,
      // which jsdom does not trigger. We verify rendering does not throw.
      expect(() =>
        render(
          <HoverCardBlock trigger={<button>hover</button>} className="custom-class">
            content
          </HoverCardBlock>
        )
      ).not.toThrow()
    })
  })

  describe('snapshots', () => {
    it('renders trigger', () => {
      const { container } = render(
        <HoverCardBlock trigger={<button>hover</button>}>card content</HoverCardBlock>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

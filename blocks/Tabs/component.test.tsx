import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Tabs } from './component'

const items = [
  { value: 'a', label: 'Tab A', content: <div>Content A</div> },
  { value: 'b', label: 'Tab B', content: <div>Content B</div> },
]

describe('Tabs', () => {
  describe('trigger touch target — min-h-11', () => {
    it('triggers have min-h-11', () => {
      const { container } = render(<Tabs items={items} />)
      const triggers = container.querySelectorAll('[role="tab"]')
      triggers.forEach((t) => {
        expect(t.className).toContain('min-h-11')
      })
    })

    it('does not have arbitrary min-h-[44px]', () => {
      const { container } = render(<Tabs items={items} />)
      expect(container.innerHTML).not.toContain('min-h-[44px]')
    })
  })

  describe('trigger invariants', () => {
    it('triggers have text-sm font-semibold text-muted-foreground', () => {
      const { container } = render(<Tabs items={items} />)
      const trigger = container.querySelector('[role="tab"]') as HTMLElement
      expect(trigger.className).toContain('text-sm')
      expect(trigger.className).toContain('font-semibold')
      expect(trigger.className).toContain('text-muted-foreground')
    })

    it('triggers have focus-visible:ring-2', () => {
      const { container } = render(<Tabs items={items} />)
      const trigger = container.querySelector('[role="tab"]') as HTMLElement
      expect(trigger.className).toContain('focus-visible:ring-2')
    })
  })

  describe('caller className override', () => {
    it('appends caller className', () => {
      const { container } = render(<Tabs items={items} className="custom-class" />)
      expect(container.innerHTML).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    it('default (first tab active)', () => {
      const { container } = render(<Tabs items={items} />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

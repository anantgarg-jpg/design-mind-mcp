import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CommandPalette } from './component'

const groups = [
  {
    heading: 'Actions',
    actions: [
      { id: '1', label: 'Action One', onSelect: () => {} },
      { id: '2', label: 'Action Two', onSelect: () => {} },
    ],
  },
]

describe('CommandPalette', () => {
  describe('item touch target — min-h-11', () => {
    it('items have min-h-11', () => {
      render(<CommandPalette open groups={groups} onOpenChange={() => {}} />)
      // CommandDialog renders into a portal — check full body
      const items = document.querySelectorAll('[cmdk-item]')
      items.forEach((item) => {
        expect(item.className).toContain('min-h-11')
      })
    })

    it('does not have arbitrary min-h-[44px]', () => {
      render(<CommandPalette open groups={groups} onOpenChange={() => {}} />)
      expect(document.body.innerHTML).not.toContain('min-h-[44px]')
    })
  })

  describe('snapshots', () => {
    it('renders closed (no portal)', () => {
      const { container } = render(
        <CommandPalette open={false} groups={groups} onOpenChange={() => {}} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

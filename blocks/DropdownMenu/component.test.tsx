import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DropdownMenuBlock } from './component'

const groups = [
  {
    items: [
      { label: 'Edit', onClick: () => {} },
      { label: 'Delete', onClick: () => {}, destructive: true },
    ],
  },
]

const trigger = <button>Open</button>

describe('DropdownMenuBlock', () => {
  describe('container — min-w-32 (replaces min-w-[8rem])', () => {
    it('does not have arbitrary min-w-[8rem]', () => {
      render(<DropdownMenuBlock trigger={trigger} groups={groups} />)
      expect(document.body.innerHTML).not.toContain('min-w-[8rem]')
    })
  })

  describe('item touch target — min-h-11', () => {
    it('does not have arbitrary min-h-[44px]', () => {
      render(<DropdownMenuBlock trigger={trigger} groups={groups} />)
      expect(document.body.innerHTML).not.toContain('min-h-[44px]')
    })
  })

  describe('trigger renders', () => {
    it('renders trigger element', () => {
      const { container } = render(
        <DropdownMenuBlock trigger={trigger} groups={groups} />
      )
      expect(container.textContent).toContain('Open')
    })
  })

  describe('snapshots', () => {
    it('renders trigger', () => {
      const { container } = render(
        <DropdownMenuBlock trigger={trigger} groups={groups} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

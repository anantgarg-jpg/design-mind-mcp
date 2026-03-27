import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NavigationMenuBlock } from './component'

const items = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  {
    label: 'Products',
    children: [
      { label: 'Widget', href: '/products/widget' },
      { label: 'Gadget', href: '/products/gadget', description: 'A gadget' },
    ],
  },
]

describe('NavigationMenuBlock', () => {
  describe('dropdown grid width — w-96 (replaces w-[400px])', () => {
    it('does not have arbitrary w-[400px]', () => {
      const { container } = render(<NavigationMenuBlock items={items} />)
      expect(container.innerHTML).not.toContain('w-[400px]')
    })
  })

  describe('trigger invariants', () => {
    it('triggers have text-base font-semibold', () => {
      const { container } = render(<NavigationMenuBlock items={items} />)
      // NavigationMenuTrigger should have these classes
      expect(container.innerHTML).toContain('text-base')
      expect(container.innerHTML).toContain('font-semibold')
    })
  })

  describe('caller className override', () => {
    it('appends caller className', () => {
      const { container } = render(
        <NavigationMenuBlock items={items} className="custom-class" />
      )
      expect(container.innerHTML).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    it('renders nav', () => {
      const { container } = render(<NavigationMenuBlock items={items} />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

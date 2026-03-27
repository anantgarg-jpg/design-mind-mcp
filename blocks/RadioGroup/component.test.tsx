import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { RadioGroupBlock } from './component'

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B', description: 'A description' },
  { value: 'c', label: 'Option C', disabled: true },
]

describe('RadioGroupBlock', () => {
  describe('touch target — min-h-11 (replaces min-h-[44px])', () => {
    it('item rows have min-h-11', () => {
      const { container } = render(<RadioGroupBlock options={options} />)
      // Each radio row is a div with flex items-start gap-2 min-h-11
      const rows = container.querySelectorAll('div.flex.items-start')
      rows.forEach((row) => {
        expect(row.className).toContain('min-h-11')
      })
    })

    it('does not have arbitrary min-h-[44px]', () => {
      const { container } = render(<RadioGroupBlock options={options} />)
      expect(container.innerHTML).not.toContain('min-h-[44px]')
    })
  })

  describe('radio item invariants', () => {
    it('radio buttons have border-subtle', () => {
      const { container } = render(<RadioGroupBlock options={options} />)
      expect(container.innerHTML).toContain('border-subtle')
    })

    it('radio buttons have focus-visible:ring-2', () => {
      const { container } = render(<RadioGroupBlock options={options} />)
      expect(container.innerHTML).toContain('focus-visible:ring-2')
    })
  })

  describe('error state', () => {
    it('has border-destructive on radio items when error=true', () => {
      const { container } = render(<RadioGroupBlock options={options} error />)
      expect(container.innerHTML).toContain('border-destructive')
    })
  })

  describe('orientation', () => {
    it('vertical — has flex-col', () => {
      const { container } = render(<RadioGroupBlock options={options} orientation="vertical" />)
      expect((container.firstChild as HTMLElement).className).toContain('flex-col')
    })

    it('horizontal — has flex-row', () => {
      const { container } = render(<RadioGroupBlock options={options} orientation="horizontal" />)
      expect((container.firstChild as HTMLElement).className).toContain('flex-row')
    })
  })

  describe('caller className override', () => {
    it('appends caller className', () => {
      const { container } = render(<RadioGroupBlock options={options} className="custom-class" />)
      expect((container.firstChild as HTMLElement).className).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    it('vertical', () => {
      const { container } = render(<RadioGroupBlock options={options} value="a" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('horizontal', () => {
      const { container } = render(
        <RadioGroupBlock options={options} orientation="horizontal" value="b" />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('with error', () => {
      const { container } = render(<RadioGroupBlock options={options} error />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

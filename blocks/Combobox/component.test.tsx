import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Combobox } from './component'

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
]

function getContainer(ui: React.ReactElement) {
  return render(ui).container
}

describe('Combobox', () => {
  describe('clear button touch target — min-w-11 min-h-11', () => {
    it('clear button has min-w-11 when value is set', () => {
      const { container } = render(
        <Combobox options={options} value="a" onValueChange={() => {}} />
      )
      const clearBtn = container.querySelector('[aria-label="Clear selection"]')
      expect(clearBtn?.className).toContain('min-w-11')
      expect(clearBtn?.className).toContain('min-h-11')
    })

    it('does not have arbitrary min-w-[44px]', () => {
      const { container } = render(
        <Combobox options={options} value="a" onValueChange={() => {}} />
      )
      expect(container.innerHTML).not.toContain('min-w-[44px]')
    })

    it('does not have arbitrary min-h-[44px]', () => {
      const { container } = render(
        <Combobox options={options} value="a" onValueChange={() => {}} />
      )
      expect(container.innerHTML).not.toContain('min-h-[44px]')
    })
  })

  describe('trigger invariants', () => {
    it('renders trigger with h-9', () => {
      const { container } = render(
        <Combobox options={options} onValueChange={() => {}} />
      )
      expect(container.innerHTML).toContain('h-9')
    })
  })

  describe('snapshots', () => {
    it('empty (no value)', () => {
      const { container } = render(
        <Combobox options={options} onValueChange={() => {}} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('with selected value', () => {
      const { container } = render(
        <Combobox options={options} value="a" onValueChange={() => {}} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('with error state', () => {
      const { container } = render(
        <Combobox options={options} hasError onValueChange={() => {}} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

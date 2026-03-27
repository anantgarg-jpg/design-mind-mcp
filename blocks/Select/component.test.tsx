import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Select } from './component'

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
]

function getTriggerClass(ui: React.ReactElement): string {
  const { container } = render(ui)
  return (container.firstChild as HTMLElement).className
}

describe('Select', () => {
  describe('trigger touch target — min-h-11 (replaces min-h-[44px])', () => {
    it('trigger has min-h-11', () => {
      const cls = getTriggerClass(<Select options={options} />)
      expect(cls).toContain('min-h-11')
    })

    it('does not have arbitrary min-h-[44px]', () => {
      const { container } = render(<Select options={options} />)
      expect(container.innerHTML).not.toContain('min-h-[44px]')
    })
  })

  describe('trigger invariants', () => {
    it('has h-11 rounded-md border border-subtle bg-card', () => {
      const cls = getTriggerClass(<Select options={options} />)
      expect(cls).toContain('h-11')
      expect(cls).toContain('rounded-md')
      expect(cls).toContain('border-subtle')
      expect(cls).toContain('bg-card')
    })

    it('has focus-visible:ring-2', () => {
      const cls = getTriggerClass(<Select options={options} />)
      expect(cls).toContain('focus-visible:ring-2')
    })
  })

  describe('error state', () => {
    it('has border-destructive when error=true', () => {
      const cls = getTriggerClass(<Select options={options} error />)
      expect(cls).toContain('border-destructive')
    })
  })

  describe('caller className override', () => {
    it('appends caller className', () => {
      const cls = getTriggerClass(<Select options={options} className="custom-class" />)
      expect(cls).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    it('default (no selection)', () => {
      const { container } = render(<Select options={options} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('with error', () => {
      const { container } = render(<Select options={options} error />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

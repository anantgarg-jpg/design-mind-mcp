import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Switch } from './component'

function getWrapperClass(ui: React.ReactElement): string {
  const { container } = render(ui)
  return (container.firstChild as HTMLElement).className
}

describe('Switch', () => {
  describe('touch target — min-h-11 (replaces min-h-[44px])', () => {
    it('wrapper has min-h-11', () => {
      const cls = getWrapperClass(<Switch label="Enable" />)
      expect(cls).toContain('min-h-11')
    })

    it('does not have arbitrary min-h-[44px]', () => {
      const { container } = render(<Switch label="Enable" />)
      expect(container.innerHTML).not.toContain('min-h-[44px]')
    })
  })

  describe('label renders', () => {
    it('shows label text', () => {
      const { container } = render(<Switch label="Dark Mode" />)
      expect(container.textContent).toContain('Dark Mode')
    })
  })

  describe('caller className override', () => {
    it('appends caller className to wrapper', () => {
      const cls = getWrapperClass(<Switch label="Enable" className="custom-class" />)
      expect(cls).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    it('unchecked', () => {
      const { container } = render(<Switch label="Enable" checked={false} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('checked', () => {
      const { container } = render(<Switch label="Enable" checked={true} />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('disabled', () => {
      const { container } = render(<Switch label="Enable" disabled />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

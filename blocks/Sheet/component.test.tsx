import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Sheet } from './component'

describe('Sheet', () => {
  describe('width tokens', () => {
    it('does not have arbitrary min-w-[320px]', () => {
      render(<Sheet title="Test" open><div>content</div></Sheet>)
      expect(document.body.innerHTML).not.toContain('min-w-[320px]')
    })

    it('has min-w-80 (replaces min-w-[320px])', () => {
      render(<Sheet title="Test" open><div>content</div></Sheet>)
      expect(document.body.innerHTML).toContain('min-w-80')
    })

    it('retains max-w-[540px] (TODO: no standard token matches 540px)', () => {
      render(<Sheet title="Test" open><div>content</div></Sheet>)
      expect(document.body.innerHTML).toContain('max-w-[540px]')
    })
  })

  describe('renders title', () => {
    it('shows title in sheet header', () => {
      render(<Sheet title="My Sheet" open><div>content</div></Sheet>)
      expect(document.body.textContent).toContain('My Sheet')
    })
  })

  describe('snapshots', () => {
    it('closed (no portal)', () => {
      const { container } = render(
        <Sheet title="Test" open={false}><div>content</div></Sheet>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

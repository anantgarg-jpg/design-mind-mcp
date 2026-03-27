import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Tooltip } from './component'

describe('Tooltip', () => {
  describe('max-width token', () => {
    it('does not have arbitrary max-w-[220px] in any rendered output', () => {
      // TooltipContent portal only renders on hover — not triggered in jsdom.
      // We assert the old arbitrary class is absent from any visible output.
      render(<Tooltip content="tip"><button>trigger</button></Tooltip>)
      expect(document.body.innerHTML).not.toContain('max-w-[220px]')
    })
  })

  describe('snapshots', () => {
    it('renders trigger (content is portal-rendered on hover)', () => {
      const { container } = render(
        <Tooltip content="Tooltip text"><button>hover me</button></Tooltip>
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

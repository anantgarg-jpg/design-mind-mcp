import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PaginationBar } from './component'

describe('PaginationBar', () => {
  describe('touch target — min-w-11 min-h-11', () => {
    it('previous/next have min-w-11 and min-h-11', () => {
      const { container } = render(
        <PaginationBar page={2} pageCount={5} onPageChange={() => {}} />
      )
      const items = container.querySelectorAll('a, button')
      const hasMin = Array.from(items).some(
        (el) => el.className.includes('min-w-11') && el.className.includes('min-h-11')
      )
      expect(hasMin).toBe(true)
    })

    it('does not have arbitrary min-w-[44px]', () => {
      const { container } = render(
        <PaginationBar page={2} pageCount={5} onPageChange={() => {}} />
      )
      expect(container.innerHTML).not.toContain('min-w-[44px]')
    })

    it('does not have arbitrary min-h-[44px]', () => {
      const { container } = render(
        <PaginationBar page={2} pageCount={5} onPageChange={() => {}} />
      )
      expect(container.innerHTML).not.toContain('min-h-[44px]')
    })
  })

  describe('active page', () => {
    it('active page has bg-primary text-primary-foreground', () => {
      const { container } = render(
        <PaginationBar page={2} pageCount={5} onPageChange={() => {}} />
      )
      expect(container.innerHTML).toContain('bg-primary')
      expect(container.innerHTML).toContain('text-primary-foreground')
    })
  })

  describe('returns null for 1-page count', () => {
    it('renders nothing when pageCount <= 1', () => {
      const { container } = render(
        <PaginationBar page={1} pageCount={1} onPageChange={() => {}} />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('caller className override', () => {
    it('appends caller className', () => {
      const { container } = render(
        <PaginationBar page={1} pageCount={3} onPageChange={() => {}} className="custom-class" />
      )
      expect(container.innerHTML).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    it('middle page', () => {
      const { container } = render(
        <PaginationBar page={3} pageCount={7} onPageChange={() => {}} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('first page (previous disabled)', () => {
      const { container } = render(
        <PaginationBar page={1} pageCount={5} onPageChange={() => {}} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

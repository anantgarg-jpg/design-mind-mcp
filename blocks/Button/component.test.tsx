import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from './component'

// Helper: get the rendered button element's className string
function getClass(ui: React.ReactElement): string {
  const { container } = render(ui)
  return (container.firstChild as HTMLElement).className
}

describe('Button', () => {
  describe('VARIANT_CLASSES — font weight (meta.yaml invariant: font-normal 400 weight)', () => {
    const variants = ['primary', 'destructive', 'basic', 'outline', 'transparent', 'link'] as const
    variants.forEach((variant) => {
      it(`${variant} — has font-normal`, () => {
        const cls = getClass(<Button variant={variant}>Label</Button>)
        expect(cls).toContain('font-normal')
      })

      it(`${variant} — does not have font-semibold`, () => {
        const cls = getClass(<Button variant={variant}>Label</Button>)
        expect(cls).not.toContain('font-semibold')
      })
    })
  })

  describe('VARIANT_CLASSES — bg/text', () => {
    it('primary — has bg-primary and text-primary-foreground', () => {
      const cls = getClass(<Button variant="primary">Label</Button>)
      expect(cls).toContain('bg-primary')
      expect(cls).toContain('text-primary-foreground')
    })

    it('destructive — has bg-destructive and text-destructive-foreground', () => {
      const cls = getClass(<Button variant="destructive">Label</Button>)
      expect(cls).toContain('bg-destructive')
      expect(cls).toContain('text-destructive-foreground')
    })

    it('basic — has bg-muted and text-foreground', () => {
      const cls = getClass(<Button variant="basic">Label</Button>)
      expect(cls).toContain('bg-muted')
      expect(cls).toContain('text-foreground')
    })

    it('outline — has border-border and bg-transparent', () => {
      const cls = getClass(<Button variant="outline">Label</Button>)
      expect(cls).toContain('border-border')
      expect(cls).toContain('bg-transparent')
    })

    it('transparent — has bg-transparent', () => {
      const cls = getClass(<Button variant="transparent">Label</Button>)
      expect(cls).toContain('bg-transparent')
    })

    it('link — has text-primary and underline-offset-2', () => {
      const cls = getClass(<Button variant="link">Label</Button>)
      expect(cls).toContain('text-primary')
      expect(cls).toContain('underline-offset-2')
    })
  })

  describe('VARIANT_CLASSES — hover states', () => {
    it('primary — has hover:bg-primary/90', () => {
      const cls = getClass(<Button variant="primary">Label</Button>)
      expect(cls).toContain('hover:bg-primary/90')
    })

    it('destructive — has hover:bg-destructive/90', () => {
      const cls = getClass(<Button variant="destructive">Label</Button>)
      expect(cls).toContain('hover:bg-destructive/90')
    })

    it('basic — has hover:bg-muted/50', () => {
      const cls = getClass(<Button variant="basic">Label</Button>)
      expect(cls).toContain('hover:bg-muted/50')
    })

    it('outline — has hover:bg-muted/50', () => {
      const cls = getClass(<Button variant="outline">Label</Button>)
      expect(cls).toContain('hover:bg-muted/50')
    })

    it('transparent — has hover:bg-muted/50', () => {
      const cls = getClass(<Button variant="transparent">Label</Button>)
      expect(cls).toContain('hover:bg-muted/50')
    })

    it('link — has hover:underline', () => {
      const cls = getClass(<Button variant="link">Label</Button>)
      expect(cls).toContain('hover:underline')
    })
  })

  describe('SIZE_CLASSES', () => {
    it('sm — has h-6 px-1.5 text-sm', () => {
      const cls = getClass(<Button size="sm">Label</Button>)
      expect(cls).toContain('h-6')
      expect(cls).toContain('px-1.5')
      expect(cls).toContain('text-sm')
    })

    it('default — has h-8 px-2.5 text-base', () => {
      const cls = getClass(<Button size="default">Label</Button>)
      expect(cls).toContain('h-8')
      expect(cls).toContain('px-2.5')
      expect(cls).toContain('text-base')
    })

    it('lg — has h-10 px-3.5 text-lg', () => {
      const cls = getClass(<Button size="lg">Label</Button>)
      expect(cls).toContain('h-10')
      expect(cls).toContain('px-3.5')
      expect(cls).toContain('text-lg')
    })
  })

  describe('ICON_SIZE_CLASSES', () => {
    it('iconOnly sm — has h-6 w-6 p-0', () => {
      const cls = getClass(<Button iconOnly size="sm">icon</Button>)
      expect(cls).toContain('h-6')
      expect(cls).toContain('w-6')
      expect(cls).toContain('p-0')
    })

    it('iconOnly default — has h-8 w-8 p-0', () => {
      const cls = getClass(<Button iconOnly>icon</Button>)
      expect(cls).toContain('h-8')
      expect(cls).toContain('w-8')
      expect(cls).toContain('p-0')
    })
  })

  describe('selected state — outline toggle pattern', () => {
    it('outline selected — has border-primary', () => {
      const cls = getClass(<Button variant="outline" selected>Label</Button>)
      expect(cls).toContain('border-primary')
    })

    it('outline selected — has bg-accent', () => {
      const cls = getClass(<Button variant="outline" selected>Label</Button>)
      expect(cls).toContain('bg-accent')
    })

    it('outline selected — has text-accent-foreground', () => {
      const cls = getClass(<Button variant="outline" selected>Label</Button>)
      expect(cls).toContain('text-accent-foreground')
    })

    it('outline selected — has aria-pressed=true', () => {
      const { container } = render(<Button variant="outline" selected>Label</Button>)
      expect((container.firstChild as HTMLElement).getAttribute('aria-pressed')).toBe('true')
    })

    it('outline unselected — does not have aria-pressed', () => {
      const { container } = render(<Button variant="outline">Label</Button>)
      expect((container.firstChild as HTMLElement).getAttribute('aria-pressed')).toBeNull()
    })

    it('primary selected — does not apply OUTLINE_SELECTED_CLASSES', () => {
      const cls = getClass(<Button variant="primary" selected>Label</Button>)
      expect(cls).not.toContain('bg-accent')
    })
  })

  describe('caller className override', () => {
    it('appends caller className last', () => {
      const cls = getClass(<Button className="custom-class">Label</Button>)
      expect(cls).toContain('custom-class')
    })
  })

  describe('snapshots', () => {
    const variants = ['primary', 'destructive', 'basic', 'outline', 'transparent', 'link'] as const
    const sizes = ['sm', 'default', 'lg'] as const

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        it(`${variant} / ${size}`, () => {
          const { container } = render(<Button variant={variant} size={size}>Label</Button>)
          expect(container.firstChild).toMatchSnapshot()
        })
      })
    })

    it('iconOnly / default', () => {
      const { container } = render(<Button iconOnly>icon</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('outline / selected', () => {
      const { container } = render(<Button variant="outline" selected>Label</Button>)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})

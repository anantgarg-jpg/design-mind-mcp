import React from 'react'
import { CarouselFrame } from '@blocks/Carousel/component'
import { Fixture, PageHeader } from '@/components/Fixture'

const slideItems = [
  <div key="1" className="flex h-40 items-center justify-center rounded-lg bg-muted text-sm font-medium">Slide 1</div>,
  <div key="2" className="flex h-40 items-center justify-center rounded-lg bg-muted text-sm font-medium">Slide 2</div>,
  <div key="3" className="flex h-40 items-center justify-center rounded-lg bg-muted text-sm font-medium">Slide 3</div>,
  <div key="4" className="flex h-40 items-center justify-center rounded-lg bg-muted text-sm font-medium">Slide 4</div>,
]

export function CarouselPage() {
  return (
    <div>
      <PageHeader
        name="Carousel"
        level="composite"
        confidence={0.80}
        description="A horizontal slide carousel with previous/next navigation and configurable item sizing."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Full-width slides" bg="bg-background">
          <div className="px-12">
            <CarouselFrame items={slideItems} />
          </div>
        </Fixture>

        <Fixture label="Three-up layout (basis-1/3)" bg="bg-background">
          <div className="px-12">
            <CarouselFrame items={slideItems} itemBasis="basis-1/3" />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

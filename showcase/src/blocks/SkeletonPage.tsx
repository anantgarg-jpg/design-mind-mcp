import React from 'react'
import { Skeleton } from '@blocks/Skeleton/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function SkeletonPage() {
  return (
    <div>
      <PageHeader
        name="Skeleton"
        level="primitive"
        confidence={0.85}
        description="Animated placeholder shapes used as loading indicators for cards, rows, and avatars."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Card skeleton">
          <div className="max-w-sm space-y-3">
            <Skeleton width="w-full" height="h-32" />
            <Skeleton width="w-3/4" height="h-4" />
            <Skeleton width="w-1/2" height="h-4" />
          </div>
        </Fixture>

        <Fixture label="Row skeleton">
          <div className="flex items-center gap-3">
            <Skeleton circle width="w-10" height="h-10" />
            <div className="flex-1 space-y-2">
              <Skeleton width="w-48" height="h-4" />
              <Skeleton width="w-32" height="h-3" />
            </div>
          </div>
        </Fixture>

        <Fixture label="Multiple rows">
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton circle width="w-8" height="h-8" />
                <Skeleton width="w-full" height="h-4" />
              </div>
            ))}
          </div>
        </Fixture>
      </div>
    </div>
  )
}

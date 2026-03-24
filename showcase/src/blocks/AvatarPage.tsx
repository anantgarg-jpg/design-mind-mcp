import React from 'react'
import { Avatar } from '@blocks/Avatar/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function AvatarPage() {
  return (
    <div>
      <PageHeader
        name="Avatar"
        level="primitive"
        confidence={0.85}
        description="A circular image element with a text-initial fallback, used to represent users and entities."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Sizes — sm, md, lg">
          <div className="flex items-center gap-4">
            <Avatar name="Alice Martin" size="sm" />
            <Avatar name="Alice Martin" size="md" />
            <Avatar name="Alice Martin" size="lg" />
          </div>
        </Fixture>

        <Fixture label="Fallback initials (no image)">
          <div className="flex items-center gap-4">
            <Avatar name="John Doe" size="md" />
            <Avatar name="Sarah Connor" size="md" />
            <Avatar name="Li" size="md" />
          </div>
        </Fixture>

        <Fixture label="With image source">
          <div className="flex items-center gap-4">
            <Avatar name="Jane Smith" src="https://api.dicebear.com/7.x/initials/svg?seed=JS" size="sm" />
            <Avatar name="Jane Smith" src="https://api.dicebear.com/7.x/initials/svg?seed=JS" size="md" />
            <Avatar name="Jane Smith" src="https://api.dicebear.com/7.x/initials/svg?seed=JS" size="lg" />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

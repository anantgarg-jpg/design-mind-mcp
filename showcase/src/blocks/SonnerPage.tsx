import React from 'react'
import { toast } from 'sonner'
import { Sonner } from '@blocks/Sonner/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function SonnerPage() {
  return (
    <div>
      <PageHeader
        name="Sonner"
        level="primitive"
        confidence={0.85}
        description="Toast notification system with success, error, and warning variants."
      />

      <Sonner />

      <div className="flex flex-col gap-6">
        <Fixture label="Default toast">
          <button
            className="px-3 py-2 rounded-md border text-sm"
            onClick={() => toast('This is a default toast')}
          >
            Show Default
          </button>
        </Fixture>

        <Fixture label="Success toast">
          <button
            className="px-3 py-2 rounded-md border text-sm"
            onClick={() => toast.success('Record saved successfully')}
          >
            Show Success
          </button>
        </Fixture>

        <Fixture label="Error toast">
          <button
            className="px-3 py-2 rounded-md border text-sm"
            onClick={() => toast.error('Something went wrong')}
          >
            Show Error
          </button>
        </Fixture>

        <Fixture label="Warning toast">
          <button
            className="px-3 py-2 rounded-md border text-sm"
            onClick={() => toast.warning('Please review before submitting')}
          >
            Show Warning
          </button>
        </Fixture>
      </div>
    </div>
  )
}

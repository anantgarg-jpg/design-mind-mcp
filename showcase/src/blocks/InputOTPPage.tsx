import React from 'react'
import { InputOTPBlock } from '@blocks/InputOTP/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function InputOTPPage() {
  return (
    <div>
      <PageHeader
        name="InputOTP"
        level="primitive"
        confidence={0.85}
        description="One-time password input with auto-advancing slots and paste support."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="6-digit single group">
          <InputOTPBlock maxLength={6} />
        </Fixture>

        <Fixture label="6-digit grouped 3-3">
          <InputOTPBlock maxLength={6} groups={[3, 3]} />
        </Fixture>

        <Fixture label="Error state">
          <InputOTPBlock maxLength={6} groups={[3, 3]} error />
        </Fixture>
      </div>
    </div>
  )
}

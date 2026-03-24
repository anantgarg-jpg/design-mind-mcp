import React from 'react'
import { Accordion } from '@blocks/Accordion/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function AccordionPage() {
  return (
    <div>
      <PageHeader
        name="Accordion"
        level="primitive"
        confidence={0.85}
        description="A vertically stacked set of interactive headings that each reveal a section of content."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Single mode (one open at a time)">
          <Accordion
            type="single"
            defaultValue="item-1"
            items={[
              { value: 'item-1', title: 'What is your refund policy?', children: 'We offer a full refund within 30 days of purchase. No questions asked.' },
              { value: 'item-2', title: 'How do I contact support?', children: 'You can reach our support team via email at support@example.com or through the in-app chat.' },
              { value: 'item-3', title: 'Can I change my plan later?', children: 'Yes, you can upgrade or downgrade your plan at any time from your account settings.' },
            ]}
          />
        </Fixture>

        <Fixture label="Multiple mode (many open at once)">
          <Accordion
            type="multiple"
            defaultValue={['m-1', 'm-2']}
            items={[
              { value: 'm-1', title: 'Eligibility criteria', children: 'Patients must be 18 years or older and enrolled in an active care plan.' },
              { value: 'm-2', title: 'Required documentation', children: 'A valid government-issued ID and proof of insurance are required.' },
              { value: 'm-3', title: 'Timeline', children: 'The review process typically takes 3-5 business days.' },
            ]}
          />
        </Fixture>
      </div>
    </div>
  )
}

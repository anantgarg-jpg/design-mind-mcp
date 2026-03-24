import React, { useState } from 'react'
import { PaginationBar } from '@blocks/Pagination/component'
import { Fixture, PageHeader } from '@/components/Fixture'

export function PaginationPage() {
  const [page, setPage] = useState(3)
  const [firstPage, setFirstPage] = useState(1)

  return (
    <div>
      <PageHeader
        name="Pagination"
        level="composite"
        confidence={0.80}
        description="A page navigation bar with numbered links, ellipsis overflow, and previous/next controls."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Current page highlighted (page 3 of 10)" bg="bg-background">
          <PaginationBar page={page} pageCount={10} onPageChange={setPage} />
        </Fixture>

        <Fixture label="First page — previous disabled" bg="bg-background">
          <PaginationBar page={firstPage} pageCount={10} onPageChange={setFirstPage} />
        </Fixture>

        <Fixture label="Few pages — no ellipsis" bg="bg-background">
          <PaginationBar page={2} pageCount={3} onPageChange={() => {}} />
        </Fixture>
      </div>
    </div>
  )
}

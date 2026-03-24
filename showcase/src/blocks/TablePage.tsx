import React from 'react'
import { Table } from '@blocks/Table/component'
import { Fixture, PageHeader } from '@/components/Fixture'

interface Patient {
  name: string
  age: number
  status: string
  lastVisit: string
}

const sampleData: Patient[] = [
  { name: 'Rivera, Maria', age: 67, status: 'Active', lastVisit: '2025-01-14' },
  { name: 'Chen, David', age: 45, status: 'Active', lastVisit: '2025-01-12' },
  { name: 'Patel, Anita', age: 72, status: 'Inactive', lastVisit: '2024-11-30' },
  { name: 'Johnson, Robert', age: 58, status: 'Active', lastVisit: '2025-01-15' },
]

const columns = [
  { key: 'name' as const, label: 'Name' },
  { key: 'age' as const, label: 'Age', numeric: true },
  { key: 'status' as const, label: 'Status' },
  { key: 'lastVisit' as const, label: 'Last Visit' },
]

export function TablePage() {
  return (
    <div>
      <PageHeader
        name="Table"
        level="primitive"
        confidence={0.85}
        description="A basic data table with column headers, row hover states, and optional numeric alignment."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default table with 4 rows" bg="bg-background">
          <Table columns={columns} data={sampleData} />
        </Fixture>

        <Fixture label="Sticky header variant" bg="bg-background">
          <div className="max-h-[200px] overflow-auto">
            <Table columns={columns} data={sampleData} stickyHeader />
          </div>
        </Fixture>
      </div>
    </div>
  )
}

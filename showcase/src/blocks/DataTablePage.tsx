import React from 'react'
import { DataTable } from '@blocks/DataTable/component'
import { Fixture, PageHeader } from '@/components/Fixture'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  refills: number
}

const medications: Medication[] = [
  { id: '1', name: 'Lisinopril', dosage: '10mg', frequency: 'Daily', refills: 3 },
  { id: '2', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', refills: 5 },
  { id: '3', name: 'Warfarin', dosage: '5mg', frequency: 'Daily', refills: 1 },
  { id: '4', name: 'Atorvastatin', dosage: '20mg', frequency: 'Daily', refills: 2 },
]

const columns = [
  { id: 'name', header: 'Medication', accessor: (row: Medication) => row.name, sortable: true },
  { id: 'dosage', header: 'Dosage', accessor: (row: Medication) => row.dosage },
  { id: 'frequency', header: 'Frequency', accessor: (row: Medication) => row.frequency },
  { id: 'refills', header: 'Refills', accessor: (row: Medication) => row.refills, numeric: true, sortable: true },
]

export function DataTablePage() {
  return (
    <div>
      <PageHeader
        name="DataTable"
        level="composite"
        confidence={0.80}
        description="An advanced data table with sortable columns, pagination footer, and empty state handling."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Sortable table with data" bg="bg-background">
          <DataTable
            columns={columns}
            data={medications}
            rowKey={(row) => row.id}
            onSort={(col, dir) => console.log('Sort:', col, dir)}
          />
        </Fixture>

        <Fixture label="With pagination" bg="bg-background">
          <DataTable
            columns={columns}
            data={medications.slice(0, 2)}
            rowKey={(row) => row.id}
            page={1}
            pageCount={3}
            onPageChange={(p) => console.log('Page:', p)}
          />
        </Fixture>

        <Fixture label="Empty state" bg="bg-background">
          <DataTable
            columns={columns}
            data={[]}
            rowKey={(row) => row.id}
          />
        </Fixture>
      </div>
    </div>
  )
}

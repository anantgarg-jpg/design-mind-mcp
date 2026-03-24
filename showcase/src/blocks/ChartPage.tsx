import React from 'react'
import { ChartFrame } from '@blocks/Chart/component'
import { Fixture, PageHeader } from '@/components/Fixture'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

const chartData = [
  { month: 'Jan', visits: 120 },
  { month: 'Feb', visits: 98 },
  { month: 'Mar', visits: 145 },
  { month: 'Apr', visits: 110 },
]

const chartConfig = {
  visits: { label: 'Visits', color: 'var(--primary)' },
}

export function ChartPage() {
  return (
    <div>
      <PageHeader
        name="Chart"
        level="composite"
        confidence={0.80}
        description="A chart container frame with title, description, and Recharts integration via ChartContainer."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Bar chart with title and description" bg="bg-background">
          <ChartFrame
            title="Monthly Visits"
            description="Patient visits over the last 4 months"
            config={chartConfig}
            height={250}
          >
            <BarChart data={chartData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Bar dataKey="visits" fill="var(--color-visits)" radius={4} />
            </BarChart>
          </ChartFrame>
        </Fixture>

        <Fixture label="Title only — no description" bg="bg-background">
          <ChartFrame title="Visits" config={chartConfig} height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" />
              <Bar dataKey="visits" fill="var(--color-visits)" radius={4} />
            </BarChart>
          </ChartFrame>
        </Fixture>
      </div>
    </div>
  )
}

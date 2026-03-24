import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { StatusBadgePage } from '@/blocks/StatusBadgePage'
import { SectionHeaderPage } from '@/blocks/SectionHeaderPage'
import { StatCardPage } from '@/blocks/StatCardPage'
import { PatientContextHeaderPage } from '@/blocks/PatientContextHeaderPage'
import { PatientRowPage } from '@/blocks/PatientRowPage'
import { ClinicalAlertBannerPage } from '@/blocks/ClinicalAlertBannerPage'
import { ShellOnlyPage } from '@/blocks/ShellOnlyPage'

type BlockId =
  | 'StatusBadge'
  | 'SectionHeader'
  | 'StatCard'
  | 'ActionableRow'
  | 'ClinicalAlertBanner'
  | 'PatientContextHeader'
  | 'PatientRow'
  | 'ChatQuickActionChip'
  | 'InlinePatientCard'
  | 'OutreachLogRow'
  | 'SdohAssessmentTab'

interface BlockMeta {
  id: BlockId
  label: string
  level: 'primitive' | 'composite' | 'domain'
  shell?: boolean
  shellPath?: string
}

const BLOCKS: BlockMeta[] = [
  // Primitive
  { id: 'StatusBadge', label: 'StatusBadge', level: 'primitive' },
  { id: 'SectionHeader', label: 'SectionHeader', level: 'primitive' },
  { id: 'StatCard', label: 'StatCard', level: 'primitive' },
  // Composite
  { id: 'ActionableRow', label: 'ActionableRow', level: 'composite', shell: true, shellPath: 'no component.tsx' },
  { id: 'ClinicalAlertBanner', label: 'ClinicalAlertBanner', level: 'composite' },
  { id: 'PatientContextHeader', label: 'PatientContextHeader', level: 'composite' },
  { id: 'PatientRow', label: 'PatientRow', level: 'composite' },
  // Domain
  { id: 'ChatQuickActionChip', label: 'ChatQuickActionChip', level: 'domain', shell: true, shellPath: '../../shell/panels/ChatPanel' },
  { id: 'InlinePatientCard', label: 'InlinePatientCard', level: 'domain', shell: true, shellPath: '../../shell/panels/ChatPanel' },
  { id: 'OutreachLogRow', label: 'OutreachLogRow', level: 'domain', shell: true, shellPath: '../../shell/artifacts/OutreachLogArtifact' },
  { id: 'SdohAssessmentTab', label: 'SdohAssessmentTab', level: 'domain', shell: true, shellPath: '../../shell/artifacts/SdohAssessmentTab' },
]

const GROUPS: { label: string; level: BlockMeta['level'] }[] = [
  { label: 'PRIMITIVE', level: 'primitive' },
  { label: 'COMPOSITE', level: 'composite' },
  { label: 'DOMAIN', level: 'domain' },
]

function renderPage(id: BlockId, blocks: BlockMeta[]) {
  const meta = blocks.find((b) => b.id === id)

  if (meta?.shell) {
    return (
      <ShellOnlyPage
        name={meta.label}
        level={meta.level as 'composite' | 'domain'}
        shellPath={meta.shellPath ?? ''}
      />
    )
  }

  switch (id) {
    case 'StatusBadge': return <StatusBadgePage />
    case 'SectionHeader': return <SectionHeaderPage />
    case 'StatCard': return <StatCardPage />
    case 'ClinicalAlertBanner': return <ClinicalAlertBannerPage />
    case 'PatientContextHeader': return <PatientContextHeaderPage />
    case 'PatientRow': return <PatientRowPage />
    default: return null
  }
}

export default function App() {
  const [selected, setSelected] = useState<BlockId>('StatusBadge')

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-card border-r border-border flex flex-col overflow-y-auto">
        {/* Logo / title */}
        <div className="px-4 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground tracking-wide">Design Mind</p>
          <p className="text-sm text-muted-foreground mt-0.5">Block Showcase</p>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 py-3">
          {GROUPS.map((group) => {
            const groupBlocks = BLOCKS.filter((b) => b.level === group.level)
            return (
              <div key={group.label} className="mb-4">
                <p className="px-4 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
                {groupBlocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => setSelected(block.id)}
                    className={cn(
                      'w-full text-left px-4 py-1.5 text-base transition-colors flex items-center gap-1.5',
                      selected === block.id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : block.shell
                        ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {block.shell && (
                      <span className="text-muted-foreground" aria-hidden="true">·</span>
                    )}
                    <span className={cn(block.shell && 'text-muted-foreground text-sm')}>
                      {block.label}
                    </span>
                  </button>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {renderPage(selected, BLOCKS)}
        </div>
      </main>
    </div>
  )
}

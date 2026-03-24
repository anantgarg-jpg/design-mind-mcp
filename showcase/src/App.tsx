import React, { useState } from 'react'
import { cn } from '@/lib/utils'

// ── Existing custom showcase pages ──────────────────────────────────────────
import { SectionHeaderPage } from '@/blocks/SectionHeaderPage'
import { StatCardPage } from '@/blocks/StatCardPage'
import { EntityContextHeaderPage } from '@/blocks/EntityContextHeaderPage'
import { EntityRowPage } from '@/blocks/EntityRowPage'
import { AlertBannerPage } from '@/blocks/AlertBannerPage'
import { ShellOnlyPage } from '@/blocks/ShellOnlyPage'
import { CandidateDetailPane, CANDIDATES } from '@/blocks/CandidatesPage'

// ── shadcn/ui primitive pages ───────────────────────────────────────────────
import { AccordionPage } from '@/blocks/AccordionPage'
import { AlertPage } from '@/blocks/AlertPage'
import { AlertDialogPage } from '@/blocks/AlertDialogPage'
import { AvatarPage } from '@/blocks/AvatarPage'
import { BadgePage } from '@/blocks/BadgePage'
import { ButtonPage } from '@/blocks/ButtonPage'
import { BreadcrumbPage } from '@/blocks/BreadcrumbPage'
import { CalendarPage } from '@/blocks/CalendarPage'
import { CardPage } from '@/blocks/CardPage'
import { CheckboxPage } from '@/blocks/CheckboxPage'
import { CollapsiblePage } from '@/blocks/CollapsiblePage'
import { ContextMenuPage } from '@/blocks/ContextMenuPage'
import { DialogPage } from '@/blocks/DialogPage'
import { DrawerPage } from '@/blocks/DrawerPage'
import { DropdownMenuPage } from '@/blocks/DropdownMenuPage'
import { HoverCardPage } from '@/blocks/HoverCardPage'
import { InputPage } from '@/blocks/InputPage'
import { InputOTPPage } from '@/blocks/InputOTPPage'
import { LabelPage } from '@/blocks/LabelPage'
import { NavigationMenuPage } from '@/blocks/NavigationMenuPage'
import { PopoverPage } from '@/blocks/PopoverPage'
import { ProgressPage } from '@/blocks/ProgressPage'
import { RadioGroupPage } from '@/blocks/RadioGroupPage'
import { ResizablePage } from '@/blocks/ResizablePage'
import { ScrollAreaPage } from '@/blocks/ScrollAreaPage'
import { SelectPage } from '@/blocks/SelectPage'
import { SeparatorPage } from '@/blocks/SeparatorPage'
import { SheetPage } from '@/blocks/SheetPage'
import { SkeletonPage } from '@/blocks/SkeletonPage'
import { SliderPage } from '@/blocks/SliderPage'
import { SonnerPage } from '@/blocks/SonnerPage'
import { SwitchPage } from '@/blocks/SwitchPage'
import { TablePage } from '@/blocks/TablePage'
import { TabsPage } from '@/blocks/TabsPage'
import { TextareaPage } from '@/blocks/TextareaPage'
import { TogglePage } from '@/blocks/TogglePage'
import { ToggleGroupPage } from '@/blocks/ToggleGroupPage'
import { TooltipPage } from '@/blocks/TooltipPage'

// ── shadcn/ui composite pages ───────────────────────────────────────────────
import { CommandPage } from '@/blocks/CommandPage'
import { ComboboxPage } from '@/blocks/ComboboxPage'
import { DatePickerPage } from '@/blocks/DatePickerPage'
import { DataTablePage } from '@/blocks/DataTablePage'
import { FormPage } from '@/blocks/FormPage'
import { ChartPage } from '@/blocks/ChartPage'
import { CarouselPage } from '@/blocks/CarouselPage'
import { PaginationPage } from '@/blocks/PaginationPage'

// ── Types ────────────────────────────────────────────────────────────────────

type BlockId = string
type ActiveView = 'published' | 'candidates'

interface BlockMeta {
  id: BlockId
  label: string
  level: 'primitive' | 'composite' | 'domain'
  shell?: boolean
  shellPath?: string
}

// ── Block registry ───────────────────────────────────────────────────────────

const BLOCKS: BlockMeta[] = [
  // ── Original primitives ──
  { id: 'SectionHeader', label: 'SectionHeader', level: 'primitive' },
  { id: 'StatCard', label: 'StatCard', level: 'primitive' },

  // ── shadcn/ui primitives ──
  { id: 'Accordion', label: 'Accordion', level: 'primitive' },
  { id: 'Alert', label: 'Alert', level: 'primitive' },
  { id: 'AlertDialog', label: 'AlertDialog', level: 'primitive' },
  { id: 'Avatar', label: 'Avatar', level: 'primitive' },
  { id: 'Badge', label: 'Badge', level: 'primitive' },
  { id: 'Breadcrumb', label: 'Breadcrumb', level: 'primitive' },
  { id: 'Button', label: 'Button', level: 'primitive' },
  { id: 'Calendar', label: 'Calendar', level: 'primitive' },
  { id: 'Card', label: 'Card', level: 'primitive' },
  { id: 'Checkbox', label: 'Checkbox', level: 'primitive' },
  { id: 'Collapsible', label: 'Collapsible', level: 'primitive' },
  { id: 'ContextMenu', label: 'ContextMenu', level: 'primitive' },
  { id: 'Dialog', label: 'Dialog', level: 'primitive' },
  { id: 'Drawer', label: 'Drawer', level: 'primitive' },
  { id: 'DropdownMenu', label: 'DropdownMenu', level: 'primitive' },
  { id: 'HoverCard', label: 'HoverCard', level: 'primitive' },
  { id: 'Input', label: 'Input', level: 'primitive' },
  { id: 'InputOTP', label: 'InputOTP', level: 'primitive' },
  { id: 'Label', label: 'Label', level: 'primitive' },
  { id: 'NavigationMenu', label: 'NavigationMenu', level: 'primitive' },
  { id: 'Popover', label: 'Popover', level: 'primitive' },
  { id: 'Progress', label: 'Progress', level: 'primitive' },
  { id: 'RadioGroup', label: 'RadioGroup', level: 'primitive' },
  { id: 'Resizable', label: 'Resizable', level: 'primitive' },
  { id: 'ScrollArea', label: 'ScrollArea', level: 'primitive' },
  { id: 'Select', label: 'Select', level: 'primitive' },
  { id: 'Separator', label: 'Separator', level: 'primitive' },
  { id: 'Sheet', label: 'Sheet', level: 'primitive' },
  { id: 'Skeleton', label: 'Skeleton', level: 'primitive' },
  { id: 'Slider', label: 'Slider', level: 'primitive' },
  { id: 'Sonner', label: 'Sonner', level: 'primitive' },
  { id: 'Switch', label: 'Switch', level: 'primitive' },
  { id: 'Table', label: 'Table', level: 'primitive' },
  { id: 'Tabs', label: 'Tabs', level: 'primitive' },
  { id: 'Textarea', label: 'Textarea', level: 'primitive' },
  { id: 'Toggle', label: 'Toggle', level: 'primitive' },
  { id: 'ToggleGroup', label: 'ToggleGroup', level: 'primitive' },
  { id: 'Tooltip', label: 'Tooltip', level: 'primitive' },

  // ── Original composites ──
  { id: 'ActionableRow', label: 'ActionableRow', level: 'composite', shell: true, shellPath: 'no component.tsx' },
  { id: 'AlertBanner', label: 'AlertBanner', level: 'composite' },
  { id: 'EntityContextHeader', label: 'EntityContextHeader', level: 'composite' },
  { id: 'EntityRow', label: 'EntityRow', level: 'composite' },

  // ── shadcn/ui composites ──
  { id: 'Carousel', label: 'Carousel', level: 'composite' },
  { id: 'Chart', label: 'Chart', level: 'composite' },
  { id: 'Combobox', label: 'Combobox', level: 'composite' },
  { id: 'Command', label: 'Command', level: 'composite' },
  { id: 'DataTable', label: 'DataTable', level: 'composite' },
  { id: 'DatePicker', label: 'DatePicker', level: 'composite' },
  { id: 'Form', label: 'Form', level: 'composite' },
  { id: 'Pagination', label: 'Pagination', level: 'composite' },

  // ── Domain (shell-only) ──
  { id: 'ChatQuickActionChip', label: 'ChatQuickActionChip', level: 'domain', shell: true, shellPath: '../../shell/panels/ChatPanel' },
  { id: 'InlineEntityCard', label: 'InlineEntityCard', level: 'domain', shell: true, shellPath: '../../shell/panels/ChatPanel' },
  { id: 'ActivityLogRow', label: 'ActivityLogRow', level: 'domain', shell: true, shellPath: '../../shell/artifacts/OutreachLogArtifact' },
  { id: 'AssessmentTab', label: 'AssessmentTab', level: 'domain', shell: true, shellPath: '../../shell/artifacts/SdohAssessmentTab' },
]

const GROUPS: { label: string; level: BlockMeta['level'] }[] = [
  { label: 'PRIMITIVE', level: 'primitive' },
  { label: 'COMPOSITE', level: 'composite' },
  { label: 'DOMAIN', level: 'domain' },
]

const PAGE_MAP: Record<string, React.FC> = {
  SectionHeader: SectionHeaderPage,
  StatCard: StatCardPage,
  AlertBanner: AlertBannerPage,
  EntityContextHeader: EntityContextHeaderPage,
  EntityRow: EntityRowPage,
  Accordion: AccordionPage,
  Alert: AlertPage,
  AlertDialog: AlertDialogPage,
  Avatar: AvatarPage,
  Badge: BadgePage,
  Breadcrumb: BreadcrumbPage,
  Button: ButtonPage,
  Calendar: CalendarPage,
  Card: CardPage,
  Checkbox: CheckboxPage,
  Collapsible: CollapsiblePage,
  ContextMenu: ContextMenuPage,
  Dialog: DialogPage,
  Drawer: DrawerPage,
  DropdownMenu: DropdownMenuPage,
  HoverCard: HoverCardPage,
  Input: InputPage,
  InputOTP: InputOTPPage,
  Label: LabelPage,
  NavigationMenu: NavigationMenuPage,
  Popover: PopoverPage,
  Progress: ProgressPage,
  RadioGroup: RadioGroupPage,
  Resizable: ResizablePage,
  ScrollArea: ScrollAreaPage,
  Select: SelectPage,
  Separator: SeparatorPage,
  Sheet: SheetPage,
  Skeleton: SkeletonPage,
  Slider: SliderPage,
  Sonner: SonnerPage,
  Switch: SwitchPage,
  Table: TablePage,
  Tabs: TabsPage,
  Textarea: TextareaPage,
  Toggle: TogglePage,
  ToggleGroup: ToggleGroupPage,
  Tooltip: TooltipPage,
  // shadcn compositions
  Carousel: CarouselPage,
  Chart: ChartPage,
  Combobox: ComboboxPage,
  Command: CommandPage,
  DataTable: DataTablePage,
  DatePicker: DatePickerPage,
  Form: FormPage,
  Pagination: PaginationPage,
}

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
  const Page = PAGE_MAP[id]
  if (Page) return <Page />
  return null
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('published')
  const [selectedBlock, setSelectedBlock] = useState<BlockId>('Badge')
  const [selectedCandidate, setSelectedCandidate] = useState<string>(CANDIDATES[0].candidate_id)
  const [localRatified, setLocalRatified] = useState<Set<string>>(new Set())

  function ratify(id: string) {
    setLocalRatified((prev) => new Set(prev).add(id))
  }

  function isCandidateRatified(id: string) {
    const c = CANDIDATES.find((c) => c.candidate_id === id)
    return c?.status === 'ratified' || localRatified.has(id)
  }

  const pending = CANDIDATES.filter((c) => !isCandidateRatified(c.candidate_id))
  const ratified = CANDIDATES.filter((c) => isCandidateRatified(c.candidate_id))

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background font-sans">

      {/* ── Top nav ── */}
      <header className="h-11 flex-shrink-0 border-b border-border bg-card flex items-center px-4">
        <span className="text-sm font-semibold text-foreground mr-6">Design Mind</span>
        <nav className="flex h-full">
          {(['published', 'candidates'] as ActiveView[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveView(tab)}
              className={cn(
                'h-full px-4 text-sm font-medium capitalize border-b-2 transition-colors',
                activeView === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Sidebar + content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 bg-card border-r border-border overflow-y-auto">
          <nav className="py-3">

            {activeView === 'published' ? (
              // ── Published: block groups ──
              GROUPS.map((group) => {
                const groupBlocks = BLOCKS.filter((b) => b.level === group.level)
                return (
                  <div key={group.label} className="mb-4">
                    <p className="px-4 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </p>
                    {groupBlocks.map((block) => (
                      <button
                        key={block.id}
                        onClick={() => setSelectedBlock(block.id)}
                        className={cn(
                          'w-full text-left px-4 py-1.5 text-base transition-colors flex items-center gap-1.5',
                          selectedBlock === block.id
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
              })
            ) : (
              // ── Candidates: pending / ratified groups ──
              <>
                {pending.length > 0 && (
                  <div className="mb-4">
                    <p className="px-4 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Pending
                    </p>
                    {pending.map((c) => (
                      <button
                        key={c.candidate_id}
                        onClick={() => setSelectedCandidate(c.candidate_id)}
                        className={cn(
                          'w-full text-left px-4 py-1.5 text-base transition-colors',
                          selectedCandidate === c.candidate_id
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        {c.pattern_name}
                      </button>
                    ))}
                  </div>
                )}
                {ratified.length > 0 && (
                  <div className="mb-4">
                    <p className="px-4 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Ratified
                    </p>
                    {ratified.map((c) => (
                      <button
                        key={c.candidate_id}
                        onClick={() => setSelectedCandidate(c.candidate_id)}
                        className={cn(
                          'w-full text-left px-4 py-1.5 text-base transition-colors flex items-center gap-1.5',
                          selectedCandidate === c.candidate_id
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span className="text-success text-xs leading-none">✓</span>
                        <span className="text-sm">{c.pattern_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            {activeView === 'published' ? (
              renderPage(selectedBlock, BLOCKS)
            ) : (
              <CandidateDetailPane
                candidateId={selectedCandidate}
                isRatified={isCandidateRatified(selectedCandidate)}
                onRatify={() => ratify(selectedCandidate)}
              />
            )}
          </div>
        </main>

      </div>
    </div>
  )
}

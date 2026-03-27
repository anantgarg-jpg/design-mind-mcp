import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Home,
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Building2,
  User,
  Calendar,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ─── Types ─────────────────────────────────────────────────────────────────────

type ClaimStatus = 'Pending Review' | 'On Hold' | 'Denied' | 'Ready to Submit' | 'Submitted'
type IssueType = 'Missing Code' | 'Auth Required' | 'Billing Error' | 'Coverage Gap'
type ResolutionStep = 'initial' | 'applied' | 'submitted'

interface Procedure {
  code: string
  description: string
}

interface Resolution {
  suggestion: string
  impact: string
  confidence: 'High' | 'Medium'
}

interface Claim {
  id: string
  patientName: string
  claimId: string
  payer: string
  amount: number
  issueType: IssueType
  issueDetail: string
  status: ClaimStatus
  lastUpdated: string
  daysOpen: number
  serviceDate: string
  encounterType: string
  provider: string
  facility: string
  primaryDx: string
  secondaryDx?: string
  procedures: Procedure[]
  resolution: Resolution
}

interface Thread {
  id: string
  label: string
  timestamp: string
  openClaimIds: string[]
  activeTab: string
}

// ─── Static data ───────────────────────────────────────────────────────────────

const CLAIMS: Claim[] = [
  {
    id: 'c1',
    patientName: 'Martinez, Elena',
    claimId: 'CLM-2024-08841',
    payer: 'Blue Cross Blue Shield',
    amount: 4200,
    issueType: 'Missing Code',
    issueDetail: 'Procedure code 99213 is missing. Required for E&M billing at this encounter level.',
    status: 'Pending Review',
    lastUpdated: 'Mar 25',
    daysOpen: 3,
    serviceDate: 'Mar 22, 2026',
    encounterType: 'Office Visit',
    provider: 'Dr. Sarah Chen, MD',
    facility: 'Riverside Medical Center',
    primaryDx: 'Z00.00 — General adult medical exam',
    secondaryDx: 'E11.9 — Type 2 diabetes, without complications',
    procedures: [{ code: '93000', description: 'Electrocardiogram, routine' }],
    resolution: {
      suggestion: 'Add CPT 99213 — Office/outpatient visit, moderate complexity (E&M Level 3)',
      impact: 'Claim aligns with documented service level. Ready for resubmission to Blue Cross.',
      confidence: 'High',
    },
  },
  {
    id: 'c2',
    patientName: 'Thompson, Robert',
    claimId: 'CLM-2024-08756',
    payer: 'Aetna',
    amount: 12800,
    issueType: 'Auth Required',
    issueDetail: 'Prior authorization for MRI brain with contrast (CPT 70553) not on file.',
    status: 'On Hold',
    lastUpdated: 'Mar 24',
    daysOpen: 5,
    serviceDate: 'Mar 19, 2026',
    encounterType: 'Outpatient Radiology',
    provider: 'Dr. Michael Park, MD',
    facility: 'Central Imaging Associates',
    primaryDx: 'G43.909 — Migraine, unspecified',
    procedures: [{ code: '70553', description: 'MRI brain with contrast' }],
    resolution: {
      suggestion: 'Submit auth request via Aetna portal with clinical notes supporting medical necessity.',
      impact: 'Auth approval takes 3–5 business days. Hold clears upon auth receipt.',
      confidence: 'High',
    },
  },
  {
    id: 'c3',
    patientName: 'Jackson, Patricia',
    claimId: 'CLM-2024-08712',
    payer: 'United Healthcare',
    amount: 890,
    issueType: 'Billing Error',
    issueDetail: 'Duplicate submission. Original claim CLM-2024-08699 still processing for same DOS.',
    status: 'Denied',
    lastUpdated: 'Mar 23',
    daysOpen: 7,
    serviceDate: 'Mar 18, 2026',
    encounterType: 'Lab Services',
    provider: 'Dr. James Wilson, MD',
    facility: 'Metro Diagnostics Lab',
    primaryDx: 'Z00.01 — General exam, abnormal findings',
    procedures: [
      { code: '80053', description: 'Comprehensive metabolic panel' },
      { code: '85025', description: 'Complete blood count' },
    ],
    resolution: {
      suggestion: 'Void duplicate CLM-2024-08712 and monitor original CLM-2024-08699.',
      impact: 'Removes denial flag. Original processes within standard 30-day cycle.',
      confidence: 'High',
    },
  },
  {
    id: 'c4',
    patientName: 'Williams, David',
    claimId: 'CLM-2024-08698',
    payer: 'Cigna',
    amount: 6750,
    issueType: 'Missing Code',
    issueDetail: 'ICD-10 linkage to procedure is missing. Modifier field is empty.',
    status: 'Pending Review',
    lastUpdated: 'Mar 22',
    daysOpen: 8,
    serviceDate: 'Mar 17, 2026',
    encounterType: 'Surgical Procedure',
    provider: 'Dr. Amanda Rodriguez, MD',
    facility: 'Valley Surgical Center',
    primaryDx: 'M23.200 — Derangement of unspecified meniscus',
    procedures: [
      { code: '29881', description: 'Arthroscopy, knee with meniscectomy' },
      { code: '29879', description: 'Abrasion arthroplasty' },
    ],
    resolution: {
      suggestion: 'Link M23.200 to CPT 29881 and add modifier 59 to CPT 29879 for distinct service.',
      impact: 'Satisfies Cigna bundling edit. Claim becomes billable as submitted.',
      confidence: 'Medium',
    },
  },
  {
    id: 'c5',
    patientName: 'Chen, Lisa',
    claimId: 'CLM-2024-08654',
    payer: 'Humana',
    amount: 2100,
    issueType: 'Coverage Gap',
    issueDetail: 'Service date (Mar 10) is outside member coverage ending Feb 28.',
    status: 'Pending Review',
    lastUpdated: 'Mar 21',
    daysOpen: 10,
    serviceDate: 'Mar 10, 2026',
    encounterType: 'Preventive Care',
    provider: 'Dr. Rachel Kim, MD',
    facility: 'Lakeview Family Practice',
    primaryDx: 'Z01.419 — Encounter for gynecological exam',
    procedures: [{ code: '99395', description: 'Preventive visit, 18–39 years' }],
    resolution: {
      suggestion: 'Verify enrollment dates via Humana eligibility portal. Check secondary coverage.',
      impact: 'If gap confirmed, patient becomes responsible. Secondary payer may cover.',
      confidence: 'Medium',
    },
  },
  {
    id: 'c6',
    patientName: 'Anderson, Mark',
    claimId: 'CLM-2024-08621',
    payer: 'Medicare',
    amount: 18400,
    issueType: 'Auth Required',
    issueDetail: 'Modifier 59 required for unbundled services. Medical necessity documentation missing.',
    status: 'On Hold',
    lastUpdated: 'Mar 20',
    daysOpen: 12,
    serviceDate: 'Mar 14, 2026',
    encounterType: 'Inpatient Surgery',
    provider: 'Dr. Thomas Lee, MD',
    facility: 'University Medical Center',
    primaryDx: 'K80.20 — Calculus of gallbladder',
    procedures: [
      { code: '47562', description: 'Laparoscopic cholecystectomy' },
      { code: '43239', description: 'Upper GI endoscopy with biopsy' },
    ],
    resolution: {
      suggestion: 'Add modifier 59 to CPT 43239 and attach operative report for separate session.',
      impact: 'Satisfies Medicare CCI edit. Unbundling justified with documentation.',
      confidence: 'High',
    },
  },
]

// ─── Color maps ────────────────────────────────────────────────────────────────

const ISSUE_COLOR: Record<IssueType, 'yellow' | 'orange' | 'red' | 'blue'> = {
  'Missing Code':  'yellow',
  'Auth Required': 'orange',
  'Billing Error': 'red',
  'Coverage Gap':  'blue',
}

const STATUS_COLOR: Record<ClaimStatus, 'blue' | 'yellow' | 'red' | 'green'> = {
  'Pending Review':   'blue',
  'On Hold':          'yellow',
  'Denied':           'red',
  'Ready to Submit':  'green',
  'Submitted':        'green',
}

function fmt(n: number) {
  return '$' + n.toLocaleString()
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Chat message wrapper with AI avatar */
function AssistantMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center shrink-0">
          <Sparkles className="h-2.5 w-2.5 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">Assistant</span>
      </div>
      <div className="pl-[26px] text-xs text-foreground leading-relaxed">{children}</div>
    </div>
  )
}

/** Clickable prompt chip in the chat panel */
function PromptChip({ label, subtitle, onClick }: { label: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md border border-border bg-background px-2.5 py-2 hover:bg-muted/60 hover:border-primary/30 transition-colors group"
    >
      <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </button>
  )
}

/** KPI metric box on home canvas */
function MetricBox({
  label, value, subtitle, variant = 'default', onClick,
}: {
  label: string; value: string; subtitle?: string
  variant?: 'default' | 'urgent' | 'warning' | 'success'; onClick?: () => void
}) {
  const valClass = {
    default: 'text-foreground',
    urgent:  'text-destructive',
    warning: 'text-warning-text',
    success: 'text-success-text',
  }[variant]

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
      className={cn(
        'rounded-lg border border-border bg-card p-3 flex flex-col gap-0.5',
        onClick && 'cursor-pointer hover:bg-foreground/[0.04] active:bg-foreground/[0.08] transition-colors',
      )}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">{label}</p>
      <p className={cn('text-2xl font-medium tabular-nums leading-tight', valClass)}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

// ─── Chat panels ───────────────────────────────────────────────────────────────

function HomeChatPanel({ onPrompt }: {
  onPrompt: (label: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <AssistantMessage>
        Good morning! Here's your billing overview for{' '}
        <span className="font-medium text-foreground">March 26</span>.
        <br /><br />
        <span className="text-warning-text font-medium">34 claims</span> need attention — 8 are high priority. Your resolution rate is on track this week.
      </AssistantMessage>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">What would you like to work on?</p>
        {[
          { label: 'Show claims with issues', subtitle: '34 claims · High priority' },
          { label: 'Show pending claims',     subtitle: '128 claims · Awaiting action' },
          { label: 'Show high value claims',  subtitle: '>$10k · 23 claims' },
          { label: 'Show denied claims',      subtitle: '41 claims · This month' },
        ].map((p) => (
          <PromptChip key={p.label} label={p.label} subtitle={p.subtitle} onClick={() => onPrompt(p.label)} />
        ))}
      </div>
    </div>
  )
}

function WorklistChatPanel({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3">
      <AssistantMessage>
        Found <span className="font-medium text-destructive">{count} claims</span> with coding issues, sorted by urgency.
        <br /><br />
        Top issues: <span className="font-medium">Missing codes</span> (14 claims), <span className="font-medium">Auth holds</span> (11 claims).
      </AssistantMessage>
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">Click any row to review it.</p>
        {['Filter by issue type', 'Sort by dollar amount'].map((label) => (
          <button
            key={label}
            className="w-full text-left rounded-md border border-border bg-background px-2.5 py-2 hover:bg-muted/60 transition-colors"
          >
            <p className="text-xs font-medium text-foreground">{label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function ClaimChatPanel({ claim, step, onApply, onSubmit }: {
  claim: Claim
  step: ResolutionStep
  onApply: () => void
  onSubmit: () => void
}) {
  const isResolved = step === 'applied' || step === 'submitted'

  return (
    <div className="flex flex-col gap-3">
      {/* Initial analysis */}
      <AssistantMessage>
        Analyzed <span className="font-mono text-xs font-medium text-foreground">{claim.claimId}</span> for{' '}
        <span className="font-medium text-foreground">{claim.patientName}</span>.
        <br /><br />
        <span className="text-warning-text font-medium">Issue: {claim.issueType}</span>
        <br />
        {claim.issueDetail}
      </AssistantMessage>

      {/* Resolution card — initial */}
      {step === 'initial' && (
        <div className="rounded-md border border-border bg-background p-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-warning-text shrink-0" />
            <span className="text-xs font-medium text-foreground">Recommended fix</span>
            <Badge badgeColor="green" badgeStyle="subtle" className="text-[10px] px-1.5 py-0 ml-auto">
              {claim.resolution.confidence}
            </Badge>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{claim.resolution.suggestion}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{claim.resolution.impact}</p>
          <div className="flex gap-1.5 pt-0.5">
            <Button variant="default" size="sm" onClick={onApply} className="text-xs h-6 px-2.5 flex-1">
              Apply Fix
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-6 px-2">
              View Docs
            </Button>
          </div>
        </div>
      )}

      {/* Applied — ready to submit */}
      {step === 'applied' && (
        <>
          <AssistantMessage>
            <span className="text-success-text font-medium">Fix applied.</span> {claim.claimId} is ready to submit to {claim.payer}.
          </AssistantMessage>
          <div className="rounded-md border border-border bg-background p-2.5 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Estimated processing: 5–7 business days after submission.</p>
            <div className="flex gap-1.5">
              <Button variant="default" size="sm" onClick={onSubmit} className="text-xs h-6 px-2.5 flex-1">
                Submit Claim
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-6 px-2">
                Save Draft
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Submitted */}
      {step === 'submitted' && (
        <AssistantMessage>
          <span className="text-success-text font-medium">Submitted</span> to {claim.payer}.
          <br />
          Confirmation:{' '}
          <span className="font-mono text-xs font-medium text-foreground">BC-2026-039241</span>
          <br />
          Moved to your Submitted queue.
        </AssistantMessage>
      )}
    </div>
  )
}

// ─── Canvas views ──────────────────────────────────────────────────────────────

function HomeCanvas({ onPrompt }: { onPrompt: (label: string) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-base font-medium text-foreground">Home</h1>
        <p className="text-xs text-muted-foreground mt-0.5">March 26, 2026 · Billing overview</p>
      </div>

      {/* Metrics — row 1 */}
      <div className="grid grid-cols-2 gap-2">
        <MetricBox label="Total Claims" value="1,847" subtitle="This month" />
        <MetricBox
          label="Claims w/ Issues" value="34" subtitle="Needs attention" variant="urgent"
          onClick={() => onPrompt('Show claims with issues')}
        />
        <MetricBox
          label="Pending Review" value="128" subtitle="Awaiting action" variant="warning"
          onClick={() => onPrompt('Show pending claims')}
        />
        <MetricBox label="Resolved Today" value="67" subtitle="+12 vs yesterday" variant="success" />
      </div>

      {/* Metrics — row 2 */}
      <div className="grid grid-cols-2 gap-2">
        <MetricBox
          label="High Value" value="23" subtitle=">$10,000" variant="default"
          onClick={() => onPrompt('Show high value claims')}
        />
        <MetricBox label="Denial Rate" value="12.4%" subtitle="↑ 1.2% vs last mo." variant="warning" />
      </div>

      {/* Recent activity */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recent Activity</p>
        <div className="rounded-lg border border-border overflow-hidden">
          {[
            { Icon: CheckCircle2, color: 'text-success-text', label: 'CLM-2024-08790 resolved', sub: 'Missing modifier added · Cigna', time: '11:24am' },
            { Icon: AlertCircle,  color: 'text-warning-text',  label: 'CLM-2024-08756 flagged',  sub: 'Auth hold · Aetna · $12,800',   time: '10:12am' },
            { Icon: FileText,     color: 'text-primary',       label: 'CLM-2024-08841 updated',  sub: 'Pending review · Blue Cross',   time: '9:47am' },
          ].map(({ Icon, color, label, sub, time }, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 bg-card border-b border-border last:border-0">
              <Icon className={cn('h-3.5 w-3.5 mt-px shrink-0', color)} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{sub}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WorklistCanvas({ claims, onClaimClick }: {
  claims: (Claim & { currentStatus: ClaimStatus })[]
  onClaimClick: (id: string) => void
}) {
  return (
    <div className="flex flex-col overflow-hidden flex-1">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">Claims with Issues</span>
          <Badge badgeColor="red" badgeStyle="subtle" className="text-[10px] px-1.5 py-0">{claims.length}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">Sorted by urgency</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_56px_72px_76px] gap-2 px-4 py-2 bg-muted/20 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">Patient / Claim</span>
        <span className="text-xs font-medium text-muted-foreground text-right">Amt</span>
        <span className="text-xs font-medium text-muted-foreground">Issue</span>
        <span className="text-xs font-medium text-muted-foreground">Status</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border overflow-y-auto flex-1">
        {claims.map((claim) => (
          <button
            key={claim.id}
            onClick={() => onClaimClick(claim.id)}
            className="w-full text-left grid grid-cols-[1fr_56px_72px_76px] gap-2 px-4 py-3 bg-card hover:bg-muted/50 transition-colors items-center"
          >
            {/* Patient / Claim */}
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{claim.patientName}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{claim.claimId}</p>
              <p className="text-xs text-muted-foreground truncate">{claim.payer}</p>
            </div>
            {/* Amount */}
            <p className="text-xs font-medium text-foreground text-right tabular-nums">{fmt(claim.amount)}</p>
            {/* Issue type */}
            <div>
              <Badge badgeColor={ISSUE_COLOR[claim.issueType]} badgeStyle="subtle" className="text-[10px] px-1.5 leading-tight whitespace-nowrap">
                {claim.issueType}
              </Badge>
            </div>
            {/* Status */}
            <div className="flex flex-col gap-1 items-start">
              <Badge badgeColor={STATUS_COLOR[claim.currentStatus]} badgeStyle="subtle" className="text-[10px] px-1.5 leading-tight whitespace-nowrap">
                {claim.currentStatus}
              </Badge>
              <span className="text-[10px] text-muted-foreground tabular-nums">{claim.lastUpdated}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ClaimDetailCanvas({ claim, currentStatus }: { claim: Claim; currentStatus: ClaimStatus }) {
  const resolved = currentStatus === 'Ready to Submit' || currentStatus === 'Submitted'

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium text-foreground">{claim.patientName}</p>
          <p className="text-xs font-mono text-muted-foreground">{claim.claimId}</p>
        </div>
        <Badge badgeColor={STATUS_COLOR[currentStatus]} badgeStyle="subtle" className="text-xs shrink-0">
          {currentStatus}
        </Badge>
      </div>

      {/* Issue / resolved banner */}
      <div className={cn(
        'rounded-lg border p-3 flex items-start gap-2.5',
        resolved
          ? 'bg-[var(--success-light)] border-success/30'
          : 'bg-[var(--warning-light)] border-warning/30',
      )}>
        {resolved
          ? <CheckCircle2 className="h-3.5 w-3.5 text-success-text mt-px shrink-0" />
          : <AlertCircle className="h-3.5 w-3.5 text-warning-text mt-px shrink-0" />
        }
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">
            {resolved ? 'Issue resolved' : claim.issueType}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {resolved ? 'Resolution applied. Claim is ready for resubmission.' : claim.issueDetail}
          </p>
        </div>
      </div>

      {/* Encounter */}
      <SectionTable title="Encounter" rows={[
        { Icon: Calendar,  label: 'Date',      value: claim.serviceDate },
        { Icon: FileText,  label: 'Type',      value: claim.encounterType },
        { Icon: User,      label: 'Provider',  value: claim.provider },
        { Icon: Building2, label: 'Facility',  value: claim.facility },
      ]} />

      {/* Diagnoses */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border">
          Diagnoses
        </p>
        <div className="divide-y divide-border/50">
          <div className="px-3 py-2">
            <span className="text-[10px] font-medium text-muted-foreground">PRIMARY</span>
            <p className="text-xs font-mono text-foreground mt-0.5">{claim.primaryDx}</p>
          </div>
          {claim.secondaryDx && (
            <div className="px-3 py-2">
              <span className="text-[10px] font-medium text-muted-foreground">SECONDARY</span>
              <p className="text-xs font-mono text-foreground mt-0.5">{claim.secondaryDx}</p>
            </div>
          )}
        </div>
      </div>

      {/* Procedures */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border">
          Procedures
        </p>
        <div className="divide-y divide-border/50">
          {claim.procedures.map((proc) => (
            <div key={proc.code} className="flex items-center gap-3 px-3 py-2">
              <span className="text-xs font-mono font-medium text-foreground w-12 shrink-0">{proc.code}</span>
              <span className="text-xs text-muted-foreground">{proc.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Billing summary */}
      <SectionTable title="Billing" rows={[
        { label: 'Payer',        value: claim.payer },
        { label: 'Claim Amount', value: fmt(claim.amount) },
        { label: 'Days Open',    value: `${claim.daysOpen} days` },
      ]} />
    </div>
  )
}

/** Shared info table used in claim detail */
function SectionTable({
  title,
  rows,
}: {
  title: string
  rows: { Icon?: React.ElementType; label: string; value: string }[]
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border">
        {title}
      </p>
      <div className="divide-y divide-border/50">
        {rows.map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2.5 px-3 py-2">
            {Icon && <Icon className="h-3 w-3 text-muted-foreground shrink-0" />}
            <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
            <span className="text-xs text-foreground truncate">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Root component ────────────────────────────────────────────────────────────

export default function MedicalCoderPreview() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [claimStatuses, setClaimStatuses] = useState<Record<string, ClaimStatus>>({})
  const [resolutionSteps, setResolutionSteps] = useState<Record<string, ResolutionStep>>({})
  const [chatInput, setChatInput] = useState('')

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null
  const canvasTab = activeThread?.activeTab ?? 'worklist'
  const activeClaimId = canvasTab !== 'worklist' ? canvasTab : null
  const activeClaim = activeClaimId ? CLAIMS.find((c) => c.id === activeClaimId) : null

  function getStatus(id: string): ClaimStatus {
    return claimStatuses[id] ?? CLAIMS.find((c) => c.id === id)!.status
  }

  function openThread(promptLabel: string) {
    const isIssues = promptLabel.toLowerCase().includes('issues')
    const label = isIssues ? 'Claims with Issues' : promptLabel.replace('Show ', '')
    const id = `t-${Date.now()}`
    setThreads((prev) => [{ id, label, timestamp: 'Just now', openClaimIds: [], activeTab: 'worklist' }, ...prev])
    setActiveThreadId(id)
  }

  function openClaim(claimId: string) {
    if (!activeThreadId) return
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThreadId) return t
        const ids = t.openClaimIds.includes(claimId) ? t.openClaimIds : [...t.openClaimIds, claimId]
        return { ...t, openClaimIds: ids, activeTab: claimId }
      }),
    )
  }

  function setCanvasTab(tab: string) {
    if (!activeThreadId) return
    setThreads((prev) => prev.map((t) => (t.id === activeThreadId ? { ...t, activeTab: tab } : t)))
  }

  function applyFix(claimId: string) {
    setClaimStatuses((prev) => ({ ...prev, [claimId]: 'Ready to Submit' }))
    setResolutionSteps((prev) => ({ ...prev, [claimId]: 'applied' }))
  }

  function submitClaim(claimId: string) {
    setClaimStatuses((prev) => ({ ...prev, [claimId]: 'Submitted' }))
    setResolutionSteps((prev) => ({ ...prev, [claimId]: 'submitted' }))
  }

  const enrichedClaims = CLAIMS.map((c) => ({ ...c, currentStatus: getStatus(c.id) }))
  const openClaims = (activeThread?.openClaimIds ?? [])
    .map((id) => CLAIMS.find((c) => c.id === id))
    .filter(Boolean) as Claim[]

  // Determine chat content
  let chatContent: React.ReactNode
  if (!activeThread) {
    chatContent = <HomeChatPanel onPrompt={openThread} />
  } else if (activeClaim) {
    chatContent = (
      <ClaimChatPanel
        claim={activeClaim}
        step={resolutionSteps[activeClaim.id] ?? 'initial'}
        onApply={() => applyFix(activeClaim.id)}
        onSubmit={() => submitClaim(activeClaim.id)}
      />
    )
  } else {
    chatContent = <WorklistChatPanel count={CLAIMS.length} />
  }

  // Determine chat header label
  const chatLabel = !activeThread
    ? 'AI Assistant'
    : activeClaim
      ? activeClaim.claimId
      : activeThread.label

  return (
    <div className="flex h-[620px] overflow-hidden rounded-md border border-border bg-background text-sm">

      {/* ── Left nav ─────────────────────────────────────────────────────────── */}
      <aside className="w-[148px] flex-shrink-0 flex flex-col bg-card border-r border-border overflow-hidden">
        {/* App wordmark */}
        <div className="h-10 flex items-center px-3 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground">RCM Pro</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {/* Home */}
          <button
            onClick={() => setActiveThreadId(null)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors',
              activeThreadId === null
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-muted',
            )}
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
            <span>Home</span>
          </button>

          {/* Threads */}
          {threads.length > 0 && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Threads
              </p>
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 transition-colors',
                    activeThreadId === thread.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className={cn('text-xs truncate', activeThreadId === thread.id && 'font-medium')}>
                      {thread.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 pl-[18px] truncate">
                    {thread.timestamp}
                  </p>
                </button>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* ── Chat panel ───────────────────────────────────────────────────────── */}
      <div className="w-[216px] flex-shrink-0 flex flex-col bg-card border-r border-border">
        {/* Header */}
        <div className="h-10 flex items-center gap-1.5 px-3 border-b border-border shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{chatLabel}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {chatContent}
        </div>

        {/* Input bar */}
        <div className="p-2 border-t border-border shrink-0">
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 min-w-0 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            <Send className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>
        </div>
      </div>

      {/* ── Main canvas ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {!activeThread ? (
          <HomeCanvas onPrompt={openThread} />
        ) : (
          <>
            {/* Tab bar */}
            <div className="flex-shrink-0 flex items-end border-b border-border px-4 overflow-x-auto bg-card">
              {/* Worklist tab */}
              <TabButton
                label={activeThread.label}
                active={canvasTab === 'worklist'}
                onClick={() => setCanvasTab('worklist')}
              />
              {/* Open claim tabs */}
              {openClaims.map((claim) => (
                <TabButton
                  key={claim.id}
                  label={claim.claimId}
                  active={canvasTab === claim.id}
                  onClick={() => setCanvasTab(claim.id)}
                  mono
                />
              ))}
            </div>

            {/* Canvas content */}
            {canvasTab === 'worklist' ? (
              <WorklistCanvas claims={enrichedClaims} onClaimClick={openClaim} />
            ) : activeClaim ? (
              <ClaimDetailCanvas claim={activeClaim} currentStatus={getStatus(activeClaim.id)} />
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}

function TabButton({ label, active, onClick, mono = false }: {
  label: string; active: boolean; onClick: () => void; mono?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2.5 text-xs border-b-2 whitespace-nowrap transition-colors shrink-0',
        mono && 'font-mono',
        active
          ? 'border-primary text-foreground font-medium'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
